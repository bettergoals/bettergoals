/**
 * The front door.
 *
 * One box: you say what you're trying to achieve, in your own words, and this
 * works out which of the site's paths answers it — then hands back the next
 * steps, the questions to sit with, and a prompt you can paste into any AI.
 *
 * Like the Outcome Coach, it is deterministic keyword matching, not an AI, and
 * the page says so plainly. It never invents an answer: every step it offers
 * points at a page, template or skill that already exists on this site, and it
 * shows you the words it matched on so you can tell when it has read you wrong.
 */

import { MAX_INPUT_LENGTH } from "./outcomeCoach";
import { SITE } from "./config";

export type AskLink = { href: string; label: string };

export type AskStep = {
  title: string;
  text: string;
  /** Where this step happens. `{draft}` in the href is replaced with the goal. */
  link?: AskLink;
};

export type Path = {
  id: string;
  /** Short label, for the "did you mean" chips. */
  label: string;
  /** What we think you're trying to do. */
  heading: string;
  blurb: string;
  steps: AskStep[];
  /** The coaching, not the correction. */
  questions: string[];
  /** What to ask an AI for, once you've got this far. */
  promptAsk: string[];
  /** The downloadable skill that fits this path, if there is one. */
  skill?: { file: string; name: string };
  /** Words that all but settle it. Worth three of the ordinary ones. */
  strongTerms: readonly string[];
  /** Words that lean this way. */
  terms: readonly string[];
};

/** A goal draft placeholder inside a step link, filled in per person. */
const DRAFT = "{draft}";

export const PATHS: Path[] = [
  {
    id: "check",
    label: "Check what I've written",
    heading: "You want to know whether what you've written is any good",
    blurb:
      "Start with the check rather than the rewrite. Most drafts are closer than they feel — they're usually missing one thing, and it's rarely the thing people expect.",
    steps: [
      {
        title: "Score the draft against the principles",
        text: "Seven checks: a named customer and their problem, a change rather than a deliverable, real measures, a baseline and a target, the bet you're making, the “so what”, and plain language. You'll get what's working, what's missing, and what to do first.",
        link: { href: `/coach?outcome=${DRAFT}`, label: "Run the check on this →" },
      },
      {
        title: "Fix the biggest gap first, not all of them",
        text: "A goal that is meaningfully clearer today beats a perfect one next quarter. Take the top gap, rewrite one sentence, and run the check again.",
      },
      {
        title: "Read the check against the source",
        text: "Every check is one of the outcome definition principles the community agreed. If you disagree with a verdict, the principle is the thing to argue with.",
        link: { href: "/principles", label: "The principles →" },
      },
    ],
    questions: [
      "If this goal landed perfectly, who would notice — and what would they be doing differently?",
      "Is what you've written a change in the world, or a thing you'll have finished?",
      "What number is different in three months, and what is it today?",
    ],
    promptAsk: [
      "Tell me, honestly, whether this is an outcome or an output — and which parts are which.",
      "Name the single biggest gap and why it matters more than the others.",
      "Give me two or three coaching questions I should sit with before I rewrite it.",
    ],
    skill: { file: "outcome-vs-output-check.md", name: "outcome-vs-output-check" },
    strongTerms: [
      "good outcome", "good outcomes", "good goal", "good goals", "is this", "are these",
      "tell me if", "sense check", "sanity check", "critique", "feedback", "review my",
      "review this", "score", "rate", "assess", "any good", "check my", "check this",
      "am i", "have i",
    ],
    terms: [
      "review", "check", "improve", "sharper", "better", "rewrite", "tighten", "wrong",
      "strong enough", "draft", "written", "wrote", "defined", "quality", "test",
    ],
  },
  {
    id: "okrs",
    label: "Turn it into OKRs",
    heading: "You want to turn an ambition into Objectives and Key Results",
    blurb:
      "The OKR is the last step, not the first. Get the outcome honest first, and the objective and key results mostly write themselves — in the SSH pattern the objective is your bet, and the key results are how you'd see it landing.",
    steps: [
      {
        title: "Get the outcome clear before the format",
        text: "An OKR wrapped around a vague ambition is a vague ambition with more boxes. Run what you have through the check first — it takes a minute.",
        link: { href: `/coach?outcome=${DRAFT}`, label: "Check the outcome first →" },
      },
      {
        title: "Use the SSH OKR pattern",
        text: "One objective written as an outcome hypothesis, three to five key results, most of them leading indicators you'll see within weeks and one lagging indicator that confirms the value. There's a worked good one and a worked bad one.",
        link: { href: "/okrs#write-one", label: "Write one, step by step →" },
      },
      {
        title: "Fill the canvas with the people doing the work",
        text: "The Outcome Canvas takes a team from the problem they can see to the bet they're making, on one page. It's the input to the OKR, and it's the artefact that stops the OKR being written alone.",
        link: { href: "/templates", label: "Get the Outcome Canvas →" },
      },
    ],
    questions: [
      "What's the bet? “We believe that ___ will result in ___” — say it out loud before you format it.",
      "Which of your key results would move within weeks, not at the end of the quarter?",
      "If you hit every key result and the objective still felt hollow, what did you leave out?",
    ],
    promptAsk: [
      "Help me shape this into one objective and three to five key results in the Sooner Safer Happier pattern.",
      "Keep the objective as an outcome hypothesis, not a deliverable, and make most of the key results leading indicators.",
      "Where I've given you an output, say so and ask me what it's in service of instead of quietly rewriting it.",
    ],
    skill: { file: "ssh-okr-pattern.md", name: "ssh-okr-pattern" },
    strongTerms: [
      "okr", "okrs", "objective", "objectives", "key result", "key results",
      "structure this", "structure it", "structure them", "structure my", "turn this into",
      "turn it into", "shape this", "shape it",
    ],
    terms: [
      "structure", "quarterly", "quarter", "cascade", "nested", "nest", "align",
      "alignment", "goal setting", "goal-setting", "planning", "annual", "high level",
      "high-level", "break down", "break it down", "format", "write", "writing", "draft",
    ],
  },
  {
    id: "teach",
    label: "Bring other people with me",
    heading: "You want to bring somebody else along",
    blurb:
      "Your goal isn't the constraint — other people's incentives are. The person still asking for outputs is under real pressure to produce them, so the job is to offer them something safer to promise, not to explain harder.",
    steps: [
      {
        title: "Pick the conversation you're actually having",
        text: "Your boss, the PMO and your peers are three different problems. Each one has an opener that doesn't start a fight, the objections you'll really hear, and something to say back in one breath.",
        link: { href: "/teach", label: "Open Teach outcomes →" },
      },
      {
        title: "Rehearse it before you have it",
        text: "There's a ready-made prompt that plays the other person — sceptical, well-intentioned, under pressure — so the first time you make the argument isn't in the room.",
        link: { href: "/teach#rehearse-heading", label: "Rehearse the conversation →" },
      },
      {
        title: "Bring one real goal, not a philosophy",
        text: "Rewriting the goal they care about most, in front of them, teaches more than any explanation of outcomes over outputs — and it can't be filed for later.",
        link: { href: `/coach?outcome=${DRAFT}`, label: "Sharpen the goal you'll bring →" },
      },
    ],
    questions: [
      "What is this person promising to somebody else, and what would make that promise safer rather than vaguer?",
      "What would you accept as the smallest sign it landed — given “they agreed” isn't one?",
      "Are you asking them to drop the deliverable, or to change what “done” means? Which one do they think you're asking?",
    ],
    promptAsk: [
      "Play the person I need to bring along: intelligent, well-intentioned, and under real pressure to show outputs.",
      "Push back on me the way they actually would, one objection at a time, and let me practise the reply.",
      "Afterwards, tell me which of my answers would have landed and which sounded like theory.",
    ],
    skill: { file: "teaching-outcomes-to-others.md", name: "teaching-outcomes-to-others" },
    strongTerms: [
      "my boss", "my manager", "pmo", "my peers", "peers", "stakeholders", "exec",
      "execs", "executive", "leadership", "steering", "convince", "persuade", "buy-in",
      "buy in", "educate", "bring them", "bring along", "push back", "pushback",
      "conflate", "sceptical", "skeptical", "influence",
    ],
    terms: [
      "colleagues", "others", "everyone else", "explain", "teach", "training", "sell",
      "argue", "argument", "resistance", "board", "sponsor", "portfolio", "finance",
      "they want", "they keep", "they insist", "culture",
    ],
  },
  {
    id: "measure",
    label: "Work out what to measure",
    heading: "You want measures that mean something",
    blurb:
      "Measurement is where good intentions go quiet. The trick isn't more metrics — it's one number that would genuinely change your mind, with a baseline you can state today.",
    steps: [
      {
        title: "Separate the early signal from the confirmation",
        text: "Leading indicators tell you within weeks whether the bet is working; a lagging indicator confirms the value actually landed. Most goals have plenty of the second and none of the first.",
        link: { href: "/okrs#write-one", label: "Leading and lagging, worked through →" },
      },
      {
        title: "Say the baseline out loud",
        text: "“Improve customer satisfaction” hides the fact that nobody knows today's number. The check will tell you whether yours has a baseline, a target and a timeframe, or only an ambition.",
        link: { href: `/coach?outcome=${DRAFT}`, label: "Check the measures in this →" },
      },
      {
        title: "Know when it's a KPI, not a key result",
        text: "Health metrics you watch forever aren't the same as the handful of numbers you're deliberately trying to move this quarter. Mixing them is why OKR sets sprawl.",
        link: { href: "/okrs", label: "OKRs and KPIs, side by side →" },
      },
    ],
    questions: [
      "What's the number today? If nobody knows, is finding out the first key result?",
      "Which measure would make you stop and change course if it didn't move?",
      "Could you hit this measure and make things worse for the customer? What guards against that?",
    ],
    promptAsk: [
      "Help me find two or three measures for this: mostly leading indicators, one that confirms the value landed.",
      "For each one, ask me for today's baseline instead of assuming a number.",
      "Tell me how each measure could be gamed, and what I'd watch to notice.",
    ],
    skill: { file: "writing-better-goals.md", name: "writing-better-goals" },
    strongTerms: [
      "measure", "measures", "measuring", "measurement", "metric", "metrics", "kpi",
      "kpis", "indicator", "indicators", "baseline", "how do we know", "how will we know",
      "how do i know", "success criteria", "leading", "lagging", "quantify",
    ],
    terms: [
      "target", "targets", "number", "numbers", "data", "track", "tracking", "evidence",
      "signal", "signals", "progress", "report", "reporting", "dashboard", "prove",
    ],
  },
  {
    id: "session",
    label: "Run a session with my team",
    heading: "You want to run a session and come out with better goals",
    blurb:
      "Goals written alone get complied with; goals written together get owned. A session works when the group does the thinking and you hold the shape.",
    steps: [
      {
        title: "Take the facilitator's script",
        text: "The goal jam skill runs a 45–90 minute session: frame it, draft badly and fast, challenge in pairs, converge on a small set. Hand it to any AI, or read it as a plan.",
        link: { href: "/skills", label: "Get the goal jam skill →" },
      },
      {
        title: "Print the canvas for the wall",
        text: "One page per goal, four boxes: the problem you can see, the bet, the early signals and the confirmation. Print it A3 and the argument happens over the paper rather than in a document nobody opens again.",
        link: { href: "/templates", label: "Get the Outcome Canvas →" },
      },
      {
        title: "Borrow the agenda for a teaching session",
        text: "If the group is new to outcomes, there's a ready-made session shape — and the pitfalls that quietly ruin these sessions.",
        link: { href: "/teach#session-heading", label: "The session agenda →" },
      },
    ],
    questions: [
      "Who has to be in the room for the result to stick — and who will quietly veto it afterwards if they aren't?",
      "What's the one decision you want made by the end? If there isn't one, it's a workshop about workshops.",
      "How will the group challenge each other's drafts without it becoming your opinion versus theirs?",
    ],
    promptAsk: [
      "Help me plan a goal-setting session for my team: agenda, timings, and what I say at each step.",
      "Tell me what to do when the group drifts into listing deliverables, because they will.",
      "Give me the two or three questions that do the most work in the room.",
    ],
    skill: { file: "goal-jam-facilitator.md", name: "goal-jam-facilitator" },
    strongTerms: [
      "workshop", "facilitate", "facilitating", "facilitation", "offsite", "off-site",
      "away day", "awayday", "goal jam", "planning session", "planning day", "agenda",
      "run a session", "session with", "get the team together", "quarterly planning",
    ],
    terms: [
      "session", "together", "group", "team day", "kick off", "kick-off", "kickoff",
      "collaborate", "co-create", "workshopping", "meeting", "run", "plan",
    ],
  },
  {
    id: "learn",
    label: "Get the idea straight",
    heading: "You want the idea itself to be clear before you use it",
    blurb:
      "Worth ten minutes. Nearly every argument about goals downstream is really an unresolved argument about what an outcome is and why it's worth the discomfort.",
    steps: [
      {
        title: "Read the principles",
        text: "Short, opinionated, and agreed by this community: what an outcome is, what an output is, and how to tell which one you've written. Everything else on this site is downstream of these.",
        link: { href: "/principles", label: "Read the principles →" },
      },
      {
        title: "Try it on a real goal, not a tidy example",
        text: "The distinction only lands when it's your own goal being called an output. Paste one you're working on — a rough one is fine.",
        link: { href: `/coach?outcome=${DRAFT}`, label: "Try it on this →" },
      },
      {
        title: "Keep a check in your pocket",
        text: "The outcome-vs-output skill gives any AI a fast verdict-and-rewrite routine, so you can sanity-check a goal wherever you are.",
        link: { href: "/skills", label: "Browse the skills →" },
      },
    ],
    questions: [
      "Think of a goal you're proud of: is it something you'll have finished, or something that will be different?",
      "Whose life gets better if it lands? Can you name them without using the word “business”?",
      "What would you have to stop doing if you took the outcome seriously?",
    ],
    promptAsk: [
      "Explain the difference between outcomes and outputs using my own example, not a generic one.",
      "Then show me what my example looks like rewritten as an outcome, and tell me what you had to assume.",
      "Ask me the questions I'd need to answer to fill those assumptions in myself.",
    ],
    skill: { file: "outcome-vs-output-check.md", name: "outcome-vs-output-check" },
    strongTerms: [
      "what is an outcome", "what is a good outcome", "what's an outcome",
      "difference between", "outcome vs", "outcomes vs", "output vs", "outputs vs",
      "versus", "new to this", "never done", "where do i start", "where to start",
      "getting started", "what does good look like", "explain outcomes",
    ],
    terms: [
      "learn", "understand", "definition", "define", "principles", "philosophy", "why",
      "beginner", "basics", "introduction", "intro", "confused", "outputs", "output",
    ],
  },
];

/** The examples on the box, so the page is useful before you've typed anything. */
export const EXAMPLE_ASKS = [
  "I have a high level goal, help me structure this as OKRs",
  "I think I have defined outcomes, tell me if they’re good outcomes",
  "My peers continually conflate outputs with outcomes, help me educate them",
  "I don’t know what we should measure to know this is working",
  "I’m running a planning session with my team next week",
];

function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Every term from the list that appears in the text, as whole words. */
function hits(text: string, terms: readonly string[]): string[] {
  const found: string[] = [];
  for (const term of terms) {
    const pattern = new RegExp(`(?:^|[^a-z0-9-])${escapeRegExp(term)}(?![a-z0-9])`, "i");
    if (pattern.test(text)) found.push(term);
  }
  return found;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** A word or two of what you asked for is not enough to route on. */
const MIN_WORDS = 3;

/** A strong term is worth this many ordinary ones. */
const STRONG_WEIGHT = 3;

/**
 * The part of the ask that reads like the goal itself, so the Outcome Coach
 * gets the draft rather than the request wrapped around it. Conservative on
 * purpose: if splitting would leave too little, the whole text goes through.
 */
export function goalDraft(input: string): string {
  const text = input.trim();
  const afterBreak = text.split(/\n{1,}/).slice(1).join("\n").trim();
  if (wordCount(afterBreak) >= 6) return afterBreak;

  const colon = text.indexOf(":");
  if (colon > -1) {
    const afterColon = text.slice(colon + 1).trim();
    if (wordCount(afterColon) >= 6) return afterColon;
  }
  return text;
}

/** Which Teach audience the words point at, for a prefilled deep link. */
export function teachAudience(text: string): "boss" | "pmo" | "peers" {
  const t = text.toLowerCase();
  if (hits(t, ["pmo", "portfolio", "governance", "steering", "programme office", "program office", "reporting"]).length > 0) {
    return "pmo";
  }
  if (hits(t, ["boss", "manager", "my lead", "exec", "execs", "executive", "leadership", "sponsor", "director", "cfo", "ceo", "cto"]).length > 0) {
    return "boss";
  }
  return "peers";
}

/** A prompt to paste into any AI, carrying your own words with it. */
export function buildAskPrompt(path: Path, text: string): string {
  const lines = [
    "You're coaching me using the Sooner Safer Happier approach to goals: better value, sooner, safer, happier — outcomes over outputs.",
    "",
    "Here's what I'm trying to do, in my own words:",
    `“${text.trim()}”`,
    "",
    ...path.promptAsk.map((ask) => `- ${ask}`),
    "",
    "Ask me one question at a time. Don't invent numbers, baselines or facts I haven't given you — if something's missing, ask me for it. I want to leave owning the answer, not holding one you wrote.",
  ];
  if (path.skill) {
    lines.push(
      "",
      `If you can read from the web, use the “${path.skill.name}” skill at ${SITE.url}/skills/${path.skill.file} as your guide.`
    );
  }
  return lines.join("\n");
}

export type AskResult = {
  /** What you typed, trimmed and capped. */
  text: string;
  /** The path that fits best, or null when nothing matched clearly. */
  path: Path | null;
  /** The words it matched on — so you can see when it's read you wrong. */
  matched: string[];
  /** The other paths, in the order they scored. */
  alternatives: Path[];
  /** The goal-shaped part of the ask, for handing to the Outcome Coach. */
  draft: string;
  /** Ready-to-paste prompt for the chosen path. */
  prompt: string;
  /** Deep link into Teach for the audience the words point at. */
  teachHref: string;
  /** True when there's enough here to say anything useful. */
  enough: boolean;
};

/** Work out what someone is asking for, from one box of free text. */
export function route(input: string): AskResult {
  const text = input.trim().slice(0, MAX_INPUT_LENGTH);
  const draft = goalDraft(text);
  const audience = teachAudience(text);
  const enough = wordCount(text) >= MIN_WORDS;

  const scored = PATHS.map((path) => {
    const strong = enough ? hits(text, path.strongTerms) : [];
    const ordinary = enough ? hits(text, path.terms) : [];
    return {
      path,
      score: strong.length * STRONG_WEIGHT + ordinary.length,
      matched: [...strong, ...ordinary],
    };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  const chosen = best.score > 0 ? best : null;

  return {
    text,
    path: chosen?.path ?? null,
    matched: chosen?.matched ?? [],
    alternatives: scored.filter((s) => s.path.id !== chosen?.path.id).map((s) => s.path),
    draft,
    prompt: chosen ? buildAskPrompt(chosen.path, text) : "",
    teachHref: `/teach?for=${audience}&outcome=${encodeURIComponent(draft)}`,
    enough,
  };
}

/** Fill a step's link with this person's own draft. */
export function stepHref(href: string, draft: string): string {
  return href.replace(DRAFT, encodeURIComponent(draft));
}

/** A link back into the box with an example already typed. */
export function askHref(ask: string): string {
  return `/?ask=${encodeURIComponent(ask)}`;
}
