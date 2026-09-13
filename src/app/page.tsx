import Link from "next/link";

const levels = [
  {
    title: "Beginner",
    emoji: "♟️",
    description:
      "Piece moves, basic rules, check, checkmate, and your first tactics.",
  },
  {
    title: "Intermediate",
    emoji: "♞",
    description: "Openings, pins, forks, skewers, and endgame fundamentals.",
  },
  {
    title: "Advanced",
    emoji: "♛",
    description:
      "Attacking plans, deep tactics, positional play, and endgame mastery.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <main className="w-full max-w-4xl">
        <section className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Learn Chess, Step by Step
          </h1>
          <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            Interactive lessons, tactics puzzles, and progress tracking across
            three levels. Complete a level and earn a certificate.
          </p>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Sign In
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {levels.map((level) => (
            <article
              key={level.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="text-3xl">{level.emoji}</div>
              <h2 className="mt-3 text-lg font-semibold">{level.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {level.description}
              </p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}