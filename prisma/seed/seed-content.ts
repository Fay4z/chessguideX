/**
 * Seeds Courses (Beginner / Intermediate / Advanced), Lessons and Quizzes.
 *
 * Content is authored here (dev workflow), matching DESIGN.md:
 *   lesson.content = [{ type: "text", markdown }, { type: "board", fen, moves? }]
 *
 * Re-runnable: each lesson is replaced when its (courseId, slug) already exists.
 *
 * Board demo move sequences are validated with chess.js before insert.
 *
 * Usage: npm run seed:content
 *   (loads .env.local automatically)
 */

import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { Chess } from "chess.js";
import type { Prisma } from "../../src/generated/prisma/client";

loadEnv({ path: resolve(".env.local") });

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

type ContentBlock =
  | { type: "text"; markdown: string }
  | { type: "board"; fen: string; moves?: string[] };

type Question = {
  prompt: string;
  options: { id: string; text: string }[];
  correct: string;
  explanation?: string;
};

type LessonSeed = {
  title: string;
  slug: string;
  content: ContentBlock[];
  quiz: { title: string; minScore: number; questions: Question[] };
};

type CourseSeed = {
  title: string;
  slug: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  description: string;
  order: number;
  lessons: LessonSeed[];
};

function text(markdown: string): ContentBlock {
  return { type: "text", markdown };
}

function board(moves: string[]): ContentBlock {
  const game = new Chess(START_FEN);
  const san: string[] = [];
  for (const uci of moves) {
    const result = game.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
    if (!result) {
      throw new Error(`Illegal board move "${uci}"`);
    }
    san.push(result.san);
  }
  return { type: "board", fen: START_FEN, moves: san };
}

function validateBlocks(courseSlug: string, lessonSlug: string, blocks: ContentBlock[]) {
  for (const block of blocks) {
    if (block.type !== "board" || !block.moves?.length) continue;
    const game = new Chess(START_FEN);
    for (const move of block.moves) {
      const result = game.move(move);
      if (!result) {
        throw new Error(
          `Illegal board move "${move}" in ${courseSlug}/${lessonSlug}`,
        );
      }
    }
  }
}

// Need to export for tsx entrypoint; keep data below.
const COURSES: CourseSeed[] = [
  // ────────────────────────────── BEGINNER ──────────────────────────────
  {
    title: "Beginner",
    slug: "beginner",
    level: "BEGINNER",
    description:
      "Brand new to chess? Start here. Learn the board, how every piece moves, and how to deliver checkmate.",
    order: 1,
    lessons: [
      {
        title: "The Chessboard",
        slug: "the-chessboard",
        content: [
          text(`Chess is played on an **8×8 board** with **64 squares**, alternating light and dark.

Here is the starting position. White always moves first.`),
          board([]),
          text(`**Notation (how we write moves)**

- Files (columns) are named \`a\` to \`h\`, left to right from White's side.
- Ranks (rows) are numbered \`1\` to \`8\`, bottom to top.
- Every square gets a name: \`a1\`, \`e4\`, \`h8\`...

A very first move: the white king's pawn steps forward from \`e2\` to \`e4\`.`),
          board(["e2e4"]),
          text(`Notice how the pawn on \`e4\` now attacks squares \`d5\` and \`f5\`. Knowing the board by coordinates is the
foundation of everything else.`),
        ],
        quiz: {
          title: "The Chessboard",
          minScore: 70,
          questions: [
            {
              prompt: "How many squares does a chessboard have?",
              options: [
                { id: "a", text: "32" },
                { id: "b", text: "64" },
                { id: "c", text: "48" },
                { id: "d", text: "100" },
              ],
              correct: "b",
              explanation: "8 files × 8 ranks = 64 squares.",
            },
            {
              prompt: "Which of these is a real square on the board?",
              options: [
                { id: "a", text: "h9" },
                { id: "b", text: "e5" },
                { id: "c", text: "5e" },
                { id: "d", text: "a0" },
              ],
              correct: "b",
              explanation: "Files only run from a to h, and ranks from 1 to 8.",
            },
            {
              prompt: "How many pawns does each player start with?",
              options: [
                { id: "a", text: "8" },
                { id: "b", text: "6" },
                { id: "c", text: "16" },
                { id: "d", text: "4" },
              ],
              correct: "a",
              explanation: "A full row of 8 pawns on the 2nd (White) and 7th (Black) ranks.",
            },
          ],
        },
      },
      {
        title: "How the Pieces Move",
        slug: "how-the-pieces-move",
        content: [
          text(`Each piece moves differently. Learn these by heart:

- **Rook** — any number of squares, straight.
- **Bishop** — any number of squares, diagonally (keeps its color).
- **Queen** — any number of squares, straight or diagonal (rook + bishop combined).
- **Knight** — an **L-shape**: two squares one way, then one to the side. It can *jump* over pieces.
- **King** — one square in any direction.
- **Pawn** — one square forward, captures diagonally; may move two from its starting rank.`),
          text(`The knights start on \`b1\`/\`g1\` and \`b8\`/\`g8\`. Watch them hop out to the center:`),
          board(["g1f3", "g8f6", "b1c3", "b8c6"]),
          text(`A bishop always stays on the same color. The light-square bishops open the game down the
big diagonal — here both sides bring theirs out:`),
          board(["e2e4", "e7e5", "f1c4", "f8c5"]),
        ],
        quiz: {
          title: "How the Pieces Move",
          minScore: 70,
          questions: [
            {
              prompt: "Which piece moves in an L-shape and can jump over other pieces?",
              options: [
                { id: "a", text: "Rook" },
                { id: "b", text: "Bishop" },
                { id: "c", text: "Knight" },
                { id: "d", text: "Queen" },
              ],
              correct: "c",
            },
            {
              prompt: "A bishop will always stay on …",
              options: [
                { id: "a", text: "the same color squares" },
                { id: "b", text: "the center four squares" },
                { id: "c", text: "the back rank" },
                { id: "d", text: "an edge of the board" },
              ],
              correct: "a",
              explanation: "Bishops move diagonally, so they never change color.",
            },
            {
              prompt: "Which piece can move any number of squares in a straight line OR diagonally?",
              options: [
                { id: "a", text: "King" },
                { id: "b", text: "Queen" },
                { id: "c", text: "Knight" },
                { id: "d", text: "Pawn" },
              ],
              correct: "b",
            },
          ],
        },
      },
      {
        title: "Check, Checkmate and Stalemate",
        slug: "check-checkmate-stalemate",
        content: [
          text(`**Check** — your king is attacked. You must deal with it immediately:
1. Move the king out of attack.
2. Capture the attacking piece.
3. Block the attack.

**Checkmate** — the king is in check and there is no legal way out. The game is over. **You win by checkmating.**

**Stalemate** — the player to move has no legal moves but their king is **not** in check. That is a **draw**.`),
          text(`Here is the famous **Scholar's Mate** — a quick checkmate against f7, the weakest square in Black's
camp. The queen and bishop work together:`),
          board(["e2e4", "e7e5", "d1h5", "b8c6", "f1c4", "g8f6", "h5f7"]),
          text(`The bishop on \`c4\` joins the queen in eyeing \`f7\`. Black's only defenders of \`f7\` (the king and
rook) cannot help, so it is mate.`),
        ],
        quiz: {
          title: "Check, Checkmate and Stalemate",
          minScore: 70,
          questions: [
            {
              prompt: "When your king is attacked, the position is called …",
              options: [
                { id: "a", text: "check" },
                { id: "b", text: "checkmate" },
                { id: "c", text: "stalemate" },
                { id: "d", text: "en passant" },
              ],
              correct: "a",
            },
            {
              prompt: "You are in check. Which of these is NOT a legal response?",
              options: [
                { id: "a", text: "Move your king out of attack" },
                { id: "b", text: "Capture the checking piece" },
                { id: "c", text: "Block the check" },
                { id: "d", text: "Play an unrelated move" },
              ],
              correct: "d",
              explanation: "You must always get out of check before doing anything else.",
            },
            {
              prompt: "In Scholar's Mate, White's queen and bishop team up against which pawn?",
              options: [
                { id: "a", text: "e4" },
                { id: "b", text: "f7" },
                { id: "c", text: "g1" },
                { id: "d", text: "a8" },
              ],
              correct: "b",
            },
          ],
        },
      },
    ],
  },

  // ────────────────────────────── INTERMEDIATE ──────────────────────────────
  {
    title: "Intermediate",
    slug: "intermediate",
    level: "INTERMEDIATE",
    description:
      "Solid foundations: tactical motifs (pins, forks, skewers), opening principles, and basic endgames.",
    order: 2,
    lessons: [
      {
        title: "Tactics: Pins, Forks and Skewers",
        slug: "tactics-pins-forks-skewers",
        content: [
          text(`Most chess games are decided by **tactics** — short forcing sequences. The three most important motifs:

- **Pin** — an enemy piece cannot move because doing so would expose a more valuable piece behind it.
- **Fork** — one piece attacks two (or more) targets at once.
- **Skewer** — the *valuable* piece is attacked first; when it moves, the piece behind it is captured.`),
          text(`The **Ruy Lopez**: White's bishop pins the \`c6\` knight to the king on \`e8\`. Black cannot just
move the knight and give up the king:`),
          board(["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"]),
          text(`This single pin already gives White an opening advantage, because Black must spend time chasing
the bishop away. Look for pins in *every* position.`),
        ],
        quiz: {
          title: "Pins, Forks and Skewers",
          minScore: 70,
          questions: [
            {
              prompt: "A pinned piece is one that …",
              options: [
                { id: "a", text: "cannot move without exposing a more valuable piece" },
                { id: "b", text: "may never be captured" },
                { id: "c", text: "always gives check" },
                { id: "d", text: "must stay on its starting square" },
              ],
              correct: "a",
            },
            {
              prompt: "A fork is when …",
              options: [
                { id: "a", text: "one piece attacks two or more targets at once" },
                { id: "b", text: "two pieces defend each other" },
                { id: "c", text: "the king cannot move" },
                { id: "d", text: "a pawn promotes" },
              ],
              correct: "a",
            },
            {
              prompt: "In the Ruy Lopez, White's bishop on b5 pins the knight on c6 to …",
              options: [
                { id: "a", text: "the king on e8" },
                { id: "b", text: "the queen on d7" },
                { id: "c", text: "the rook on h8" },
                { id: "d", text: "nothing in particular" },
              ],
              correct: "a",
              explanation: "The bishop, knight and king line up on the same diagonal (b5-c6-d7-e8).",
            },
          ],
        },
      },
      {
        title: "Opening Principles: the Italian Game",
        slug: "opening-principles-italian",
        content: [
          text(`The opening has three goals:
1. **Control the center** — pawns and pieces toward \`e4\`/\`d4\`.
2. **Develop** — bring knights and bishops to active squares.
3. **Castle early** — get the king safe and connect your rooks.

Avoid: moving the same piece twice, bringing the queen out too early, and pushing too many pawns.`),
          text(`The **Italian Game** checks every box. Both sides develop, fight for the center, and prepare to castle:
1. \`e4\` — claim the center
2. \`Nf3\` — develop and eye e5
3. \`Bc4\` — pressure f7, the weakest square`),
          board(["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5"]),
          text(`White's bishop on \`c4\` points straight at the \`f7\` pawn (guarded only by the black king). If
Black ever forgets to play \`Nf6\` and \`O-O\`, quick tactics against f7 become possible.`),
        ],
        quiz: {
          title: "Opening Principles",
          minScore: 70,
          questions: [
            {
              prompt: "Which of these is a good opening principle?",
              options: [
                { id: "a", text: "Develop pieces toward the center" },
                { id: "b", text: "Move your queen out on move one" },
                { id: "c", text: "Move the same piece three times early" },
                { id: "d", text: "Keep all pieces on your back rank" },
              ],
              correct: "a",
            },
            {
              prompt: "In the Italian Game, White plays Bc4 mainly to target …",
              options: [
                { id: "a", text: "f7" },
                { id: "b", text: "b7" },
                { id: "c", text: "g2" },
                { id: "d", text: "h7" },
              ],
              correct: "a",
              explanation: "The bishop on c4 attacks f7, guarded only by the king in the opening.",
            },
            {
              prompt: "Which of these is generally a mistake in the opening?",
              options: [
                { id: "a", text: "Castling quickly" },
                { id: "b", text: "Developing bishops and knights" },
                { id: "c", text: "Moving the queen out very early and shuffling it" },
                { id: "d", text: "Controlling the center" },
              ],
              correct: "c",
            },
          ],
        },
      },
      {
        title: "Basic Endgames: King and Queen vs King",
        slug: "king-and-queen-vs-king",
        content: [
          text(`A **queen** (or a **rook**) and a king easily beat a lone king — as long as you avoid stalemate.

**Technique**
1. Make a "fence" with your queen, cutting the enemy king to half the board.
2. On each move, shrink the fence (rook or queen), stalling for checks.
3. When the king is on the edge, bring your **own king** up.
4. Deliver checkmate with the king's support.`),
          text(`The quickest, most reliable way to win an endgame up a queen is usually to fight for a **passed pawn**
and promote. Here White races a pawn to the queening square:`),
          board(["a2a4", "b8c6", "a4a5", "g8f6", "a5a6", "f6d5", "a6b7", "d5b4", "b7a8q"]),
          text(`A pawn that reaches the last rank **promotes** — usually to a queen. Suddenly you have two queens
and mate follows within a few moves.`),
        ],
        quiz: {
          title: "King and Queen vs King",
          minScore: 70,
          questions: [
            {
              prompt: "The winning idea with K+Q vs K is to …",
              options: [
                { id: "a", text: "drive the king to the edge, then bring your own king up" },
                { id: "b", text: "trade queens as fast as possible" },
                { id: "c", text: "give random checks forever" },
                { id: "d", text: "stalemate your opponent on purpose" },
              ],
              correct: "a",
            },
            {
              prompt: "With a huge material advantage, the biggest danger is …",
              options: [
                { id: "a", text: "stalemate" },
                { id: "b", text: "threefold repetition" },
                { id: "c", text: "losing on time" },
                { id: "d", text: "checkmate" },
              ],
              correct: "a",
              explanation: "Rushing square-bunches the king takes away all of its squares — a draw.",
            },
            {
              prompt: "When a pawn reaches the last rank, it must be promoted into …",
              options: [
                { id: "a", text: "a queen, rook, bishop or knight" },
                { id: "b", text: "a queen only" },
                { id: "c", text: "a second king" },
                { id: "d", text: "nothing — it stays a pawn" },
              ],
              correct: "a",
            },
          ],
        },
      },
    ],
  },

  // ────────────────────────────── ADVANCED ──────────────────────────────
  {
    title: "Advanced",
    slug: "advanced",
    level: "ADVANCED",
    description:
      "Take your game further: attacking play, positional understanding, and world-class rook endgames.",
    order: 3,
    lessons: [
      {
        title: "Attacking the King",
        slug: "attacking-the-king",
        content: [
          text(`A king attack wins games — provided your **own** king is safe first.

Rules of attack:
1. **Castle early** and keep your king shielded by pawns.
2. Build up **more attackers** around the enemy king than it has defenders.
3. Open lines (files and diagonals) with pawn breaks and sacrifices.
4. Watch for classic patterns: back-rank mates, the Greek Gift sacrifice, and the \`h\`-file storm.`),
          text(`Attackers must also respect the fastest mate in chess, the **Fool's Mate**. Black punishes White's
crazy pawn pushes in two moves:`),
          board(["f2f3", "e7e5", "g2g4", "d8h4"]),
          text(`White moved two king-side pawns and opened the \`e1-h4\` diagonal, so the black queen delivered mate
on move four. The lesson: never weaken the squares around your own king early.`),
        ],
        quiz: {
          title: "Attacking the King",
          minScore: 70,
          questions: [
            {
              prompt: "The fastest checkmate in chess is called …",
              options: [
                { id: "a", text: "Fool's Mate" },
                { id: "b", text: "Scholar's Mate" },
                { id: "c", text: "Anastasia's Mate" },
                { id: "d", text: "Greek Gift" },
              ],
              correct: "a",
            },
            {
              prompt: "Which piece delivers the checkmate in Fool's Mate?",
              options: [
                { id: "a", text: "The queen" },
                { id: "b", text: "The rook" },
                { id: "c", text: "The bishop" },
                { id: "d", text: "The knight" },
              ],
              correct: "a",
            },
            {
              prompt: "Before launching a king attack, you should …",
              options: [
                { id: "a", text: "make sure your own king is safe" },
                { id: "b", text: "push your own king-side pawns forward" },
                { id: "c", text: "sacrifice pieces regardless of outcome" },
                { id: "d", text: "ignore development" },
              ],
              correct: "a",
            },
          ],
        },
      },
      {
        title: "Positional Play",
        slug: "positional-play",
        content: [
          text(`Not every advantage comes from tactics. **Positional chess** improves your pieces slowly but surely:

- **Pawn structure** — strong pawns, few weaknesses.
- **Outposts** — a knight planted on a square your opponent cannot attack with a pawn.
- **The bishop pair** — two bishops control both color complexes.
- **Space** — more room to maneuver, and your opponent suffocates.`),
          text(`Watch a full natural development with both sides castling — the famous "Spanish" setup of the Ruy
Lopez. Notice how every move improves the position without risk:`),
          board(["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6", "e1g1", "f8e7"]),
          text(`By move 10 both sides have developed, battled for the center, and their kings are safe. From here
the game becomes a slow grind of small advantages — exactly what positional play is about.`)
        ],
        quiz: {
          title: "Positional Play",
          minScore: 70,
          questions: [
            {
              prompt: "An outpost is best described as …",
              options: [
                { id: "a", text: "a square defended by your pawn where your piece can't easily be chased away" },
                { id: "b", text: "your piece's starting square" },
                { id: "c", text: "a corner square" },
                { id: "d", text: "the square in front of your king" },
              ],
              correct: "a",
            },
            {
              prompt: "Which of these usually indicates the better position?",
              options: [
                { id: "a", text: "More space and healthy pawn structure" },
                { id: "b", text: "A king still in the center" },
                { id: "c", text: "Doubled and isolated pawns everywhere" },
                { id: "d", text: "Fewer developed pieces" },
              ],
              correct: "a",
            },
            {
              prompt: "Two bishops are often better than a bishop and a knight because …",
              options: [
                { id: "a", text: "they jointly control both colors of squares" },
                { id: "b", text: "they are worth twice as much material" },
                { id: "c", text: "they can never be blocked" },
                { id: "d", text: "they move faster" },
              ],
              correct: "a",
            },
          ],
        },
      },
      {
        title: "Rook Endgames: the Lucena Position",
        slug: "lucena-position",
        content: [
          text(`**Rook endgames occur in roughly half of all chess games** — knowing the key positions is essential.

The most famous winning position is the **Lucena Position**: the defender's king is cut off behind the
passed pawn, and the stronger side has the \`Rook + pawn on the 7th rank\` structure.

**The winning method (building a bridge)**
1. Check the enemy king away from ever approaching the pawn.
2. Use your rook to shield your king from checks ("a bridge").
3. March your king to support the pawn, then promote — the opponent cannot stop you.`),
          text(`Here is the *concept* in miniature: a passed pawn racing down the board while nothing can stop it.
Keep the king in front of the pawn and your rook behind it — then the pawn promotes:`),
          board(["a2a4", "h7h6", "a4a5", "g8f6", "a5a6", "f6g4", "a6b7", "g4e3", "b7a8q"]),
          text(`From the Lucena position the outcome is a forced win. If instead the rooks are off the board it
may only be a draw — the whole art of the endgame is in knowing which one you have.`),
        ],
        quiz: {
          title: "The Lucena Position",
          minScore: 70,
          questions: [
            {
              prompt: "The Lucena Position is …",
              options: [
                { id: "a", text: "a theoretically winning rook endgame with a pawn on the 7th rank" },
                { id: "b", text: "a drawing fortress in a rook endgame" },
                { id: "c", text: "an opening trap in the Italian Game" },
                { id: "d", text: "a queen vs pawn endgame" },
              ],
              correct: "a",
            },
            {
              prompt: "In a rook endgame, the strongest placement for your rook is …",
              options: [
                { id: "a", text: "behind the passed pawn" },
                { id: "b", text: "in front of the passed pawn" },
                { id: "c", text: "on its starting square" },
                { id: "d", text: "behind your own king" },
              ],
              correct: "a",
              explanation: "A rook behind a passed pawn gives it unlimited support and activity.",
            },
            {
              prompt: "The 'building a bridge' technique is used to …",
              options: [
                { id: "a", text: "shield the king from checks while the pawn promotes" },
                { id: "b", text: "block a passed pawn from advancing" },
                { id: "c", text: "transport rooks across the board" },
                { id: "d", text: "force a threefold repetition" },
              ],
              correct: "a",
            },
          ],
        },
      },
    ],
  },
];

async function main() {
  const { prisma } = await import("../../src/lib/db");

  for (const [courseIndex, course] of COURSES.entries()) {
  // Validate every board demo before inserting anything.
  for (const lesson of course.lessons) {
    validateBlocks(course.slug, lesson.slug, lesson.content);
  }

  const saved = await prisma.course.upsert({
    where: { slug: course.slug },
    update: {
      title: course.title,
      level: course.level,
      description: course.description,
      order: course.order,
      published: true,
    },
    create: {
      title: course.title,
      slug: course.slug,
      level: course.level,
      description: course.description,
      order: course.order,
      published: true,
    },
  });

  for (const lesson of course.lessons) {
    // Replace any previous version of this lesson (idempotent re-seeds).
    const existing = await prisma.lesson.findUnique({
      where: { courseId_slug: { courseId: saved.id, slug: lesson.slug } },
      include: { quiz: true },
    });
    if (existing) {
      if (existing.quizId) {
        await prisma.quizQuestion.deleteMany({ where: { quizId: existing.quizId } });
        await prisma.quiz.deleteMany({ where: { id: existing.quizId } });
      }
      await prisma.lesson.deleteMany({ where: { id: existing.id } });
    }

    await prisma.lesson.create({
      data: {
        course: { connect: { id: saved.id } },
        title: lesson.title,
        slug: lesson.slug,
        order: courseIndex * 10 + lessonIndex(course, lesson),
        content: lesson.content as Prisma.InputJsonValue,
        published: true,
        quiz: {
          create: {
            title: lesson.quiz.title,
            minScore: lesson.quiz.minScore,
            questions: {
              create: lesson.quiz.questions.map((q, i) => ({
                type: "MULTIPLE_CHOICE",
                prompt: q.prompt,
                options: q.options,
                correctAnswer: q.correct,
                explanation: q.explanation ?? null,
                position: i,
              })),
            },
          },
        },
      },
    });
  }

  console.log(`  seeded "${course.title}" (${course.lessons.length} lessons)`);
  }

  const summary = await prisma.$transaction([
    prisma.course.count(),
    prisma.lesson.count(),
    prisma.quiz.count(),
    prisma.quizQuestion.count(),
  ]);
  const [courses, lessons, quizzes, questions] = summary;
  console.log("Done:", { courses, lessons, quizzes, questions });
  await prisma.$disconnect();
}

function lessonIndex(course: CourseSeed, lesson: LessonSeed): number {
  return course.lessons.findIndex((l) => l.slug === lesson.slug) + 1;
}

main().catch(async (e) => {
  console.error("Seed failed:", e?.message ?? e);
  process.exit(1);
});