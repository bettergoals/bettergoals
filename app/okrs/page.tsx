import Link from "next/link";
import { NEW_IDEA_URL } from "@/lib/config";

export const metadata = {
  title: "The OKR Framework",
  description:
    "Objectives and Key Results, the Sooner Safer Happier way: an outcome hypothesis, 3–5 measurable key results, and a golden thread from strategy to experiment.",
};

const THREE_MS = [
  {
    m: "Mission",
    color: "text-sooner",
    border: "border-sooner/40",
    lead: "The Objective",
    text: "Outcome over output. Inspirational, aspirational, and clear about the change you want to see in the world.",
  },
  {
    m: "Measurement",
    color: "text-safer",
    border: "border-safer/40",
    lead: "The Key Results",
    text: "Measures of movement and behaviour, not activity. Leading indicators you can act on, plus a lagging measure of impact.",
  },
  {
    m: "Mindset",
    color: "text-happier",
    border: "border-happier/40",
    lead: "The way you hold them",
    text: "Emergent over deterministic. Empowering, not assigning. Safe to challenge, safe to pivot, safe to invalidate.",
  },
];

const HYPOTHESIS = [
  { label: "Due to…", hint: "this insight, feedback or belief" },
  { label: "We believe that…", hint: "this bet" },
  { label: "Will result in…", hint: "this outcome" },
];

const OK_KRS = [
  "Double ad click-through rate from 2.5% to 5%",
  "Increase customer NPS from +40 to +60",
  "Increase referrals from 50k to 100k per month",
  "Grow daily digital transactions from 100k to 400k",
  "Increase market share from #2 to #1 by Q2",
];

const OK_PATTERNS = [
  "Outcome over output — inspirational and aspirational",
  "Measurable: <verb> <measure> from <x> to <y> by <when>",
  "Measures of behaviour and of movement toward the objective",
  "Four leading indicators plus one lagging measure of impact",
  "An early and often feedback loop — value added incrementally",
  "No more than 3–5 key results, business and technology as one",
];

const NOTOK_KRS = [
  "Create a new training program",
  "Design agreed by all necessary committees",
  "Contract signed with vendor for build",
  "Build new feature screens",
  "Get InfoSec and data privacy approval",
  "Provision hardware",
  "Test data migration",
  "Go live",
];

const NOTOK_PATTERNS = [
  "Output over outcome — a task list, not a change",
  "Not inspirational, and the duration isn’t clear",
  "Not measurable: no from, no to, no by when",
  "No measure of changed behaviour, and none of value",
  "No leading indicators, so nothing to steer with",
  "Too many key results, and technology-only — where’s the business value?",
];

const SHIFT = [
  ["Top down", "Top down, bottom up and sideways"],
  ["Command and control", "Empowerment and autonomy"],
  ["Outputs and tasks", "Outcomes and experiments"],
  ["Annual", "Multi-year, annual, quarterly"],
  ["Private and siloed", "Transparent and aligned"],
  ["Risk averse", "Aspirational"],
];

const CAR = [
  {
    thing: "Strategy",
    metaphor: "the travel destination",
    question: "Where do you want to go?",
    color: "text-happier",
    border: "border-happier/40",
  },
  {
    thing: "KPIs",
    metaphor: "the dashboard",
    question: "How healthy is the car?",
    color: "text-safer",
    border: "border-safer/40",
  },
  {
    thing: "OKRs",
    metaphor: "the GPS",
    question: "Are you on the right track?",
    color: "text-sooner",
    border: "border-sooner/40",
  },
];

const LADDER = [
  {
    horizon: "Multi-year",
    span: "North Star",
    example: "Top 3 most valuable luxury brand",
    indent: "",
  },
  {
    horizon: "Annual",
    span: "< 12 months",
    example: "Luxury bags: top 3 market share in China",
    indent: "sm:ml-4",
  },
  {
    horizon: "Quarterly outcome",
    span: "< 3 months",
    example: "Handbags: increase market share in Shanghai",
    indent: "sm:ml-8",
  },
  {
    horizon: "Experiments",
    span: "< 1 month",
    example: "Social media influencers · online promotion",
    indent: "sm:ml-12",
  },
];

const QUESTIONS = [
  {
    q: "Do we use OKRs for regulatory work?",
    a: [
      "Yes. Regulatory work needs framing as an outcome just as much as discretionary work does. Being compliant is an output; the outcome is the position you choose to take — do the bare minimum to comply, do it as cheaply as possible, or be the best in the market at this legislation.",
      "You have probably never implemented this regulation before, so how you implement it is unknowable up front — and other organisations have found that how you do it can become a competitive advantage.",
    ],
  },
  {
    q: "What is the difference between impact metrics and KPIs?",
    a: [
      "Nothing meaningful — they are the same thing under two names: high-level, lagging measures of the health of the business (revenue, margin, churn, satisfaction). Use whichever name your organisation already accepts.",
      "Outcomes are the leading indicators for those metrics. Executives tend to watch impact metrics; teams focus mostly on outcomes.",
    ],
  },
  {
    q: "Should we track FTE reductions as a key result?",
    a: [
      "If the organisation genuinely has that goal, it isn’t unreasonable: cost is the lagging key result and FTE reduction is a leading one. It is not a metric to make visible to everyone — it is handed to the accountable leader, who builds the plan with Finance and HR.",
      "Track flow efficiency alongside it as a balancing measure, so visible costs going down doesn’t just push hidden costs up.",
    ],
  },
  {
    q: "How do we support platform teams who struggle with OKRs?",
    a: [
      "Platforms are a shared-service value stream: the value they create is enabling the customer value streams. Two questions unlock most platform OKRs — how are we helping the customer value streams go faster, and how are we enabling self-service?",
      "Then get clear on the basics: who is the internal customer, what is the thing of value, what does awesome look like, what does awful look like, what would happen if the product didn’t exist, and what is the biggest impediment to realising value?",
    ],
  },
  {
    q: "How many OKRs should we have?",
    a: [
      "Less is more: no more than three to five OKRs per value stream, each with three to five key results. Think big, start small, learn fast.",
      "Go shallow and broad across the enterprise for multi-year and annual OKRs, and narrow and deep within a value stream for annual and quarterly ones.",
    ],
  },
];

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-widest text-ink-soft/70">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
    </>
  );
}

export default function OkrsPage() {
  return (
    <div>
      <section className="bg-ink text-chalk">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-chalk/60">
            A Sooner Safer Happier point of view
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            The OKR framework
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-chalk/80">
            Objectives and Key Results are a tool for shifting the focus from
            output to outcome — creating clarity on strategic direction, and
            visibility of the work, without pretending the work is predictable.
          </p>
          <p className="mt-4 max-w-2xl text-sm text-chalk/60">
            This is a starting-point guide to apply to your context, not a
            standard to comply with. Take it and make it yours.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <SectionHeading eyebrow="Why" title="Output is not the point" />
        <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4 text-ink-soft">
            <p className="leading-relaxed">
              Too many initiatives, programmes and projects focus on producing
              stuff without being clear who the customer is or what problem is
              being solved. Many also define the solution up front — which
              ignores that the work is complex and uncertain, and that we have to
              test and learn our way to the answer.
            </p>
            <p className="leading-relaxed">
              OKRs unlock the value hiding inside that work. An OKR is a single
              objective plus three to five key results that show measurable
              progress toward the outcome, used from enterprise level all the way
              to team level.
            </p>
          </div>
          <figure className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
            <blockquote className="text-sm leading-relaxed text-ink-soft">
              “Outcome is a measurable change in human behavior we see when we
              give the output to our users and customers. Outcome answers the
              question: what are people doing differently now that we have
              delivered the output?”
            </blockquote>
            <figcaption className="mt-3 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
              Jeff Gothelf
            </figcaption>
            <p className="mt-4 border-t border-ink/10 pt-4 text-sm leading-relaxed text-ink-soft">
              Outcomes are not features. They are metrics. “We shipped the app”
              is an output; “50% of our audience has upgraded to the new app” is
              an outcome.
            </p>
          </figure>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <SectionHeading eyebrow="Format" title="Write the objective as an outcome hypothesis" />
          <p className="mt-3 max-w-2xl text-ink-soft">
            The word <em>hypothesis</em> is deliberate. It sets the expectation
            that the outcome may turn out to be invalid, that there are
            unknown-unknowns only the work will reveal, and that teams are
            empowered to discover how best to make progress — and to judge whether
            the bet is still worth pursuing.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-sooner/40 bg-chalk p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-xl font-bold text-sooner">Objective</h3>
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
                  data + insight + belief = bet
                </span>
              </div>
              <dl className="mt-5 space-y-4">
                {HYPOTHESIS.map((h) => (
                  <div key={h.label} className="rounded-xl border border-ink/10 bg-white p-4">
                    <dt className="font-semibold">{h.label}</dt>
                    <dd className="mt-1 text-sm text-ink-soft">{h.hint}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-2xl border border-safer/40 bg-chalk p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-xl font-bold text-safer">3–5 Key Results</h3>
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
                  we’ll know we’re successful when
                </span>
              </div>
              <p className="mt-5 rounded-xl border border-ink/10 bg-white p-4 font-mono text-sm">
                &lt;verb&gt; &lt;measure&gt; from &lt;x&gt; to &lt;y&gt; by &lt;when&gt;
              </p>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
                <p>
                  <strong className="text-ink">3–4 leading indicators.</strong>{" "}
                  Indicative of future performance — they let you pivot while
                  there is still time to maximise the outcome.
                </p>
                <p>
                  <strong className="text-ink">1 lagging indicator.</strong>{" "}
                  Assesses performance that has already happened — revenue,
                  profit, expense. Also known as an impact metric.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <SectionHeading eyebrow="More than a framework" title="The three Ms" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {THREE_MS.map((m) => (
            <div key={m.m} className={`rounded-2xl border ${m.border} bg-white p-6 shadow-sm`}>
              <h3 className={`text-xl font-bold ${m.color}`}>{m.m}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-ink-soft/70">
                {m.lead}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{m.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-ink/10 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <SectionHeading eyebrow="What good looks like" title="An OK OKR and a NOT OK OKR" />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-sooner/40 bg-chalk p-6">
              <span className="rounded-full bg-sooner px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink">
                OK OKR
              </span>
              <h3 className="mt-4 text-lg font-bold">
                Objective: #1 in our market in LATAM
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {OK_KRS.map((kr) => (
                  <li key={kr} className="rounded-xl border border-ink/10 bg-white px-4 py-2">
                    {kr}
                  </li>
                ))}
              </ul>
              <h4 className="mt-6 text-xs font-bold uppercase tracking-widest text-sooner">
                Patterns
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-soft">
                {OK_PATTERNS.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-ink/15 bg-ink/[0.03] p-6">
              <span className="rounded-full border border-ink/20 bg-white px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink-soft">
                NOT OK OKR
              </span>
              <h3 className="mt-4 text-lg font-bold">
                Objective: deliver Project Platypus
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {NOTOK_KRS.map((kr) => (
                  <li key={kr} className="rounded-xl border border-ink/10 bg-white/70 px-4 py-2">
                    {kr}
                  </li>
                ))}
              </ul>
              <h4 className="mt-6 text-xs font-bold uppercase tracking-widest text-ink-soft">
                Antipatterns
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-soft">
                {NOTOK_PATTERNS.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className="mt-10 rounded-2xl border border-ink/10 p-6">
            <h3 className="font-semibold">The shift OKRs ask for</h3>
            <p className="mt-1 text-sm text-ink-soft">
              OKRs grew out of Management by Objectives — Drucker in 1954, Andy
              Grove’s iMBOs, then John Doerr. What changed is less the paperwork
              and more the posture.
            </p>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {SHIFT.map(([from, to]) => (
                <div key={from} className="flex flex-wrap items-baseline gap-2 rounded-xl bg-chalk px-4 py-3 text-sm">
                  <dt className="text-ink-soft line-through decoration-ink/30">{from}</dt>
                  <span aria-hidden className="text-ink-soft/60">→</span>
                  <dd className="font-semibold">{to}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <SectionHeading eyebrow="Don’t confuse them" title="Strategy vs. OKRs vs. KPIs" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {CAR.map((c) => (
            <div key={c.thing} className={`rounded-2xl border ${c.border} bg-white p-6 shadow-sm`}>
              <h3 className={`text-xl font-bold ${c.color}`}>{c.thing}</h3>
              <p className="mt-1 text-sm font-semibold text-ink">= {c.metaphor}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{c.question}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-ink/10 bg-white p-6">
            <h3 className="font-semibold">KPIs</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-soft">
              <li>Easier to set — they are based on what we already know</li>
              <li>Watch the health of the business, with precision</li>
              <li>Usually delivered by a functional group; clear who and what — efficiency</li>
              <li>A KPI in an unhealthy state may need to become a short-term OKR</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-6">
            <h3 className="font-semibold">OKRs</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-soft">
              <li>Harder to set — the change is unknown and complex</li>
              <li>Cross-functional, focused on getting better rather than staying stable</li>
              <li>Need a network of stakeholders to create value</li>
              <li>Ambitious: baselines may exist, but how to measure often has to be created</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <SectionHeading eyebrow="Nesting" title="The golden thread of value" />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-4 text-ink-soft">
              <p className="leading-relaxed">
                Nesting means a different objective at each level of the
                organisation. As you move down, objectives get more specific and
                more relevant to that business area — while still contributing to
                the objective above.
              </p>
              <p className="leading-relaxed">
                A complete set of nested objectives forms the{" "}
                <strong className="text-ink">golden thread</strong>: every
                outcome, epic and story is traceable back to the strategy. Some
                organisations even measure it, tracking the percentage of stories
                that link all the way up to a strategic objective.
              </p>
              <p className="leading-relaxed">
                Multi-year OKRs act as the North Star. Annual OKRs make that
                digestible. Quarterly OKRs create the room to pivot within the
                year — with a feedback loop at every level.
              </p>
            </div>
            <ol className="space-y-3">
              {LADDER.map((l) => (
                <li
                  key={l.horizon}
                  className={`rounded-2xl border border-ink/10 bg-chalk p-4 ${l.indent}`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">{l.horizon}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-soft">
                      {l.span}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{l.example}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <SectionHeading eyebrow="Commonly asked" title="Questions, answered" />
        <div className="mt-6 divide-y divide-ink/10 overflow-hidden rounded-2xl border border-ink/10 bg-white">
          {QUESTIONS.map((item) => (
            <details key={item.q} className="group px-6 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {item.q}
                <span aria-hidden className="text-ink-soft transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
                {item.a.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="rounded-3xl bg-ink px-6 py-12 text-chalk sm:px-12">
          <h2 className="text-2xl font-bold sm:text-3xl">Use it as your guardrail</h2>
          <p className="mt-3 max-w-2xl text-chalk/80">
            This framework is how bettergoals.ai thinks about outcomes. Before you
            propose an idea, try stating it as an outcome hypothesis — due to,
            we believe that, will result in — and name the leading indicator you
            would watch. If you can finish the idea without anything getting
            better for anyone, it’s an output. To run this with a group, the SSH{" "}
            <a
              href="https://www.soonersaferhappier.com/quick-learn-outcome-canvas"
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline underline-offset-2"
            >
              Outcome Canvas
            </a>{" "}
            gives you a workshop structure.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/templates/okr-set"
              className="rounded-full bg-sooner px-6 py-3 font-semibold text-ink hover:bg-sooner/90"
            >
              Take the OKR template →
            </Link>
            <Link
              href="/skills"
              className="rounded-full border border-chalk/30 px-6 py-3 font-semibold hover:bg-chalk/10"
            >
              Get the OKR skill →
            </Link>
            <a
              href={NEW_IDEA_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-chalk/30 px-6 py-3 font-semibold hover:bg-chalk/10"
            >
              Propose an outcome ↗
            </a>
          </div>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-ink-soft">
          Adapted from “SSH PoV — OKR Framework” (Sooner Safer Happier, Nov 2023).
          Output, outcome, impact and KPI definitions from Jeff Gothelf, “Output,
          Outcomes, Impact and KPIs” (2021). Golden thread measurement example from
          Tony Caink on Nationwide’s operating model.
        </p>
      </section>
    </div>
  );
}
