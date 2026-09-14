/**
 * The column, as a voice conversation — idea #124.
 *
 * "◉ Talk to me" used to buy you the browser's own speech synthesis and speech
 * recognition: the printed question read out, one answer listened for, and no
 * coach anywhere in it (see `app/coach/entry/SayIt.tsx`). The goal jam, by
 * contrast, has had a real voice coach since it was built. This module is what
 * closes that gap — it describes the column to the voice model in the shape the
 * model needs, and nothing else.
 *
 * Three things live here, and they are deliberately the same three things:
 *
 *  - `turnFor()` — where the conversation is and what the coach asks next. The
 *    *same* decision the column makes when it renders, made from the same run
 *    and the same coaching, so the voice and the page can never be asking two
 *    different questions.
 *  - `COLUMN_TOOLS` — how an answer gets from the coach's ears onto the canvas.
 *    One tool, `answer`, carrying the field and the leader's own words; plus
 *    `hand_over`, because "stop talking" has to work as a sentence and not only
 *    as a button.
 *  - `columnCoachInstructions()` — who the coach is while it runs this.
 *
 * ## Who owns what
 *
 * The route is the column's; the wording is the coach's. `turnFor()` says which
 * box the conversation is in, because `readCoaching` reads the run in that
 * order and an answer landed out of turn would be dropped. Everything else —
 * how the question is asked, what is worth following up, when an answer is thin,
 * when a phrase from three boxes ago needs sharpening — belongs to the coach,
 * which is what CARD A contract 2 means by "the coach follows that order and
 * does what it needs to".
 *
 * It read as a form being read aloud when the note handed over an exact
 * sentence and the brief said never to deviate from it. The note now gives the
 * intent of the box and the brief says the wording is the coach's.
 *
 * What it deliberately does not do:
 *  - it does not decide the route. The order of the boxes, the jump past ④, the
 *    double-back to ① — all of that is `readCoaching`/`canvasFor`'s, which is to
 *    say the deck's. This reads that state; it never forms an opinion.
 *  - it does not persist. The model is handed the conversation each turn
 *    because the query string is still the only place any of it lives.
 *  - it does not touch a secret or the network. The route mints the session;
 *    this only says what the session is for.
 *
 * Source: `docs/reference/card-a.md` and slides 3–16 of
 * `docs/reference/voice-coach-deck.md`, same as the column itself.
 */

import { CANVAS_ORDER } from "./canvas";
import {
  ANSWER_MAX,
  DONT_KNOW,
  DONT_KNOW_ANSWER,
  canvasFor,
  canvasText,
  columnHref,
  readCoaching,
  type CanvasState,
  type Coaching,
} from "./coaching";
import { nudgeFor } from "./nudge";
import {
  BROUGHT_ANSWERS,
  BROUGHT_MAX,
  SHARE_ANSWERS,
  WHO_ANSWERS,
  WHO_QUESTION,
  broughtQuestion,
  matchSpoken,
  readRun,
  shareQuestion,
  type Run,
} from "./triage";

/**
 * The coach's own questions, once.
 *
 * They are printed in the column as the label of the field you answer them in,
 * and — since #121 — read out loud. Now they are also what the voice coach is
 * told to ask, so they live here rather than inline in the markup: one string,
 * said once and printed once, so what you hear and what you can see can never
 * drift apart. `lib/triage.ts` holds the triage four for the same reason.
 */
export const COACH_ASKS = {
  centre: "Who is this for, and what would they be doing differently?",
  problem: "Due to what? What's in their way today?",
  lagging: "How would you know it landed? What would convince a sceptic?",
  whoKnows: "Who would know? And has anyone ever been able to tell whether this got better?",
  centreAgain: "What would they actually be doing, on a Tuesday?",
  hypothesis: "What's the bet, and which of those numbers should move?",
  leading: "What tells us in weeks?",
  back: "Can I take you back a step? I don't think the problem is here.",
  out: "Where do you want to leave this?",
} as const;

/** Every field an answer can land in. The `answer` tool's enum. */
export const ANSWER_FIELDS = [
  "who",
  "brought",
  "share",
  "centre",
  "problem",
  "lagging",
  "whoKnows",
  "back",
  "centreAgain",
  "hypothesis",
  "leading",
  "nudge",
  "out",
] as const;

export type AnswerField = (typeof ANSWER_FIELDS)[number];

/**
 * An answer that isn't the leader's own words. Structurally what a
 * `TriageAnswer` already is, minus the two things only the chips need — so the
 * triage arrays can be handed straight to `turnFor` without being restated.
 */
export type Choice = { value: string; label: string; phrases: string[] };

/** Slide 9's two answers to "can I take you back a step?" */
const BACK_CHOICES: readonly Choice[] = [
  { value: "yes", label: "Go on then", phrases: ["go on", "go on then", "yes", "yeah", "okay", "ok", "sure", "please do"] },
  {
    value: "no",
    label: "I'd rather push on",
    phrases: ["push on", "rather push on", "no", "nope", "carry on", "keep going", "move on"],
  },
];

/** Slide 14. Whether they want the gap drawn as well as said. */
const NUDGE_CHOICES: readonly Choice[] = [
  { value: "show", label: "Show me which ones", phrases: ["show me", "show", "which ones", "go on", "yes", "please"] },
  { value: "later", label: "Not now", phrases: ["not now", "later", "no", "no thanks", "skip", "leave it"] },
];

/** Slide 15. Three ways out, none of them recommended. */
const OUT_CHOICES: readonly Choice[] = [
  {
    value: "refine",
    label: "Keep refining",
    phrases: ["keep refining", "refine", "carry on", "keep going", "more", "not done"],
  },
  { value: "stop", label: "Stop here", phrases: ["stop", "stop here", "that's it", "thats it", "done", "finished", "im good"] },
  {
    value: "questions",
    label: "Take the questions away",
    phrases: ["questions", "take the questions", "pack them up", "take them away", "my team"],
  },
];

/** Step 08's one non-free-text answer, offered beside the leader's own words. */
const LAGGING_CHOICES: readonly Choice[] = [DONT_KNOW_ANSWER];

/**
 * Where the conversation is. One of these, always — the column is never in
 * between two of them, because the same gating decides both.
 */
export type Turn =
  | {
      kind: "ask";
      field: AnswerField;
      /** The coach's question. Where the column prints one, these are its words. */
      question: string;
      /** The line the column says above the question, in the coach's voice. */
      preamble?: string;
      /** Fixed answers. Empty when the answer is whatever they say. */
      choices: readonly Choice[];
      /** Whether anything else they say is carried as their own words. */
      freeText: boolean;
      /** The longest answer this field carries. */
      max: number;
      /** Anything the coach has to know to run this turn well. */
      note?: string;
    }
  /** Step 04 said "no". The run leaves for the handover and does not come back. */
  | { kind: "handover" }
  /** Through the first door: the conversation carries on in the same column. */
  | { kind: "refining" }
  /** Through a leaving door. The takeaway is on screen; nothing is saved. */
  | { kind: "takeaway" };

/**
 * The turn the column is on, folded from the same state the page renders from.
 *
 * Read it top to bottom: it is the deck's spine, and each gate is the one
 * `readRun` and `readCoaching` already apply. Nothing here can put the coach a
 * question ahead of the page, because neither of them is deciding anything —
 * they are both reading the query string.
 */
export function turnFor(run: Run, c: Coaching): Turn {
  if (!run.who) {
    return { kind: "ask", field: "who", question: WHO_QUESTION, choices: WHO_ANSWERS, freeText: false, max: BROUGHT_MAX };
  }
  if (!run.brought) {
    return {
      kind: "ask",
      field: "brought",
      question: broughtQuestion(run.who),
      choices: BROUGHT_ANSWERS,
      freeText: true,
      max: BROUGHT_MAX,
      note: "If what they brought is one of the listed answers, use its value. Otherwise carry their own words — a short phrase.",
    };
  }
  if (!run.share) {
    return {
      kind: "ask",
      field: "share",
      question: shareQuestion(run.brought),
      preamble:
        "Before they answer, say it plainly and briefly: there's no account here, no database, and nothing is kept when they close the tab — but some wording isn't theirs to paste anywhere, and either answer is a good one.",
      choices: SHARE_ANSWERS,
      freeText: false,
      max: BROUGHT_MAX,
    };
  }
  if (run.share === "no") return { kind: "handover" };

  if (!c.centre) {
    return {
      kind: "ask",
      field: "centre",
      question: COACH_ASKS.centre,
      preamble:
        "The canvas has just come up on their screen. Say so once, in a sentence: they don't have to fill it in — you'll ask, they talk, and it fills itself.",
      choices: [],
      freeText: true,
      max: ANSWER_MAX,
    };
  }
  if (!c.problem) {
    return { kind: "ask", field: "problem", question: COACH_ASKS.problem, choices: [], freeText: true, max: ANSWER_MAX };
  }
  if (!c.lagging) {
    return {
      kind: "ask",
      field: "lagging",
      question: COACH_ASKS.lagging,
      preamble:
        "Say why this comes before the bet, in one sentence: write the clever sentence first and you'll pick measures that flatter it.",
      choices: LAGGING_CHOICES,
      freeText: true,
      max: ANSWER_MAX,
      note: `If they don't know their baseline, that is an answer and the most interesting one on the canvas — send "${DONT_KNOW}" and never treat it as a failure or a skip.`,
    };
  }
  if (c.lagging === DONT_KNOW && !c.whoKnows) {
    return {
      kind: "ask",
      field: "whoKnows",
      question: COACH_ASKS.whoKnows,
      preamble: "They said they don't know their baseline. Tell them that's good, genuinely, and stay here a second.",
      choices: [],
      freeText: true,
      max: ANSWER_MAX,
      note: "What they say lands on the canvas as an open question to take back to their team. That is a real output, not a gap.",
    };
  }
  if (!c.back) {
    return {
      kind: "ask",
      field: "back",
      question: COACH_ASKS.back,
      preamble:
        "Say why: their lagging measure can only be as sharp as the behaviour underneath it. Nothing they've said is wrong — you're fixing it upstream. Both answers are real ones.",
      choices: BACK_CHOICES,
      freeText: false,
      max: ANSWER_MAX,
    };
  }
  if (c.back === "yes" && !c.centreAgain) {
    return { kind: "ask", field: "centreAgain", question: COACH_ASKS.centreAgain, choices: [], freeText: true, max: ANSWER_MAX };
  }
  if (!c.hypothesis) {
    return { kind: "ask", field: "hypothesis", question: COACH_ASKS.hypothesis, choices: [], freeText: true, max: ANSWER_MAX };
  }
  if (!c.leading) {
    return {
      kind: "ask",
      field: "leading",
      question: COACH_ASKS.leading,
      preamble:
        "Say the bet back to them once, and say that it's written against a measure that already exists — which is why you asked for the measure first.",
      choices: [],
      freeText: true,
      max: ANSWER_MAX,
      note: "If they want to redo the bet instead, send it as the hypothesis field again with their new wording.",
    };
  }

  /* 11 · the nudge. The gap in words, never a number — and never at all in a
     room, where nobody needs one person told what's thin in front of everyone.
     `nudgeFor` decides whether there is anything to say; if it says nothing,
     there is no turn here at all. */
  const nudge = nudgeFor(canvasText(canvasFor(c)), { room: run.who === "room" });
  if (nudge && !c.nudge) {
    return {
      kind: "ask",
      field: "nudge",
      question: `${nudge.opening} ${nudge.gap}`,
      choices: NUDGE_CHOICES,
      freeText: false,
      max: ANSWER_MAX,
      note: "Say that in your own voice if you like, but say the gap — in words. Never a score, a percentage or a number.",
    };
  }

  if (!c.out) {
    return {
      kind: "ask",
      field: "out",
      question: COACH_ASKS.out,
      preamble:
        "Three ways out, on screen, and none of them is the recommended one: keep refining, stop here, or take the open questions away to their team. Offer all three evenly and don't push one.",
      choices: OUT_CHOICES,
      freeText: false,
      max: ANSWER_MAX,
    };
  }
  if (c.out === "refine") return { kind: "refining" };
  return { kind: "takeaway" };
}

/* ------------------------------------------------------------------------ */
/* Telling the coach where it is                                             */
/* ------------------------------------------------------------------------ */

/** The canvas in one short block, so the coach never re-asks what's already up. */
export function canvasSummary(state: CanvasState): string {
  const lines = CANVAS_ORDER.map((box) => {
    const b = state.boxes[box.id];
    const notes = b.notes.map((n) => (n.kind === "open" ? `open question — ${n.text}` : n.text)).join(" · ");
    return `${box.numeral} ${box.short}: ${notes || "(nothing yet)"}`;
  });
  return lines.join("\n");
}

function choiceList(choices: readonly Choice[]): string {
  return choices.map((c) => `"${c.value}" (${c.label})`).join(", ");
}

/**
 * The whole of what the coach is told between turns: what is on the canvas, and
 * the one question to ask next. Sent as a `[column]` note on the data channel,
 * and handed back as the result of every `answer` call so the conversation
 * never has to wait a round trip to know where it got to.
 */
export function columnNote(run: Run, coaching: Coaching): string {
  const turn = turnFor(run, coaching);
  const canvas = canvasSummary(canvasFor(coaching));

  if (turn.kind === "handover") {
    return `[column] They said they can't share it, and that was a good answer. Tell them briefly that nothing about this needs you to see their wording: the coaching is the questions, and the questions travel. The link on screen has the skill, where it goes, and a prompt to take behind their own walls. Then stop — this run doesn't come back here, and there is nothing left to ask.`;
  }
  if (turn.kind === "refining") {
    return `[column] They chose to keep refining, and the other two doors are still open underneath. The canvas:\n${canvas}\n\nAsk what they want to change. The two you can reopen cleanly are the bet (field "hypothesis") and what tells us in weeks (field "leading") — send either again with their new wording. Anything further up the canvas they should take away and sharpen there. When they're done, they can still stop here (field "out", value "stop") or take the questions away (value "questions").`;
  }
  if (turn.kind === "takeaway") {
    return `[column] They've been through a door and the takeaway is on screen: the goal in the SSH pattern, the canvas gaps and all, and a prompt to carry on elsewhere. Say once, plainly, that you don't keep a copy — no account, no database — so they should download, copy or print it before they close the tab. Offer to keep going if they want. Don't ask anything else.`;
  }

  const parts = [`[column] The canvas as they can see it:\n${canvas}`];
  if (turn.preamble) parts.push(`Worth saying before you ask: ${turn.preamble}`);
  // The question is what the column is waiting for, not a line to be read out.
  // The deck's wording is the best short version of it and a perfectly good
  // thing to say — but getting there is the coach's job. See
  // `columnCoachInstructions`, "HOW YOU ASK".
  parts.push(
    `What the column needs next: ${turn.question}\n` +
      `That is the intent, not a script. Ask it your way, and follow up, dig or push back as the conversation needs before you land it.`,
  );
  if (turn.choices.length > 0) {
    parts.push(
      `Their answer goes in field "${turn.field}". The answers on screen are ${choiceList(turn.choices)} — send the value, not the label.${
        turn.freeText ? " If they say something else entirely, send their own words instead." : " If they say something else, ask again rather than guessing."
      }`,
    );
  } else {
    parts.push(`Their answer goes in field "${turn.field}", in their own words, as a short phrase or a sentence.`);
  }
  if (turn.note) parts.push(turn.note);
  return parts.join("\n\n");
}

/* ------------------------------------------------------------------------ */
/* Landing an answer                                                          */
/* ------------------------------------------------------------------------ */

/** Read a run back out of a column link — the same gating the server applies. */
export function stateFromHref(href: string): { run: Run; coaching: Coaching } {
  const url = new URL(href, "https://bettergoals.ai");
  const params: Record<string, string> = Object.fromEntries(url.searchParams.entries());
  const run = readRun(params);
  return { run, coaching: readCoaching(params, run) };
}

/** A fixed answer, however it was said. Longest phrase wins, as everywhere else. */
function pick(value: string, choices: readonly Choice[]): string | null {
  const said = value.trim().toLowerCase();
  const exact = choices.find((c) => c.value.toLowerCase() === said || c.label.toLowerCase() === said);
  if (exact) return exact.value;
  return matchSpoken(value, choices);
}

export type Landed =
  | { ok: true; href: string; run: Run; coaching: Coaching }
  | { ok: false; error: string };

/**
 * Land one answer from the coach, exactly where tapping or typing it would have
 * gone: a link back to the column with one more thing known.
 *
 * It is checked against the turn the column is actually on rather than trusted,
 * because a voice model that gets ahead of itself must not be able to write into
 * a box the conversation hasn't reached. A refused answer is not an error — the
 * coach is told which question it is on and asks that one instead.
 */
export function landAnswer(run: Run, coaching: Coaching, field: string, value: string): Landed {
  const turn = turnFor(run, coaching);
  const said = value.trim();
  if (!said) return { ok: false, error: "There were no words in that answer." };

  /* Keeping refining reopens the last two boxes and the doors, and nothing
     else — the same two the column offers as links, for the same reason: they
     are the two that can be taken back without pulling apart what sits under
     them. */
  const allowed: readonly AnswerField[] =
    turn.kind === "ask" ? [turn.field] : turn.kind === "refining" ? ["hypothesis", "leading", "out"] : [];
  if (!allowed.includes(field as AnswerField)) {
    return {
      ok: false,
      error:
        allowed.length === 0
          ? "There's nothing left to answer — the conversation is at the takeaway."
          : `That isn't the question you're on. The column is waiting on "${allowed.join('" or "')}".`,
    };
  }

  const choices = turn.kind === "ask" ? turn.choices : OUT_CHOICES;
  const freeText = turn.kind === "ask" ? turn.freeText : field !== "out";
  const max = turn.kind === "ask" ? turn.max : ANSWER_MAX;

  let landing = said.slice(0, max);
  if (choices.length > 0) {
    const chosen = pick(said, choices);
    if (chosen) landing = chosen;
    else if (!freeText) {
      return { ok: false, error: `Not one of the answers on screen. They're ${choiceList(choices)}. Ask again rather than guessing.` };
    }
  }

  const href = columnHref(run, coaching, { [field]: landing } as Partial<Run & Coaching>);
  const next = stateFromHref(href);
  return { ok: true, href, run: next.run, coaching: next.coaching };
}

/* ------------------------------------------------------------------------ */
/* What the coach can do                                                      */
/* ------------------------------------------------------------------------ */

/** OpenAI Realtime function tools. Kept in step with `landAnswer`. */
export const COLUMN_TOOLS = [
  {
    type: "function",
    name: "answer",
    description:
      "Land what they just said in the column, so the page moves on and the canvas fills in. Call it once, as soon as they have actually answered the question you asked — not before. The result tells you the next question to ask. Use their own words, not a tidied-up version of them.",
    parameters: {
      type: "object",
      properties: {
        field: {
          type: "string",
          enum: [...ANSWER_FIELDS],
          description: "The field the column is waiting on. The [column] note names it.",
        },
        value: {
          type: "string",
          description:
            "For a question with answers on screen, one of the listed values. Otherwise their answer in their own words — a short phrase or one sentence.",
        },
      },
      required: ["field", "value"],
    },
  },
  {
    type: "function",
    name: "hand_over",
    description:
      "Stop talking and let them carry on with the column by hand — call this the moment they ask you to be quiet, or say they'd rather type. Everything they've said stays exactly where it is. Say one short sentence first; the microphone closes straight after.",
    parameters: { type: "object", properties: {} },
  },
] as const;

/* ------------------------------------------------------------------------ */
/* Who the coach is                                                           */
/* ------------------------------------------------------------------------ */

export function columnCoachInstructions(): string {
  return `You are the bettergoals.ai coach, on the front door of the site. Someone has just pressed "◉ Talk to me", so this is a spoken conversation from the first answer. You are warm, direct, curious and brief — a coach, never an auditor and never a form being read out.

You are grounded in Sooner Safer Happier. A better goal describes a change in the world for a customer, colleague or citizen — not a list of things to build. You are here to turn what they brought into an outcome worth chasing: who it is for and what they'd do differently, what's in their way, how they'd know it landed, the bet, and what tells them in weeks.

WHAT THEY CAN SEE. One column, scrolling. Your questions are printed in it as you ask them, the answers they've already given sit above as small grey chips, and a canvas of five boxes fills itself in as you go: ① who this is for and what changes in their behaviour, ② driver and problem, ③ lagging — what would convince a sceptic, ④ the outcome hypothesis, ⑤ leading — what tells us in weeks. The lit box is wherever you are. They can also answer by tapping or typing at any moment. Nothing is stored anywhere: the whole conversation lives in their address bar and closing the tab ends it.

HOW THE COLUMN MOVES. You do not control the page except through the answer tool. Messages beginning [column] tell you the canvas as it stands and what the column needs next; the result of every answer call tells you the same for the turn after. That is the *intent* of the next box — not a line to read out. Work through the canvas in the order you are given, because each box is what makes the next one answerable, and never read the canvas out in full: they can see it.

HOW YOU ASK. The wording is yours. Ask in your own words, in the language they are using, and shape the question around what they have already told you rather than starting fresh each time. You are a sparring partner, not an auditor: follow up when an answer is thin, ask for the example behind a generalisation, and when you hear an output dressed as an outcome say so in a few words and ask whether they could hit it and nothing improve for anyone. If a phrase they used earlier now looks wrong, say so and offer to sharpen it — send that box again with their new wording; going back is a normal move and never a correction. One question at a time, and never jump to a box the column has not asked for yet.

LANDING AN ANSWER. When they have actually answered, call answer with the field from the note and their own words. Carry their words, not your summary of them — the canvas is their thinking, not yours. If they ask what you meant, think aloud, or answer something else, reply in a sentence and come back to it — put it a different way if the first way didn't land; don't call answer until they've answered it. Never invent a number, a baseline or a fact on their behalf. If something is unknown, that is the answer and you say so plainly.

HOW YOU TALK. Short. A sentence and a question, rarely more than thirty words — a follow-up that earns its place is worth the extra breath, a speech never is. Don't repeat their answer back to them, don't summarise, don't compliment, don't narrate what you're doing or mention the canvas filling in. Don't spell out box numbers or field names. If they go quiet, wait; then offer one prompt. If they want to stop talking, or ask to type instead, call hand_over — the column stays exactly as it is and they carry on by hand.

Nothing here is a test and nothing they say is wrong. "I don't know" is a legitimate answer and often the most interesting one on the canvas: it becomes an open question they take back to their team, and you never treat it as a gap to be closed. There is no score, no progress bar, no count and no total anywhere in this conversation — don't invent one.`;
}
