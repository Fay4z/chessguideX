"use client";

import { useState, useTransition } from "react";
import { submitQuiz, type SubmitQuizResult } from "@/lib/content/actions";

export type QuizQuestionView = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
};

export function QuizBlock({
  lessonId,
  quizTitle,
  questions,
  alreadyPassed,
}: {
  lessonId: string;
  quizTitle: string;
  questions: QuizQuestionView[];
  alreadyPassed?: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitQuizResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const unanswered = questions.filter((q) => !answers[q.id]).length;
  const locked = Boolean(result && result.ok) || isPending;

  function submit() {
    startTransition(async () => {
      const res = await submitQuiz(lessonId, answers);
      setResult(res);
    });
  }

  return (
    <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold tracking-tight">{quizTitle}</h2>
        {alreadyPassed && (
          <span className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-600 dark:border-emerald-700 dark:text-emerald-400">
            Completed
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Answer every question correctly enough to pass (you need at least the
        passing score shown below).
      </p>

      <div className="mt-6 space-y-6">
        {questions.map((q, qi) => {
          const userPick = answers[q.id] ?? "";
          const feedback =
            result && result.ok
              ? result.results.find((r) => r.questionId === q.id)
              : undefined;
          return (
            <fieldset key={q.id} className="space-y-2">
              <legend className="font-medium">
                {qi + 1}. {q.prompt}
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((opt) => {
                  const picked = userPick === opt.id;
                  let cls =
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition";
                  if (feedback) {
                    if (feedback.correct && picked) {
                      cls += " border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40";
                    } else if (!feedback.correct && picked) {
                      cls += " border-rose-400 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/40";
                    } else if (
                      !feedback.correct &&
                      opt.id === feedback.correctOptionId
                    ) {
                      cls += " border-emerald-400 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20";
                    } else {
                      cls += " border-zinc-200 opacity-60 dark:border-zinc-700";
                    }
                  } else {
                    cls += " border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800";
                  }
                  return (
                    <label key={opt.id} className={cls}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.id}
                        checked={picked}
                        disabled={locked}
                        onChange={() =>
                          setAnswers((a) => ({ ...a, [q.id]: opt.id }))
                        }
                        className="accent-zinc-900 disabled:opacity-50 dark:accent-zinc-50"
                      />
                      <span>{opt.text}</span>
                    </label>
                  );
                })}
              </div>
              {feedback && !feedback.correct && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    Your answer: {feedback.yourAnswer}. Correct answer:{" "}
                    {feedback.correctAnswer}.
                  </p>
                  {feedback.explanation && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {feedback.explanation}
                    </p>
                  )}
                </div>
              )}
              {feedback && feedback.correct && feedback.explanation && (
                <div className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
                  {feedback.explanation}
                </div>
              )}
            </fieldset>
          );
        })}
      </div>

      {result && result.ok && (
        <div
          className={`mt-6 flex items-center justify-between rounded-xl border px-4 py-3 ${
            result.passed
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          }`}
        >
          <span className="font-semibold">
            Score {result.score}% (required {result.minScore}%)
          </span>
          <span className="text-sm">
            {result.passed
              ? "Passed — keep going!"
              : "Not quite — review and try again."}
          </span>
        </div>
      )}
      {result && !result.ok && (
        <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">
          {result.error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={locked || unanswered > 0}
          className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
        >
          {isPending ? "Checking…" : "Check answers"}
        </button>
        {unanswered > 0 && (
          <span className="text-sm text-zinc-500">
            {unanswered} question{unanswered === 1 ? "" : "s"} unanswered
          </span>
        )}
        {result && result.ok && (
          <button
            type="button"
            onClick={() => {
              setAnswers({});
              setResult(null);
            }}
            className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Retake
          </button>
        )}
      </div>
    </section>
  );
}