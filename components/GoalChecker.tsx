"use client";

import { useState } from "react";
import Link from "next/link";
import CopyButton from "./CopyButton";
import { checkGoal, EXAMPLE_GOALS, type Verdict } from "@/lib/outcome-check";

/**
 * Paste a goal, get an honest read on it. The check is a pure function shared
 * with the server render, so this works three ways: live as you type, on a
 * shared /checker?goal=… link, and with JavaScript off (the noscript submit
 * button posts the form and the server renders exactly the same result).
 *
 * With JavaScript on, nothing is ever sent anywhere — the goal stays in the tab.
 */
export default function GoalChecker({ initialGoal = "" }: { initialGoal?: string }) {
  const [goal, setGoal] = useState(initialGoal);
  const check = checkGoal(goal);
  const typed = goal.trim().length > 0;

  return (
    <div>
      <form method="get" action="/checker" className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <label htmlFor="goal" className="block font-semibold">
          Paste a goal, objective or key result
        </label>
        <p className="mt-1 text-sm text-ink-soft">
          One goal at a time. Nothing is stored, and with JavaScript on it never
          leaves your browser.
        </p>
        <textarea
          id="goal"
          name="goal"
          rows={3}
          maxLength={1200}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Increase the share of new customers who open an account unaided from 40% to 75% within eight weeks…"
          className="mt-4 w-full resize-y rounded-xl border border-ink/15 bg-chalk px-4 py-3 text-base leading-relaxed outline-none placeholder:text-ink-soft/50 focus:border-sooner focus:ring-2 focus:ring-sooner/30"
        />
        <noscript>
          <button
            type="submit"
            className="mt-3 rounded-full bg-ink px-5 py-2 text-sm font-semibold text-chalk hover:bg-ink-soft"
          >
            Check this goal
          </button>
        </noscript>
        <div className="mt-4 flex flex-wrap items-baseline gap-2 border-t border-ink/10 pt-4 text-sm">
          <span className="text-ink-soft">Or try one:</span>
          {EXAMPLE_GOALS.map((example, i) => (
            <a
              key={example}
              href={`/checker?goal=${encodeURIComponent(example)}`}
              onClick={(e) => {
                e.preventDefault();
                setGoal(example);
              }}
              className="rounded-full border border-ink/15 px-3 py-1 font-medium hover:bg-ink/5"
            >
              {["An output", "A hybrid", "An outcome"][i]}
            </a>
          ))}
        </div>
      </form>

      {!check ? (
        <p className="mt-6 rounded-2xl border border-dashed border-ink/20 px-6 py-8 text-center text-sm text-ink-soft">
          {typed
            ? "A few more words and we can have a go at it."
            : "The read appears here as you type — verdict, five scores, and the one question worth answering next."}
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          <section
            aria-live="polite"
            className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-3">
              <VerdictBadge verdict={check.verdict} />
              <span className="text-sm font-semibold text-ink-soft">
                {check.total} / 25
              </span>
            </div>
            <p className="mt-3 leading-relaxed">{check.verdictReason}</p>
          </section>

          <section className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
            <h2 className="border-b border-ink/10 px-6 py-4 font-semibold">
              Five dimensions
            </h2>
            <ul className="divide-y divide-ink/10">
              {check.dimensions.map((d) => (
                <li key={d.key} className="px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <h3 className="font-semibold">{d.label}</h3>
                    <Meter score={d.score} />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d.note}</p>
                  {d.evidence.length > 0 && (
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      {d.evidence.map((word) => (
                        <span
                          key={word}
                          className="rounded-full bg-chalk px-2.5 py-0.5 font-mono text-xs text-ink-soft"
                        >
                          {word}
                        </span>
                      ))}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-happier/40 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-widest text-happier">
              The one question
            </h2>
            <p className="mt-2 text-lg font-semibold leading-relaxed">{check.question}</p>
          </section>

          <section className="rounded-2xl border border-sooner/40 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-widest text-sooner">
              Rewrite scaffold
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              What we could pick out is filled in. The gaps are yours.
            </p>
            <p className="mt-4 text-lg leading-loose">
              {check.scaffold.map((part, i) =>
                part.kind === "text" ? (
                  <span key={i}>{part.text}</span>
                ) : part.value ? (
                  <strong key={i} className="font-semibold text-sooner">
                    {part.value}
                  </strong>
                ) : (
                  <span
                    key={i}
                    className="rounded-md border-b-2 border-dashed border-ink/30 bg-chalk px-2 py-0.5 text-base text-ink-soft"
                  >
                    {part.label}
                  </span>
                )
              )}
            </p>
          </section>

          <section className="rounded-2xl bg-ink p-6 text-chalk">
            <h2 className="text-lg font-bold">Want the sharper rewrite?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-chalk/80">
              This page checks patterns. Writing the better sentence takes
              judgement — so take your goal to an assistant running the{" "}
              <Link href="/skills" className="font-semibold underline underline-offset-2">
                outcome-vs-output-check skill
              </Link>
              . Here is the prompt, ready to paste.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <CopyButton text={check.prompt} label="Copy the prompt" />
              <Link
                href="/skills"
                className="rounded-full border border-chalk/30 px-4 py-2 text-sm font-semibold hover:bg-chalk/10"
              >
                Get the skill →
              </Link>
            </div>
            <pre className="mt-4 max-h-56 overflow-auto rounded-xl bg-chalk/10 p-4 text-xs leading-relaxed text-chalk/80">
              {check.prompt}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
}

const VERDICT_STYLES: Record<Verdict, string> = {
  Outcome: "bg-sooner text-ink",
  Hybrid: "bg-happier text-ink",
  Output: "border border-ink/20 bg-chalk text-ink-soft",
};

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span
      className={`rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-widest ${VERDICT_STYLES[verdict]}`}
    >
      {verdict}
    </span>
  );
}

function Meter({ score }: { score: number }) {
  const tone = score >= 4 ? "bg-sooner" : score >= 2 ? "bg-happier" : "bg-ink/40";
  return (
    <span className="flex items-center gap-2">
      <span className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={`h-2.5 w-5 rounded-full ${step <= score ? tone : "bg-ink/10"}`}
          />
        ))}
      </span>
      <span className="text-sm font-semibold text-ink-soft">{score}/5</span>
    </span>
  );
}
