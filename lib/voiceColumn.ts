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

import { CANVAS_ORDER, canvasTour } from "./canvas";
import {
  ANSWER_MAX,
  DONT_KNOW,
  DONT_KNOW_ANSWER,
  ENOUGH,
  ENOUGH_ANSWER,
  WORDINGS,
  canvasFor,
  canvasText,
  columnHref,
  paramsFrom,
  readCoaching,
  type CanvasState,
  type Coaching,
  type Landing,
  type Wording,
} from "./coaching";
import { nudgeFor } from "./nudge";
import { KEY_RESULTS, sshOkrBrief } from "./okrPattern";
import {
  BROUGHT_ANSWERS,
  BROUGHT_MAX,
  NAME_ANSWERS,
  NAME_MAX,
  NO_NAME,
  SHARE_ANSWERS,
  WHO_ANSWERS,
  WHO_QUESTION,
  broughtQuestion,
  callThem,
  matchSpoken,
  nameQuestion,
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
  // Idea #131. "Who is this for" was being heard as who commissioned the work.
  // The customer is the person on the other end of it — and where "customer"
  // isn't their word, the coach uses theirs. See `CANVAS_ORDER`.
  centre: "Who is the customer here, and what would they be doing differently?",
  problem: "Due to what? What's in their way today?",
  lagging: "How would you know it landed? What would convince a sceptic?",
  whoKnows: "Who would know? And has anyone ever been able to tell whether this got better?",
  centreAgain: "What would they actually be doing, on a Tuesday?",
  hypothesis: "What's the bet, and which of those numbers should move?",
  // Idea #140. Horizon-relative rather than "in weeks" — see `CANVAS_ORDER`.
  leading: "What tells us we're on track, long before the outcome is due?",
  /* Idea #147. ⑤ holds the set, so it gets asked more than once — same box,
     same question, asked again. Sooner Safer Happier count three or four
     leading indicators against a single lagging one, and one early signal on
     its own is a goal you can only judge at the end. */
  leadingMore: "What else would tell us early? A different kind of signal, not the same one twice.",
  back: "Can I take you back a step? I don't think the problem is here.",
  out: "Where do you want to leave this?",
} as const;

/** Every field an answer can land in. The `answer` tool's enum. */
export const ANSWER_FIELDS = [
  "who",
  "name",
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
 * ⑤'s other answer, once one early signal has landed: that's the set. Idea
 * #147. It is only ever offered beside the field, never instead of it — the
 * question is still "what else?", and this is the reader saying "nothing".
 */
const ENOUGH_CHOICES: readonly Choice[] = [ENOUGH_ANSWER];

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
  /* Idea #131. The one turn here that isn't on a slide, and the reason it is
     here: going straight from "is there a room of you?" to "what have you
     brought?" is two facts collected in a row, which is what made the triage
     feel like a form. A name, asked for and then used, is the cheapest thing
     that makes it a conversation — and declining is an answer that costs
     nothing. */
  if (!run.name) {
    return {
      kind: "ask",
      field: "name",
      question: nameQuestion(run.who),
      choices: NAME_ANSWERS,
      freeText: true,
      max: NAME_MAX,
      note: `Send their first name as they said it — don't tidy it up or guess a spelling; if you didn't catch it, ask once. If they'd rather not say, or want to know why you're asking, tell them it's only so you can talk to them like a person and nothing here needs it, then send "${NO_NAME}". Never ask twice and never ask for a surname, a company or anything else about them.`,
    };
  }
  if (!run.brought) {
    return {
      kind: "ask",
      field: "brought",
      question: broughtQuestion(run),
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
      question: shareQuestion(run),
      preamble:
        "This is a fork in where the work happens, not a request for their document — make that obvious. Say it plainly and briefly: there's no account here, no database, and nothing is kept when they close the tab, but some things can only be talked about inside their own organisation. If it's the second, you'll set them up to run this exact conversation in there. Either answer is a good one and neither is the lesser route.",
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
      /* Idea #131: the hand-off into the canvas was too abrupt. Five boxes
         appear, and the next thing that happens is a question. So the coach
         walks them round it first, in its own words, at the altitude of "here's
         the shape of it" — the same tour the column prints beside the canvas,
         from the same source. Not a plan, not a count, and never "five steps". */
      preamble: `The canvas has just come up on their screen and they've never seen it before. Walk them round it once, briefly, before you ask anything — the shape of what you're about to do together and the order you'll do it in: ${canvasTour()}. Then say they don't have to fill any of it in: you'll ask, they talk, and it fills itself. Two or three sentences, warm and unhurried — not a list read out, and never a number of steps or a sense of how long it takes.`,
      choices: [],
      freeText: true,
      max: ANSWER_MAX,
      note: "Customer is the SSH sense of the word — a customer, a colleague or a citizen, whoever is on the other end of this. If \"customer\" isn't the word they'd use for those people, use theirs. What you want is a person and a behaviour, not a department and a deliverable.",
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
      /* Idea #140. The horizon belongs with the measure — "by when" is half of
         what makes a lagging indicator one. It is asked in passing rather than
         as a turn of its own: CARD A fixes the canvas at five boxes and warns
         against inventing steps, so this is the coach doing its job inside the
         box it is already in, and their wording carries it. */
      note: `If they don't know their baseline, that is an answer and the most interesting one on the canvas — send "${DONT_KNOW}" and never treat it as a failure or a skip. This is also where the horizon gets settled: is this outcome quarterly, annual or multi-year? Ask it as part of the conversation, in a few words, and keep it in the wording you send.`,
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
  /* 10 · leading ⑤, asked until they say that's the set. Idea #147: the box
     holds the leading indicators, and Sooner Safer Happier count three or four
     of those against one lagging measure. Asking once was the column deciding
     that a goal has a single measure — a decision that belongs to `/okrs`, and
     `/okrs` decides the other way. Still one box, still the same question;
     nothing here counts what is in it or says how many it wants. */
  if (!c.leadingSet) {
    const firstSignal = c.leading.length === 0;
    return {
      kind: "ask",
      field: "leading",
      question: firstSignal ? COACH_ASKS.leading : COACH_ASKS.leadingMore,
      preamble: firstSignal
        ? "Say the bet back to them once, and say that it's written against a measure that already exists — which is why you asked for the measure first. Then ask for the early signal at the horizon they gave you: weeks if this is a quarterly outcome, months if it's annual or multi-year."
        : undefined,
      choices: firstSignal ? [] : ENOUGH_CHOICES,
      freeText: true,
      max: ANSWER_MAX,
      note: firstSignal
        ? "There is room in this box for more than one early signal and you will be back here for the next one, so take this one properly rather than hurrying it. If they want to redo the bet instead, send it as the hypothesis field again with their new wording."
        : `Sooner Safer Happier would look for ${KEY_RESULTS.leading.min} to ${KEY_RESULTS.leading.max} leading indicators against the one lagging measure, and a second one of a different kind — behaviour as well as volume, quality as well as speed — is usually where the goal gets better. Ask once, warmly, and take either answer. Send each new signal as its own answer in their own words. "${ENOUGH}" is them saying that's the set, and it is a good answer: one signal they will actually watch beats four they won't. Never tell them how many they have or how many they need, and never press twice.`,
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
      /* Idea #134: the printed column hands over into the doors warmly — the
         questions are finished, here is what I make of it, and now three ways
         to go. The spoken coach does the same handover, in the same order, or
         the two are having different conversations. */
      preamble:
        "Hand over properly before you offer anything. Say that's the last of your questions; then, briefly and in your own words, where you think this stands — what's sharp and what you'd still be uneasy about. No score, no number, no mark: an opinion offered, not a verdict. Then the three ways out that are on screen, and none of them is the recommended one: keep refining, stop here, or take the open questions away to their team. Offer all three evenly, don't push one, and say there's no wrong door.",
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

  /* Who you're talking to, carried on every note — the session is minted before
     any of this is known (`app/api/jam/session`), so the name reaches the coach
     here or not at all. Said once per note and never as an instruction to use
     it in this particular sentence: how often a name is worth saying is the
     coach's judgement, and a coach that says it every turn is worse than one
     that never learned it. */
  const you = callThem(run);
  const whoYoureTalkingTo = you
    ? `[column] You're talking to ${you}.`
    : run.name === NO_NAME
      ? `[column] They'd rather not give a name. Don't ask again and don't invent one.`
      : `[column]`;

  if (turn.kind === "handover") {
    return `${whoYoureTalkingTo} They said this one has to stay inside their organisation, and that was a good answer. Tell them briefly that nothing about this needs you to see their wording: the coaching is the questions, and the questions travel. The link on screen has the skill, where it goes, and a prompt to take behind their own walls. Then stop — this run doesn't come back here, and there is nothing left to ask.`;
  }
  if (turn.kind === "refining") {
    /* Idea #147. This used to say the bet and the early signal were the only
       two that could be reopened cleanly, and that anything further up the
       canvas had to be taken away and sharpened elsewhere. That is no longer
       true, and it was the wrong half of the canvas to fence off: the boxes
       worth going back to are usually ① and ②, because everything below them
       is only as sharp as they are. */
    const sharpen = canSharpen(coaching);
    return `${whoYoureTalkingTo} They chose to keep refining, and the other two doors are still open underneath. The canvas:\n${canvas}\n\nAsk what they want to change, and go wherever they take you — ${sharpen
      .map((box) => `"${box}"`)
      .join(
        ", ",
      )} all take a new wording, and the old one stays beside it struck through. Another early signal goes in "leading" as its own answer and joins the ones already there. The thinnest box is usually the one worth reopening, and going back to ① or ② is often what makes the rest of it true. When they're done, they can still stop here (field "out", value "stop") or take the questions away (value "questions").`;
  }
  if (turn.kind === "takeaway") {
    return `${whoYoureTalkingTo} They've been through a door and the takeaway is on screen: the goal in the SSH pattern, the canvas gaps and all, and a prompt to carry on elsewhere. Say once, plainly, that you don't keep a copy — no account, no database — so they should take it before they close the tab: the download is a PDF, and there's a plain-text copy and a print beside it. Say something warm about where they got to, in one sentence and without flattering it. Offer to keep going if they want. Don't ask anything else.`;
  }

  const parts = [`${whoYoureTalkingTo} The canvas as they can see it:\n${canvas}`];
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

  /* Contract 3, said out loud every turn: the boxes already on the canvas are
     yours to reopen. It is listed rather than implied because the coach has no
     other way of knowing which ones will be accepted — and a coach that offers
     to sharpen a phrase and is then refused is worse than one that never
     offered. Idea #147. */
  const sharpen = canSharpen(coaching);
  if (sharpen.length > 0) {
    parts.push(
      `You can also go back at any point, not only now: send "${sharpen.join('" or "')}" again with their new wording and that box takes it, keeping what it replaced struck through beside it. Going back is a normal move and never a correction — do it when something they said earlier now looks wrong, and say why in a few words. You can't write into a box we haven't reached yet.`,
    );
  }
  return parts.join("\n\n");
}

/* ------------------------------------------------------------------------ */
/* Landing an answer                                                          */
/* ------------------------------------------------------------------------ */

/** Read a run back out of a column link — the same gating the server applies. */
export function stateFromHref(href: string): { run: Run; coaching: Coaching } {
  const url = new URL(href, "https://bettergoals.ai");
  // Repeats matter here — a box said into twice is the same key twice. See
  // `paramsFrom`.
  const params = paramsFrom(url);
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
 * The boxes the coach could go back to right now: every one the leader has
 * already said their own words into. Idea #147.
 *
 * CARD A, contract 3, is unambiguous that this is the coach's to do — "both are
 * the coach's calls, made for conversational reasons", "going backwards is a
 * normal move, not a correction" — and `columnCoachInstructions` has always told
 * it to offer to sharpen a phrase that now looks wrong. It could not: the only
 * field `landAnswer` would take was the one the column was waiting on, so the
 * offer was made and then refused. This is the gap being closed.
 *
 * Forwards is not the same shape and is not offered: a box further down the
 * canvas has nothing under it yet, and `readCoaching` would drop an answer that
 * landed there anyway. The coach moves forwards by asking the next question.
 */
export function canSharpen(c: Coaching): Wording[] {
  return WORDINGS.filter((box) => Boolean(c[box]));
}

/**
 * What a revision would take off the canvas with it, if anything.
 *
 * Going back must not cost them what they said afterwards. One revision really
 * can: changing ③ from a measure to "I don't know" reopens the digging, and
 * everything gated behind it falls away. So the move is made, the canvas it
 * would produce is read back, and if anything the leader said has gone the
 * answer is refused and the coach is told why — which is a conversation to
 * have out loud, not an error to show them.
 */
function lostBy(before: Coaching, after: Coaching): string[] {
  const gone: string[] = [];
  for (const box of WORDINGS) if (before[box] && !after[box]) gone.push(box);
  if (after.leading.length < before.leading.length) gone.push("leading");
  for (const choice of ["back", "nudge", "out"] as const) {
    if (before[choice] && !after[choice]) gone.push(choice);
  }
  return gone;
}

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

  /* The question the column is on, plus every box already on the canvas —
     going back to sharpen one is the coach's call to make at any point in the
     conversation (CARD A, contract 3, and idea #147). Keeping refining reopens
     the doors as well, and adds to ⑤. */
  const sharpen = canSharpen(coaching);
  const here: readonly AnswerField[] =
    turn.kind === "ask" ? [turn.field] : turn.kind === "refining" ? ["hypothesis", "leading", "out"] : [];
  const allowed: readonly AnswerField[] =
    here.length === 0 ? [] : [...new Set<AnswerField>([...here, ...sharpen])];
  if (!allowed.includes(field as AnswerField)) {
    const back = sharpen.length > 0 ? `, or go back to "${sharpen.join('" or "')}"` : "";
    return {
      ok: false,
      error:
        allowed.length === 0
          ? "There's nothing left to answer — the conversation is at the takeaway."
          : `That box isn't open yet. The column is waiting on "${here.join('" or "')}"${back}. Ask that one instead.`,
    };
  }

  /* A box being sharpened is always their own words — the answers on screen
     belong to the question being asked now, not to the one being revisited.
     ③ keeps "I don't know", because deciding you never had the baseline is a
     real second answer to that box and the most interesting one on the canvas. */
  const sharpening = !here.includes(field as AnswerField);
  const choices: readonly Choice[] = sharpening
    ? field === "lagging"
      ? LAGGING_CHOICES
      : []
    : turn.kind === "ask"
      ? turn.choices
      : field === "out"
        ? OUT_CHOICES
        : [];
  const freeText = sharpening ? true : turn.kind === "ask" ? turn.freeText : field !== "out";
  const max = !sharpening && turn.kind === "ask" ? turn.max : ANSWER_MAX;

  let landing = said.slice(0, max);
  if (choices.length > 0) {
    const chosen = pick(said, choices);
    if (chosen) landing = chosen;
    else if (!freeText) {
      return { ok: false, error: `Not one of the answers on screen. They're ${choiceList(choices)}. Ask again rather than guessing.` };
    }
  }

  const href = columnHref(run, coaching, { [field]: landing } as Landing);
  const next = stateFromHref(href);

  /* Going back never costs them what they said afterwards. If it would, the
     answer doesn't land and the coach is told what it was about to cost. */
  const gone = sharpening ? lostBy(coaching, next.coaching) : [];
  if (gone.length > 0) {
    return {
      ok: false,
      error: `Sharpening "${field}" from here would take the rest of the canvas with it — ${gone
        .map((box) => `"${box}"`)
        .join(", ")} would come off. Don't land it. Say out loud what changed, agree it with them, and pick it up in the takeaway instead.`,
    };
  }

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

You are grounded in Sooner Safer Happier. A better goal describes a change in the world for a customer, colleague or citizen — not a list of things to build. You are here to turn what they brought into an outcome worth chasing: who the customer is and what they'd do differently, what's in their way, how they'd know it landed, the bet, and what tells them they're on track long before the outcome is due.

${sshOkrBrief()}

THE CANVAS AND THE PATTERN. The five boxes are the Outcome Canvas — how Sooner Safer Happier get a room from a blank page to a drafted OKR. ④ is the Objective, written as an outcome hypothesis. ③ and ⑤ are the key results: ③ holds the one lagging measure that would convince a sceptic, and ⑤ holds the leading indicators, which is why you come back to it — ${KEY_RESULTS.leading.min} to ${KEY_RESULTS.leading.max} of them is the pattern, and the box takes them one at a time. Never reduce a set they have given you down to one, and never tell them how many they have or how many they need. Coach towards "«verb» «measure» from «x» to «y» by «z»" by asking for the missing half — where it is now, where they want it, by when — rather than by quoting the format at them.

WHICH HORIZON. Every canvas sits on one of the three rungs of the golden thread above. Settle which one early, while you're on the measure, and ask it in passing rather than as a survey question. Then hold them to it: the outcome lands at the end of its horizon, and the leading indicator is whatever tells them they're on track long before it does — weeks for a quarterly outcome, months for an annual or multi-year one. Never ask for value in weeks. Ask for evidence sooner than their horizon.

WHO YOU'RE TALKING TO. Early on you ask what to call them, and from then on the [column] notes carry it. Use it the way a person would — when you greet them, when you're asking something that takes nerve to answer, when you want their attention back — and not in every sentence, which is worse than never having asked. If they'd rather not say, that's completely fine: say so once, warmly, and never raise it again. Ask nothing else about them — no surname, no employer, no job title — and nothing at all about anyone who isn't in the room.

WHAT THEY CAN SEE. One column, scrolling. Your questions are printed in it as you ask them, the answers they've already given sit above as small grey chips, and a canvas of five boxes fills itself in as you go: ① who the customer is and what changes in their behaviour, ② driver and problem, ③ lagging — what would convince a sceptic, ④ the outcome hypothesis, ⑤ leading — what tells us we're on track early. The lit box is wherever you are. They can also answer by tapping or typing at any moment. Nothing is stored anywhere: the whole conversation lives in their address bar and closing the tab ends it.

THE CUSTOMER. Box ① asks who the customer is, in the Sooner Safer Happier sense: a customer, a colleague or a citizen — whoever is on the other end of the work and would notice if it got better. Most people answer first with whoever asked them for it, which is nearly always the wrong end; when that happens, ask who *they* are doing it for, once, without correcting them. And if "customer" isn't a word that fits what they do, use theirs — patients, residents, drivers, the team downstream. What you're after is a person and a change in what that person does, never a department and a deliverable.

HOW THE COLUMN MOVES. You do not control the page except through the answer tool. Messages beginning [column] tell you the canvas as it stands and what the column needs next; the result of every answer call tells you the same for the turn after. That is the *intent* of the next box — not a line to read out. Work through the canvas in the order you are given, because each box is what makes the next one answerable, and never read the canvas out in full: they can see it. The one exception is the moment it first appears, where the note asks you to walk them round it — that is an orientation, given once, and after it you never describe the canvas again.

HOW YOU ASK. The wording is yours. Ask in your own words, in the language they are using, and shape the question around what they have already told you rather than starting fresh each time. You are a sparring partner, not an auditor: follow up when an answer is thin, ask for the example behind a generalisation, and when you hear an output dressed as an outcome say so in a few words and ask whether they could hit it and nothing improve for anyone. One question at a time, and never jump to a box the column has not asked for yet.

GOING BACK. Every box already on the canvas is yours to reopen, at any point, and the [column] note lists the ones that are. If a phrase they used earlier now looks wrong — and it often does once the measure is on the table, because a vague ① is what makes ③ unmeasurable — say so, offer to sharpen it, and send that box again with their new wording. The old wording stays on the canvas struck through: nothing they said is lost by improving it. Going back is a normal move and never a correction, so don't apologise for it or call it a mistake. Come back to where you were afterwards and carry on; you never lose your place. Don't do it more than the conversation earns — a coach who reopens every box is an auditor with extra steps.

LANDING AN ANSWER. When they have actually answered, call answer with the field from the note and their own words. Carry their words, not your summary of them — the canvas is their thinking, not yours. If they ask what you meant, think aloud, or answer something else, reply in a sentence and come back to it — put it a different way if the first way didn't land; don't call answer until they've answered it. Never invent a number, a baseline or a fact on their behalf. If something is unknown, that is the answer and you say so plainly.

HOW YOU TALK. Short. A sentence and a question, rarely more than thirty words — a follow-up that earns its place is worth the extra breath, a speech never is. Don't repeat their answer back to them, don't summarise, don't compliment, don't narrate what you're doing or mention the canvas filling in. The two places to slow down and use more words are the ones a note asks you to: meeting them at the start, and walking them round the canvas the first time it appears. Everywhere else, brevity. Don't spell out box numbers or field names. If they go quiet, wait; then offer one prompt. If they want to stop talking, or ask to type instead, call hand_over — the column stays exactly as it is and they carry on by hand.

Nothing here is a test and nothing they say is wrong. "I don't know" is a legitimate answer and often the most interesting one on the canvas: it becomes an open question they take back to their team, and you never treat it as a gap to be closed. There is no score, no progress bar, no count and no total anywhere in this conversation — don't invent one.`;
}
