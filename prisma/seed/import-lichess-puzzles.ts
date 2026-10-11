/**
 * Bounded Lichess CC0 puzzle import into the Puzzle model.
 *
 * Usage: npm run db:seed
 * (alias: npx tsx prisma/seed/import-lichess-puzzles.ts)
 *
 * Params (env):
 *   PUZZLE_CSV     path to lichess_db_puzzle.csv   (default ./data/lichess_db_puzzle.csv)
 *   MIN_RATING     lower band bound                (default 300)
 *   MAX_RATING     upper band bound                (default 1800)
 *   MAX_PUZZLES    slice size cap                  (default 4000)
 *   PUBLISH_IMPORTED  publish new rows             (default "true")
 *
 * The Lichess database is huge (~20 GB CSV, zstd-compressed). This script reads
 * a bounded slice: it streams the CSV, keeps puzzles within the rating band
 * until MAX_PUZZLES are imported, and upserts keyed on the unique lichess id.
 * Re-running never duplicates and never downgrades the published flag.
 *
 * First run: download and decompress a slice, e.g.
 *   https://database.lichess.org/lichess_db_puzzle.csv.zst
 *   zstd -d lichess_db_puzzle.csv.zst -o data/lichess_db_puzzle.csv
 */

import { config as loadEnv } from "dotenv";
import { createReadStream } from "fs";
import { resolve } from "path";
import * as readline from "readline";
import {
  inRatingBand,
  isValidPuzzle,
  parseLichessLine,
} from "../../src/lib/lichess/parse";

loadEnv({ path: resolve(".env.local") });

const csvPath = resolve(process.env.PUZZLE_CSV ?? "./data/lichess_db_puzzle.csv");
const minRating = Number(process.env.MIN_RATING ?? 300);
const maxRating = Number(process.env.MAX_RATING ?? 1800);
const maxPuzzles = Number(process.env.MAX_PUZZLES ?? 4000);
const publishImported = (process.env.PUBLISH_IMPORTED ?? "true") !== "false";

function fail(message: string): never {
  console.error(`import-lichess-puzzles: ${message}`);
  process.exit(1);
}

async function main() {
  const { prisma } = await import("../../src/lib/db");

  if (minRating < 0 || maxRating <= minRating) {
    fail("MIN_RATING and MAX_RATING must define a positive band.");
  }
  if (!Number.isFinite(maxPuzzles) || maxPuzzles < 1) {
    fail("MAX_PUZZLES must be a positive integer.");
  }

  let scanned = 0;
  let matched = 0;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  const stream = createReadStream(csvPath);
  stream.on("error", (err) =>
    fail(
      `cannot open ${csvPath} (${err.message}). Download the Lichess puzzle CSV and decompress it here, see the script header.`,
    ),
  );

  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (created + updated >= maxPuzzles) break;
    const parsed = parseLichessLine(line);
    if (parsed === null) continue;
    scanned++;

    if (!inRatingBand(parsed, minRating, maxRating)) continue;
    matched++;

    if (!isValidPuzzle(parsed)) {
      skipped++;
      continue;
    }

    const exists = await prisma.puzzle.findUnique({
      where: { lichessId: parsed.lichessId },
      select: { id: true },
    });

    await prisma.puzzle.upsert({
      where: { lichessId: parsed.lichessId },
      update: {
        fen: parsed.fen,
        solutionMoves: parsed.moves,
        rating: parsed.rating,
        ratingDeviation: parsed.ratingDeviation,
        themes: parsed.themes,
        nbPlays: parsed.nbPlays,
      },
      create: {
        lichessId: parsed.lichessId,
        fen: parsed.fen,
        solutionMoves: parsed.moves,
        rating: parsed.rating,
        ratingDeviation: parsed.ratingDeviation,
        themes: parsed.themes,
        nbPlays: parsed.nbPlays,
        published: publishImported,
      },
    });

    if (exists) {
      updated++;
    } else {
      created++;
    }
  }

  await prisma.$disconnect();

  console.log("Puzzle import complete");
  console.log(`  csv:            ${csvPath}`);
  console.log(`  band:           ${minRating}–${maxRating}`);
  console.log(`  cap:            ${maxPuzzles}`);
  console.log(`  scanned rows:   ${scanned}`);
  console.log(`  in-band rows:   ${matched}`);
  console.log(`  skipped:        ${skipped}`);
  console.log(`  created:        ${created}`);
  console.log(`  updated:        ${updated}`);
}

main().catch(async (e) => {
  console.error("import-lichess-puzzles failed:", e?.message ?? e);
  process.exit(1);
});