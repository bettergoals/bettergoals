/**
 * A deterministic reading of a goal statement against the five dimensions in the
 * `outcome-vs-output-check` skill (see public/skills/outcome-vs-output-check.md).
 *
 * This is a pattern check, not a judgement. It can see whether a goal names a
 * beneficiary, moves a measure and has a by-when. It cannot see whether the goal
 * is the right one — that conversation still needs a human, or the skill itself
 * in front of an assistant.
 *
 * Everything here is pure and dependency-free so the same function runs during
 * server render (works with JavaScript off) and live in the browser as you type.
 */

export type DimensionKey = "customer" | "change" | "sooner" | "safer" | "motivating";
export type Verdict = "Outcome" | "Output" | "Hybrid";

export type Dimension = {
  key: DimensionKey;
  label: string;
  score: number;
  note: string;
  evidence: string[];
};

export type ScaffoldPart =
  | { kind: "text"; text: string }
  | { kind: "slot"; label: string; value: string | null };

export type Check = {
  goal: string;
  verdict: Verdict;
  verdictReason: string;
  total: number;
  dimensions: Dimension[];
  question: string;
  scaffold: ScaffoldPart[];
  prompt: string;
};

/* ------------------------------------------------------------------ lexicons */

/** Verbs that describe producing a thing rather than changing something. */
const DELIVERY = [
  "launch", "ship", "deliver", "build", "implement", "rollout", "roll out", "roll-out",
  "migrate", "create", "design", "develop", "deploy", "set up", "stand up", "spin up",
  "establish", "produce", "publish", "write", "run", "hold", "organise", "organize",
  "procure", "purchase", "buy", "sign", "approve", "hire", "install", "integrate",
  "standardise", "standardize", "consolidate", "refactor", "rebuild", "rewrite",
  "redesign", "replace", "introduce", "provide", "define", "document", "prepare",
  "present", "select", "configure", "automate", "go live", "put in place", "finish",
  "train", "plan", "scope", "audit", "review", "communicate", "recruit",
];

/** Verbs that describe moving a measure. */
const MOVEMENT = [
  "increase", "decrease", "reduce", "grow", "improve", "raise", "lower", "double",
  "triple", "quadruple", "halve", "shift", "cut", "accelerate", "boost", "lift",
  "drop", "shorten", "speed up", "eliminate", "minimise", "minimize", "maximise",
  "maximize", "sustain", "recover", "win back", "bring down", "close the gap",
];

/** Verbs that describe someone doing something differently. */
const BEHAVIOUR = [
  "adopt", "use", "return", "renew", "recommend", "refer", "switch", "self-serve",
  "self serve", "choose", "apply", "abandon", "repeat", "engage", "upgrade",
  "subscribe", "log in", "sign up", "reorder", "share", "trust", "understand",
  "resolve", "come back", "stay", "churn", "activate", "onboard", "complete",
];

const METRIC_NOUNS = [
  "rate", "ratio", "share", "score", "nps", "csat", "ces", "churn", "retention",
  "conversion", "adoption", "revenue", "margin", "cost", "volume", "throughput",
  "lead time", "cycle time", "time to", "latency", "uptime", "availability",
  "defect", "error rate", "satisfaction", "engagement", "frequency", "market share",
  "click-through", "ctr", "arpu", "ltv", "cost per", "number of", "percentage",
  "percent", "median", "average", "backlog", "wait time", "handling time",
  "first contact", "basis points", "index", "sales", "signups", "sign-ups",
];

const BENEFICIARY_GENERIC = [
  "user", "users", "customer", "customers", "people", "person", "stakeholder",
  "stakeholders", "everyone", "the business", "team", "teams", "staff", "employee",
  "employees", "colleague", "colleagues", "the organisation", "the organization",
  "end user", "end users", "internal customer", "internal customers",
];

const BENEFICIARY_SPECIFIC = [
  "client", "clients", "member", "members", "patient", "patients", "citizen",
  "citizens", "applicant", "applicants", "buyer", "buyers", "shopper", "shoppers",
  "seller", "sellers", "subscriber", "subscribers", "guest", "guests", "developer",
  "developers", "engineer", "engineers", "partner", "partners", "merchant",
  "merchants", "driver", "drivers", "rider", "riders", "student", "students",
  "learner", "learners", "tenant", "tenants", "resident", "residents", "advisor",
  "advisors", "adviser", "advisers", "broker", "brokers", "caller", "callers",
  "visitor", "visitors", "clinician", "clinicians", "nurse", "nurses", "doctor",
  "doctors", "teacher", "teachers", "parent", "parents", "carer", "carers",
  "supplier", "suppliers", "recruiter", "recruiters", "analyst", "analysts",
  "homeowner", "homeowners", "policyholder", "policyholders", "cardholder",
  "cardholders", "borrower", "borrowers", "taxpayer", "taxpayers", "passenger",
  "manager", "managers", "leader", "leaders", "operator", "operators",
  "passengers", "product manager", "product managers", "value stream",
  "value streams", "small business", "small businesses",
];

/** Qualifiers that turn a generic "users" into a segment worth naming. */
const SEGMENT = /\b(new|first[- ]time|returning|existing|lapsed|at[- ]risk|high[- ]value|enterprise|small[- ]business|smb|prospective|premium|frequent|mobile|self[- ]serve|onboarding)\s+(?:\w+\s+)?(users?|customers?|members?|people|teams?|staff|employees?|colleagues?)\b/i;

const GUARDRAILS = [
  "without", "whilst", "while maintaining", "while keeping", "while holding",
  "no increase", "no worse", "not at the expense", "at no cost to", "guardrail",
  "counter-metric", "counter metric", "balancing measure", "without harming",
  "no degradation", "safe to miss",
];

const LEARNING = [
  "we believe", "hypothesis", "experiment", "test", "learn", "early signal",
  "evidence", "due to", "will result in", "validate", "invalidate", "assume",
];

/** Metrics that are easy to hit and easy to game. */
const VANITY = [
  "story points", "velocity", "utilisation", "utilization", "headcount",
  "lines of code", "tickets closed", "tickets raised", "number of meetings",
  "attendance", "training completed", "trained", "workshops", "certified",
  "certifications", "on time and on budget", "on budget", "milestones",
  "sign-off", "signoff", "percent complete", "% complete", "man days", "man-days",
  "burndown", "resource utilisation",
];

const JARGON = [
  "leverage", "synergy", "synergies", "operationalise", "operationalize", "utilise",
  "utilize", "best-in-class", "best in class", "world-class", "world class",
  "seamless", "holistic", "paradigm", "value-add", "value add", "low-hanging fruit",
  "boil the ocean", "step change", "move the needle", "enterprise-wide",
  "cutting-edge", "state-of-the-art", "next-generation", "frictionless", "turnkey",
  "mission-critical", "robust", "strategic imperative",
];

const COMMITTEE = [
  "sign-off", "signoff", "signed off", "approved by", "governance",
  "steering committee", "steering group", "board approval", "as agreed",
  "in accordance with", "as per",
];

/** "may" is left out on purpose — far more often the verb than the month. */
const MONTH_NAMES = [
  "january", "february", "march", "april", "june", "july", "august",
  "september", "october", "november", "december", "jan", "feb", "mar", "apr",
  "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",
];

/* ------------------------------------------------------------------ matching */

/** Crude morphological variants, so "increasing" matches the stem "increase". */
function forms(word: string): string[] {
  const out = new Set<string>([word]);
  for (const suffix of ["ing", "ed", "es", "s", "d"]) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
      out.add(word.slice(0, -suffix.length));
    }
  }
  if (word.endsWith("ies")) out.add(`${word.slice(0, -3)}y`);
  for (const variant of [...out]) {
    if (variant.length < 4) continue;
    if (variant.endsWith("e")) out.add(variant.slice(0, -1));
    else out.add(`${variant}e`);
    const doubled = /([b-df-hj-np-tv-z])\1$/.exec(variant);
    if (doubled) out.add(variant.slice(0, -1));
  }
  return [...out];
}

type Text = { raw: string; lower: string; words: string[]; stems: Set<string> };

function prepare(goal: string): Text {
  const lower = goal.toLowerCase();
  const words = lower.match(/[a-z][a-z'-]*/g) ?? [];
  const stems = new Set<string>();
  for (const word of words) for (const form of forms(word)) stems.add(form);
  return { raw: goal, lower, words, stems };
}

/** How a lexicon term actually appears in the goal, so quotes read naturally. */
function surface(text: Text, term: string): string {
  if (term.includes(" ")) {
    const at = text.lower.indexOf(term);
    return at >= 0 ? text.raw.slice(at, at + term.length) : term;
  }
  const wanted = new Set(forms(term));
  return text.words.find((word) => forms(word).some((form) => wanted.has(form))) ?? term;
}

/** Terms present in the goal, in the order they appear in the lexicon. */
function match(text: Text, terms: readonly string[]): string[] {
  const hits: string[] = [];
  for (const term of terms) {
    const found = term.includes(" ")
      ? text.lower.includes(term)
      : forms(term).some((form) => text.stems.has(form));
    if (found && !hits.includes(term)) hits.push(term);
  }
  return hits;
}

const clamp = (n: number) => Math.max(0, Math.min(5, Math.round(n)));

/* ------------------------------------------------------------------- the check */

export function checkGoal(input: string): Check | null {
  const goal = input.trim().replace(/\s+/g, " ");
  const text = prepare(goal);
  if (goal.length < 12 || text.words.length < 4) return null;

  const delivery = match(text, DELIVERY);
  const movement = match(text, MOVEMENT);
  const behaviour = match(text, BEHAVIOUR);
  const metrics = match(text, METRIC_NOUNS);
  const generic = match(text, BENEFICIARY_GENERIC);
  const specific = match(text, BENEFICIARY_SPECIFIC);
  const guardrails = match(text, GUARDRAILS);
  const learning = match(text, LEARNING);
  const vanity = match(text, VANITY);
  const jargon = match(text, JARGON);
  const committee = match(text, COMMITTEE);

  const numbers = (goal.match(/\d+(?:[.,]\d+)?\s*%?/g) ?? []).map((n) => n.trim());
  // Allows a unit on either side: "from 4 hours to 30 minutes", "from 60% to 25%".
  const UNIT = "(?:hours?|hrs?|minutes?|mins?|seconds?|days?|weeks?|months?|points?|pts?|percent|%)";
  const fromTo = new RegExp(
    `\\bfrom\\s+([^\\s,.;]+(?:\\s+${UNIT})?)\\s+to\\s+([^\\s,.;]+(?:\\s+${UNIT})?)`,
    "i"
  ).exec(goal);
  const segment = SEGMENT.exec(goal);

  // The measure being moved is the one before the "from x to y", not one that
  // happens to appear in a guardrail clause later in the sentence.
  const fromAt = fromTo ? text.lower.indexOf(fromTo[0].toLowerCase()) : -1;
  const located = metrics
    .map((term) => surface(text, term))
    .map((word) => ({ word, at: text.lower.indexOf(word.toLowerCase()) }))
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at);
  const primaryMetric =
    (fromAt >= 0 ? located.find((m) => m.at < fromAt) : located[0])?.word ?? null;

  /* --- 1. Names a customer or beneficiary ------------------------------- */
  const namedSpecific = specific.length > 0 || Boolean(segment);
  const beneficiary = segment?.[0]
    ?? (specific[0] ? surface(text, specific[0]) : null)
    ?? (generic[0] ? surface(text, generic[0]) : null);
  const customerScore = namedSpecific ? 5 : generic.length ? 3 : 0;
  const customerNote = namedSpecific
    ? `Names a specific beneficiary — “${beneficiary}”. Good: the more specific the person, the easier the goal is to argue with.`
    : generic.length
      ? `Says “${surface(text, generic[0])}”, which could be anyone. Which ones? A segment you can picture beats a category.`
      : "No beneficiary anywhere. Nobody in this sentence is better off when it comes true.";

  /* --- 2. Measurable change in behaviour or experience ------------------ */
  let changeScore = 0;
  if (movement.length || (behaviour.length && customerScore > 0)) changeScore += 2;
  if (numbers.length) changeScore += 2;
  if (fromTo) changeScore += 1;
  if (metrics.length) changeScore += 1;
  if (!movement.length && !behaviour.length && delivery.length) changeScore = Math.min(changeScore, 1);
  changeScore = clamp(changeScore);
  const changeNote = !movement.length && !behaviour.length
    ? delivery.length
      ? `Reads as a thing to produce — “${surface(text, delivery[0])}” — not a change to observe. What is different for someone once it exists?`
      : "Nothing in here is moving. What would somebody be doing differently once this is true?"
    : fromTo
      ? `Moves ${primaryMetric ? `“${primaryMetric}”` : "a measure"} from ${fromTo[1]} to ${fromTo[2]} — a baseline and a target, which is what makes it arguable.`
      : numbers.length
        ? "Has a number but no baseline. “From x to y” turns a target into a change."
        : "Names a change but nothing to measure it with. What number would move if this were true?";

  /* --- 3. Testable sooner ------------------------------------------------ */
  // "90 days" is a quarter wearing a disguise — don't let it read as "days".
  const longDays = /\b(60|90|120|180|365)\s*days?\b/i.test(goal);
  const soon = match(text, ["week", "weeks", "sprint", "sprints", "fortnight", "day", "days"])
    .filter((term) => !(longDays && term.startsWith("day")));
  const monthly = match(text, ["month", "months", "monthly"]);
  const longRange = match(text, ["year", "years", "annual", "annually", "fy", "end of year", "eoy", "financial year"])
    .length > 0 || /\b(12|18|24|36)\s*months?\b/i.test(goal) || /\bh[12]\b/i.test(goal);
  const quarterly = match(text, ["quarter", "quarterly", ...MONTH_NAMES]).length > 0
    || /\bq[1-4]\b/i.test(goal) || longDays;

  // The by-when as the author actually wrote it — "eight weeks", "Q3", "March".
  const period = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve)\s+(day|week|fortnight|sprint|month|quarter|year)s?\b/i.exec(goal);
  const quarterTag = /\bq[1-4]\b/i.exec(goal);
  const relative = /\b(?:the\s+)?(?:end\s+of\s+)?(?:the\s+)?(this|next)\s+(week|month|quarter|year)\b/i.exec(goal);
  const namedMonth = new RegExp(`\\bby\\s+(?:the\\s+end\\s+of\\s+)?(${MONTH_NAMES.join("|")})\\b`, "i").exec(goal);
  const when = period
    ? `${period[1]} ${period[2]}${period[1] === "one" || period[1] === "1" ? "" : "s"}`
    : quarterTag?.[0].toUpperCase()
      ?? (relative ? `${relative[1].toLowerCase()} ${relative[2].toLowerCase()}` : null)
      ?? namedMonth?.[1] ?? null;

  let soonerScore: number;
  let soonerNote: string;
  if (longRange && !soon.length) {
    soonerScore = 1;
    soonerNote = "A year-shaped horizon. What could you see in three weeks that would tell you this is working, or that it isn’t?";
  } else if (soon.length) {
    soonerScore = 5;
    soonerNote = `Talks in ${soon[0]}s. Early signal is possible, so you can steer while there is still time.`;
  } else if (monthly.length) {
    soonerScore = 4;
    soonerNote = "A month-shaped horizon — close enough to get a signal and act on it.";
  } else if (quarterly) {
    soonerScore = 3;
    soonerNote = "There is a by-when, but it’s a quarter or a date. What is the first weekly signal on the way there?";
  } else {
    soonerScore = 2;
    soonerNote = "No by-when at all, so nobody can tell whether it is on track or already over.";
  }

  /* --- 4. Safe ----------------------------------------------------------- */
  let saferScore = 1;
  if (guardrails.length) saferScore += 2;
  if (learning.length) saferScore += 1;
  if (numbers.length >= 1 && numbers.length <= 2) saferScore += 1;
  if (numbers.length >= 4) saferScore -= 1;
  if (vanity.length) saferScore -= 2;
  saferScore = clamp(saferScore);
  const saferNote = vanity.length
    ? `“${vanity[0]}” is easy to hit and easy to game — it measures effort, not the change. What would tell you the number was being gamed?`
    : guardrails.length
      ? "Carries a guardrail, so chasing the number has a limit on it."
      : numbers.length >= 4
        ? "Several numbers at once. One primary measure and at most one guardrail beats a dashboard."
        : "No guardrail. What must not get worse while you chase this?";

  /* --- 5. Motivating ----------------------------------------------------- */
  let motivatingScore = 3;
  if (customerScore >= 3) motivatingScore += 1;
  if (movement.length || behaviour.length) motivatingScore += 1;
  motivatingScore -= Math.min(2, jargon.length);
  if (text.words.length > 40) motivatingScore -= 1;
  if (committee.length) motivatingScore -= 1;
  motivatingScore = clamp(motivatingScore);
  const motivatingNote = jargon.length
    ? `“${jargon[0]}” is doing work that a plain word could do better. Say it the way you'd say it to a colleague.`
    : committee.length
      ? "Framed around approval rather than around people. Who cheers when this lands?"
      : text.words.length > 40
        ? "Long enough that a team would skim it. If it can’t be said in one breath, it can’t be rallied around."
        : customerScore >= 3 && (movement.length > 0 || behaviour.length > 0)
          ? "Plain language, a person in it, and something actually changing. A team could get behind this."
          : customerScore >= 3
            ? "Someone is named, but nothing is changing for them. That’s the bit a team would cheer for."
            : "Nothing here to care about yet — no one named, nothing moving.";

  const dimensions: Dimension[] = [
    {
      key: "customer",
      label: "Names a customer or beneficiary",
      score: customerScore,
      note: customerNote,
      evidence: segment ? [segment[0]] : [...specific, ...generic].slice(0, 4),
    },
    {
      key: "change",
      label: "Measurable change in behaviour or experience",
      score: changeScore,
      note: changeNote,
      evidence: [...movement, ...behaviour, ...metrics, ...numbers].slice(0, 5),
    },
    {
      key: "sooner",
      label: "Testable sooner — early signal in weeks",
      score: soonerScore,
      note: soonerNote,
      evidence: [...soon, ...monthly, ...(quarterly ? ["a quarter or a date"] : [])].slice(0, 4),
    },
    {
      key: "safer",
      label: "Safe — guardrails, not gameable, safe to miss",
      score: saferScore,
      note: saferNote,
      evidence: [...guardrails, ...learning, ...vanity].slice(0, 4),
    },
    {
      key: "motivating",
      label: "Motivating — a team would care",
      score: motivatingScore,
      note: motivatingNote,
      evidence: [...jargon, ...committee].slice(0, 4),
    },
  ];

  const total = dimensions.reduce((sum, d) => sum + d.score, 0);

  /* --- verdict ----------------------------------------------------------- */
  const hasMovement = movement.length > 0 || (behaviour.length > 0 && customerScore > 0);
  // A metric *noun* isn't enough for an outcome verdict — "improve satisfaction"
  // still has no number in it. Insist on something countable.
  const hasMeasure = numbers.length > 0 || Boolean(fromTo);
  let verdict: Verdict;
  let verdictReason: string;
  if (hasMovement && hasMeasure && !delivery.length) {
    verdict = "Outcome";
    verdictReason = "Something changes for someone, and there is a measure that would show it.";
  } else if (delivery.length && !hasMovement) {
    verdict = "Output";
    verdictReason = `“${delivery[0]}” is a thing you produce. You could finish it in full and nothing would be different for anyone.`;
  } else if (!delivery.length && !hasMovement) {
    verdict = "Hybrid";
    verdictReason = "Neither a clear delivery nor a clear movement — as written, it’s a topic rather than a goal.";
  } else if (hasMovement && !hasMeasure) {
    verdict = "Hybrid";
    verdictReason = "It points at a change, but with nothing to measure it stays an intention.";
  } else {
    verdict = "Hybrid";
    verdictReason = "A change wrapped around a delivery. Lead with the change and let the delivery be one way to get there.";
  }

  /* --- the one question --------------------------------------------------- */
  const QUESTIONS: Record<DimensionKey, string> = {
    customer: "Who, specifically, is better off when this is true — and how would they describe the difference in their own words?",
    change: "What number would move if this were true, and what is it today?",
    sooner: "What could you see in three weeks that would tell you this is working — or that it isn’t?",
    safer: "What must not get worse while you chase this, and what would tell you the measure was being gamed?",
    motivating: "Would the team read this out loud and care? Say it again in the words you’d use to a colleague.",
  };
  const PRIORITY: DimensionKey[] = ["customer", "change", "sooner", "safer", "motivating"];
  const weakest = [...dimensions].sort(
    (a, b) => a.score - b.score || PRIORITY.indexOf(a.key) - PRIORITY.indexOf(b.key)
  )[0];
  const question = QUESTIONS[weakest.key];

  /* --- rewrite scaffold ---------------------------------------------------- */
  // Keep the author's own connective so "while keeping X under 5%" doesn't get
  // rendered as "without while keeping X under 5%".
  const guard = /\b(without|while|whilst)\s+([^,.;]{3,60})/i.exec(goal);
  const scaffold: ScaffoldPart[] = [
    { kind: "text", text: "So that " },
    { kind: "slot", label: "who", value: beneficiary },
    { kind: "text", text: " can " },
    { kind: "slot", label: "do what they can’t today", value: behaviour[0] ? surface(text, behaviour[0]) : null },
    { kind: "text", text: ", we will move " },
    { kind: "slot", label: "one primary measure", value: primaryMetric },
    { kind: "text", text: " from " },
    { kind: "slot", label: "today", value: fromTo?.[1] ?? null },
    { kind: "text", text: " to " },
    { kind: "slot", label: "target", value: fromTo?.[2] ?? numbers[0] ?? null },
    { kind: "text", text: " by " },
    { kind: "slot", label: "when", value: when },
    { kind: "text", text: guard ? ` — ${guard[1].toLowerCase()} ` : " — without " },
    { kind: "slot", label: "what must not get worse", value: guard?.[2].trim() ?? null },
    { kind: "text", text: "." },
  ];

  return { goal, verdict, verdictReason, total, dimensions, question, scaffold, prompt: buildPrompt(goal) };
}

/** A ready-to-paste prompt that hands the goal to an assistant running the skill. */
export function buildPrompt(goal: string): string {
  return [
    "Run the outcome-vs-output-check skill (bettergoals.ai/skills) on this goal.",
    "",
    `Goal: "${goal.trim()}"`,
    "",
    "Give me:",
    "1. A verdict — outcome, output or hybrid — with one line of reasoning.",
    "2. A score out of 5 for each of: names a customer or beneficiary; describes a measurable change in behaviour or experience; testable sooner (early signal within weeks); safe (guardrails present, not gameable, safe to miss and learn); motivating (a team would care).",
    "3. The one question I most need to answer.",
    "4. A sharper rewrite — one sentence, outcome-shaped, with a single primary measure and at most one guardrail.",
    "",
    "Be honest: most goals people paste are outputs. Say so kindly and specifically, and keep it under 200 words.",
  ].join("\n");
}

/** Goals to try, chosen to show an output, a hybrid and an outcome. */
export const EXAMPLE_GOALS = [
  "Launch the new mobile app by the end of the financial year",
  "Improve customer satisfaction across the contact centre",
  "So that new customers can open an account unaided, reduce assisted openings from 60% to 25% within eight weeks, without pushing complaints above today’s level",
];
