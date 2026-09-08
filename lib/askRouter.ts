/**
 * One text box, one next step.
 *
 * The front door of the site is a single prompt: "what are you trying to
 * achieve?". This module reads that sentence and decides which of the things
 * this community already knows is the right next step — the Outcome Coach, the
 * OKR pattern, the canvas, the teaching guidance, or the session agenda.
 *
 * Like the Outcome Coach, it is deterministic keyword matching rather than an
 * AI, and the page says so. It follows the same design rules: it never invents
 * content, it says what it heard so you can correct it, and it hands you
 * questions and a route rather than an answer. When it can't tell what you
 * want, it falls back to the most useful default instead of guessing loudly.
 */

import { MAX_INPUT_LENGTH } from "@/lib/outcomeCoach";
import { SITE } from "@/lib/config";

export type IntentId = "check" | "okrs" | "measure" | "teach" | "facilitate" | "draft";

/** Somewhere on this site that answers the ask. */
export type Route = {
  href: string;
  label: string;
  note: string;
};

/** One of the community skills, for pointing your own AI at. */
export type SkillPointer = {
  file: string;
  name: string;
  why: string;
};

export type Intent = {
  id: IntentId;
  /** What the router thinks you asked for, said back so you can correct it. */
  heard: string;
  /** Heading for the answer. */
  heading: string;
  /** Why this is the route, in one short paragraph. */
  guidance: string;
  /** The coaching, not the correction — questions to sit with. */
  questions: string[];
  /** Concrete things to do, in order, smallest first. */
  steps: string[];
  skill: SkillPointer;
  /** What you want from an AI coach, for the handoff prompt. */
  promptWant: string;
  /** Where to go first, what else is worth a look, and a sharper `heard`. */
  route: (text: string) => { primary: Route; also: Route[]; heard?: string };
};

export type Ask = {
  text: string;
  intent: Intent;
  /** What was heard, said back — the intent's line, sharpened where possible. */
  heard: string;
  primary: Route;
  also: Route[];
  /** Ready-to-paste prompt for taking the ask to an AI coach. */
  prompt: string;
  /** True when nothing matched and we fell back to a sensible default. */
  guessed: boolean;
};

/** Below this there isn't enough to route on. */
const MIN_WORDS = 3;

/** Long enough that you've pasted a goal rather than asked a question. */
const PASTED_A_GOAL_WORDS = 12;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Does this term appear in the (lower-cased) text as a whole word or phrase? */
function has(text: string, term: string): boolean {
  return new RegExp(`(?:^|[^a-z0-9-])${escapeRegExp(term)}(?![a-z0-9])`, "i").test(text);
}

/** One unmistakable phrase ("tell me if", "okr") outweighs any pile of hints. */
const STRONG_POINTS = 3;

function score(
  text: string,
  strong: readonly string[],
  weak: readonly string[]
): { points: number; certain: boolean } {
  let points = 0;
  let certain = false;
  for (const term of strong) {
    if (has(text, term)) {
      points += STRONG_POINTS;
      certain = true;
    }
  }
  for (const term of weak) if (has(text, term)) points += 1;
  return { points, certain };
}

// --- What each intent sounds like -------------------------------------------

/**
 * Ordered by how specific the ask is: an ask about other people beats an ask
 * about your own draft, because "help my peers write outcomes" contains both.
 * Ties are broken by this order.
 */
const SIGNALS: { id: IntentId; strong: readonly string[]; weak: readonly string[] }[] = [
  {
    id: "facilitate",
    strong: [
      "workshop", "offsite", "off-site", "off site", "away day", "awayday", "planning day",
      "goal jam", "facilitate", "facilitating", "facilitation", "run a session",
      "running a session", "run a workshop", "team day", "planning session",
      "quarterly planning", "annual planning", "agenda", "breakout", "breakouts",
    ],
    weak: ["session", "workshop", "group", "room", "together", "leadership team", "offsite", "run"],
  },
  {
    id: "teach",
    strong: [
      "teach", "teaching", "educate", "educating", "convince", "convincing", "persuade",
      "persuading", "buy-in", "buy in", "bring them along", "bring along", "explain to",
      "get them to", "help them", "my boss", "my manager", "my peers", "my team",
      "my colleagues", "the pmo", "pmo", "stakeholders", "steering", "push back",
      "pushback", "conflate", "conflates", "conflating", "won't let", "don't get it",
      "doesn't get it", "obsessed with", "insist", "insists", "resistance", "resist",
      "coach my", "onboard my", "sell this",
    ],
    weak: [
      "boss", "manager", "leadership", "exec", "execs", "executive", "board", "governance",
      "portfolio", "peers", "colleagues", "team", "others", "everyone", "people", "they",
      "them", "training", "train", "culture", "language",
    ],
  },
  {
    id: "okrs",
    strong: [
      "okr", "okrs", "key result", "key results", "objective and key", "objectives and key",
      "kr", "krs", "mbo", "mbos", "objectives", "cascade", "cascading", "nest", "nested",
      "quarterly goals", "goal framework", "smart goals",
    ],
    weak: ["objective", "structure", "structured", "format", "shape", "template", "quarterly", "quarter", "align", "alignment"],
  },
  {
    id: "measure",
    strong: [
      "how do i measure", "what should i measure", "what do i measure", "kpi", "kpis",
      "leading indicator", "leading indicators", "lagging", "baseline", "baselines",
      "metric", "metrics", "how would i know", "how will i know", "how do we know",
      "no data", "can't measure", "cannot measure", "hard to measure", "unmeasurable",
      "quantify", "success criteria",
    ],
    weak: ["measure", "measures", "measurable", "target", "targets", "number", "numbers", "data", "track", "tracking", "report", "reporting"],
  },
  {
    id: "check",
    strong: [
      "tell me if", "is this a good", "is this good", "are these good", "are they good",
      "is it a good", "good outcome", "good outcomes", "good enough", "review this",
      "review my", "review these", "check this", "check my", "check these", "sense check",
      "sense-check", "critique", "feedback on", "score this", "score my", "rate this",
      "rate my", "sharpen", "improve this", "improve my", "make this better",
      "what's wrong with", "whats wrong with", "how good", "is this an output",
      "output or an outcome", "outcome or an output", "audit", "sanity check",
    ],
    weak: ["review", "check", "feedback", "assess", "assessment", "judge", "grade", "score", "better", "improve", "rewrite", "already", "drafted", "defined", "written"],
  },
  {
    id: "draft",
    strong: [
      "where do i start", "where to start", "don't know where", "do not know where",
      "from scratch", "blank page", "starting from nothing", "help me write",
      "help me draft", "write a goal", "write my goal", "write an outcome",
      "write some goals", "need a goal", "need goals", "new goal", "new goals",
      "set goals", "setting goals", "haven't got", "have not got", "no goal",
      "first time", "get started", "getting started",
    ],
    weak: ["write", "writing", "draft", "start", "vague", "fuzzy", "high level", "high-level"],
  },
];

/** Which teaching conversation this is, when the ask is about other people. */
function audienceFromText(text: string): "boss" | "pmo" | "peers" {
  const pmo = ["pmo", "portfolio", "governance", "steering", "steerco", "rag", "milestone", "milestones", "programme office", "program office", "reporting"];
  const boss = ["my boss", "boss", "my manager", "manager", "line manager", "exec", "execs", "executive", "leadership", "cfo", "ceo", "cto", "coo", "sponsor", "the board", "upwards"];
  if (pmo.some((t) => has(text, t))) return "pmo";
  if (boss.some((t) => has(text, t))) return "boss";
  return "peers";
}

const AUDIENCE_HEARD: Record<string, string> = {
  boss: "the person you need to bring along is your boss",
  pmo: "the function you need to bring along is the PMO",
  peers: "the people you need to bring along are your peers and team",
};

const AUDIENCE_LABEL: Record<string, string> = {
  boss: "Talking to your boss about outcomes",
  pmo: "Getting outcomes into the PMO",
  peers: "Teaching your team and peers",
};

// --- Routes ------------------------------------------------------------------

function coachRoute(text: string): Route {
  return {
    href: `/coach?outcome=${encodeURIComponent(text)}`,
    label: "Score it with the Outcome Coach",
    note: "Your words, checked against each outcome principle in turn: what's working, what's missing, and the next step for each gap.",
  };
}

const PRINCIPLES_ROUTE: Route = {
  href: "/principles",
  label: "The outcome principles",
  note: "The standard everything here is checked against. Seven principles, one page.",
};

const CANVAS_ROUTE: Route = {
  href: "/templates",
  label: "The SSH Outcome Canvas",
  note: "One page from the problem you can see to the outcome you're betting on. Blank, plus the same canvas filled in.",
};

const OKR_ROUTE: Route = {
  href: "/okrs",
  label: "OKRs, the SSH way",
  note: "The Objective is the bet, the Key Results are the feedback — with the format, the 3Ms, and OK versus NOT OK examples.",
};

const SKILLS_ROUTE: Route = {
  href: "/skills",
  label: "Coaching skills for your AI",
  note: "Drop one into Claude or any assistant and it becomes a better-goals coach for as long as you need it.",
};

/** Only send a draft to the coach when there is enough of one to review. */
function coachIfDraft(text: string): Route[] {
  return wordCount(text) >= PASTED_A_GOAL_WORDS ? [coachRoute(text)] : [];
}

// --- The intents -------------------------------------------------------------

const INTENTS: Record<IntentId, Intent> = {
  check: {
    id: "check",
    heard: "you have a draft already, and you want to know whether it is any good",
    heading: "Let's check what you've got",
    guidance:
      "The fastest way to improve a goal you have already written is to find out which parts of it are doing work and which parts only sound like they are. The Outcome Coach reads your draft against each principle and quotes your own words back to you, so nothing it claims to have seen is invented.",
    questions: [
      "If we achieved every word of this and nothing was different for anyone, would we still call it a success?",
      "Who exactly is better off, and what is hard for them today?",
      "What is the number today, what should it be, and by when?",
    ],
    steps: [
      "Paste the draft into the Outcome Coach and read the gaps in order — biggest first.",
      "Close one gap, not all of them. A goal that is meaningfully clearer today beats a perfect one next quarter.",
      "Show the rewritten version to one person who wasn't in the room and ask them what would change in the world if it happened.",
    ],
    skill: {
      file: "outcome-vs-output-check.md",
      name: "outcome-vs-output-check",
      why: "a fast second opinion on whether a goal is an outcome or an output, with a sharper version suggested",
    },
    promptWant:
      "to know whether what I have written is an outcome or an output, where it is weakest, and what to change first",
    route: (text) => ({
      primary: coachRoute(text),
      also: [PRINCIPLES_ROUTE, CANVAS_ROUTE],
    }),
  },

  okrs: {
    id: "okrs",
    heard: "you want what you're trying to achieve in Objective and Key Result shape",
    heading: "Let's get this into OKR shape",
    guidance:
      "In the Sooner Safer Happier pattern the Objective is the bet you are placing — an outcome hypothesis, not a deliverable — and the Key Results are the feedback: three or four leading indicators so you can pivot early, plus one lagging indicator for the impact itself. Start from the outcome, then let the OKR format carry it.",
    questions: [
      "What is the bet here — what do you believe will happen, and why?",
      "Which single number would move first if the bet were working?",
      "Which number would show the impact actually landed, and when would you expect to see it?",
    ],
    steps: [
      "Write the Objective as the change, not the work: the outcome you're betting on, in a sentence anyone could repeat.",
      "Add 3–4 leading indicators you could read within weeks, and exactly one lagging indicator. Stop at five.",
      "Run the whole thing through the Outcome Coach before you share it — an OKR with no baseline is a wish in a table.",
    ],
    skill: {
      file: "ssh-okr-pattern.md",
      name: "ssh-okr-pattern",
      why: "drafting, nesting and critiquing OKRs in the SSH pattern against the SSH checklist",
    },
    promptWant:
      "to turn what I'm trying to achieve into one Objective and three to five Key Results in the Sooner Safer Happier pattern",
    route: (text) => ({
      primary: { ...OKR_ROUTE, label: "Write one, the SSH way", href: "/okrs#write-one" },
      also: [CANVAS_ROUTE, ...coachIfDraft(text), PRINCIPLES_ROUTE].slice(0, 3),
    }),
  },

  measure: {
    id: "measure",
    heard: "the goal exists, and the open question is how you would know it worked",
    heading: "Let's find the measure",
    guidance:
      "Measurement is where most goals quietly fall over: either there is no number at all, or there are fifteen. You need two — one leading indicator that moves in weeks so you can steer, and one lagging indicator that shows the impact landed. Each needs a baseline, a target and a date, and an honest \"we don't measure this yet\" is a finding rather than a blocker.",
    questions: [
      "What would you see in the next few weeks if this were working — before any of the big numbers move?",
      "What is that number today? If nobody knows, is finding out the first piece of work?",
      "What would this measure make people do, and are you happy for them to do it?",
    ],
    steps: [
      "Name one leading and one lagging measure. Resist the third.",
      "Write each in the SSH shape: verb, measure, from x to y, by when.",
      "Pair anything with a target attached with a guardrail measure, so moving it can't quietly break something else.",
    ],
    skill: {
      file: "ssh-okr-pattern.md",
      name: "ssh-okr-pattern",
      why: "picking leading and lagging measures and checking them against the SSH OKR checklist",
    },
    promptWant:
      "to choose one leading and one lagging measure for this, with a baseline, target and timeframe I can defend",
    route: (text) => ({
      primary: {
        ...OKR_ROUTE,
        label: "Leading and lagging measures",
        note: "The 3Ms and the leading/lagging split: how many measures, of what kind, and what an OK one looks like next to a NOT OK one.",
      },
      also: [CANVAS_ROUTE, ...coachIfDraft(text), PRINCIPLES_ROUTE].slice(0, 3),
    }),
  },

  teach: {
    id: "teach",
    heard: "your own thinking is not the blocker — the people around you are still working in outputs",
    heading: "Let's bring them along",
    guidance:
      "Nobody asks for outputs because they enjoy them. They ask because that is what they are measured on, and an outcome sounds like being asked to promise something vaguer to somebody else. So don't argue the theory: bring one real goal, show both versions, and offer them something safer to commit to than a date.",
    questions: [
      "What is this person actually measured on, and what would they lose if your version won?",
      "Which version of this outcome makes their job easier rather than harder?",
      "What is the smallest thing you could ask them for — and is \"what's the baseline?\" it?",
    ],
    steps: [
      "Pick one real goal they care about this quarter. Never a tidy example, and never someone else's goal held up for correction.",
      "Show the output as it is written today next to the outcome underneath it, and ask which one they would rather report on.",
      "Ask for exactly one thing: agreement on what the number is today.",
    ],
    skill: {
      file: "teaching-outcomes-to-others.md",
      name: "teaching-outcomes-to-others",
      why: "rehearsing the conversation, including the objections you'll actually hear",
    },
    promptWant:
      "to bring someone else along — to have a conversation that leaves them writing outcomes, without it becoming a fight about frameworks",
    route: (text) => {
      const audience = audienceFromText(text);
      const draft = wordCount(text) >= PASTED_A_GOAL_WORDS ? `&outcome=${encodeURIComponent(text)}` : "";
      return {
        heard: `your own thinking is not the blocker — ${AUDIENCE_HEARD[audience]}`,
        primary: {
          href: `/teach?for=${audience}${draft}`,
          label: AUDIENCE_LABEL[audience],
          note: "The opener, the moves, the objections you'll hear and what to say back — plus a prompt for rehearsing it before you do it for real.",
        },
        also: [SKILLS_ROUTE, ...coachIfDraft(text), PRINCIPLES_ROUTE].slice(0, 3),
      };
    },
  },

  facilitate: {
    id: "facilitate",
    heard: "you're getting a group in a room to write goals together",
    heading: "Let's plan the session",
    guidance:
      "Sessions about goals fail when they become a course. They work when the room rewrites a goal it recognises. Bring real goals — starting with one of your own that you know is output-shaped — put the bad version up first, and leave with one commitment each rather than a template rollout.",
    questions: [
      "Whose real goals are going on the wall, and have you got permission to use them?",
      "Which goal in the room has the most energy behind it? That's the one to rewrite together.",
      "What would have to be true, a week later, for this to have been worth an hour of everyone's time?",
    ],
    steps: [
      "Book an hour, not a day, and bring three real goals — one of them yours.",
      "Run the 60-minute agenda: why we're here, the one question, rewrite one goal together, check it out loud, one commitment each.",
      "Print the canvas at A3 for the wall, and send everyone away with one artefact rather than notes.",
    ],
    skill: {
      file: "goal-jam-facilitator.md",
      name: "goal-jam-facilitator",
      why: "designing and running the session, including what to do when the room goes quiet",
    },
    promptWant:
      "to design and run a short session where a group rewrites a few of their own real goals as outcomes",
    route: () => ({
      primary: {
        href: "/teach?for=peers",
        label: "The 60-minute session",
        note: "A run sheet for the hour, the pitfalls that make it feel like training, and the signals that tell you it landed.",
      },
      also: [CANVAS_ROUTE, SKILLS_ROUTE, PRINCIPLES_ROUTE],
    }),
  },

  draft: {
    id: "draft",
    heard: "you're starting close to a blank page",
    heading: "Let's start it properly",
    guidance:
      "A blank page is the best place to be, because nothing has to be defended yet. Start with the customer and the problem rather than the goal: who this is for, and what is hard for them today. The outcome is what changes for them — the work you'll do to get there comes last, and belongs to the team.",
    questions: [
      "Who is this for, and what is hard for them today?",
      "What would be different for them if this worked — and how would you notice?",
      "What do you believe will cause that change? That belief is your bet.",
    ],
    steps: [
      "Fill in the top two boxes of the Outcome Canvas only: the problem statement and the outcome hypothesis.",
      "Say it out loud in one sentence: for «who», «what changes», so that «why it matters».",
      "Bring the rough version back through the Outcome Coach. First drafts are meant to score badly.",
    ],
    skill: {
      file: "writing-better-goals.md",
      name: "writing-better-goals",
      why: "being coached through a first draft, one question at a time",
    },
    promptWant:
      "to get from a vague ambition to a first outcome I could show someone, without you writing it for me",
    route: (text) => ({
      primary: CANVAS_ROUTE,
      also: [PRINCIPLES_ROUTE, ...coachIfDraft(text), SKILLS_ROUTE].slice(0, 3),
    }),
  },
};

/**
 * A prompt for taking the ask to an AI coach — with a community skill attached,
 * so the answer arrives in this community's language rather than the internet's.
 */
export function buildAskPrompt(intent: Intent, text: string): string {
  return [
    "I'm working on goals and outcomes and I want coaching, not a rewrite.",
    "",
    "What I'm trying to achieve, in my own words:",
    '"""',
    text,
    '"""',
    "",
    `What I want from you: ${intent.promptWant}.`,
    "",
    "Questions I'm already sitting with:",
    ...intent.questions.map((q) => `- ${q}`),
    "",
    "Use the bettergoals.ai outcome principles as the standard: start with customer and problem;",
    "outcomes over outputs; treat the outcome as a hypothesis; measure movement and impact with a",
    "baseline, target and timeframe; connect it to strategy and value; and write it so anyone can",
    "understand it.",
    "",
    `If you can load files, the skill for this is ${SITE.url}/skills/${intent.skill.file}.`,
    "",
    "Ask me one question at a time. Don't invent baselines, targets or facts I haven't given you —",
    "if something is missing, ask. Where a template would help, give me the shape and let me fill it in.",
    "I want to leave owning this, not holding something you wrote.",
  ].join("\n");
}

function build(text: string, id: IntentId, guessed: boolean): Ask {
  const intent = INTENTS[id];
  const { primary, also, heard } = intent.route(text);

  return {
    text,
    intent,
    heard: heard ?? intent.heard,
    primary,
    also,
    prompt: buildAskPrompt(intent, text),
    guessed,
  };
}

/**
 * Read one sentence and decide what to do about it. Returns `null` when there
 * isn't enough to route on — better to ask again than to guess at two words.
 */
export function routeAsk(input: string): Ask | null {
  const text = input.trim().slice(0, MAX_INPUT_LENGTH);
  if (wordCount(text) < MIN_WORDS) return null;

  const t = text.toLowerCase();
  const best = SIGNALS.map((s) => ({ id: s.id, ...score(t, s.strong, s.weak) })).reduce(
    (top, s) => (s.points > top.points ? s : top),
    { id: "draft" as IntentId, points: 0, certain: false }
  );

  // No unmistakable ask, only stray words: a long paste is a goal somebody
  // wants checked, a short one is closer to a blank page. Say it's a guess.
  const guessed = !best.certain;
  const id = guessed ? (wordCount(text) >= PASTED_A_GOAL_WORDS ? "check" : "draft") : best.id;

  return build(text, id, guessed);
}

/** The same, but you told us which route you wanted. */
export function routeAskAs(input: string, id: string | undefined): Ask | null {
  const text = input.trim().slice(0, MAX_INPUT_LENGTH);
  if (wordCount(text) < MIN_WORDS) return null;
  if (!id || !(id in INTENTS)) return routeAsk(text);
  return build(text, id as IntentId, false);
}

/** The routes, in the order a person would think of them. For "not what I meant". */
export const INTENT_CHOICES: { id: IntentId; label: string }[] = [
  { id: "draft", label: "Help me write one" },
  { id: "check", label: "Check what I've written" },
  { id: "okrs", label: "Put it into OKRs" },
  { id: "measure", label: "Choose the measures" },
  { id: "teach", label: "Bring other people along" },
  { id: "facilitate", label: "Run a session with my team" },
];

/** Example asks, so the box is useful before you've typed anything. */
export const EXAMPLE_ASKS = [
  "I have a high level goal, help me structure this as OKRs",
  "I think I have defined outcomes, tell me if they're good outcomes",
  "My peers continually conflate outputs with outcomes, help me educate them on how to write impactful outcomes",
  "I'm starting from a blank page and don't know where to start",
  "My boss wants a delivery date and I want to talk about impact",
  "I'm running a planning session next week and want the team to write better goals",
];

export function intentFor(id: IntentId): Intent {
  return INTENTS[id];
}
