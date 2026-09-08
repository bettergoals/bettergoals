"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { CopyButton } from "@/components/CopyButton";
import type { CoachReview } from "@/lib/coachAi";
import {
  EXAMPLES,
  MAX_INPUT_LENGTH,
  STATUS_LABEL,
  type Band,
  type Check,
  type CheckStatus,
} from "@/lib/outcomeCoach";
import { coachAction } from "./actions";
import { INITIAL_STATE } from "./state";

/**
 * One form, one conversation. The draft, the coach's questions and the
 * author's answers all travel in this form, so it works as a plain POST with
 * JavaScript off (Next re-renders the page with the action's result) and gets
 * pending states and a no-round-trip "use this draft" with it on.
 */

const STATUS_STYLE: Record<CheckStatus, string> = {
  strong: "border-sooner/40 bg-sooner/10 text-ink",
  partial: "border-happier/50 bg-happier/10 text-ink",
  missing: "border-ink/25 bg-ink/5 text-ink",
};

const STATUS_MARK: Record<CheckStatus, string> = { strong: "✓", partial: "◐", missing: "○" };

const VERDICT_LABEL: Record<CoachReview["verdict"], string> = {
  outcome: "Reads as an outcome",
  output: "Reads as an output",
  hybrid: "Part outcome, part output",
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

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="rounded-full bg-ink px-6 py-3 font-semibold text-chalk hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-progress disabled:opacity-70"
    >
      <span aria-live="polite">{pending ? busy : idle}</span>
    </button>
  );
}

/**
 * The clarifying round's escape hatch. A plain submit button, so it works with
 * JavaScript off: "create clarity, preserve autonomy" — the author decides when
 * they've said enough, not the coach.
 */
function SkipButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="skip"
      value="1"
      disabled={pending}
      className="text-sm font-semibold underline underline-offset-2 hover:text-ink-soft disabled:opacity-50"
    >
      Skip the questions and write it anyway
    </button>
  );
}

/**
 * Start again submits the form with `restart`, so the server action can hand
 * back a blank state. `useFormStatus().data` tells us whether the submission
 * in flight is this button's, so a coaching run doesn't relabel it.
 */
function RestartButton() {
  const { pending, data } = useFormStatus();
  const restarting = pending && Boolean(data?.get("restart"));
  return (
    <button
      type="submit"
      name="restart"
      value="1"
      disabled={pending}
      aria-disabled={pending}
      className="rounded-full text-sm font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-progress disabled:opacity-70"
    >
      {restarting ? "Starting again…" : "Start again"}
    </button>
  );
}

/**
 * The coach's questions with a box under each. In the clarifying round this
 * renders above the score and is the only thing asked of the author; later it
 * sits under the review as the next pass.
 */
function Questions({ questions, seq, clarifying }: { questions: string[]; seq: number; clarifying: boolean }) {
  if (!questions.length) return null;
  return (
    <section aria-labelledby="questions-heading">
      <h2 id="questions-heading" className="text-2xl font-bold tracking-tight">
        {clarifying ? "First, a few questions" : "The coach asks"}
      </h2>
      <p className="mt-2 max-w-2xl text-ink-soft">
        {clarifying
          ? "Before it offers you any wording, the coach wants the context only you have — who you are in this, who the outcome is for, and what you hope changes for them. Answer what you can: rough, rounded and anonymised is fine, “don’t know” is a real answer, and nothing here needs a confidential number."
          : "Answer what you can — rough, rounded and anonymised is fine, and “don’t know” is a real answer. Edit the draft above too if you want. Then send it back for another pass."}
      </p>
      <ol className="mt-4 space-y-4">
        {questions.map((q, i) => (
          <li key={`${seq}-${i}`} className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
            <input type="hidden" name={`q${i}`} value={q} />
            <label htmlFor={`a${i}`} className="block font-semibold">
              <span className="mr-2 text-sooner" aria-hidden="true">
                {i + 1}
              </span>
              {q}
            </label>
            <textarea
              id={`a${i}`}
              name={`a${i}`}
              rows={3}
              maxLength={1500}
              className="mt-3 w-full rounded-2xl border border-ink/15 bg-white p-3 text-sm leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <SubmitButton
          idle={clarifying ? "Answer and write my outcome" : "Send my answers"}
          busy="Coaching — this takes a few seconds…"
        />
        {clarifying && <SkipButton />}
      </div>
    </section>
  );
}

/** The shared shape of an AI review and the structural check. */
type Scored = {
  text: string;
  score: number;
  max: number;
  band: Band;
  checks: Check[];
  strengths: Check[];
  gaps: Check[];
  handoffPrompt: string;
};

function Verdict({ scored, review }: { scored: Scored; review: CoachReview | null }) {
  const percent = Math.round((scored.score / scored.max) * 100);
  return (
    <section aria-labelledby="score-heading">
      <div className={`rounded-3xl border-2 bg-white p-6 shadow-sm sm:p-8 ${scored.band.border}`}>
        <h2 id="score-heading" className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
          The verdict
        </h2>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className={`text-2xl font-bold tracking-tight sm:text-3xl ${scored.band.color}`}>{scored.band.label}</p>
          {review && (
            <p className="rounded-full border border-ink/15 px-3 py-0.5 text-xs font-semibold text-ink-soft">
              {VERDICT_LABEL[review.verdict]}
            </p>
          )}
        </div>
        <p className="mt-1 font-mono text-sm font-semibold text-ink-soft">
          {scored.score} out of {scored.max} across {scored.checks.length} checks
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
          <div className="h-full rounded-full bg-ink" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink">{review ? review.headline : scored.band.note}</p>
        {review?.personalInfo && (
          <p className="mt-4 rounded-2xl border border-safer/40 bg-safer/10 p-4 text-sm leading-relaxed">
            <span className="font-semibold">Personal information set aside. </span>
            {review.personalInfo}
          </p>
        )}
      </div>
    </section>
  );
}

function Strengths({ strengths }: { strengths: Check[] }) {
  if (!strengths.length) return null;
  return (
    <section aria-labelledby="strengths-heading">
      <h2 id="strengths-heading" className="text-2xl font-bold tracking-tight">
        What&rsquo;s working
      </h2>
      <ul className="mt-4 space-y-3">
        {strengths.map((c) => (
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
  );
}

function NextSteps({ gaps }: { gaps: Check[] }) {
  if (!gaps.length) return null;
  return (
    <section aria-labelledby="next-heading">
      <h2 id="next-heading" className="text-2xl font-bold tracking-tight">
        Do these next
      </h2>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Biggest gap first. You don&rsquo;t have to close all of them — a goal that is meaningfully clearer
        today beats a perfect one next quarter.
      </p>
      <ol className="mt-4 space-y-3">
        {gaps.slice(0, 3).map((c, i) => (
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
  );
}

function CheckByCheck({ checks }: { checks: Check[] }) {
  return (
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
        {checks.map((c) => (
          <CheckCard key={c.id} check={c} />
        ))}
      </ul>
    </section>
  );
}

function Teach({ text }: { text: string }) {
  return (
    <section aria-labelledby="teach-heading">
      <h2 id="teach-heading" className="text-2xl font-bold tracking-tight">
        Now take it to someone else
      </h2>
      <p className="mt-2 max-w-2xl text-ink-soft">
        A sharper goal that nobody else recognises is still a goal you&rsquo;ll be argued out of. The hard
        part is usually the boss who needs a date, the PMO that reports milestones, or the peers whose goals
        were set for them.{" "}
        <Link href="/teach" className="font-semibold underline underline-offset-2">
          Teach outcomes
        </Link>{" "}
        has the opener, the objections you&rsquo;ll hear and what to say back, for each of the three.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { id: "boss", label: "Talk to my boss →" },
          { id: "pmo", label: "Take it to the PMO →" },
          { id: "peers", label: "Teach my peers →" },
        ].map((a) => (
          <Link
            key={a.id}
            href={`/teach?for=${a.id}&outcome=${encodeURIComponent(text)}`}
            className="rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-ink/5"
          >
            {a.label}
          </Link>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        Your draft travels with you, so the rehearsal prompt over there already knows the goal you&rsquo;re
        arguing for.
      </p>
    </section>
  );
}

function Handoff({ prompt, ai }: { prompt: string; ai: boolean }) {
  return (
    <section aria-labelledby="handoff-heading" className="rounded-3xl bg-ink p-6 text-chalk sm:p-8">
      <h2 id="handoff-heading" className="text-2xl font-bold tracking-tight">
        Take it to your team
      </h2>
      <p className="mt-2 max-w-2xl text-chalk/80">
        {ai
          ? "The coach can tell you how the goal reads. It can't tell you whether it's the right goal, whether the target is bold enough, or whether the people closest to the work agree — the ones who'd say “this is the wrong goal” if they felt safe to. Take the draft and this conversation to them."
          : "This check reads structure. It can't tell you whether the goal is the right one, whether the target is bold enough, or whether the people closest to the work agree."}{" "}
        To carry on with an AI assistant holding one of our{" "}
        <Link href="/skills" className="font-semibold underline underline-offset-2">
          coaching skills
        </Link>
        , here&rsquo;s a prompt that picks up where this left off:
      </p>
      <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-chalk/10 p-4 font-mono text-xs leading-relaxed text-chalk">
        {prompt}
      </pre>
      <div className="mt-4">
        <CopyButton text={prompt} label="Copy the prompt" />
      </div>
    </section>
  );
}

export function CoachForm({ initialDraft, aiEnabled }: { initialDraft: string; aiEnabled: boolean }) {
  const [state, formAction] = useActionState(coachAction, { ...INITIAL_STATE, draft: initialDraft });
  // Seeded from the action's state, not the prop, so that with JavaScript off
  // the textarea shows what the last submission decided the draft is — the
  // adopted candidate, or nothing at all after "Start again".
  const [draft, setDraft] = useState(state.draft);
  const [seenSeq, setSeenSeq] = useState(state.seq);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // React resets an uncontrolled form after an action, so the draft is
  // controlled; it re-syncs from the server whenever a submission lands
  // (which is also how "use this as my draft" arrives without JavaScript).
  // Done during render — the React-sanctioned way to derive state from a
  // changed input — rather than in an effect, which would render twice.
  if (state.seq !== seenSeq) {
    setSeenSeq(state.seq);
    setDraft(state.draft);
  }

  useEffect(() => {
    if (state.seq > 0 && !state.notice && !state.cleared)
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state.seq, state.notice, state.cleared]);

  // Starting again should feel like arriving fresh: back at the top of the
  // page with the cursor in an empty box, and without the ?outcome= that a
  // reload would otherwise use to bring the old draft back.
  useEffect(() => {
    if (!state.cleared) return;
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
    textareaRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.cleared, state.seq]);

  const review = state.review;
  const scored: Scored | null = review ?? state.fallback;
  const hasResult = Boolean(scored);
  const questions = review?.questions ?? [];
  /** The coach has asked and is holding back the wording until it hears back. */
  const clarifying = review?.stage === "clarify" && questions.length > 0;

  function adopt(text: string) {
    setDraft(text);
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <form action={formAction} className="mt-8">
      <input type="hidden" name="turns" value={JSON.stringify(state.turns)} />
      {state.skipped && <input type="hidden" name="skipped" value="1" />}

      <label htmlFor="outcome" className="block font-semibold">
        Your goal, objective or outcome
      </label>
      <p id="outcome-hint" className="mt-1 text-sm text-ink-soft">
        Plain text, up to {MAX_INPUT_LENGTH.toLocaleString()} characters.{" "}
        {aiEnabled
          ? "It goes to an AI model to write the review and nothing is kept, but anonymise anything confidential first — the coaching is just as good on a redacted version, and it never needs to know who anyone is."
          : "Leave confidential detail out and paste an anonymised version — the check works just as well on one."}
      </p>
      <textarea
        ref={textareaRef}
        id="outcome"
        name="outcome"
        rows={6}
        maxLength={MAX_INPUT_LENGTH}
        aria-describedby="outcome-hint"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="e.g. Reduce the time it takes a new customer to get set up, from 12 days to 3 days by Q3, so they stop giving up on us part-way through."
        className="mt-3 w-full rounded-2xl border border-ink/15 bg-white p-4 font-sans text-base leading-relaxed shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <SubmitButton
          idle={hasResult ? "Check it again" : aiEnabled ? "Coach my outcome" : "Check my outcome"}
          busy={aiEnabled ? "Coaching — this takes a few seconds…" : "Checking…"}
        />
        {(hasResult || state.turns.length > 0) && <RestartButton />}
      </div>

      {state.cleared && (
        <p role="status" className="mt-6 rounded-2xl border border-sooner/40 bg-sooner/10 p-4 text-sm leading-relaxed">
          <span className="font-semibold">Cleared. </span>
          The draft and everything you told the coach are gone. Write a new goal above and check it whenever
          you&rsquo;re ready.
        </p>
      )}

      {!hasResult && (
        <p className="mt-6 text-sm text-ink-soft">
          Not sure what good looks like? Try{" "}
          {EXAMPLES.map((ex, i) => (
            <span key={ex.label}>
              {i > 0 && " or "}
              <Link
                href={`/coach?outcome=${encodeURIComponent(ex.text)}`}
                onClick={(e) => {
                  e.preventDefault();
                  adopt(ex.text);
                }}
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
      )}

      {state.notice && (
        <p role="status" className="mt-6 rounded-2xl border border-sooner/40 bg-sooner/10 p-4 text-sm leading-relaxed">
          {state.notice}
        </p>
      )}

      {state.tooShort && (
        <div role="status" className="mt-10 rounded-2xl border border-happier/40 bg-happier/10 p-6">
          <h2 className="font-bold">That&rsquo;s not quite enough to review</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Give it a sentence or two — who it&rsquo;s for and what should be different for them. A half-formed
            sentence is fine; coaching three words honestly isn&rsquo;t possible.
          </p>
        </div>
      )}

      {scored && (
        <div ref={resultsRef} className="mt-12 space-y-10 scroll-mt-6">
          {state.fallbackReason && (
            <p role="status" className="rounded-2xl border border-happier/50 bg-happier/10 p-4 text-sm leading-relaxed">
              <span className="font-semibold">Structural check only. </span>
              {state.fallbackReason}
            </p>
          )}

          {/* The clarifying round leads: questions before the wording, and
              before the score, so the first thing asked of the author is the
              context only they have. */}
          {clarifying && <Questions questions={questions} seq={state.seq} clarifying />}

          <Verdict scored={scored} review={review} />

          {state.turns.length > 0 && (
            <details className="rounded-2xl border border-ink/10 bg-white p-5 text-sm shadow-sm">
              <summary className="cursor-pointer font-semibold">
                What you&rsquo;ve told the coach so far ({state.turns.length})
              </summary>
              <dl className="mt-3 space-y-3">
                {state.turns.map((t, i) => (
                  <div key={i}>
                    <dt className="font-semibold text-ink-soft">{t.question}</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap">{t.answer}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}

          {review && review.done && (
            <section aria-labelledby="done-heading" className="rounded-3xl border-2 border-sooner/40 bg-sooner/10 p-6 sm:p-8">
              <h2 id="done-heading" className="text-2xl font-bold tracking-tight">
                Good enough to take to your team
              </h2>
              <p className="mt-2 max-w-2xl leading-relaxed text-ink-soft">
                The thinking has moved enough. Better beats perfect: stop refining here and go and test it on the
                people closest to the work — they&rsquo;re the ones who can tell you whether it&rsquo;s the right goal.
              </p>
            </section>
          )}

          {review && !clarifying && <Questions questions={questions} seq={state.seq} clarifying={false} />}

          {clarifying && (
            <section
              aria-labelledby="wording-heading"
              className="rounded-3xl border border-dashed border-ink/25 bg-white p-6 sm:p-8"
            >
              <h2 id="wording-heading" className="text-2xl font-bold tracking-tight">
                Ways you might write it
              </h2>
              <p className="mt-2 max-w-2xl text-ink-soft">
                These arrive once you&rsquo;ve answered the questions above. The coach won&rsquo;t phrase your
                outcome around facts it doesn&rsquo;t have: a confident sentence built on its guesses is worse
                than the rough one you already own.
              </p>
              <p className="mt-2 max-w-2xl text-sm text-ink-soft">
                In a hurry? Skip the questions and it will offer wording anyway, with «placeholders» wherever
                you haven&rsquo;t told it something.
              </p>
            </section>
          )}

          {review && review.candidates.length > 0 && (
            <section aria-labelledby="candidates-heading">
              <h2 id="candidates-heading" className="text-2xl font-bold tracking-tight">
                Ways you might write it
              </h2>
              <p className="mt-2 max-w-2xl text-ink-soft">
                Starting points, not answers — pick one and make it yours. Anything in «guillemets» is a fact
                the coach doesn&rsquo;t have and won&rsquo;t invent: that&rsquo;s yours to fill in.
              </p>
              <ul className="mt-4 space-y-4">
                {review.candidates.map((c, i) => (
                  <li key={i} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
                    <p className="text-lg leading-relaxed">{c.text}</p>
                    {c.note && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{c.note}</p>}
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        name="adopt"
                        value={c.text}
                        onClick={(e) => {
                          e.preventDefault();
                          adopt(c.text);
                        }}
                        className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
                        Use this as my draft
                      </button>
                      <CopyButton text={c.text} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Strengths strengths={scored.strengths} />
          <NextSteps gaps={scored.gaps} />
          <CheckByCheck checks={scored.checks} />
          <Handoff prompt={scored.handoffPrompt} ai={Boolean(review)} />
          <Teach text={scored.text} />
        </div>
      )}
    </form>
  );
}
