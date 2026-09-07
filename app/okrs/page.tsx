import Link from "next/link";
import {
  CADENCE,
  CHECKLIST,
  MBO_TO_OKR,
  NAVIGATION,
  NOT_OK_OKR,
  OK_OKR,
  SSH_SOURCES,
  THREE_MS,
  WHY_OKRS,
} from "@/lib/okrPattern";

export const metadata = {
  title: "OKRs",
  description:
    "An overview of OKRs the Sooner Safer Happier way: the Objective is the bet, the Key Results are the feedback — with the format, the 3Ms, and what OK and NOT OK OKRs look like.",
};

/** The four things to take away if you read nothing else — all from the SSH pack. */
const ESSENCE = [
  {
    label: "The Objective",
    text: "Clarity of the bet you are placing and the capability you are building. Where you want to play, and how you will win.",
    color: "text-sooner",
    border: "border-sooner/40",
  },
  {
    label: "The Key Results",
    text: "The feedback. Leading and lagging metrics that tell you how the journey is going and what success looks like.",
    color: "text-safer",
    border: "border-safer/40",
  },
  {
    label: "3 to 5 of them",
    text: "3–4 leading indicators so you can pivot early, plus 1 lagging indicator — the impact metric. No more than five.",
    color: "text-happier",
    border: "border-happier/40",
  },
  {
    label: "Held as a hypothesis",
    text: "Emergent over deterministic. The outcome may turn out to be invalid, and finding that out early is the point.",
    color: "text-ink-soft",
    border: "border-ink/20",
  },
];

function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/70">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {children ? <p className="mt-3 leading-relaxed text-ink-soft">{children}</p> : null}
    </div>
  );
}

export default function OkrsPage() {
  return (
    <div>
      <section className="bg-ink text-chalk">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-chalk/60">
            Overview · Sooner Safer Happier
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            <span className="text-sooner">OKRs</span>, the way SSH think about them
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-chalk/80">
            Objectives and Key Results are a tool for shifting the focus from
            output to outcome — creating clarity of strategic direction, and
            visibility of the portfolio of work for disciplined execution.
          </p>
          <p className="mt-4 max-w-2xl text-chalk/70">
            This page is the short version: what an OKR is, how to write one, and
            how to tell a good one from a task list. It is drawn from the{" "}
            <span className="font-semibold text-chalk">SSH OKR Pattern</span>{" "}
            pack — a starting point to apply to your context, not a standard to
            comply with.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#write-one"
              className="rounded-full bg-sooner px-6 py-3 font-semibold text-ink hover:bg-sooner/90"
            >
              How to write one ↓
            </Link>
            <Link
              href="/skills"
              className="rounded-full border border-chalk/30 px-6 py-3 font-semibold hover:bg-chalk/10"
            >
              Get a coaching skill →
            </Link>
          </div>
        </div>
      </section>

      {/* The essence -------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading eyebrow="In one minute" title="An OKR, in four lines">
          An Objective without measures is a slogan. Measures without an
          Objective are a dashboard. You need both halves.
        </SectionHeading>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ESSENCE.map((e) => (
            <div key={e.label} className={`rounded-2xl border ${e.border} bg-white p-6 shadow-sm`}>
              <h3 className={`font-bold ${e.color}`}>{e.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{e.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The shift ---------------------------------------------------------- */}
      <section className="border-y border-ink/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading eyebrow="Why" title="From output to outcome">
            Too many projects focus on producing stuff — outputs — without
            understanding who the customer is and the problem being solved. Many
            also define the solution upfront, which ignores that the work is
            complex and uncertain, and that we need to test and learn to discover
            the solution.
          </SectionHeading>

          <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2">
            <div className="bg-chalk px-5 py-3">
              <dt className="text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
                From management by objectives
              </dt>
            </div>
            <div className="bg-chalk px-5 py-3">
              <dt className="text-xs font-semibold uppercase tracking-widest text-sooner">
                To OKRs
              </dt>
            </div>
            {MBO_TO_OKR.map(([from, to]) => (
              <div key={from} className="contents">
                <div className="bg-white px-5 py-3 text-sm text-ink-soft">{from}</div>
                <div className="bg-white px-5 py-3 text-sm font-medium">{to}</div>
              </div>
            ))}
          </dl>

          <details className="group mt-6 rounded-2xl border border-ink/10 bg-chalk p-6">
            <summary className="cursor-pointer text-sm font-semibold marker:text-sooner">
              Six reasons organisations use them
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WHY_OKRS.map((w) => (
                <div key={w.title}>
                  <h3 className="text-sm font-semibold">{w.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{w.text}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
      </section>

      {/* How to write one --------------------------------------------------- */}
      <section id="write-one" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <SectionHeading eyebrow="The format" title="Write the Objective as an outcome hypothesis">
          The word “hypothesis” is deliberate: it sets a clear expectation that
          the outcome may be invalid, and that there are unknown-unknowns only
          uncovered once the work takes place.
        </SectionHeading>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="rounded-2xl border border-sooner/40 bg-white p-6 shadow-sm lg:col-span-2">
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

          <div className="rounded-2xl border border-safer/40 bg-white p-6 shadow-sm lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
              3–5 Key Results
            </p>
            <p className="mt-1 text-sm text-ink-soft">“We’ll know we’re successful when…”</p>
            <p className="mt-4 overflow-x-auto rounded-xl bg-ink px-4 py-3 font-mono text-sm text-chalk">
              &lt;verb&gt; &lt;measure&gt; from &lt;x&gt; to &lt;y&gt; by &lt;z&gt;
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-safer">3–4 leading indicators</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  Indicative of future performance — they let you pivot to
                  maximise the outcome while there is still time.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-safer">1 lagging indicator</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  Assesses performance that has already happened — profit,
                  revenue, expenses. The impact metric.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-bold tracking-tight">More than a framework — the 3Ms</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {THREE_MS.map((m) => (
              <div key={m.m} className={`rounded-2xl border ${m.border} bg-white p-6 shadow-sm`}>
                <h4 className={`text-lg font-bold ${m.color}`}>{m.m}</h4>
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
                  {m.scope}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{m.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink-soft">
          To get from a blank page to a drafted OKR with a group, SSH use the{" "}
          <a
            href={SSH_SOURCES.outcomeCanvas}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Outcome Canvas
          </a>
          . For the thinking behind the format, read{" "}
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
      </section>

      {/* OK / NOT OK -------------------------------------------------------- */}
      <section className="border-y border-ink/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading eyebrow="Calibrate" title="An OK OKR and a NOT OK OKR">
            The quickest way to know whether you have written an OKR or a
            delivery plan is to put them side by side.
          </SectionHeading>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-sooner/40 bg-chalk p-6">
              <p className="inline-block rounded-full bg-sooner/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sooner">
                OK
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
              <ul className="mt-5 space-y-1 border-t border-ink/10 pt-4 text-sm text-ink-soft">
                {[...OK_OKR.patterns.mission, ...OK_OKR.patterns.measurement].map((p) => (
                  <li key={p}>
                    <span aria-hidden>✅</span> {p}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-ink/15 bg-chalk p-6">
              <p className="inline-block rounded-full bg-ink/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink-soft">
                NOT OK
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
              <ul className="mt-5 space-y-1 border-t border-ink/10 pt-4 text-sm text-ink-soft">
                {[...NOT_OK_OKR.antipatterns.mission, ...NOT_OK_OKR.antipatterns.measurement].map(
                  (p) => (
                    <li key={p}>
                      <span aria-hidden>⛔</span> {p}
                    </li>
                  )
                )}
              </ul>
            </article>
          </div>

          <p className="mt-6 text-sm text-ink-soft">
            Jon Smart walks through both in{" "}
            <a
              href={SSH_SOURCES.okNotOkOkrs}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              OK and NOT OK OKRs
            </a>
            . Want the same check on your own draft? The{" "}
            <Link href="/skills" className="underline underline-offset-2">
              skills
            </Link>{" "}
            on this site do it conversationally.
          </p>

          <details className="mt-8 rounded-2xl border border-ink/10 bg-chalk p-6">
            <summary className="cursor-pointer text-sm font-semibold marker:text-sooner">
              The full SSH OKR checklist — {CHECKLIST.reduce((n, c) => n + c.items.length, 0)}{" "}
              questions to run a draft through
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-soft">
              If a question has no answer yet, that is the next conversation to
              have — not a reason to write a vaguer goal.
            </p>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {CHECKLIST.map((col) => (
                <div key={col.heading}>
                  <h3 className="font-bold">{col.heading}</h3>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-soft">
                    {col.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden className="text-sooner">
                          ☐
                        </span>
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
              .
            </p>
          </details>
        </div>
      </section>

      {/* Where they sit ----------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading eyebrow="Don’t confuse them" title="Strategy, OKRs and KPIs">
          Strategy sets the direction. OKRs help you navigate. KPIs show how well
          the system is performing along the way.
        </SectionHeading>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {NAVIGATION.map((n) => (
            <div key={n.label} className={`rounded-2xl border ${n.border} bg-white p-6 shadow-sm`}>
              <h3 className={`text-lg font-bold ${n.color}`}>
                {n.label} = {n.equals}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{n.question}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-10 text-lg font-bold tracking-tight">
          And they nest — the golden thread
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {CADENCE.map((c) => (
            <div key={c.horizon} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
              <h4 className="font-bold text-sooner">{c.horizon}</h4>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-soft">
          As you move down the levels, the Objective gets more specific to that
          business area while still contributing to the level above. A complete
          set of nested objectives forms the golden thread that links work
          throughout the organisation back to the strategy.
        </p>
      </section>

      {/* Credits ------------------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl bg-ink px-6 py-10 text-chalk sm:px-12">
          <h2 className="text-2xl font-bold">Take it and make it yours</h2>
          <p className="mt-4 max-w-2xl text-chalk/80">
            Every organisation adapts how it uses OKRs. Treat this as a starting
            point, then keep what helps you deliver value sooner, safer and
            happier — the{" "}
            <Link href="/principles" className="underline underline-offset-2">
              principles
            </Link>{" "}
            are the tie-breaker when the framework and reality disagree.
          </p>
          <p className="mt-6 text-sm text-chalk/60">
            Sourced from the <em>SSH OKR Pattern — input for AI Outcome Coach</em>{" "}
            pack, contributed by the community as{" "}
            <a
              href="https://github.com/bettergoals/bettergoals/issues/28"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              idea #28
            </a>
            . ©{" "}
            <a
              href={SSH_SOURCES.ssh}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Sooner Safer Happier
            </a>
            , used here with the community’s thanks. Further reading:{" "}
            <a
              href={SSH_SOURCES.okrChecklist}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              the OKR checklist
            </a>{" "}
            and{" "}
            <a
              href={SSH_SOURCES.strategyDefinition}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              writing strategic choices you can execute
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
