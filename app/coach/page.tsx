import Link from "next/link";
import { coachAiEnabled } from "@/lib/coachAi";
import { COACH_FEEDBACK_HREF } from "@/lib/feedback";
import { CoachForm } from "./CoachForm";

export const metadata = {
  title: "Outcome Coach",
  description:
    "Paste any goal — a rough thought, an objective, a whole OKR — and get coached against the outcome principles: an honest score, the reasons, the questions you most need to answer, and help writing a better outcome.",
};

/** The coach waits on a model; give the server action room to finish. */
export const maxDuration = 120;

export default async function CoachPage({
  searchParams,
}: {
  searchParams: Promise<{ outcome?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.outcome) ? params.outcome[0] : params.outcome;
  const initialDraft = typeof raw === "string" ? raw.slice(0, 2000) : "";
  const ai = coachAiEnabled();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Outcome Coach</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Write the outcome — any input. A rough thought, an objective, a whole OKR, or the sentence your
        exec team argued about this morning. You&rsquo;ll get a score against the{" "}
        <Link href="/principles" className="underline underline-offset-2">
          outcome definition principles
        </Link>
        , the reasons, {ai ? "the questions you most need to answer — and once you have, help writing a better one" : "what's missing, and what to do next"}.
      </p>

      <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-ink-soft">
        <span className="rounded-full bg-safer/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink">
          Zero data retention
        </span>
        <span>
          {ai
            ? "Your draft goes to a model that keeps nothing and never trains on it — and no account, no database, no copy here."
            : "This deployment runs the structural check: your draft never leaves this site."}{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            How that works
          </Link>
          .
        </span>
      </p>

      <CoachForm initialDraft={initialDraft} aiEnabled={ai} />

      <section className="mt-14 rounded-2xl border border-ink/10 bg-white p-6 text-sm leading-relaxed text-ink-soft">
        <h2 className="font-semibold text-ink">How the coach works, and what it can&rsquo;t do</h2>
        {ai ? (
          <>
            <p className="mt-2">
              Your draft goes to an AI model, holding the community&rsquo;s{" "}
              <Link href="/principles" className="underline underline-offset-2">
                principles
              </Link>{" "}
              as its brief, and comes back scored against the seven outcome checks — 2 for strong, 1 for
              partly there, 0 for missing, out of 14 — with the reasons in your own words, the questions
              that would move the thinking furthest, and candidate phrasings to make your own. It follows
              the coach design principles: it asks rather than tells, and it never invents a baseline, a
              target or a fact you didn&rsquo;t give it — anything it doesn&rsquo;t know is left in
              «guillemets» for you to fill in.
            </p>
            <p className="mt-2">
              It asks before it writes. On a first draft you get the score and two or three clarifying
              questions — who you are in this, who the outcome is for, what you hope changes for them — and
              no suggested wording yet, because a phrasing built on the coach&rsquo;s guesses about your
              organisation teaches you nothing. Answer what you can and the wording comes next; rough,
              rounded and anonymised answers are enough, and none of the questions need a commercially
              confidential number. If you&rsquo;d rather not answer, skip them and it will offer wording with
              «placeholders» instead.
            </p>
            <p className="mt-2">
              It can still be wrong. It reads a sentence, not your organisation, so it can miss context
              your team would take for granted, and it can be charmed by a bad goal in good vocabulary.
              Treat the score as a prompt for a conversation, never a verdict. You stay accountable for the
              goal.
            </p>
            <p className="mt-2">
              On privacy: your draft and your answers are sent to this site and on to an AI model, through
              Vercel&rsquo;s AI Gateway, to write the review. Nothing is stored here — there is no database
              and no account — and the conversation lives only on this page until you leave it. Every call
              is made under zero data retention and no prompt training: the gateway will only route it to a
              provider that has agreed to keep nothing once the reply is written and never train on it, and
              if no such provider can serve the model it refuses the request rather than sending your words
              somewhere that would keep them. Web requests to this site are still logged by the host, so
              anonymise anything sensitive before you paste it. The coach never needs to know who anyone is,
              and if personal information turns up it sets it aside and works with the role. More on the{" "}
              <Link href="/privacy" className="underline underline-offset-2">
                privacy page
              </Link>
              .
            </p>
          </>
        ) : (
          <>
            <p className="mt-2">
              This deployment is running the structural check: deterministic pattern matching, not an AI. It
              reads your words and looks for the things the outcome principles ask for — a named customer, a
              change rather than a deliverable, a measure with a baseline, a target and a date, an explicit
              bet, a stated &ldquo;so what&rdquo;, and plain language. It never invents a number, a baseline
              or a rewritten goal for you: everything it says it saw, it quotes back.
            </p>
            <p className="mt-2">
              It sees words, not meaning — so it can miss a good goal written in unusual language, and it can
              be charmed by a bad one that happens to use the right vocabulary. Treat the score as a prompt
              for a conversation, never a verdict.
            </p>
            <p className="mt-2">
              On privacy: your draft is sent to this site to render the review. There is no database here and
              nothing is saved, but web requests do get logged. Anonymise anything sensitive before you paste
              it — the check reads structure, so redacted examples score exactly the same.
            </p>
          </>
        )}
        <p className="mt-4 border-t border-ink/10 pt-4">
          <strong className="text-ink">Did it get your goal wrong?</strong> That is the most useful
          thing you can tell us, and it is how the coach improves.{" "}
          <Link href={COACH_FEEDBACK_HREF} className="font-semibold underline underline-offset-2">
            Say what it missed
          </Link>{" "}
          — ninety seconds, anonymous if you like.
        </p>
      </section>
    </div>
  );
}
