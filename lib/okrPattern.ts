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
