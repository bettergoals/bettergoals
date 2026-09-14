/**
 * Coaching — steps 06–11 of the entry column (CARD 5), and the door the reader
 * leaves by at step 12 (CARD 6).
 *
 * One coach loop, not six builds. The canvas order is fixed (`lib/canvas.ts`,
 * CARD A contract 2); this module holds the *presentation* state that sits on
 * top of it — which box is lit, what has landed in each one, which box is
 * holding a longer dig, and which is parked while the coach fixes something
 * upstream.
 *
 * Source: slides 9–14 of `docs/reference/voice-coach-deck.md`, under
 * `docs/reference/card-a.md`. The deck is binding on what happens when an
 * answer lands, what stays, and what is never shown. It is not binding on how
 * any of it looks.
 *
 * ## Where "wherever the coach is" comes from
 *
 * CARD A, contract 2, asks one question before this card can be sized: does the
 * coach emit a box or topic identifier the UI can subscribe to? It does not.
 * `lib/coachAi.ts` returns a verdict, a headline, seven fixed checks, questions
 * and candidate wordings — nothing that names a canvas box, and rule 10 forbids
 * this card from adding one.
 *
 * So the route is held here, as data, in the shape a box signal would arrive
 * in: one step at a time, each naming the box the coach is in and what its
 * answer puts on the canvas. `canvasFor()` folds the reader's answers through
 * it. Everything downstream — the component, the column — only ever sees the
 * folded `CanvasState`, so the day the coach does emit a box identifier, this
 * file is the only one that changes.
 *
 * Two things this file deliberately does not do:
 *  - it does not decide the route. The lit box, the jump at step 07 and the
 *    double-back at step 09 are the coach's calls with the coach's wording,
 *    transcribed from the deck. Nothing here reads the reader's answer and
 *    forms an opinion about where the conversation should go next.
 *  - it does not count. No step numbers, no totals, no "n of five". The boxes
 *    filling in are the only orientation there is.
 */

import { COLUMN_PATH } from "./config";
import { CANVAS_ORDER, type CanvasBoxId } from "./canvas";
import { BROUGHT_MAX, type Run, type TriageAnswer } from "./triage";

/** The longest answer we'll carry on the canvas. A UX bound, not a safety one. */
export const ANSWER_MAX = 180;

/**
 * The one answer at step 08 that isn't the reader's own words: "I don't know."
 * It is a legitimate answer and the most interesting one on the canvas — never
 * a blank, never a skip. See `canvasFor()` and slide 11.
 */
export const DONT_KNOW = "dk";

/**
 * "I don't know", offered as an answer in its own right at step 08 and weighted
 * exactly like the field beside it. It is not a skip and there is no skip to
 * offer instead: slide 11 calls it the most interesting answer on the canvas,
 * and it is the one that makes the box grow.
 *
 * The phrases are what it can sound like said out loud, matched on whole words
 * by `matchSpoken`. Both the apostrophe and the space-separated forms are
 * listed because `matchSpoken` folds anything that isn't a letter, a digit or a
 * straight apostrophe down to a space — so a browser that transcribes a curly
 * apostrophe still lands here rather than being heard as something else.
 */
export const DONT_KNOW_ANSWER: TriageAnswer = {
  value: DONT_KNOW,
  label: "I don’t know what our baseline is",
  aside: "then let’s stay here a second",
  chip: "no baseline yet",
  phrases: [
    "i don't know",
    "i dont know",
    "i don t know",
    "don't know",
    "dont know",
    "don t know",
    "no idea",
    "not sure",
  ],
};

/**
 * What the reader has said into the canvas, in the order the coach asked for
 * it. Each field is one turn; a gap ends the run, exactly as triage works.
 */
export type Coaching = {
  /** 06 · centre ①. Who this is for, what changes in their behaviour. */
  centre: string | null;
  /** 07 · problem ②. */
  problem: string | null;
  /** 08 · lagging ③. The reader's words, or `DONT_KNOW`. */
  lagging: string | null;
  /** 08 · the digging, when the answer was "I don't know". Lands blue. */
  whoKnows: string | null;
  /** 09 · the reader's answer to "can I take you back a step?" */
  back: "yes" | "no" | null;
  /** 09 · the sharper wording for ①. The old words are struck through, not lost. */
  centreAgain: string | null;
  /** 10 · hypothesis ④. The bet. */
  hypothesis: string | null;
  /** 10 · leading ⑤. What tells us in weeks. */
  leading: string | null;
  /** 11 · the nudge. Whether the reader asked to see which ones. */
  nudge: "show" | "later" | null;
  /**
   * 12 · which door they went through. CARD 6, slide 15.
   *
   * Three ways out, none of them recommended and none of them a finish button:
   * `refine` keeps the conversation going in the same column, `stop` and
   * `questions` both open the takeaway — the second with the open questions
   * pulled to the front, because that is what the reader said they came for.
   *
   * `null` is the state the doors are *offered* in, not a missing answer. Going
   * through a door never closes the other two.
   */
  out: Door | null;
};

/** The three doors on slide 15, in the order the deck draws them. */
export type Door = "refine" | "stop" | "questions";
export const DOORS: readonly Door[] = ["refine", "stop", "questions"];

/** The two doors that end the conversation with something in your hands. */
export function leaving(out: Door | null): boolean {
  return out === "stop" || out === "questions";
}

export const NO_COACHING: Coaching = {
  centre: null,
  problem: null,
  lagging: null,
  whoKnows: null,
  back: null,
  centreAgain: null,
  hypothesis: null,
  leading: null,
  nudge: null,
  out: null,
};

/* ------------------------------------------------------------------------ */
/* Reading the run                                                           */
/* ------------------------------------------------------------------------ */

function first(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && v.trim() ? v.trim().slice(0, ANSWER_MAX) : null;
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/**
 * The coaching so far, gated in the order the coach asked. A gap ends it, so a
 * hand-edited URL can never land the reader in the middle of a conversation
 * that never happened.
 *
 * Coaching only exists at all once triage has finished with "yes, let's look at
 * it together" — the other answer left for the handover at step 07 and does not
 * come back.
 */
export function readCoaching(
  params: Record<string, string | string[] | undefined>,
  run: Run,
): Coaching {
  if (run.share !== "yes") return NO_COACHING;

  const centre = first(params.centre);
  const problem = centre ? first(params.problem) : null;
  const lagging = problem ? first(params.lagging) : null;
  const digging = lagging === DONT_KNOW;
  const whoKnows = digging ? first(params.whoKnows) : null;
  // Step 08 is finished when the reader has given a measure, or — having said
  // "I don't know" — has said who would know. The second is not a lesser
  // answer: it is the open question they take back to their team.
  const settled = Boolean(lagging) && (!digging || Boolean(whoKnows));
  const back = settled ? oneOf(first(params.back), ["yes", "no"] as const) : null;
  const centreAgain = back === "yes" ? first(params.centreAgain) : null;
  const moved = back === "no" || Boolean(centreAgain);
  const hypothesis = moved ? first(params.hypothesis) : null;
  const leading = hypothesis ? first(params.leading) : null;
  const nudge = leading ? oneOf(first(params.nudge), ["show", "later"] as const) : null;
  // The doors exist once the last answer has landed. Whether they are on screen
  // is the column's call, because the nudge sits between the two and a room
  // never gets one — but nothing can be *through* a door before the canvas is.
  const out = leading ? oneOf(first(params.out), DOORS) : null;

  return { centre, problem, lagging, whoKnows, back, centreAgain, hypothesis, leading, nudge, out };
}

/**
 * Every link in the column carries the whole run — the triage answers and the
 * coaching both — because the query string is the only place any of it lives.
 * Close the tab and it is gone.
 */
export function columnHref(
  run: Run,
  coaching: Coaching,
  next: Partial<Run & Coaching> = {},
  hash = "#live",
): string {
  const merged = { ...run, ...coaching, ...next };
  const q = new URLSearchParams();
  const put = (key: string, value: string | null | undefined) => {
    if (value) q.set(key, String(value).slice(0, ANSWER_MAX));
  };
  put("mode", merged.mode);
  put("who", merged.who);
  if (merged.brought) q.set("brought", merged.brought.slice(0, BROUGHT_MAX));
  put("share", merged.share);
  put("voice", merged.voice);
  put("centre", merged.centre);
  put("problem", merged.problem);
  put("lagging", merged.lagging);
  put("whoKnows", merged.whoKnows);
  put("back", merged.back);
  put("centreAgain", merged.centreAgain);
  put("hypothesis", merged.hypothesis);
  put("leading", merged.leading);
  put("nudge", merged.nudge);
  put("out", merged.out);
  const s = q.toString();
  return `${COLUMN_PATH}${s ? `?${s}` : ""}${hash}`;
}

/** The hidden fields a GET form needs to carry everything already said. */
export function carried(run: Run, coaching: Coaching): { name: string; value: string }[] {
  const url = new URL(columnHref(run, coaching, {}, ""), "https://bettergoals.ai");
  return [...url.searchParams.entries()].map(([name, value]) => ({ name, value }));
}

/* ------------------------------------------------------------------------ */
/* The canvas, as it stands                                                   */
/* ------------------------------------------------------------------------ */

/**
 * Something the reader said, living in a box.
 *
 * Two kinds, deliberately (rule 9). A yellow sticky is your thinking. Blue is
 * an open question you take back to your team — a legitimate output and never
 * an error. Triage's outline chips are the third system and stay above the
 * canvas, untouched by any of this.
 */
export type Note = {
  kind: "sticky" | "open";
  text: string;
  /** Earlier wording, kept and struck through. Nothing is ever replaced. */
  struck?: string;
};

export type BoxState = {
  notes: Note[];
  /**
   * The conversation happening inside this box while the coach digs. The box
   * grows to hold it — that growth is the only cue that standing still is going
   * deeper rather than stalling (slide 11). Nothing here is a status.
   */
  digging: string[];
  /** Set aside while the coach fixes something upstream. Never an error. */
  parked: boolean;
  /** What the coach has said about this box while it isn't lit, in its voice. */
  standing: string | null;
};

export type CanvasState = {
  /** The box the conversation is in. The coach's call; this only reflects it. */
  lit: CanvasBoxId;
  boxes: Record<CanvasBoxId, BoxState>;
};

function emptyBoxes(): Record<CanvasBoxId, BoxState> {
  const boxes = {} as Record<CanvasBoxId, BoxState>;
  for (const box of CANVAS_ORDER) {
    boxes[box.id] = { notes: [], digging: [], parked: false, standing: null };
  }
  return boxes;
}

/**
 * The canvas as it stands, folded from what the reader has said.
 *
 * Every move in here is the coach's, transcribed from slides 9–14: the jump
 * past ④ to ③ at step 07, the box that inflates at 08, the double-back to ① at
 * 09, and the order it returns in. The fold renders them; it does not choose
 * them.
 */
export function canvasFor(c: Coaching): CanvasState {
  const boxes = emptyBoxes();
  let lit: CanvasBoxId = "centre";

  // 06 · centre ①. The lit box is where we're talking; the others are questions
  // the coach hasn't asked yet, and say so in their own words.
  if (!c.centre) return { lit, boxes };
  boxes.centre.notes.push({ kind: "sticky", text: c.centre });
  lit = "problem";

  // 07 · problem ②, then the jump to ③. The coach names its own route on the
  // two boxes that would otherwise read as skipped — said out loud, in the flow
  // of talk. Never a diagram and never "step 3 of 5".
  boxes.lagging.standing = "up next, before the bet";
  if (!c.problem) return { lit, boxes };
  boxes.problem.notes.push({ kind: "sticky", text: c.problem });
  lit = "lagging";
  boxes.lagging.standing = null;
  boxes.hypothesis.standing = "not yet — see below";

  // 08 · "I don't know" ③. The box inflates to hold the digging, and what comes
  // out of it is blue: an open question to take back to the team. It does not
  // get ticked and it cannot be skipped.
  if (!c.lagging) return { lit, boxes };
  if (c.lagging === DONT_KNOW) {
    boxes.lagging.digging = [
      "“I don’t know what our baseline is.”",
      "Good. Genuinely. Let’s stay here.",
      "Who would know? And has anyone ever been able to tell whether this got better?",
    ];
    if (!c.whoKnows) return { lit, boxes };
    boxes.lagging.notes.push({ kind: "open", text: c.whoKnows });
  } else {
    boxes.lagging.notes.push({ kind: "sticky", text: c.lagging });
  }

  // 09 · going backwards to ①. The coach's call and the coach's wording; the
  // canvas re-lights box one and parks box three with your words are safe.
  // Nothing about it reads as an error, a validation failure or a skip.
  if (!c.back) return { lit, boxes };
  if (c.back === "yes") {
    boxes.lagging.parked = true;
    boxes.lagging.standing = "we’ll come back — your words are safe";
    if (!c.centreAgain) {
      lit = "centre";
      return { lit, boxes };
    }
    boxes.centre.notes = [{ kind: "sticky", text: c.centreAgain, struck: c.centre }];
    boxes.lagging.parked = false;
    boxes.lagging.standing = null;
  }

  // 10 · hypothesis ④, then leading ⑤. The bet, written against a measure that
  // already exists — which is why ③ came first.
  lit = "hypothesis";
  boxes.hypothesis.standing = null;
  boxes.leading.standing = "last — what tells us in weeks?";
  if (!c.hypothesis) return { lit, boxes };
  boxes.hypothesis.notes.push({ kind: "sticky", text: c.hypothesis });
  lit = "leading";
  boxes.leading.standing = null;
  if (!c.leading) return { lit, boxes };
  boxes.leading.notes.push({ kind: "sticky", text: c.leading });

  return { lit, boxes };
}

/**
 * Everything the reader has put on the canvas, in canvas order, as one piece of
 * plain text. This is what the existing quality signal reads — see
 * `lib/nudge.ts`. It is assembled here so the signal is handed the thinking and
 * nothing else: no labels, no prompts, none of the coach's own words.
 */
export function canvasText(state: CanvasState): string {
  return CANVAS_ORDER.flatMap((box) => state.boxes[box.id].notes.map((n) => n.text))
    .join(". ")
    .trim();
}
