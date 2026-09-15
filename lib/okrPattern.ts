/**
 * The Sooner Safer Happier OKR Pattern.
 *
 * Source of truth: "SSH OKR Pattern — input for AI Outcome Coach" (Sooner Safer
 * Happier, Nov 2023), contributed to this community site as GitHub issue #28.
 * Everything below is drawn from that pack. Please don't add guidance here that
 * isn't in it — the whole point of this file is that the framework on the site
 * matches the framework SSH actually teaches.
 */

export const SSH_SOURCES = {
  outcomeHypothesis:
    "https://www.soonersaferhappier.com/post/outcome-hypotheses-a-primer",
  okrChecklist: "https://www.soonersaferhappier.com/post/okrs-a-checklist",
  outcomeCanvas: "https://www.soonersaferhappier.com/quick-learn-outcome-canvas",
  strategyDefinition:
    "https://www.soonersaferhappier.com/post/strategy-definition-how-might-we-write-our-strategic-choices-in-a-way-that-we-can-execute-outcome",
  okNotOkOkrs: "https://youtu.be/CtO7WewP-Vo",
  ssh: "https://soonersaferhappier.com",
};

/** Slide 6 — what the two halves of an OKR are actually for. */
export const ANATOMY = [
  {
    letter: "O",
    title: "Objective",
    text: "Provides clarity of the bet that you are placing and the capability you are building. This is where you want to play and how you are going to win.",
    color: "text-sooner",
    border: "border-sooner/40",
  },
  {
    letter: "KRs",
    title: "Key Results",
    text: "Provide the feedback. They are the leading and lagging metrics that tell you how you are going on the journey and what success looks like.",
    color: "text-safer",
    border: "border-safer/40",
  },
];

/** Slide 7 — why bother. */
export const WHY_OKRS = [
  {
    title: "Connection to strategy",
    text: "To provide teams with clarity on how the work they are doing aligns with the organisation’s vision and strategy.",
  },
  {
    title: "Alignment & collaboration",
    text: "To create shared understanding of outcomes and alignment of people and purpose.",
  },
  {
    title: "Decision making",
    text: "To provide a guiding structure to support trade-off decisions and resource allocation.",
  },
  {
    title: "Empowerment & experimentation",
    text: "To create empowerment through experimentation, taking calculated risks and innovation.",
  },
  {
    title: "Autonomy & accountability",
    text: "To provide autonomy and accountability through visibility and transparency of outcomes and progress towards achieving the strategy.",
  },
  {
    title: "Maximise value, minimise risk",
    text: "To optimise on impact to be achieved through lagging metrics whilst mitigating risk along the way through leading metrics.",
  },
];

/** Slide 9 — the 3Ms. */
export const THREE_MS = [
  {
    m: "Mission",
    scope: "Objective",
    text: "Outcome over output. Inspirational.",
    color: "text-sooner",
    border: "border-sooner/40",
  },
  {
    m: "Measurement",
    scope: "Key Results",
    text: "Movement & behaviour. Leading and lagging.",
    color: "text-safer",
    border: "border-safer/40",
  },
  {
    m: "Mindset",
    scope: "How you hold them",
    text: "Emergent over deterministic. Empowering.",
    color: "text-happier",
    border: "border-happier/40",
  },
];

/** Slide 11 — the shift OKRs are meant to make. */
export const MBO_TO_OKR: [from: string, to: string][] = [
  ["Top down", "Top down & bottom up"],
  ["Command & control", "Empowerment, autonomy"],
  ["Output & tasks", "Outcomes & experiments"],
  ["Annual", "Multi-year, annual, quarterly"],
  ["Private and siloed", "Transparent and aligned"],
  ["Risk averse", "Aspirational"],
];

/** Slide 12 — an OK OKR, and why it is OK. */
export const OK_OKR = {
  objective: "#1 in our market in LATAM",
  objectiveLabel: "Objective (annual)",
  keyResults: [
    "Double ad click-through-rate from 2.5% to 5%",
    "Increase customer NPS from +40 to +60",
    "Increase referrals from 50k to 100k p.m.",
    "Grow daily digital transactions from 100k to 400k",
    "Increase market share from x% to y% by Q4",
  ],
  patterns: {
    mission: ["Outcome over output", "Inspirational & aspirational"],
    measurement: [
      "Measurable: <verb> <measure> from <x> to <y>",
      "Measures of behaviour — leading (1–4) and lagging (5)",
      "Early & often feedback loop",
      "Measures of movement towards the Objective",
      "Measures of value added, incrementally",
      "No more than 3 to 5 Key Results per OKR",
      "Business and IT as one",
    ],
  },
};

/** Slide 13 — a NOT OK OKR, and why it isn't. */
export const NOT_OK_OKR = {
  objective: "Deliver Project Platypus",
  objectiveLabel: "Objective",
  keyResults: [
    "Create a new training program",
    "Design agreed by all necessary committees",
    "Mandatory & discretionary artefacts approved",
    "Contract signed with vendor for build",
    "Build new feature screens",
    "Improve search engine optimisation",
    "Write runbook",
    "Get InfoSec & data privacy approval",
    "Provision hardware",
    "Test data migration",
    "Go live",
  ],
  antipatterns: {
    mission: ["Output over outcome", "Not inspirational, duration not clear"],
    measurement: [
      "Task list",
      "Not measurable",
      "No measures of change of behaviour",
      "No measures of value",
      "No leading indicators of value",
      "Too many Key Results",
      "IT only — what’s the business value?",
    ],
  },
};

/** Slide 16 — Maria Muir's OKR checklist, the review guardrail. */
export const CHECKLIST: { heading: string; items: string[] }[] = [
  {
    heading: "Overall",
    items: [
      "Who is the customer? Is it clear who the value is being delivered to (i.e. internal or external)?",
      "Do we understand what behaviour change we are expecting? Why is the customer desiring this change?",
      "Was the OKR written as a collaborative, cross-functional team?",
      "Is the OKR time bound? Does it have an owner?",
      "Is the OKR connected to strategy?",
      "Does the OKR have a parent/child? (e.g. a 1-year OKR connected to a 3-year OKR, with 4x quarterly OKRs)",
    ],
  },
  {
    heading: "Objective definition",
    items: [
      "What is the problem being solved? Is it clear?",
      "Is the “so what” to the customer clear? Is the impact (or value driver) clear?",
      "Is the objective defined as an outcome hypothesis, or as a predetermined solution? What capability is needed?",
      "Is the objective defined as an aspirational goal or a defined target?",
      "How many OKRs have been defined?",
    ],
  },
  {
    heading: "Key Results",
    items: [
      "How will you know if you’ve been successful? (i.e. lagging metric)",
      "How will you know if you’re on the right track? (i.e. leading metrics)",
      "How many KRs have been defined? Do we have too many? Not enough?",
      "Are the KRs quantifiable? Is the action required clear? (e.g. improve, decrease)",
      "Do the KRs represent the expected behaviour change?",
      "How can the KRs be measured? Is the “from/to” clear?",
    ],
  },
];

/** Slide 18 — the navigation metaphor. */
export const NAVIGATION = [
  {
    label: "Strategy",
    equals: "Travel destination",
    question: "Where do we want to go?",
    color: "text-happier",
    border: "border-happier/40",
  },
  {
    label: "OKRs",
    equals: "GPS",
    question: "Are we heading in the right direction?",
    color: "text-sooner",
    border: "border-sooner/40",
  },
  {
    label: "KPIs",
    equals: "Dashboard",
    question: "How well is our system performing along the journey?",
    color: "text-safer",
    border: "border-safer/40",
  },
];

/** Slide 19 — OKRs are not KPIs. */
export const OKRS_VS_KPIS = {
  okrs: [
    "Harder to determine, as the change is unknown and complex",
    "Cross-functional in nature, focusing on getting better",
    "Focus on accelerated growth and the change required",
    "Typically requires a network of stakeholders to create end-to-end value",
    "Ambitious",
    "Baselines may exist; how to measure needs to be created",
  ],
  kpis: [
    "Easier to set, as they are based on what we know",
    "Typically delivered by a functional group",
    "Focus on the health of the business, watched with precision",
    "Clear on who and what is required",
    "“This is how we work, what we know — let’s see if we can improve”",
    "Assessed via knowable metrics (health metrics)",
  ],
};

/**
 * How many key results an OKR carries.
 *
 * Slide 12: "no more than 3 to 5 Key Results per OKR", made of "measures of
 * behaviour — leading (1–4) and lagging (5)" — the numerals there are the
 * positions in the list, so four of them at most are leading and the last is
 * the lagging one. `/okrs` says the same thing in words: "3–4 leading
 * indicators so you can pivot early, plus 1 lagging indicator".
 *
 * It is a number the product has to agree with in more than one place — the
 * canvas box that holds the early signals, both coach briefs, the takeaway and
 * the page — so it lives here with the pattern it comes from, and nowhere else.
 * It describes the pattern, never a quota: a leader who stops at one early
 * signal has a finished canvas, and nothing anywhere counts what they gave.
 */
export const KEY_RESULTS = {
  /** Fewest that make an OKR an OKR. */
  min: 3,
  /** Most, in total. */
  max: 5,
  /** Leading indicators — the ones you can still pivot on. */
  leading: { min: 3, max: 4 },
  /** Lagging — the impact metric. One. */
  lagging: 1,
} as const;

/** Slide 3 — the cadence OKRs live in. */
export const CADENCE = [
  {
    horizon: "Multi-year",
    text: "Acts as the North Star for an organisation, helping it remain focussed on its long-term strategy.",
  },
  {
    horizon: "Annual",
    text: "Makes those longer-term strategic goals more digestible, giving divisions focus for the year ahead.",
  },
  {
    horizon: "Quarterly",
    text: "Allows flexibility to pivot within the year, so teams can develop actionable plans for the work they will do.",
  },
];

/* ------------------------------------------------------------------------ */
/* The pattern, as the coach needs to hear it                                 */
/* ------------------------------------------------------------------------ */

/**
 * The Sooner Safer Happier point of view on OKRs, in one brief — idea #147.
 *
 * CARD A is explicit about why this exists: `/okrs` is "how Sooner Safer Happier
 * thinks about and applies OKRs… the domain content the coaching is actually
 * teaching", and it is binding on the coach, second only to PRINCIPLES.md. It
 * was binding on the *page* and nowhere else: neither coach had ever been told
 * the pattern, so the framework the site teaches and the framework the coach
 * coached to had drifted — most visibly on how many measures a goal carries.
 *
 * Built from the same constants the page renders, so the two can't drift again.
 * Change the pattern here and the page and both coaches change together.
 *
 * It is a brief, not a script. Every consumer of it says so in its own words:
 * the coach coaches this, it never recites it. "Coach, don't dictate."
 */
export function sshOkrBrief(): string {
  const kr = KEY_RESULTS;
  return [
    `HOW SOONER SAFER HAPPIER DO OKRs. This is the domain you are teaching, and it is written up at bettergoals.ai/okrs. Coach it — never recite it, and never name the framework when a plain question would do.`,
    ``,
    `THE OBJECTIVE IS THE BET. ${ANATOMY[0].text} Its shape is an outcome hypothesis: "due to «this insight, feedback or belief», we believe that «this bet» will result in «this outcome»". The word hypothesis is deliberate — it sets the expectation that the outcome may be invalid, and that finding that out early is the point rather than the failure.`,
    ``,
    `THE KEY RESULTS. ${ANATOMY[1].text} ${kr.min} to ${kr.max} of them and no more: ${kr.leading.min}–${kr.leading.max} leading indicators, which are indicative of future performance and let them pivot while there is still time, plus ${kr.lagging} lagging indicator — the impact metric, the one that would convince a sceptic. Each is measurable in the shape "«verb» «measure» from «x» to «y» by «z»". One measure on its own is not the pattern: a single lagging number tells them at the end whether they were right, and nothing before it. So ask for more than one early signal, and never quietly reduce a set they have given you down to one.`,
    ``,
    `MORE THAN A FRAMEWORK — THE 3Ms. ${THREE_MS.map((m) => `${m.m} (${m.scope}): ${m.text}`).join(" ")}`,
    ``,
    `THEY NEST — THE GOLDEN THREAD. ${CADENCE.map((c) => `${c.horizon}: ${c.text}`).join(" ")} Every goal sits at one of those three horizons, and as you go down the levels the Objective gets more specific while still contributing to the level above.`,
    ``,
    `CALIBRATION. An OK OKR reads "${OK_OKR.objective}" with key results like "${OK_OKR.keyResults[0]}" and "${OK_OKR.keyResults[OK_OKR.keyResults.length - 1]}" — ${OK_OKR.patterns.mission.join(", ").toLowerCase()}, measures of behaviour and of value added incrementally. A NOT OK one reads "${NOT_OK_OKR.objective}" with a task list under it — ${NOT_OK_OKR.antipatterns.measurement.slice(0, 5).join(", ").toLowerCase()}.`,
    ``,
    `WHAT SSH ASK OF KEY RESULTS. ${CHECKLIST.find((c) => c.heading === "Key Results")?.items.join(" ") ?? ""}`,
    ``,
    `It is a starting point to apply to their context, not a standard to comply with. Where the pattern and their reality disagree, the principles are the tie-breaker and their reality usually wins.`,
  ].join("\n");
}
