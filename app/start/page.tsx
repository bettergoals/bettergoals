import Link from "next/link";
import { AskForm } from "@/components/AskForm";
import { CopyButton } from "@/components/CopyButton";
import { INTENT_CHOICES, intentFor, routeAskAs, type Route } from "@/lib/askRouter";

export const metadata = {
  title: "Start here",
  description:
    "Say what you're trying to achieve in one sentence and get the next step — the right guidance, template, coaching questions and prompt from everything this community has written.",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function RouteCard({ route }: { route: Route }) {
  return (
    <li>
      <Link
        href={route.href}
        className="block h-full rounded-2xl border border-ink/10 bg-white p-5 shadow-sm hover:bg-ink/5"
      >
        <p className="font-semibold">{route.label} →</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{route.note}</p>
      </Link>
    </li>
  );
}

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; as?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = first(params.q) ?? "";
  const asked = raw.trim().length > 0;
  const ask = asked ? routeAskAs(raw, first(params.as)) : null;

  if (!ask) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Start here</h1>
        <p className="mt-2 text-ink-soft">
          {asked
            ? "That's not quite enough to point you anywhere useful — give it a few more words, in whatever language you'd use with a colleague."
            : "Tell us what you're trying to achieve, in your own words. You'll get one next step, not a reading list."}
        </p>

        <div className="mt-8 rounded-3xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
          <AskForm tone="light" defaultValue={asked ? raw : ""} autoFocus />
        </div>

        <h2 className="mt-12 text-xl font-bold tracking-tight">What this can help with</h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-soft">
          {INTENT_CHOICES.map((c) => (
            <li key={c.id}>
              <span className="font-semibold text-ink">{c.label}</span> — when{" "}
              {intentFor(c.id).heard}.
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const { intent, heard, primary, also, prompt, text, guessed } = ask;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">You said</p>
      <blockquote className="mt-2 border-l-4 border-sooner pl-4 text-lg leading-relaxed">
        {text}
      </blockquote>
      <p className="mt-4 text-ink-soft">
        {guessed ? "Taking a guess: it sounds like " : "It sounds like "}
        {heard}.
      </p>

      <h1 className="mt-8 text-3xl font-bold tracking-tight">{intent.heading}</h1>
      <p className="mt-3 leading-relaxed text-ink-soft">{intent.guidance}</p>

      <section aria-labelledby="primary-heading" className="mt-8">
        <h2 id="primary-heading" className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
          Start here
        </h2>
        <Link
          href={primary.href}
          className="mt-3 block rounded-3xl border-2 border-sooner/50 bg-white p-6 shadow-sm hover:bg-sooner/5 sm:p-8"
        >
          <p className="text-xl font-bold tracking-tight sm:text-2xl">{primary.label} →</p>
          <p className="mt-2 leading-relaxed text-ink-soft">{primary.note}</p>
        </Link>
      </section>

      <section aria-labelledby="questions-heading" className="mt-12">
        <h2 id="questions-heading" className="text-2xl font-bold tracking-tight">
          Sit with these first
        </h2>
        <p className="mt-2 text-ink-soft">
          Three questions, before any template. If you can answer them, the rest is formatting.
        </p>
        <ul className="mt-4 space-y-3">
          {intent.questions.map((q) => (
            <li key={q} className="rounded-2xl border border-ink/10 bg-white p-5 leading-relaxed shadow-sm">
              {q}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="steps-heading" className="mt-12">
        <h2 id="steps-heading" className="text-2xl font-bold tracking-tight">
          Then do these
        </h2>
        <ol className="mt-4 space-y-3">
          {intent.steps.map((s, i) => (
            <li key={s} className="flex gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
              <span className="text-2xl font-bold text-sooner" aria-hidden="true">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-ink-soft">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="prompt-heading" className="mt-12 rounded-3xl bg-ink p-6 text-chalk sm:p-8">
        <h2 id="prompt-heading" className="text-2xl font-bold tracking-tight">
          Or take it to an AI coach
        </h2>
        <p className="mt-2 text-chalk/80">
          This prompt carries your words, what you asked for, and the outcome principles — so the
          coaching arrives in this community&rsquo;s language rather than the internet&rsquo;s. For a
          deeper version, give your assistant the{" "}
          <a
            href={`/skills/${intent.skill.file}`}
            download
            className="font-mono font-semibold underline underline-offset-2"
          >
            {intent.skill.name}
          </a>{" "}
          skill — it&rsquo;s built for {intent.skill.why}.
        </p>
        <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-chalk/10 p-4 font-mono text-xs leading-relaxed text-chalk">
          {prompt}
        </pre>
        <div className="mt-4">
          <CopyButton text={prompt} label="Copy the prompt" />
        </div>
      </section>

      {also.length > 0 && (
        <section aria-labelledby="also-heading" className="mt-12">
          <h2 id="also-heading" className="text-2xl font-bold tracking-tight">
            Also worth a look
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {also.map((r) => (
              <RouteCard key={r.href} route={r} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="rethink-heading" className="mt-14 rounded-3xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
        <h2 id="rethink-heading" className="text-xl font-bold tracking-tight">
          Not what you meant?
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Pick the route yourself — your words come with you.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {INTENT_CHOICES.filter((c) => c.id !== intent.id).map((c) => (
            <li key={c.id}>
              <Link
                href={`/start?q=${encodeURIComponent(text)}&as=${c.id}`}
                className="inline-block rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 border-t border-ink/10 pt-6">
          <AskForm
            tone="light"
            defaultValue={text}
            label="Or say it differently"
            submitLabel="Try again"
            showExamples={false}
          />
        </div>
      </section>

      <p className="mt-10 text-sm leading-relaxed text-ink-soft">
        How this works: it reads your words for the kind of help you asked for and points you at what
        this community has already written. It is pattern matching, not an AI, so it can misread you —
        that&rsquo;s what the buttons above are for. Nothing is saved, but your words travel in the
        page address, so anonymise anything sensitive before you paste it.
      </p>
    </div>
  );
}
