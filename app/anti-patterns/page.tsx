import Link from "next/link";
import { ANTI_PATTERNS, SPOT_CHECK } from "@/lib/antiPatterns";
import { NEW_IDEA_URL } from "@/lib/config";

export const metadata = {
  title: "Anti-patterns",
  description:
    "A gallery of goals that go wrong — output fixation, vanity metrics, 47 KPIs, goals nobody feels safe to challenge — each one named, explained, and rewritten as an outcome.",
};

export default function AntiPatternsPage() {
  return (
    <div>
      <section className="bg-ink text-chalk">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-chalk/60">
            Gallery · {ANTI_PATTERNS.length} ways a goal goes wrong
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Goal <span className="text-happier">anti-patterns</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-chalk/80">
            Bad goals are not random. They come in a handful of shapes, and once
            a shape has a name you catch it in your own draft in about ten
            seconds. Each one here is paired with the same intent rewritten as
            an outcome.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-chalk/60">
            The goals are composites — drawn from what the community has seen in
            the wild, with the organisation, the numbers and anything
            identifying changed. Nobody&rsquo;s quarterly review is on this page.
          </p>
        </div>
      </section>

      <section className="border-b border-ink/10 bg-white">
        <nav aria-label="Jump to an anti-pattern" className="mx-auto max-w-6xl px-4 py-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
            In this gallery
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {ANTI_PATTERNS.map((p) => (
              <li key={p.id}>
                <a
                  href={`#${p.id}`}
                  className="inline-block rounded-full border border-ink/15 px-4 py-1.5 text-sm font-semibold hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {p.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <ol className="space-y-14">
          {ANTI_PATTERNS.map((p, i) => (
            <li key={p.id} id={p.id} className="scroll-mt-24">
              <article aria-labelledby={`${p.id}-heading`}>
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
                  Anti-pattern {i + 1} of {ANTI_PATTERNS.length} · also called {p.aka}
                </p>
                <h2
                  id={`${p.id}-heading`}
                  className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
                >
                  {p.name}
                </h2>
                <p className="mt-3 leading-relaxed text-ink-soft">
                  <span className="font-semibold text-ink">The tell:</span> {p.tell}
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-happier/40 bg-happier/10 p-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-happier">
                      ✗ As written
                    </p>
                    <blockquote className="mt-3 border-l-2 border-happier/50 pl-4 text-lg font-semibold leading-snug">
                      {p.before}
                    </blockquote>
                    <p className="mt-3 text-sm text-ink-soft/80">{p.context}</p>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
                      Why it fails
                    </p>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
                      {p.why.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-sooner/40 bg-sooner/10 p-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-sooner">
                      ✓ Rewritten as an outcome
                    </p>
                    <blockquote className="mt-3 border-l-2 border-sooner/50 pl-4 text-lg font-semibold leading-snug">
                      {p.after}
                    </blockquote>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
                      What that buys you
                    </p>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
                      {p.better.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="mt-4 text-sm text-ink-soft">
                  Fails the principle{" "}
                  <Link href="/principles" className="font-semibold underline underline-offset-2">
                    {p.principle}
                  </Link>
                  .
                </p>
              </article>
            </li>
          ))}
        </ol>

        <section aria-labelledby="spot-check" className="mt-16">
          <h2 id="spot-check" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Five questions that catch most of them
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
            Run these over your own draft before you send it. A question you
            cannot answer is the interesting one.
          </p>
          <ul className="mt-6 space-y-3">
            {SPOT_CHECK.map((s) => (
              <li
                key={s.question}
                className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm"
              >
                <p className="font-semibold leading-relaxed">{s.question}</p>
                <p className="mt-1 text-sm text-ink-soft">Catches: {s.catches}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-3xl bg-ink px-6 py-10 text-chalk sm:px-10">
          <h2 className="text-2xl font-bold tracking-tight">Found one in your own draft?</h2>
          <p className="mt-3 max-w-2xl text-chalk/80">
            Paste it into the{" "}
            <Link href="/coach" className="font-semibold underline underline-offset-2">
              Outcome Coach
            </Link>{" "}
            and it will tell you which of these shapes it is reading, and what
            question to sit with. The{" "}
            <Link href="/okrs" className="font-semibold underline underline-offset-2">
              OKR overview
            </Link>{" "}
            has the pattern these rewrites follow, and{" "}
            <Link href="/templates" className="font-semibold underline underline-offset-2">
              the Outcome Canvas
            </Link>{" "}
            is where to start one from scratch.
          </p>
          <p className="mt-4 max-w-2xl text-chalk/80">
            Seen a shape that isn&rsquo;t here?{" "}
            <a
              href={NEW_IDEA_URL}
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline underline-offset-2"
            >
              Propose it as an idea
            </a>{" "}
            — anonymised, with the rewrite you would offer. If the community
            endorses it, it gets added to the gallery.
          </p>
        </section>
      </div>
    </div>
  );
}
