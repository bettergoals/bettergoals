import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { MAX_INPUT_LENGTH } from "@/lib/outcomeCoach";
import {
  AUDIENCES,
  PITFALLS,
  SESSION_AGENDA,
  audienceFor,
  buildRehearsalPrompt,
} from "@/lib/outcomeConversations";

export const metadata = {
  title: "Teach outcomes",
  description:
    "How to talk to your boss, your PMO and your peers about outcomes — the opener, the conversation, the objections you'll hear and what to say, plus a prompt to rehearse it first.",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TeachPage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string | string[]; outcome?: string | string[] }>;
}) {
  const params = await searchParams;
  const audience = audienceFor(first(params.for));
  const draftRaw = first(params.outcome);
  const draft = draftRaw?.trim().slice(0, MAX_INPUT_LENGTH) || undefined;
  const prompt = buildRehearsalPrompt(audience, draft);

  /** Keep any draft you arrived with as you switch audience. */
  const hrefFor = (id: string) =>
    draft
      ? `/teach?for=${id}&outcome=${encodeURIComponent(draft)}`
      : `/teach?for=${id}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Teach outcomes</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        You can write a perfectly good outcome and still be handed an output next quarter. The
        harder half of this work is everyone else: the boss who needs a date, the PMO that reports
        milestones, the peers whose goals were set for them. This page is for those three
        conversations — what to say, what you&rsquo;ll hear back, and what to leave behind.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-ink-soft">
        Got a draft already? The{" "}
        <Link href="/coach" className="underline underline-offset-2">
          Outcome Coach
        </Link>{" "}
        will score it first — then come back here to take it to someone.
      </p>

      <nav aria-label="Who you're talking to" className="mt-8 flex flex-wrap gap-2">
        {AUDIENCES.map((a) => {
          const active = a.id === audience.id;
          return (
            <Link
              key={a.id}
              href={hrefFor(a.id)}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-chalk"
                  : "rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-semibold hover:bg-ink/5"
              }
            >
              {a.label}
            </Link>
          );
        })}
      </nav>

      <article className="mt-8 space-y-10">
        <section aria-labelledby="audience-heading">
          <h2 id="audience-heading" className="text-2xl font-bold tracking-tight">
            {audience.heading}
          </h2>
          <p className="mt-2 max-w-2xl text-ink-soft">{audience.blurb}</p>

          <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
              Start here: what they&rsquo;re under
            </h3>
            <p className="mt-2 leading-relaxed text-ink-soft">{audience.pressure}</p>
          </div>

          <div className="mt-4 rounded-2xl border-2 border-sooner/40 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
              An opener that doesn&rsquo;t start a fight
            </h3>
            <p className="mt-2 text-lg font-semibold leading-relaxed">
              &ldquo;{audience.opener}&rdquo;
            </p>
            <div className="mt-4">
              <CopyButton text={audience.opener} label="Copy the opener" />
            </div>
          </div>
        </section>

        <section aria-labelledby="moves-heading">
          <h2 id="moves-heading" className="text-2xl font-bold tracking-tight">
            The conversation
          </h2>
          <p className="mt-2 max-w-2xl text-ink-soft">
            In order, and none of it requires a slide. Each move teaches by doing something to a
            real goal rather than explaining a principle.
          </p>
          <ol className="mt-4 space-y-3">
            {audience.moves.map((m, i) => (
              <li
                key={m.title}
                className="flex gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm"
              >
                <span className="text-2xl font-bold text-sooner" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{m.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{m.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="objections-heading">
          <h2 id="objections-heading" className="text-2xl font-bold tracking-tight">
            What you&rsquo;ll hear back
          </h2>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Every one of these is reasonable from where they sit. Answer the fear underneath, not
            the sentence.
          </p>
          <ul className="mt-4 space-y-4">
            {audience.objections.map((o) => (
              <li key={o.heard} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
                <p className="text-lg font-bold tracking-tight">&ldquo;{o.heard}&rdquo;</p>
                <dl className="mt-4 space-y-3 border-t border-ink/10 pt-4 text-sm">
                  <div>
                    <dt className="font-semibold">What&rsquo;s underneath it</dt>
                    <dd className="mt-0.5 text-ink-soft">{o.meaning}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Something you could say</dt>
                    <dd className="mt-0.5 text-ink-soft">&ldquo;{o.say}&rdquo;</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="after-heading" className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
            <h2 id="after-heading" className="text-lg font-bold tracking-tight">
              What to leave behind
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{audience.afterwards}</p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold tracking-tight">How you&rsquo;ll know it landed</h2>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-soft">
              {audience.signals.map((s) => (
                <li key={s} className="flex gap-2">
                  <span aria-hidden="true" className="text-sooner">
                    ✓
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink-soft">
              Note that &ldquo;they agreed&rdquo; isn&rsquo;t on the list. Agreement in the room is
              cheap; the test is what happens to the next goal written without you.
            </p>
          </div>
        </section>

        <section aria-labelledby="rehearse-heading" className="rounded-3xl bg-ink p-6 text-chalk sm:p-8">
          <h2 id="rehearse-heading" className="text-2xl font-bold tracking-tight">
            Rehearse it first
          </h2>
          <p className="mt-2 max-w-2xl text-chalk/80">
            Paste this into Claude or any assistant — ideally alongside one of our{" "}
            <Link href="/skills" className="font-semibold underline underline-offset-2">
              coaching skills
            </Link>
            . It coaches you on the angle, then role-plays {audience.label.toLowerCase()} so you can
            practise before it counts.
            {draft
              ? " Your draft from the coach is included."
              : " Bring a draft through the coach first and it will be included here."}
          </p>
          <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-chalk/10 p-4 font-mono text-xs leading-relaxed text-chalk">
            {prompt}
          </pre>
          <div className="mt-4">
            <CopyButton text={prompt} label="Copy the prompt" />
          </div>
        </section>

        <section aria-labelledby="session-heading">
          <h2 id="session-heading" className="text-2xl font-bold tracking-tight">
            When a chat isn&rsquo;t enough: one hour, one goal
          </h2>
          <p className="mt-2 max-w-2xl text-ink-soft">
            The same agenda works for a team, a leadership group or a PMO. It is deliberately not a
            course — there is no theory section, and everything that gets rewritten is real work.
            Running it? The{" "}
            <a
              href="/skills/goal-jam-facilitator.md"
              className="underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              goal-jam-facilitator
            </a>{" "}
            skill will help you plan it, and the{" "}
            <Link href="/templates" className="underline underline-offset-2">
              Outcome Canvas
            </Link>{" "}
            is the one handout you need.
          </p>
          <ol className="mt-4 space-y-3">
            {SESSION_AGENDA.map((s) => (
              <li key={s.title} className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
                <p className="font-mono text-sm font-bold text-sooner">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="pitfalls-heading">
          <h2 id="pitfalls-heading" className="text-2xl font-bold tracking-tight">
            Five ways this goes wrong
          </h2>
          <ul className="mt-4 space-y-2">
            {PITFALLS.map((p) => (
              <li
                key={p}
                className="flex gap-3 rounded-2xl border border-happier/40 bg-happier/10 p-4 text-sm leading-relaxed text-ink-soft"
              >
                <span aria-hidden="true" className="font-bold text-ink">
                  ×
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>
      </article>

      <section className="mt-14 rounded-2xl border border-ink/10 bg-white p-6 text-sm leading-relaxed text-ink-soft">
        <h2 className="font-semibold text-ink">Where this comes from</h2>
        <p className="mt-2">
          The advice here is the{" "}
          <Link href="/principles" className="underline underline-offset-2">
            coach design principles
          </Link>{" "}
          pointed at a colleague instead of a goal: coach rather than dictate, challenge assumptions
          without inventing them, create clarity while preserving autonomy, and settle for better
          rather than perfect. It assumes the person you&rsquo;re talking to is sensible and under
          real pressure — because they are, and because approaches that assume otherwise don&rsquo;t
          work twice.
        </p>
        <p className="mt-2">
          It is written from community experience, not research, and your organisation is not ours.
          Take what fits, and if you find a better line, put it on the{" "}
          <Link href="/contribute" className="underline underline-offset-2">
            board
          </Link>{" "}
          so the next person gets it too.
        </p>
        <p className="mt-2">
          A note on names: keep them out. Talk about roles — &ldquo;my manager&rdquo;, &ldquo;the
          portfolio lead&rdquo; — in anything you paste into an AI, here or anywhere else. This site{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            refuses personal information
          </Link>{" "}
          on purpose, and a conversation about someone is one of the easiest ways to leak it.
        </p>
      </section>
    </div>
  );
}
