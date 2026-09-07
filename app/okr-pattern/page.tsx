import Link from "next/link";
import {
  ANATOMY,
  CADENCE,
  CHECKLIST,
  MBO_TO_OKR,
  NAVIGATION,
  NOT_OK_OKR,
  OK_OKR,
  OKRS_VS_KPIS,
  SSH_SOURCES,
  THREE_MS,
  WHY_OKRS,
} from "@/lib/okrPattern";

export const metadata = {
  title: "The SSH OKR Pattern",
  description:
    "The Sooner Safer Happier OKR pattern: outcome hypotheses, leading and lagging key results, the OKR checklist, and what OK and NOT OK OKRs look like.",
};

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/70">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {children ? <p className="mt-3 leading-relaxed text-ink-soft">{children}</p> : null}
    </div>
  );
}

export default function OkrPatternPage() {
  return (
    <div>
      <section className="bg-ink text-chalk">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-chalk/60">
            Reference pack · Sooner Safer Happier
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            The SSH <span className="text-sooner">OKR</span> Pattern
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-chalk/80">
            Objectives and Key Results, as Sooner Safer Happier teach them — a
            starting point guide to apply to your context, not a standard to
            comply with.
          </p>
          <p className="mt-4 max-w-2xl text-chalk/70">
            This page is the reference the rest of this site works from: the
            skills you download and the coaching they give you follow the pattern
            set out here.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#format"
              className="rounded-full bg-sooner px-6 py-3 font-semibold text-ink hover:bg-sooner/90"
            >
              How to write one ↓
            </Link>
            <Link
              href="#checklist"
              className="rounded-full border border-chalk/30 px-6 py-3 font-semibold hover:bg-chalk/10"
            >
              The checklist ↓
            </Link>
          </div>
        </div>
      </section>

      {/* Why ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading eyebrow="Why" title="From output to outcome">
          When we start to think about the shift from output to outcome, what we
          are really trying to drive is an unlock of value from your initiatives,
          programs and projects. Too many projects focus on producing stuff (aka
          outputs) without understanding who the customer is and the problem
          being solved.
        </SectionHeading>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
          Further, many projects start by defining the solution upfront, which
          does not consider that the work we are doing is complex and uncertain.
          That means we need to test and learn to discover the solution. OKRs are
          a tool to help shift the focus from output to outcome, to create focus
          and clarity on strategic direction, and to give visibility of the
          portfolio of work for disciplined execution.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {ANATOMY.map((a) => (
            <div key={a.title} className={`rounded-2xl border ${a.border} bg-white p-6 shadow-sm`}>
              <div className="flex items-baseline gap-3">
                <span className={`font-mono text-2xl font-bold ${a.color}`}>{a.letter}</span>
                <h3 className="text-xl font-bold">{a.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{a.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_OKRS.map((w) => (
            <div key={w.title} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
              <h3 className="font-semibold">{w.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Format ------------------------------------------------------------- */}
      <section id="format" className="scroll-mt-20 border-y border-ink/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading eyebrow="Format" title="Write the Objective as an outcome hypothesis">
            The value associated with a unique change is best articulated as a
            business outcome hypothesis. The word “hypothesis” intentionally
            creates a clear expectation that the outcome may be invalid — that
            there are unknown-unknowns only uncovered when the work takes place.
          </SectionHeading>

          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            <div className="rounded-2xl border border-sooner/40 bg-chalk p-6 lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
                Objective
              </p>
              <p className="mt-1 text-sm text-ink-soft">data + insight + belief = bet</p>
              <dl className="mt-5 space-y-4 font-mono text-sm">
                <div>
                  <dt className="font-bold text-sooner">Due to</dt>
                  <dd className="text-ink-soft">&lt;this insight, feedback or belief&gt;</dd>
                </div>
                <div>
                  <dt className="font-bold text-sooner">We believe that</dt>
                  <dd className="text-ink-soft">&lt;this bet&gt;</dd>
                </div>
                <div>
                  <dt className="font-bold text-sooner">Will result in</dt>
                  <dd className="text-ink-soft">&lt;this outcome&gt;</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-safer/40 bg-chalk p-6 lg:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
                3–5 Key Results
              </p>
              <p className="mt-1 text-sm text-ink-soft">“We’ll know we’re successful when…”</p>
              <p className="mt-4 rounded-xl bg-ink px-4 py-3 font-mono text-sm text-chalk">
                &lt;verb&gt; &lt;measure&gt; from &lt;x&gt; to &lt;y&gt; by &lt;z&gt;
              </p>
              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-safer">3–4 leading indicators</h3>
                  <p className="mt-1 leading-relaxed text-ink-soft">
                    These indicate future conditions, are indicative of future
                    performance, and enable pivoting to maximise the outcome.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-safer">1 lagging indicator</h3>
                  <p className="mt-1 leading-relaxed text-ink-soft">
                    This assesses current performance — it measures an outcome
                    that has already occurred (e.g. profit, revenue, expenses).
                    Known as an impact metric.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-soft">
            A hypothesis creates a clear expectation that experimentation is
            required, with teams empowered to use their own brains to discover
            how best to make progress — and to what extent the hypothesis is
            worth continuing to try to achieve. Key results are used as
            indicators of performance and success towards achieving it.{" "}
            <a
              href={SSH_SOURCES.outcomeHypothesis}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Outcome hypotheses — a primer
            </a>
            .
          </p>

          <div className="mt-10">
            <h3 className="text-lg font-bold tracking-tight">
              More than a framework — the 3Ms
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {THREE_MS.map((m) => (
                <div key={m.m} className={`rounded-2xl border ${m.border} bg-chalk p-6`}>
                  <h4 className={`text-lg font-bold ${m.color}`}>{m.m}</h4>
                  <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
                    {m.scope}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OK / NOT OK -------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading eyebrow="What good looks like" title="An OK OKR and a NOT OK OKR">
          The fastest way to calibrate is to look at the same idea written both
          ways. The shift OKRs are meant to make is the shift out of the left-hand
          column below.
        </SectionHeading>

        <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2">
          <div className="bg-white px-5 py-3">
            <dt className="text-xs font-semibold uppercase tracking-widest text-ink-soft/70">From MBOs</dt>
          </div>
          <div className="bg-white px-5 py-3">
            <dt className="text-xs font-semibold uppercase tracking-widest text-sooner">To OKRs</dt>
          </div>
          {MBO_TO_OKR.map(([from, to]) => (
            <div key={from} className="contents">
              <div className="bg-white px-5 py-3 text-sm text-ink-soft">{from}</div>
              <div className="bg-white px-5 py-3 text-sm font-medium">{to}</div>
            </div>
          ))}
        </dl>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-sooner/40 bg-white p-6 shadow-sm">
            <p className="inline-block rounded-full bg-sooner/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sooner">
              OK OKR
            </p>
            <h3 className="mt-4 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
              {OK_OKR.objectiveLabel}
            </h3>
            <p className="mt-1 text-lg font-bold">{OK_OKR.objective}</p>
            <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
              {OK_OKR.keyResults.map((kr) => (
                <li key={kr}>{kr}</li>
              ))}
            </ol>
            <div className="mt-5 border-t border-ink/10 pt-4 text-sm">
              <h4 className="font-semibold">Mission — the Objective</h4>
              <ul className="mt-1 space-y-1 text-ink-soft">
                {OK_OKR.patterns.mission.map((p) => (
                  <li key={p}>✅ {p}</li>
                ))}
              </ul>
              <h4 className="mt-3 font-semibold">Measurement — the Key Results</h4>
              <ul className="mt-1 space-y-1 text-ink-soft">
                {OK_OKR.patterns.measurement.map((p) => (
                  <li key={p}>✅ {p}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className="rounded-2xl border border-ink/15 bg-white p-6 shadow-sm">
            <p className="inline-block rounded-full bg-ink/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink-soft">
              NOT OK OKR
            </p>
            <h3 className="mt-4 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
              {NOT_OK_OKR.objectiveLabel}
            </h3>
            <p className="mt-1 text-lg font-bold">{NOT_OK_OKR.objective}</p>
            <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
              {NOT_OK_OKR.keyResults.map((kr) => (
                <li key={kr}>{kr}</li>
              ))}
            </ol>
            <div className="mt-5 border-t border-ink/10 pt-4 text-sm">
              <h4 className="font-semibold">Mission — the Objective</h4>
              <ul className="mt-1 space-y-1 text-ink-soft">
                {NOT_OK_OKR.antipatterns.mission.map((p) => (
                  <li key={p}>⛔ {p}</li>
                ))}
              </ul>
              <h4 className="mt-3 font-semibold">Measurement — the Key Results</h4>
              <ul className="mt-1 space-y-1 text-ink-soft">
                {NOT_OK_OKR.antipatterns.measurement.map((p) => (
                  <li key={p}>⛔ {p}</li>
                ))}
              </ul>
            </div>
          </article>
        </div>

        <p className="mt-6 max-w-3xl text-sm text-ink-soft">
          To structure a workshop that gets you from a blank page to a drafted
          OKR, SSH use the{" "}
          <a
            href={SSH_SOURCES.outcomeCanvas}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Outcome Canvas
          </a>
          .
        </p>
      </section>

      {/* Checklist ---------------------------------------------------------- */}
      <section id="checklist" className="scroll-mt-20 border-y border-ink/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading eyebrow="Guardrail" title="The OKR checklist">
            Run a draft OKR through these questions before you commit to it. If a
            question has no answer yet, that is the next conversation to have —
            not a reason to write a vaguer goal.
          </SectionHeading>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {CHECKLIST.map((col) => (
              <div key={col.heading} className="rounded-2xl border border-ink/10 bg-chalk p-6">
                <h3 className="font-bold">{col.heading}</h3>
                <ul className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
                  {col.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden className="text-sooner">☐</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-ink-soft">
            Adapted from{" "}
            <a
              href={SSH_SOURCES.okrChecklist}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Maria Muir’s OKR checklist
            </a>
            . Want an assistant to run it for you? Download the{" "}
            <Link href="/skills" className="underline underline-offset-2">
              ssh-okr-pattern skill
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Cadence & nesting -------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading eyebrow="System of work" title="Nesting, cadence, and the golden thread">
          OKRs are a goal-setting framework that helps organisations break down
          and digest their strategy. The system runs on a continual feedback
          loop, so goals can be amended as you learn.
        </SectionHeading>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {CADENCE.map((c) => (
            <div key={c.horizon} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-sooner">{c.horizon}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <h3 className="font-bold">The golden thread</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
            Nesting OKRs means there is a different objective at each level of
            the organisation. As you move down the levels, the Objective becomes
            more specific and relevant to that business area or tribe — while
            still contributing to the objective of the level above. A complete
            set of nested objectives forms what is known as the golden thread: a
            thread linking the work throughout the entire organisation, helping
            to execute on the strategy.
          </p>
        </div>
      </section>

      {/* Strategy vs OKRs vs KPIs ------------------------------------------- */}
      <section className="border-t border-ink/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading eyebrow="Don’t confuse them" title="Strategy vs. OKRs vs. KPIs">
            Strategy sets the direction. OKRs help us navigate. KPIs show how
            well we are operating along the way.
          </SectionHeading>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {NAVIGATION.map((n) => (
              <div key={n.label} className={`rounded-2xl border ${n.border} bg-chalk p-6`}>
                <h3 className={`text-lg font-bold ${n.color}`}>
                  {n.label} = {n.equals}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{n.question}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink/10 p-6">
              <h3 className="font-bold">Objectives & Key Results</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
                {OKRS_VS_KPIS.okrs.map((i) => (
                  <li key={i}>• {i}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-ink/10 p-6">
              <h3 className="font-bold">Key Performance Indicators</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
                {OKRS_VS_KPIS.kpis.map((i) => (
                  <li key={i}>• {i}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Credits ------------------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl bg-ink px-6 py-10 text-chalk sm:px-12">
          <h2 className="text-2xl font-bold">Take it and make it yours</h2>
          <blockquote className="mt-4 max-w-2xl border-l-2 border-sooner pl-4 text-chalk/80">
            “OKRs have helped us to 10x growth, many times over. We have adapted
            how we use it over the years — take it and make it yours based on
            what you want to see happen.”
            <footer className="mt-2 text-sm text-chalk/60">— Larry Page, 2018</footer>
          </blockquote>
          <p className="mt-6 max-w-2xl text-sm text-chalk/70">
            This page summarises <em>SSH OKR Pattern — a starting point guide to
            apply to your context</em> (Nov 2023), contributed to this community
            site by{" "}
            <a
              href={SSH_SOURCES.ssh}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Sooner Safer Happier
            </a>
            . OKRs are not new — they originated from Peter Drucker’s Management
            by Objectives, evolved through Andy Grove at Intel and John Doerr,
            and continue to evolve today in the work of Jeff Gothelf, Josh Seiden
            and John Cutler.
          </p>
          <ul className="mt-4 space-y-1 text-sm text-chalk/70">
            <li>
              <a href={SSH_SOURCES.outcomeHypothesis} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                Outcome hypotheses — a primer
              </a>
            </li>
            <li>
              <a href={SSH_SOURCES.okrChecklist} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                OKRs — a checklist (Maria Muir)
              </a>
            </li>
            <li>
              <a href={SSH_SOURCES.outcomeCanvas} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                QuickLearn: Outcome Canvas
              </a>
            </li>
            <li>
              <a href={SSH_SOURCES.strategyDefinition} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                Strategy definition (Maria Muir)
              </a>
            </li>
            <li>
              <a href={SSH_SOURCES.okNotOkOkrs} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                OK not OK OKRs (Jon Smart)
              </a>
            </li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/skills"
              className="rounded-full bg-sooner px-6 py-3 font-semibold text-ink hover:bg-sooner/90"
            >
              Get the skill →
            </Link>
            <Link
              href="/principles"
              className="rounded-full border border-chalk/30 px-6 py-3 font-semibold hover:bg-chalk/10"
            >
              Our principles
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
