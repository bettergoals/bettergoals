import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { BUILD_URL, NEW_IDEA_URL } from "@/lib/config";
import {
  EXAMPLE_ASKS,
  PATHS,
  askHref,
  buildAskPrompt,
  route,
  stepHref,
  type Path,
} from "@/lib/askRouter";
import { MAX_INPUT_LENGTH, evaluateOutcome } from "@/lib/outcomeCoach";

const PILLARS = [
  {
    word: "Sooner",
    color: "text-sooner",
    border: "border-sooner/40",
    text: "Goals that create value in weeks, not vague ambitions parked until year-end. Small, outcome-shaped, and testable early.",
  },
  {
    word: "Safer",
    color: "text-safer",
    border: "border-safer/40",
    text: "Goals with psychological safety and governance built in — safe to challenge, safe to miss, safe to learn from in the open.",
  },
  {
    word: "Happier",
    color: "text-happier",
    border: "border-happier/40",
    text: "Goals people actually want to pursue — meaningful for customers, colleagues, and the humans doing the work.",
  },
];

const STEPS = [
  { n: "1", title: "Add an idea", text: "Suggest content, features, or thinking for this site. Every idea is a GitHub issue — one form, two minutes." },
  { n: "2", title: "Vote & discuss", text: "Endorse ideas with a 👍 and shape them in the comments. The board updates live as the group votes." },
  { n: "3", title: "Claude builds it", text: "When the group endorses an idea and it moves to Doing, Claude Code picks it up and builds it into this very site." },
  { n: "4", title: "Review & ship", text: "The change lands as a pull request with a preview link. The community reviews, then it ships to production." },
];

/** Link into the box with an example, or with the same words read a different way. */
function pathHref(ask: string, pathId: string): string {
  return `${askHref(ask)}&path=${pathId}`;
}

function PathChip({ ask, path }: { ask: string; path: Path }) {
  return (
    <Link
      href={pathHref(ask, path.id)}
      className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      {path.label}
    </Link>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ask?: string | string[]; path?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawAsk = Array.isArray(params.ask) ? params.ask[0] : params.ask;
  const rawPath = Array.isArray(params.path) ? params.path[0] : params.path;
  const asked = typeof rawAsk === "string" && rawAsk.trim().length > 0;
  const result = asked ? route(rawAsk) : null;

  // A "not what I meant?" chip overrides what the words alone suggested.
  const forced = result ? PATHS.find((p) => p.id === rawPath) ?? null : null;
  const path = forced ?? result?.path ?? null;
  const prompt = result && path ? (forced ? buildAskPrompt(forced, result.text) : result.prompt) : "";

  // On the "check what I've written" path, the review itself is the answer.
  const evaluation = result && path?.id === "check" ? evaluateOutcome(result.draft) : null;
  const others = path ? PATHS.filter((p) => p.id !== path.id) : PATHS;

  return (
    <div>
      <section className="bg-ink text-chalk">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-chalk/60">
            A Sooner Safer Happier community resource
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            What are you trying to achieve?
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-chalk/80">
            Say it in your own words — a goal, a mess, a conversation you&rsquo;re dreading. You&rsquo;ll
            get the next steps, the questions worth sitting with, and a prompt to take away.
          </p>

          <form action="/" method="get" className="mt-7">
            <label htmlFor="ask" className="sr-only">
              What are you trying to achieve?
            </label>
            <textarea
              id="ask"
              name="ask"
              rows={4}
              maxLength={MAX_INPUT_LENGTH}
              aria-describedby="ask-hint"
              defaultValue={result?.text ?? ""}
              placeholder="e.g. I have a high level goal, help me structure this as OKRs"
              className="w-full rounded-2xl border border-chalk/20 bg-chalk p-4 font-sans text-base leading-relaxed text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sooner"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="rounded-full bg-sooner px-6 py-3 font-semibold text-ink hover:bg-sooner/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chalk"
              >
                Show me where to start →
              </button>
              {asked && (
                <Link href="/" className="text-sm font-semibold underline underline-offset-2">
                  Start again
                </Link>
              )}
            </div>
            <p id="ask-hint" className="mt-3 text-sm text-chalk/60">
              Your words travel in the page address, so leave confidential detail out — an
              anonymised version works just as well.
            </p>
          </form>

          <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-chalk/70">
            <span className="rounded-full bg-safer/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-chalk">
              Zero data retention
            </span>
            <span>
              The coach only uses models that keep nothing and never train on your words, and
              there&rsquo;s no account here and nothing of yours written down either.{" "}
              <Link href="/privacy" className="font-semibold underline underline-offset-2">
                How that works
              </Link>
              .
            </span>
          </p>

          {!asked && (
            <div className="mt-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-chalk/60">
                Or start with one of these
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {EXAMPLE_ASKS.map((ex) => (
                  <Link
                    key={ex}
                    href={askHref(ex)}
                    className="rounded-full border border-chalk/25 px-4 py-2 text-sm hover:bg-chalk/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chalk"
                  >
                    {ex}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {result && (
        <section className="mx-auto max-w-4xl px-4 py-12">
          {!path && (
            <div className="rounded-3xl border border-happier/40 bg-happier/10 p-6 sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight">
                {result.enough
                  ? "I couldn’t tell which of these you meant"
                  : "Give me a sentence to work with"}
              </h2>
              <p className="mt-2 max-w-2xl text-ink-soft">
                {result.enough
                  ? "This reads your words, not your meaning — so sometimes it shrugs. Pick the closest and it will pick up your words from there."
                  : "A few words about what you’re trying to do is enough: what you’ve got, and what you want to happen next."}
              </p>
              <ul className="mt-6 space-y-3">
                {PATHS.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={result.enough ? pathHref(result.text, p.id) : askHref(p.label)}
                      className="block rounded-2xl border border-ink/10 bg-white p-5 shadow-sm hover:bg-ink/5"
                    >
                      <p className="font-semibold">{p.label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{p.heading}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {path && (
            <div className="space-y-10">
              <div className="rounded-3xl border-2 border-sooner/40 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
                  Where to start
                </h2>
                <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{path.heading}</p>
                <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">{path.blurb}</p>
                {!forced && result.matched.length > 0 && (
                  <p className="mt-4 text-sm text-ink-soft">
                    Read from{" "}
                    {result.matched.slice(0, 3).map((m, i) => (
                      <span key={m}>
                        {i > 0 && ", "}
                        <span className="font-mono">“{m}”</span>
                      </span>
                    ))}{" "}
                    in what you wrote.
                  </p>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-ink-soft">Not what you meant?</span>
                  {others.map((p) => (
                    <PathChip key={p.id} ask={result.text} path={p} />
                  ))}
                </div>
              </div>

              <section aria-labelledby="steps-heading">
                <h2 id="steps-heading" className="text-2xl font-bold tracking-tight">
                  Do these next
                </h2>
                <ol className="mt-4 space-y-3">
                  {path.steps.map((step, i) => (
                    <li
                      key={step.title}
                      className="flex gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm"
                    >
                      <span className="text-2xl font-bold text-sooner" aria-hidden="true">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold">{step.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{step.text}</p>
                        {step.link && (
                          <Link
                            href={stepHref(step.link.href, result.draft)}
                            className="mt-3 inline-block rounded-full bg-ink px-5 py-2 text-sm font-semibold text-chalk hover:bg-ink-soft"
                          >
                            {step.link.label}
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {evaluation && (
                <section
                  aria-labelledby="verdict-heading"
                  className={`rounded-3xl border-2 bg-white p-6 shadow-sm sm:p-8 ${evaluation.band.border}`}
                >
                  <h2
                    id="verdict-heading"
                    className="text-xs font-semibold uppercase tracking-widest text-ink-soft"
                  >
                    A first read of what you pasted
                  </h2>
                  <p className={`mt-2 text-2xl font-bold tracking-tight ${evaluation.band.color}`}>
                    {evaluation.band.label}
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-ink-soft">
                    {evaluation.score} out of {evaluation.max} across {evaluation.checks.length}{" "}
                    checks
                  </p>
                  {evaluation.gaps.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                      {evaluation.gaps.slice(0, 3).map((gap) => (
                        <li key={gap.id}>
                          <span aria-hidden="true" className="mr-2">
                            ○
                          </span>
                          <span className="font-semibold text-ink">{gap.title}</span> — {gap.nextStep}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href={`/coach?outcome=${encodeURIComponent(result.draft)}`}
                    className="mt-5 inline-block rounded-full bg-ink px-5 py-2 text-sm font-semibold text-chalk hover:bg-ink-soft"
                  >
                    See the full check →
                  </Link>
                </section>
              )}

              <section aria-labelledby="questions-heading">
                <h2 id="questions-heading" className="text-2xl font-bold tracking-tight">
                  Sit with these
                </h2>
                <p className="mt-2 max-w-2xl text-ink-soft">
                  Nobody here can answer these for you — that&rsquo;s rather the point.
                </p>
                <ul className="mt-4 space-y-3">
                  {path.questions.map((q) => (
                    <li key={q} className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
                      <p className="leading-relaxed">{q}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section
                aria-labelledby="prompt-heading"
                className="rounded-3xl bg-ink p-6 text-chalk sm:p-8"
              >
                <h2 id="prompt-heading" className="text-2xl font-bold tracking-tight">
                  Take it to an AI, with your words already in it
                </h2>
                <p className="mt-2 max-w-2xl text-chalk/80">
                  Paste this into Claude, ChatGPT or whatever you use. It carries what you wrote,
                  the coaching stance, and the rule that matters most: no invented numbers.
                </p>
                <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-chalk/10 p-4 font-mono text-xs leading-relaxed text-chalk">
                  {prompt}
                </pre>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <CopyButton text={prompt} label="Copy the prompt" />
                  {path.skill && (
                    <Link
                      href="/skills"
                      className="text-sm font-semibold text-chalk underline underline-offset-2"
                    >
                      Or download the {path.skill.name} skill →
                    </Link>
                  )}
                </div>
              </section>

              <p className="text-sm leading-relaxed text-ink-soft">
                This box reads your words with keyword matching, not AI — it can be wrong, and every
                door it opens is a page you can reach from the menu above anyway:{" "}
                <Link href="/coach" className="underline underline-offset-2">
                  Coach
                </Link>
                ,{" "}
                <Link href="/teach" className="underline underline-offset-2">
                  Teach
                </Link>
                ,{" "}
                <Link href="/principles" className="underline underline-offset-2">
                  Principles
                </Link>
                ,{" "}
                <Link href="/okrs" className="underline underline-offset-2">
                  OKRs
                </Link>
                ,{" "}
                <Link href="/templates" className="underline underline-offset-2">
                  Templates
                </Link>{" "}
                and{" "}
                <Link href="/skills" className="underline underline-offset-2">
                  Skills
                </Link>
                . Nothing is stored — your words live in the page address only, so anonymise
                anything sensitive (
                <Link href="/privacy" className="underline underline-offset-2">
                  why
                </Link>
                ).
              </p>
            </div>
          )}
        </section>
      )}

      {!asked && (
        <>
          <section className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-2xl font-bold tracking-tight">What makes a goal better?</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {PILLARS.map((p) => (
                <div key={p.word} className={`rounded-2xl border ${p.border} bg-white p-6 shadow-sm`}>
                  <h3 className={`text-xl font-bold ${p.color}`}>{p.word}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-ink-soft">
              Prefer to browse? Everything above is also a page:{" "}
              <Link href="/coach" className="font-semibold underline underline-offset-2">
                the Outcome Coach
              </Link>{" "}
              scores a goal you paste,{" "}
              <Link href="/okrs" className="font-semibold underline underline-offset-2">
                OKRs the way SSH think about them
              </Link>{" "}
              is the short version of the pattern, and{" "}
              <Link href="/principles" className="font-semibold underline underline-offset-2">
                the principles
              </Link>{" "}
              are what all of it is built on.
            </p>
          </section>

          <section className="border-y border-ink/10 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-16">
              <h2 className="text-2xl font-bold tracking-tight">How this site gets built</h2>
              <p className="mt-2 max-w-2xl text-ink-soft">
                This is a living experiment in working the way we talk about working:
                small ideas, fast feedback, shipped continuously.
              </p>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {STEPS.map((s) => (
                  <div key={s.n} className="relative rounded-2xl border border-ink/10 p-6">
                    <span className="text-3xl font-bold text-sooner">{s.n}</span>
                    <h3 className="mt-2 font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={BUILD_URL}
                  className="rounded-full border border-ink/15 bg-white px-6 py-3 font-semibold shadow-sm hover:bg-ink/5"
                >
                  See the live board ↗
                </a>
                <a
                  href={NEW_IDEA_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-ink/15 bg-white px-6 py-3 font-semibold shadow-sm hover:bg-ink/5"
                >
                  Add your idea →
                </a>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-16">
            <div className="rounded-3xl bg-ink px-6 py-12 text-center text-chalk sm:px-12">
              <h2 className="text-2xl font-bold sm:text-3xl">In the room with us?</h2>
              <p className="mx-auto mt-3 max-w-xl text-chalk/80">
                Head to <Link href="/contribute" className="underline underline-offset-2">Contribute</Link> for
                the two-minute path from “I have a thought” to “it’s on the board” —
                whether you live in GitHub or have never touched it.
              </p>
              <p className="mx-auto mt-3 max-w-xl text-chalk/80">
                Used the site already?{" "}
                <Link href="/feedback" className="font-semibold underline underline-offset-2">
                  Tell us what you think
                </Link>{" "}
                — ninety seconds, anonymous if you like. It shapes what gets built next.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
