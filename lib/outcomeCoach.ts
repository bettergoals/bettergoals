/**
 * The Outcome Coach check.
 *
 * A deterministic, dependency-free structural review of a goal statement,
 * scored against the "Outcome definition principles" in PRINCIPLES.md.
 *
 * It is pattern matching, not an AI, and the page says so plainly. That is a
 * deliberate reading of two coach design principles: it never invents a
 * baseline, a number, or a rewritten goal on your behalf ("challenge
 * assumptions, don't invent them"), and it hands back questions rather than
 * answers ("coach, don't dictate"). Everything it claims to have seen, it
 * really did see in your words — the findings quote them back to you.
 */

export type CheckStatus = "strong" | "partial" | "missing";

export type Check = {
  id: string;
  title: string;
  /** The heading in PRINCIPLES.md this check comes from. */
  principle: string;
  status: CheckStatus;
  /** What the check saw in your words, and why that reads the way it does. */
  finding: string;
  /** The question to sit with — the coaching, not the correction. */
  question: string;
  /** One concrete thing to do next. */
  nextStep: string;
};

export type Band = {
  label: string;
  note: string;
  /** Tailwind text colour for the band label. Never the only signal. */
  color: string;
  border: string;
};

export type Evaluation = {
  text: string;
  score: number;
  max: number;
  band: Band;
  checks: Check[];
  strengths: Check[];
  gaps: Check[];
  /** Ready-to-paste prompt for taking the draft to a real AI coach. */
  handoffPrompt: string;
};

export const MAX_INPUT_LENGTH = 2000;

/** Below this, there isn't enough to review honestly. */
const MIN_WORDS = 4;

const STATUS_POINTS: Record<CheckStatus, number> = { strong: 2, partial: 1, missing: 0 };

export const STATUS_LABEL: Record<CheckStatus, string> = {
  strong: "Strong",
  partial: "Partly there",
  missing: "Missing",
};

function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Every term from the list that appears in the (lower-cased) text, in order. */
function found(text: string, terms: readonly string[]): string[] {
  const hits: string[] = [];
  for (const term of terms) {
    const pattern = new RegExp(`(?:^|[^a-z0-9-])${escapeRegExp(term)}(?![a-z0-9])`, "i");
    if (pattern.test(text)) hits.push(term);
  }
  return hits;
}

/** “a”, “b” and “c” — for quoting the words a check actually matched on. */
function quoteList(terms: string[], limit = 3): string {
  const shown = terms.slice(0, limit).map((t) => `“${t}”`);
  if (shown.length === 0) return "";
  if (shown.length === 1) return shown[0];
  return `${shown.slice(0, -1).join(", ")} and ${shown[shown.length - 1]}`;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// --- Vocabulary -------------------------------------------------------------

const BENEFICIARIES = [
  "customer", "customers", "client", "clients", "user", "users", "member", "members",
  "patient", "patients", "employee", "employees", "colleague", "colleagues", "citizen",
  "citizens", "resident", "residents", "student", "students", "applicant", "applicants",
  "buyer", "buyers", "seller", "sellers", "merchant", "merchants", "partner", "partners",
  "supplier", "suppliers", "driver", "drivers", "rider", "riders", "passenger", "passengers",
  "guest", "guests", "subscriber", "subscribers", "borrower", "borrowers", "policyholder",
  "policyholders", "adviser", "advisers", "advisor", "advisors", "broker", "brokers",
  "teacher", "teachers", "nurse", "nurses", "shopper", "shoppers", "visitor", "visitors",
  "candidate", "candidates", "tenant", "tenants", "donor", "donors", "volunteer",
  "volunteers", "household", "households", "team", "teams", "staff", "people", "leader",
  "leaders", "parent", "parents", "audience", "small business", "small businesses",
  "front-line", "frontline", "new starter", "new starters", "new joiner", "new joiners",
];

const PROBLEM_SIGNALS = [
  "problem", "problems", "pain", "painful", "struggle", "struggles", "struggling",
  "frustrated", "frustrating", "frustration", "can't", "cannot", "unable", "wait",
  "waiting", "waits", "delay", "delays", "delayed", "friction", "blocked", "blocker",
  "blockers", "difficult", "hard to", "confusing", "confused", "confusion", "error",
  "errors", "fails", "failing", "failure", "drop off", "drop-off", "abandon",
  "abandoned", "rework", "manual", "manually", "complaint", "complaints", "complain",
  "gap", "gaps", "too long", "too many", "too slow", "too hard", "no way to",
  "workaround", "workarounds", "give up", "chase", "chasing", "unclear",
];

const OUTPUT_SIGNALS = [
  "deliver", "delivery", "delivered", "launch", "launched", "build", "building", "built",
  "implement", "implementation", "roll out", "rollout", "rolled out", "go live",
  "go-live", "migrate", "migration", "deploy", "deployment", "complete", "completion",
  "create", "develop", "development", "write", "design", "set up", "stand up", "install",
  "procure", "integrate", "integration", "replatform", "upgrade", "refactor", "rebuild",
  "project", "programme", "program", "initiative", "workstream", "platform", "portal",
  "app", "application", "system", "tool", "toolset", "dashboard", "mvp", "phase",
  "milestone", "epic", "sprint", "release", "runbook", "vendor", "business case",
  "training program", "training programme", "sign contract", "sign a contract", "approval",
  "approved", "sign-off", "signed off", "documentation",
];

const CHANGE_SIGNALS = [
  "increase", "increased", "reduce", "reduced", "reduction", "improve", "improved",
  "improvement", "grow", "growth", "decrease", "decreased", "shorten", "shortened",
  "raise", "raised", "lower", "lowered", "halve", "halved", "double", "doubled", "triple",
  "cut", "boost", "accelerate", "eliminate", "remove", "minimise", "minimize", "maximise",
  "maximize", "shift", "lift", "speed up", "more", "fewer", "less", "faster", "slower",
  "higher", "better", "greater", "quicker", "easier", "safer", "happier", "sooner",
  "stronger", "smoother", "simpler", "clearer",
];

const METRIC_NOUNS = [
  "rate", "rates", "score", "scores", "nps", "csat", "esat", "time", "times", "cost",
  "costs", "spend", "revenue", "share", "conversion", "retention", "churn", "throughput",
  "satisfaction", "volume", "count", "index", "ratio", "percentage", "percent", "days",
  "hours", "minutes", "weeks", "uptime", "defects", "incidents", "complaints",
  "engagement", "adoption", "usage", "sessions", "signups", "sign-ups", "renewals",
  "referrals", "transactions", "clicks", "click-through", "lead time", "cycle time",
  "first response", "abandonment", "attrition", "margin", "downtime", "wait time",
];

const HYPOTHESIS_SIGNALS = [
  "we believe", "we think", "hypothesis", "we expect", "our bet", "the bet", "we assume",
  "assumption", "assumptions", "experiment", "experiments", "trial", "pilot", "test",
  "testing", "learn", "learning", "we'll know", "we will know", "if we", "leading",
  "early signal", "early indicator", "prove", "disprove", "validate",
];

const EARLY_SIGNALS = [
  "week", "weeks", "fortnight", "month", "months", "quarter", "quarterly", "q1", "q2",
  "q3", "q4", "sprint", "pilot", "experiment", "trial", "weekly", "monthly",
];

const LINK_SIGNALS = [
  "so that", "so we can", "so they can", "which means", "in order to", "resulting in",
  "leading to", "enabling", "enables", "because", "this matters", "contributes to",
  "supports our", "aligned to", "aligns to", "golden thread", "strategy", "strategic",
  "vision", "north star", "why this matters",
];

const VALUE_SIGNALS = [
  "revenue", "cost", "costs", "saving", "savings", "margin", "growth", "risk", "risks",
  "compliance", "safety", "trust", "loyalty", "retention", "satisfaction", "wellbeing",
  "well-being", "experience", "value", "efficiency", "productivity", "market share",
  "profit", "impact", "reputation", "morale", "capacity",
];

const JARGON = [
  "synergy", "synergies", "leverage", "leveraging", "holistic", "robust", "seamless",
  "seamlessly", "best-in-class", "best in class", "world-class", "world class",
  "transformation", "transformational", "streamline", "streamlining", "optimise",
  "optimize", "optimisation", "optimization", "utilise", "utilize", "paradigm",
  "ecosystem", "value-add", "value add", "uplift", "operationalise", "operationalize",
  "double down", "move the needle", "low-hanging fruit", "low hanging fruit",
  "step change", "future-proof", "mission-critical", "deep dive", "bandwidth",
  "circle back", "at pace", "bau", "enablement", "synergise", "synergize", "ideate",
  "socialise the", "socialize the", "reimagine", "supercharge", "turbocharge",
];

/** Acronyms an executive audience reads without stumbling. */
const KNOWN_ACRONYMS = new Set([
  "OKR", "OKRS", "KR", "KRS", "KPI", "KPIS", "NPS", "CSAT", "AI", "IT", "HR", "CEO",
  "CFO", "CTO", "COO", "CX", "EX", "UK", "US", "USA", "EU", "AU", "NZ", "ROI", "Q1",
  "Q2", "Q3", "Q4", "H1", "H2", "FY", "GBP", "USD", "EUR", "AUD", "SSH", "PDF", "URL",
  "ID", "OK", "PIN", "SMS", "FAQ", "VAT", "GST", "AM", "PM",
]);

// --- Detectors --------------------------------------------------------------

function hasFromTo(text: string): boolean {
  const digits = text.match(/\d/g)?.length ?? 0;
  return digits >= 2 && /\bfrom\b[^.\n]{0,60}\bto\b/i.test(text);
}

function hasTimeframe(text: string): boolean {
  return (
    /\bq[1-4]\b/i.test(text) ||
    /\bh[12]\b/i.test(text) ||
    /\bby\s+(the\s+)?(end\s+of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|q[1-4]|h[12]|20\d\d)/i.test(text) ||
    /\bwithin\s+\d+\s*(day|week|month|quarter|year)/i.test(text) ||
    /\b(this|next)\s+(week|month|quarter|half|year)\b/i.test(text) ||
    /\b(in|over)\s+(the\s+next\s+)?\d+\s*(day|week|month|quarter|year)s?\b/i.test(text) ||
    /\bby\s+20\d\d\b/.test(text) ||
    /\bby\s+(year|quarter|month)[\s-]end\b/i.test(text)
  );
}

function unknownAcronyms(original: string): string[] {
  const matches = original.match(/\b[A-Z]{2,6}s?\b/g) ?? [];
  const unknown = matches
    .map((m) => m.replace(/s$/, ""))
    .filter((m) => m.length >= 2 && !KNOWN_ACRONYMS.has(m) && !KNOWN_ACRONYMS.has(`${m}S`));
  return [...new Set(unknown)];
}

function codeNames(original: string): string[] {
  // Keyword either case, but the name itself must be capitalised — "project delivery"
  // is not a code name, "Project Platypus" is.
  const matches = original.match(/\b[Pp](?:roject|rogramme|rogram)\s+[A-Z][a-z]{2,}|\b[Ii]nitiative\s+[A-Z][a-z]{2,}/g) ?? [];
  return [...new Set(matches)];
}

function longestSentenceWords(text: string): number {
  const sentences = text.split(/[.!?;\n]+/).filter((s) => s.trim());
  return sentences.reduce((longest, s) => Math.max(longest, wordCount(s)), 0);
}

// --- The checks -------------------------------------------------------------

function customerAndProblem(t: string): Check {
  const who = found(t, BENEFICIARIES);
  const pain = found(t, PROBLEM_SIGNALS);
  const status: CheckStatus = who.length && pain.length ? "strong" : who.length || pain.length ? "partial" : "missing";

  let finding: string;
  if (who.length && pain.length) {
    finding = `You name who this is for (${quoteList(who)}) and what isn't working for them today (${quoteList(pain)}).`;
  } else if (who.length) {
    finding = `You name who this is for (${quoteList(who)}), but not the problem or opportunity they have today. Without it, nobody can tell whether this is worth doing now.`;
  } else if (pain.length) {
    finding = `You describe something that isn't working (${quoteList(pain)}), but not whose problem it is. "Someone, somewhere" is hard to design for.`;
  } else {
    finding = "No customer or beneficiary, and no problem. As written, this reads as work to do rather than value for someone.";
  }

  return {
    id: "customer",
    title: "Customer and problem",
    principle: "Start with customer and problem",
    status,
    finding,
    question: "Who exactly is this for, what is hard for them today, and why does it matter now?",
    nextStep: "Open with one line: “For «who», «what isn't working for them today»”.",
  };
}

function outcomeNotOutput(t: string): Check {
  const outputs = found(t, OUTPUT_SIGNALS);
  const changes = found(t, CHANGE_SIGNALS);

  let status: CheckStatus;
  let finding: string;
  if (outputs.length && !changes.length) {
    finding = `Words like ${quoteList(outputs)} describe the thing you'll produce. You could finish every one of them and nothing would be better for anyone — that's a plan, not a goal.`;
    status = "missing";
  } else if (outputs.length && changes.length) {
    finding = `Part outcome, part output: ${quoteList(changes)} describes a change, but ${quoteList(outputs)} names the solution you've already picked. The "how" belongs to the team.`;
    status = "partial";
  } else if (changes.length) {
    finding = `Your words for change — ${quoteList(changes)} — describe something getting better in the world, and you haven't pre-committed to a solution. That's outcome-shaped.`;
    status = "strong";
  } else {
    finding = "Nothing here describes a change — no increase, reduce, improve, or fewer. It isn't clear what would be different in the world if this were achieved.";
    status = "missing";
  }

  return {
    id: "outcome",
    title: "An outcome, not an output",
    principle: "Outcomes over outputs",
    status,
    finding,
    question: "If we shipped all of this and nothing changed for anyone, would we call it a success? If not, what is the change?",
    nextStep: "Rewrite the headline as the change, not the work: “«more/fewer/faster» «what», for «who»”.",
  };
}

function measures(t: string): Check {
  const hasNumber = /\d/.test(t);
  const metrics = found(t, METRIC_NOUNS);
  const status: CheckStatus = hasNumber && metrics.length ? "strong" : hasNumber || metrics.length ? "partial" : "missing";

  let finding: string;
  if (hasNumber && metrics.length) {
    finding = `There's a named measure (${quoteList(metrics)}) and a number attached to it. Someone else could check whether this moved.`;
  } else if (metrics.length) {
    finding = `You name what to measure (${quoteList(metrics)}), but there's no number anywhere. "Improve satisfaction" is a direction, not a measure.`;
  } else if (hasNumber) {
    finding = "There's a number, but it isn't clear what it measures. A figure without a named metric can't be tracked by anyone but you.";
  } else {
    finding = "No measure and no number. Nobody — including you in three months — could say whether this worked.";
  }

  return {
    id: "measures",
    title: "Measures of movement and impact",
    principle: "Measure movement and impact",
    status,
    finding,
    question: "What single number would move first if this were working, and what number would show the impact landed?",
    nextStep: "Name one leading indicator (movement in weeks) and one lagging indicator (the impact itself). Resist adding a third.",
  };
}

function baselineTargetTimeframe(t: string): Check {
  const fromTo = hasFromTo(t);
  const when = hasTimeframe(t);
  const status: CheckStatus = fromTo && when ? "strong" : fromTo || when ? "partial" : "missing";

  let finding: string;
  if (fromTo && when) {
    finding = "You've got the full shape: where you are now, where you want to be, and by when.";
  } else if (fromTo) {
    finding = "There's a from-and-to, but no deadline. A target with no date can always be next quarter's problem.";
  } else if (when) {
    finding = "There's a timeframe, but no baseline and target. Without today's number, nobody can tell whether the target is bold or already true.";
  } else {
    finding = "No baseline, no target, no timeframe. This can't be judged as achieved or missed — which also makes it impossible to be safe to miss.";
  }

  return {
    id: "baseline",
    title: "Baseline, target and timeframe",
    principle: "Measure movement and impact",
    status,
    finding,
    question: "What is the number today, what should it be, and by when?",
    nextStep: "Write it in the SSH shape: “«verb» «measure» from «x» to «y» by «when»”. If you don't know the baseline, say so — an honest “we don't measure this yet” beats a guess.",
  };
}

function hypothesis(t: string): Check {
  const belief = found(t, HYPOTHESIS_SIGNALS);
  const early = found(t, EARLY_SIGNALS);
  const status: CheckStatus = belief.length && early.length ? "strong" : belief.length || early.length ? "partial" : "missing";

  let finding: string;
  if (belief.length && early.length) {
    finding = `You've framed this as a bet (${quoteList(belief)}) with a horizon you can learn inside (${quoteList(early)}).`;
  } else if (belief.length) {
    finding = `You've made the belief explicit (${quoteList(belief)}), but there's no short horizon. A bet you can only settle at year-end is a verdict, not a feedback loop.`;
  } else if (early.length) {
    finding = `The horizon is short enough to learn from (${quoteList(early)}), but the underlying belief is unstated. What has to be true for this to work?`;
  } else {
    finding = "This reads as a certainty rather than a bet. No stated belief, no experiment, and no horizon short enough to be wrong in time to do something about it.";
  }

  return {
    id: "hypothesis",
    title: "A bet you can test",
    principle: "Outcomes are hypotheses",
    status,
    finding,
    question: "What do we believe, and what would we see in the next few weeks if that belief were wrong?",
    nextStep: "Add the hypothesis in one line: “We believe «change» will «effect». We'll know we're on track when «early signal».”",
  };
}

function soWhat(t: string): Check {
  const links = found(t, LINK_SIGNALS);
  const value = found(t, VALUE_SIGNALS);
  const status: CheckStatus = links.length && value.length ? "strong" : links.length || value.length ? "partial" : "missing";

  let finding: string;
  if (links.length && value.length) {
    finding = `The “so what” is spelled out (${quoteList(links)}) and it lands on something the organisation cares about (${quoteList(value)}).`;
  } else if (links.length) {
    finding = `You link this to something bigger (${quoteList(links)}), but the value at the end of that chain isn't named.`;
  } else if (value.length) {
    finding = `Value words are here (${quoteList(value)}), but the chain from this outcome to that value is implicit. Implicit golden threads get cut in prioritisation.`;
  } else {
    finding = "No “so what”. Nothing connects this to customer or organisational value, or to the strategy it's meant to serve.";
  }

  return {
    id: "sowhat",
    title: "The “so what”",
    principle: "Connect to strategy and value",
    status,
    finding,
    question: "If this lands, what becomes possible that wasn't before — and which strategic choice does that serve?",
    nextStep: "Finish the sentence “…so that «value», which is how we «strategic choice»”.",
  };
}

function plainLanguage(t: string, original: string): Check {
  const jargon = found(t, JARGON);
  const acronyms = unknownAcronyms(original);
  const names = codeNames(original);
  const longest = longestSentenceWords(original);
  const rambling = longest > 40;

  const problems: string[] = [];
  if (jargon.length) problems.push(`jargon (${quoteList(jargon)})`);
  if (acronyms.length) problems.push(`unexplained acronyms (${quoteList(acronyms)})`);
  if (names.length) problems.push(`an internal code name (${quoteList(names)})`);
  if (rambling) problems.push(`a ${longest}-word sentence`);

  const status: CheckStatus = problems.length === 0 ? "strong" : problems.length === 1 ? "partial" : "missing";
  const finding =
    problems.length === 0
      ? "Plain language throughout — no jargon, no unexplained acronyms, no code names, and nothing that needs re-reading."
      : `Someone who joined last week would stumble on ${problems.join(", ")}.`;

  return {
    id: "plain",
    title: "Anyone can understand it",
    principle: "Written so anyone can understand it",
    status,
    finding,
    question: "Could someone who joined last week say what would be different in the world if this were achieved?",
    nextStep: "Read it aloud to someone outside your function. Every word they query is a word to cut or explain.",
  };
}

const BANDS: { min: number; band: Band }[] = [
  {
    min: 13,
    band: {
      label: "A strong outcome",
      note: "This has the shape of a goal a team could act on tomorrow. Take it to a human — the remaining questions are about ambition and truth, not structure.",
      color: "text-sooner",
      border: "border-sooner/40",
    },
  },
  {
    min: 10,
    band: {
      label: "Outcome-shaped, with gaps",
      note: "The bones are right. Close the gaps below and this is ready to share.",
      color: "text-sooner",
      border: "border-sooner/40",
    },
  },
  {
    min: 6,
    band: {
      label: "Halfway to an outcome",
      note: "There's real thinking here, and some of it is still about the work rather than the change. The gaps below are the fastest way forward.",
      color: "text-safer",
      border: "border-safer/40",
    },
  },
  {
    min: 2,
    band: {
      label: "Mostly an output",
      note: "This describes what you'll do more than what will be different. That's the normal starting point — almost every goal begins here.",
      color: "text-happier",
      border: "border-happier/40",
    },
  },
  {
    min: 0,
    band: {
      label: "A starting point",
      note: "There's not much structure yet, and that's fine — this is a first draft, not a failure. Start with the first gap below and come back.",
      color: "text-happier",
      border: "border-happier/40",
    },
  },
];

function bandFor(score: number): Band {
  return (BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1]).band;
}

function buildHandoffPrompt(text: string, gaps: Check[]): string {
  const gapLines = gaps.length
    ? gaps.map((g) => `- ${g.title}: ${g.question}`).join("\n")
    : "- No structural gaps were flagged. Push me on whether this is bold enough, and whether the measure is the right one.";

  return [
    "I'm working on a goal and I want coaching, not a rewrite.",
    "",
    "My draft:",
    '"""',
    text,
    '"""',
    "",
    "A structural check flagged these:",
    gapLines,
    "",
    "Coach me using the bettergoals.ai outcome principles: start with customer and problem;",
    "outcomes over outputs; treat the outcome as a hypothesis; measure movement and impact",
    "with a baseline, target and timeframe; connect it to strategy and value; and write it so",
    "anyone can understand it.",
    "",
    "Ask me one question at a time. Don't invent baselines, targets or facts I haven't given",
    "you — if something is missing, ask. I want to leave owning the goal, not holding one you wrote.",
  ].join("\n");
}

/**
 * Review a goal statement. Returns `null` when there isn't enough text to say
 * anything honest about — better to ask for more than to score a fragment.
 */
export function evaluateOutcome(input: string): Evaluation | null {
  const text = input.trim().slice(0, MAX_INPUT_LENGTH);
  if (wordCount(text) < MIN_WORDS) return null;

  const t = text.toLowerCase();
  const checks: Check[] = [
    customerAndProblem(t),
    outcomeNotOutput(t),
    measures(t),
    baselineTargetTimeframe(t),
    hypothesis(t),
    soWhat(t),
    plainLanguage(t, text),
  ];

  const score = checks.reduce((total, c) => total + STATUS_POINTS[c.status], 0);
  const order: Record<CheckStatus, number> = { missing: 0, partial: 1, strong: 2 };
  const gaps = checks.filter((c) => c.status !== "strong").sort((a, b) => order[a.status] - order[b.status]);

  return {
    text,
    score,
    max: checks.length * 2,
    band: bandFor(score),
    checks,
    strengths: checks.filter((c) => c.status === "strong"),
    gaps,
    handoffPrompt: buildHandoffPrompt(text, gaps.slice(0, 4)),
  };
}

/** Worked examples, so the page is useful before you've typed anything. */
export const EXAMPLES = [
  {
    label: "A typical first draft",
    text: "Deliver Project Platypus: build the new customer portal, migrate the data and go live by the end of the year.",
  },
  {
    label: "A sharper version",
    text: "New customers give up part-way through onboarding because it takes too long. We believe a shorter journey will keep them. Reduce median onboarding time from 12 days to 3 days, and lift 30-day activation from 48% to 65% by Q3, so that we keep the revenue we already win. We'll know we're on track if week-one drop-off falls within the first month.",
  },
];
