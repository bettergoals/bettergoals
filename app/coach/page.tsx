import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import {
  EXAMPLES,
  MAX_INPUT_LENGTH,
  STATUS_LABEL,
  evaluateOutcome,
  type Check,
  type CheckStatus,
} from "@/lib/outcomeCoach";
import { COACH_FEEDBACK_HREF } from "@/lib/feedback";

export const metadata = {
  title: "Outcome Coach",
  description:
    "Paste any goal — a rough thought, an objective, a whole OKR — and get a structured review against the outcome principles: what's working, what's missing, and what to do next.",
};

const STATUS_STYLE: Record<CheckStatus, string> = {
  strong: "border-sooner/40 bg-sooner/10 text-ink",
  partial: "border-happier/50 bg-happier/10 text-ink",
  missing: "border-ink/25 bg-ink/5 text-ink",
};

const STATUS_MARK: Record<CheckStatus, string> = {
  strong: "✓",
  partial: "◐",
  missing: "○",
};

function StatusPill({ status }: { status: CheckStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}
    >
      <span aria-hidden="true">{STATUS_MARK[status]}</span>
      {STATUS_LABEL[status]}
    </span>
  );
}

function CheckCard({ check }: { check: Check }) {
  return (
    <li className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight">{check.title}</h3>
          <p className="mt-0.5 text-xs uppercase tracking-widest text-ink-soft">{check.principle}</p>
        </div>
        <StatusPill status={check.status} />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">{check.finding}</p>
      {check.status !== "strong" && (
        <dl className="mt-4 space-y-3 border-t border-ink/10 pt-4 text-sm">
          <div>
            <dt className="font-semibold">Sit with this</dt>
            <dd className="mt-0.5 text-ink-soft">{check.question}</dd>
          </div>
          <div>
            <dt className="font-semibold">Next step</dt>
            <dd className="mt-0.5 text-ink-soft">{check.nextStep}</dd>
          </div>
        </dl>
      )}
    </li>
  );
}

export default async function CoachPage({
  searchParams,
}: {
  searchParams: Promise<{ outcome?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.outcome) ? params.outcome[0] : params.outcome;
  const submitted = typeof raw === "string" && raw.trim().length > 0;
  const evaluation = submitted ? evaluateOutcome(raw) : null;
  const percent = evaluation ? Math.round((evaluation.score / evaluation.max) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Outcome Coach</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Write the outcome — any input. A rough thought, an objective, a whole OKR,
        or the sentence your exec team argued about this morning. You&rsquo;ll get a
        score against the{" "}
        <Link href="/principles" className="underline underline-offset-2">
          outcome definition principles
        </Link>
        , what&rsquo;s working, what&rsquo;s missing, and what to do next.
      </p>

      <form action="/coach" method="get" className="mt-8">
        <label htmlFor="outcome" className="block font-semibold">
          Your goal, objective or outcome
        </label>
        <p id="outcome-hint" className="mt-1 text-sm text-ink-soft">
          Plain text, up to {MAX_INPUT_LENGTH.toLocaleString()} characters. Your draft travels in the
          page address, so leave confidential detail out and paste an anonymised version — the check
          works just as well on one.
        </p>
        <textarea
          id="outcome"
          name="outcome"
          rows={6}
          maxLength={MAX_INPUT_LENGTH}
          aria-describedby="outcome-hint"
          defaultValue={evaluation?.text ?? (submitted ? raw : "")}
          placeholder="e.g. Reduce the time it takes a new customer to get set up, from 12 days to 3 days by Q3, so they stop giving up on us part-way through."
          className="mt-3 w-full rounded-2xl border border-ink/15 bg-white p-4 font-sans text-base leading-relaxed shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-full bg-ink px-6 py-3 font-semibold text-chalk hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Check my outcome
          </button>
          {submitted && (
            <Link href="/coach" className="text-sm font-semibold underline underline-offset-2">
              Start again
            </Link>
          )}
        </div>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        Not sure what good looks like? Try{" "}
        {EXAMPLES.map((ex, i) => (
          <span key={ex.label}>
            {i > 0 && " or "}
            <Link
              href={`/coach?outcome=${encodeURIComponent(ex.text)}`}
              className="font-semibold underline underline-offset-2"
            >
              {ex.label}
            </Link>
          </span>
        ))}
        . Already happy with your goal and stuck on everyone else?{" "}
        <Link href="/teach" className="font-semibold underline underline-offset-2">
          Teach outcomes
        </Link>{" "}
        covers your boss, your PMO and your peers.
      </p>

      {submitted && !evaluation && (
        <div className="mt-10 rounded-2xl border border-happier/40 bg-happier/10 p-6">
          <h2 className="font-bold">That&rsquo;s not quite enough to review</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Give it a sentence or two — who it&rsquo;s for and what should be different for them. A
            half-formed sentence is fine; scoring three words honestly isn&rsquo;t possible.
          </p>
        </div>
      )}

      {evaluation && (
        <div className="mt-12 space-y-10">
          <section aria-labelledby="score-heading">
            <div className={`rounded-3xl border-2 bg-white p-6 shadow-sm sm:p-8 ${evaluation.band.border}`}>
              <h2 id="score-heading" className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
                The verdict
              </h2>
              <p className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${evaluation.band.color}`}>
                {evaluation.band.label}
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-ink-soft">
                {evaluation.score} out of {evaluation.max} across {evaluation.checks.length} checks
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
                <div className="h-full rounded-full bg-ink" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">{evaluation.band.note}</p>
            </div>
          </section>

          {evaluation.strengths.length > 0 && (
            <section aria-labelledby="strengths-heading">
              <h2 id="strengths-heading" className="text-2xl font-bold tracking-tight">
                What&rsquo;s working
              </h2>
              <ul className="mt-4 space-y-3">
                {evaluation.strengths.map((c) => (
                  <li key={c.id} className="rounded-2xl border border-sooner/40 bg-white p-5 shadow-sm">
                    <p className="font-semibold">
                      <span aria-hidden="true" className="mr-2 text-sooner">
                        ✓
                      </span>
                      {c.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{c.finding}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {evaluation.gaps.length > 0 && (
            <section aria-labelledby="next-heading">
              <h2 id="next-heading" className="text-2xl font-bold tracking-tight">
                Do these next
              </h2>
              <p className="mt-2 max-w-2xl text-ink-soft">
                Biggest gap first. You don&rsquo;t have to close all of them — a goal that is
                meaningfully clearer today beats a perfect one next quarter.
              </p>
              <ol className="mt-4 space-y-3">
                {evaluation.gaps.slice(0, 3).map((c, i) => (
                  <li key={c.id} className="flex gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
                    <span className="text-2xl font-bold text-sooner" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{c.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{c.nextStep}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section aria-labelledby="detail-heading">
            <h2 id="detail-heading" className="text-2xl font-bold tracking-tight">
              Check by check
            </h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              Each check is one of the{" "}
              <Link href="/principles" className="underline underline-offset-2">
                outcome definition principles
              </Link>
              , scored 2 for strong, 1 for partly there, 0 for missing.
            </p>
            <ul className="mt-4 space-y-4">
              {evaluation.checks.map((c) => (
                <CheckCard key={c.id} check={c} />
              ))}
            </ul>
          </section>

          <section aria-labelledby="handoff-heading" className="rounded-3xl bg-ink p-6 text-chalk sm:p-8">
            <h2 id="handoff-heading" className="text-2xl font-bold tracking-tight">
              Take it to a real coach
            </h2>
            <p className="mt-2 max-w-2xl text-chalk/80">
              This check reads structure. It can&rsquo;t tell you whether the goal is the right one,
              whether the target is bold enough, or whether the people closest to the work agree.
              For that, take your draft and these gaps to a conversation — with your team, or with
              an AI holding one of our{" "}
              <Link href="/skills" className="font-semibold underline underline-offset-2">
                coaching skills
              </Link>
              . Here&rsquo;s a prompt to start with:
            </p>
            <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-chalk/10 p-4 font-mono text-xs leading-relaxed text-chalk">
              {evaluation.handoffPrompt}
            </pre>
            <div className="mt-4">
              <CopyButton text={evaluation.handoffPrompt} label="Copy the prompt" />
            </div>
          </section>

          <section aria-labelledby="teach-heading">
            <h2 id="teach-heading" className="text-2xl font-bold tracking-tight">
              Now take it to someone else
            </h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              A sharper goal that nobody else recognises is still a goal you&rsquo;ll be argued out
              of. The hard part is usually the boss who needs a date, the PMO that reports
              milestones, or the peers whose goals were set for them.{" "}
              <Link href="/teach" className="font-semibold underline underline-offset-2">
                Teach outcomes
              </Link>{" "}
              has the opener, the objections you&rsquo;ll hear and what to say back, for each of the
              three.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "boss", label: "Talk to my boss →" },
                { id: "pmo", label: "Take it to the PMO →" },
                { id: "peers", label: "Teach my peers →" },
              ].map((a) => (
                <Link
                  key={a.id}
                  href={`/teach?for=${a.id}&outcome=${encodeURIComponent(evaluation.text)}`}
                  className="rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-ink/5"
                >
                  {a.label}
                </Link>
              ))}
            </div>
            <p className="mt-3 text-sm text-ink-soft">
              Your draft travels with you, so the rehearsal prompt over there already knows the goal
              you&rsquo;re arguing for.
            </p>
          </section>
        </div>
      )}

      <section className="mt-14 rounded-2xl border border-ink/10 bg-white p-6 text-sm leading-relaxed text-ink-soft">
        <h2 className="font-semibold text-ink">How this check works, and what it can&rsquo;t do</h2>
        <p className="mt-2">
          It is deterministic pattern matching, not an AI. It reads your words and looks for the
          things the outcome principles ask for — a named customer, a change rather than a
          deliverable, a measure with a baseline, a target and a date, an explicit bet, a stated
          &ldquo;so what&rdquo;, and plain language. That means it never invents a number, a
          baseline or a rewritten goal for you: everything it says it saw, it quotes back.
        </p>
        <p className="mt-2">
          It also means it can be wrong. It sees words, not meaning — so it can miss a good goal
          written in unusual language, and it can be charmed by a bad one that happens to use the
          right vocabulary. Treat the score as a prompt for a conversation, never a verdict. You
          stay accountable for the goal.
        </p>
        <p className="mt-2">
          On privacy: your draft is sent to this site as part of the page address so the page can
          render the review. There is no database here and nothing is saved, but web requests do get
          logged, and the address bar carries your words wherever you bookmark or forward the link.
          Anonymise anything sensitive before you paste it — the check reads structure, so redacted
          examples score exactly the same.
        </p>
        <p className="mt-4 border-t border-ink/10 pt-4">
          <strong className="text-ink">Did it get your goal wrong?</strong> That is the most useful
          thing you can tell us, and it is how the check improves.{" "}
          <Link href={COACH_FEEDBACK_HREF} className="font-semibold underline underline-offset-2">
            Say what it missed
          </Link>{" "}
          — ninety seconds, anonymous if you like.
        </p>
      </section>
    </div>
  );
}
