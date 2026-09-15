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
 * ## Boxes that hold more than one thing (idea #147)
 *
 * Two of the deck's assumptions were the column's rather than the canvas's, and
 * both made the goal worse:
 *
 *  - ⑤ held one measure. `/okrs` — binding, per CARD A — asks for three to five
 *    key results, of which one is the lagging indicator, so the box that holds
 *    the leading ones holds a *set*. See `LEADING_MAX` and `ENOUGH`.
 *  - a box could only be written into once. Contract 3 says out-of-order moves
 *    are the coach's and going back is a normal move, so every box that holds
 *    the reader's own words can be said into again: the new wording is what the
 *    box carries and the old one stays with it, struck through. See `WORDINGS`
 *    and `earlier`.
 *
 * Neither adds a step, a control or a count. The order is still the order.
 *
 * Two things this file deliberately does not do:
 *  - it does not decide the route. The lit box, the jump at step 07 and the
 *    double-back at step 09 are the coach's calls with the coach's wording,
 *    transcribed from the deck. Nothing here reads the reader's answer and
 *    forms an opinion about where the conversation should go next — including
 *    `backToCentre()`, which asks the existing quality signal whether there is
 *    anything upstream worth going back for and does no judging of its own.
 *    Before idea #155 the double-back fired unconditionally, from a fixed
 *    position in this chain, on every run there has ever been; CARD A contract 1
 *    always said the flow reads that signal to decide whether to keep going, and
 *    contract 3 that the signal "may well be what prompts the coach to double
 *    back". This is that, kept.
 *  - it does not count. No step numbers, no totals, no "n of five". The boxes
 *    filling in are the only orientation there is.
 */

import { COLUMN_PATH } from "./config";
import { CANVAS_ORDER, type CanvasBoxId } from "./canvas";
import { centreGapFor, type CentreGap } from "./nudge";
import { KEY_RESULTS } from "./okrPattern";
import { BROUGHT_MAX, NAME_MAX, type Run, type TriageAnswer } from "./triage";

/** The longest answer we'll carry on the canvas. A UX bound, not a safety one. */
export const ANSWER_MAX = 180;

/**
 * How many leading indicators box ⑤ will hold — idea #147.
 *
 * Not a number this file gets to choose. `/okrs` is how Sooner Safer Happier
 * frame goals and CARD A makes it binding on the coach: an OKR carries three to
 * five key results, one of them the lagging indicator and the rest leading. The
 * box held exactly one, which is the shape the pack calls NOT OK — a single
 * number that tells you at the end whether you were right and nothing before
 * it. It is a ceiling, never a target: one early signal is a finished canvas,
 * and nothing counts what is in the box or calls it short.
 */
export const LEADING_MAX = KEY_RESULTS.leading.max;

/**
 * "That's the set" — the answer that closes box ⑤ without adding to it.
 *
 * ⑤ is the one box that can take more than one answer, so it is the one box
 * that needs a way to say *enough*. It is the reader's call, never a count
 * reaching a limit: the coach asks whether anything else would tell them early,
 * and this is the other answer to that question. Weighted like `DONT_KNOW` and
 * for the same reason — stopping at one is not stopping short.
 */
export const ENOUGH = "set";

/** "That's the set", offered beside the field once one early signal has landed. */
export const ENOUGH_ANSWER: TriageAnswer = {
  value: ENOUGH,
  label: "That’s the set",
  aside: "one you can act on beats four you can’t",
  chip: "that’s the set",
  /**
   * What it can sound like. Every one of them is a whole phrase, and the bare
   * words — "enough", "done", "no more" — are deliberately not here: this is
   * the one question whose free-text answer is a *measure*, and "no more than
   * five minutes a shelf" or "counts done before lunch" is a measure, not
   * somebody closing the box. `matchSpoken` matches on whole words anywhere in
   * what was said, so a one-word phrase here would quietly eat their answer.
   */
  phrases: [
    "that's the set",
    "thats the set",
    "that's it",
    "thats it",
    "that's all",
    "thats all",
    "that's enough",
    "thats enough",
    "nothing else",
    "that'll do",
    "thatll do",
    "we're done",
    "were done",
    "i'm done",
    "im done",
    "leave it there",
    // A browser that transcribes a curly apostrophe lands here instead: see
    // `DONT_KNOW_ANSWER` for why the space-separated forms are listed too.
    "that s the set",
    "that s it",
    "that s all",
    "that s enough",
    "that ll do",
    "we re done",
    "i m done",
  ],
};

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
 * The boxes that hold the reader's own words, rather than a choice between
 * answers the column put on screen — so the boxes a later answer can sharpen.
 *
 * CARD A, contract 3: going back is the coach's call and a normal move, and the
 * canvas "strikes through the old sticky and writes the new one". Every field
 * here can be said into twice: the second wording is what the box carries, the
 * first stays with it, struck through. ⑤ is deliberately not in this list — it
 * accumulates a set rather than replacing a wording. See `earlier`.
 */
export const WORDINGS = [
  "centre",
  "problem",
  "lagging",
  "whoKnows",
  "centreAgain",
  "hypothesis",
] as const;

export type Wording = (typeof WORDINGS)[number];

/**
 * One more thing said, on its way into the link that carries the run: the field
 * it lands in and the words, or `null` to take it off the canvas again.
 *
 * It is a field and a string rather than a slice of `Coaching` because what
 * arrives is always one answer — and what that answer *does* to the box is this
 * module's business, not the caller's. Landing in ⑤ adds a key result; landing
 * anywhere else sharpens a wording and keeps what it replaced.
 */
export type Landing = Partial<
  Record<keyof Run | Wording | "leading" | "back" | "nudge" | "out", string | null>
>;

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
  /**
   * 09 · the reader's answer to "can I take you back a step?" — asked only when
   * the coach has a reason to ask it. See `backToCentre()`.
   */
  back: "yes" | "no" | null;
  /** 09 · the sharper wording for ①. The old words are struck through, not lost. */
  centreAgain: string | null;
  /** 10 · hypothesis ④. The bet. */
  hypothesis: string | null;
  /**
   * 10 · leading ⑤. What tells us we’re on track, long before the outcome is
   * due — the *set* of them, in the order they were said, up to `LEADING_MAX`.
   *
   * A list rather than a string since idea #147: Sooner Safer Happier ask for
   * three to five key results, and only one of those is the lagging indicator.
   * Empty is the box before anything has landed in it; one is a finished canvas.
   */
  leading: string[];
  /**
   * Whether the reader has said that's the set — `ENOUGH`, or the box full.
   * The conversation moves on from ⑤ when they say so, never when a count is
   * reached: there is no target number of measures and nothing says how many.
   */
  leadingSet: boolean;
  /**
   * The wording a later answer replaced, per box. Kept, and struck through on
   * the canvas — nothing the reader said is ever cleared away by sharpening it.
   * One per box: the most recent thing it replaced, which is what the deck's
   * own double-back at step 09 shows.
   */
  earlier: Partial<Record<Wording, string>>;
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
  leading: [],
  leadingSet: false,
  earlier: {},
  nudge: null,
  out: null,
};

/* ------------------------------------------------------------------------ */
/* Reading the run                                                           */
/* ------------------------------------------------------------------------ */

/**
 * Everything said into one box, in the order it was said.
 *
 * A box can be written into more than once — sharpened later (every box), or
 * added to (⑤). The query string is the only place any of it lives, so the
 * repeats are the same key repeated, and the order they arrive in is the order
 * they were said in. What that repetition *means* is the box's business, not
 * this function's: `readCoaching` reads ⑤ as a set and everything else as a
 * wording and the wording it replaced.
 */
function said(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return values
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().slice(0, ANSWER_MAX))
    .filter(Boolean);
}

/** The current value of a field that only ever holds one — the last one said. */
function first(value: string | string[] | undefined): string | null {
  const values = said(value);
  return values.length > 0 ? values[values.length - 1] : null;
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/**
 * Step 08 is finished when the reader has given a measure, or — having said "I
 * don't know" — has said who would know. The second is not a lesser answer: it
 * is the open question they take back to their team.
 */
export function laggingSettled(c: Coaching): boolean {
  return Boolean(c.lagging) && (c.lagging !== DONT_KNOW || Boolean(c.whoKnows));
}

/**
 * The words in ①②③ as they were when the measure landed — the canvas the coach
 * is looking at when it decides whether to go back. Same three notes
 * `canvasText` would hand over, assembled without going through `canvasFor` so
 * that the fold can ask this question without asking itself.
 *
 * It reads `centre` rather than `centreAgain` on purpose: this is the state the
 * decision was made in, so once the coach has gone back, the sharper wording
 * landing in ① cannot retrospectively unmake the trip that produced it.
 */
function upstreamText(c: Coaching): string {
  const measure = c.lagging === DONT_KNOW ? c.whoKnows : c.lagging;
  return [c.centre, c.problem, measure].filter(Boolean).join(". ").trim();
}

/**
 * Whether the coach takes them back to ①, and what it asks when it does — or
 * `null`, which is the ordinary case: box ① is fine, there is no detour, and the
 * conversation carries on to ④ and ⑤.
 *
 * The call is the signal's, not this file's. `centreGapFor` reads the same
 * engine the nudge reads, on the same terms (CARD A, contract 1), and looks only
 * at the dimensions box ① is the place to mend. Nothing here thresholds it,
 * nothing renders it as a value, and the trip is still a question the reader can
 * decline.
 */
export function backToCentre(c: Coaching): CentreGap | null {
  if (!laggingSettled(c)) return null;
  return centreGapFor(upstreamText(c));
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

  /* A box's current wording, and the wording it replaced. Said into twice means
     the coach came back and sharpened it — the second is what the box carries
     and the first stays, struck through. Never an edit: nothing is lost. */
  const earlier: Partial<Record<Wording, string>> = {};
  const wording = (key: Wording, asked: boolean): string | null => {
    if (!asked) return null;
    const words = said(params[key]);
    if (words.length === 0) return null;
    const now = words[words.length - 1];
    const before = words[words.length - 2];
    if (before && before !== now) earlier[key] = before;
    return now;
  };

  const centre = wording("centre", true);
  const problem = wording("problem", Boolean(centre));
  const lagging = wording("lagging", Boolean(problem));
  const digging = lagging === DONT_KNOW;
  const whoKnows = wording("whoKnows", digging);
  // Step 08 is finished when the reader has given a measure, or — having said
  // "I don't know" — has said who would know. The second is not a lesser
  // answer: it is the open question they take back to their team.
  const settled = laggingSettled({ ...NO_COACHING, lagging, whoKnows });
  /* 09 · the double-back exists only when the signal says box ① has something
     in it worth going back for (idea #155). No gap, no question — and so no
     `back` and no `centreAgain` to read, whatever the address bar says.

     Idea #147 keeps that gate and changes only what happens once it opens: the
     sharper wording goes through `wording()`, so the words it replaces stay on
     the canvas struck through rather than being overwritten. */
  const gap = settled ? backToCentre({ ...NO_COACHING, centre, problem, lagging, whoKnows }) : null;
  const back = gap ? oneOf(first(params.back), ["yes", "no"] as const) : null;
  const centreAgain = wording("centreAgain", back === "yes");
  // Past ① and on to the bet: either the coach never stopped there, or it did
  // and the reader has answered — by pushing on, or by sharpening the wording.
  const moved = settled && (!gap || back === "no" || Boolean(centreAgain));
  const hypothesis = wording("hypothesis", moved);

  /* ⑤ is the one box that takes more than one answer — the leading indicators,
     which Sooner Safer Happier count three or four of against a single lagging
     one. Every value is a key result and stays one; `ENOUGH` is the reader
     saying that's the set, and is not itself a measure. */
  const intoLeading = hypothesis ? said(params.leading) : [];
  const leading = intoLeading.filter((v) => v !== ENOUGH).slice(0, LEADING_MAX);
  const leadingSet =
    leading.length > 0 &&
    (intoLeading[intoLeading.length - 1] === ENOUGH || leading.length >= LEADING_MAX);

  const nudge = leadingSet ? oneOf(first(params.nudge), ["show", "later"] as const) : null;
  // The doors exist once the last answer has landed. Whether they are on screen
  // is the column's call, because the nudge sits between the two and a room
  // never gets one — but nothing can be *through* a door before the canvas is.
  const out = leadingSet ? oneOf(first(params.out), DOORS) : null;

  return {
    centre,
    problem,
    lagging,
    whoKnows,
    back,
    centreAgain,
    hypothesis,
    leading,
    leadingSet,
    earlier,
    nudge,
    out,
  };
}

/**
 * Every link in the column carries the whole run — the triage answers and the
 * coaching both — because the query string is the only place any of it lives.
 * Close the tab and it is gone.
 */
export function columnHref(
  run: Run,
  coaching: Coaching,
  next: Landing = {},
  hash = "#live",
): string {
  const merged = { ...run, ...coaching, ...next };
  const q = new URLSearchParams();
  const put = (key: string, value: string | null | undefined) => {
    if (value) q.set(key, String(value).slice(0, ANSWER_MAX));
  };

  /* A box the reader has said something into. Three things can happen to it:
     nothing (it carries what it carried, including the wording it replaced),
     a new wording (the old one goes with it, struck through), or `null` — the
     reader taking their own words back off the canvas, which takes the earlier
     wording with them because they never asked for it to be kept. */
  const box = (key: Wording) => {
    const now = coaching[key];
    const before = coaching.earlier[key];
    const said = next[key];
    const values =
      said === null
        ? []
        : said === undefined || said === now
          ? [before, now]
          : now
            ? [now, said]
            : [said];
    for (const value of values) if (value) q.append(key, value.slice(0, ANSWER_MAX));
  };

  put("mode", merged.mode);
  put("who", merged.who);
  if (merged.name) q.set("name", merged.name.slice(0, NAME_MAX));
  if (merged.brought) q.set("brought", merged.brought.slice(0, BROUGHT_MAX));
  put("share", merged.share);
  put("voice", merged.voice);
  box("centre");
  box("problem");
  box("lagging");
  box("whoKnows");
  put("back", merged.back);
  box("centreAgain");
  box("hypothesis");

  /* ⑤, the box that holds a set. A new measure is added to what is there
     rather than replacing it — that is the whole of what "more than one
     measure" means here — and `ENOUGH` closes the set without joining it. */
  const intoLeading = next.leading;
  let measures = intoLeading === null ? [] : [...coaching.leading];
  let closed = intoLeading === null ? false : coaching.leadingSet;
  if (intoLeading === ENOUGH) {
    closed = measures.length > 0;
  } else if (intoLeading != null && !measures.includes(intoLeading)) {
    measures = [...measures, intoLeading].slice(0, LEADING_MAX);
  }
  for (const measure of measures) q.append("leading", measure.slice(0, ANSWER_MAX));
  if (closed && measures.length > 0 && measures.length < LEADING_MAX) q.append("leading", ENOUGH);

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

/**
 * A run's own URL read back into the shape `readRun` and `readCoaching` take.
 *
 * It exists because `Object.fromEntries(searchParams)` — which is what both
 * readers used to be handed outside a page — keeps only the last value of a
 * repeated key, and a box said into twice is exactly a repeated key. Every
 * earlier wording and every key result but the last silently disappeared.
 *
 * Next's own `searchParams` already hands a page `string | string[]`, which is
 * why the column itself never had the bug. This is the same shape, built by
 * hand, for the two places that start from a URL instead: the voice coach
 * landing an answer, and the takeaway route.
 */
export function paramsFrom(url: URL): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  for (const [key, value] of url.searchParams.entries()) {
    const already = params[key];
    params[key] =
      already === undefined ? value : Array.isArray(already) ? [...already, value] : [already, value];
  }
  return params;
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
  boxes.centre.notes.push({ kind: "sticky", text: c.centre, struck: c.earlier.centre });
  lit = "problem";

  // 07 · problem ②, then the jump to ③. The coach names its own route on the
  // two boxes that would otherwise read as skipped — said out loud, in the flow
  // of talk. Never a diagram and never "step 3 of 5".
  boxes.lagging.standing = "up next, before the bet";
  if (!c.problem) return { lit, boxes };
  boxes.problem.notes.push({ kind: "sticky", text: c.problem, struck: c.earlier.problem });
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
    boxes.lagging.notes.push({ kind: "open", text: c.whoKnows, struck: c.earlier.whoKnows });
  } else {
    boxes.lagging.notes.push({ kind: "sticky", text: c.lagging, struck: c.earlier.lagging });
  }

  // 09 · going backwards to ①, when there is something up there worth going
  // back for. The coach's call and the coach's wording; the canvas re-lights box
  // one and parks box three with your words are safe. Nothing about it reads as
  // an error, a validation failure or a skip — and when ① is fine it does not
  // happen at all, which is the whole of idea #155.
  const gap = backToCentre(c);
  if (gap) {
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
  }

  // 10 · hypothesis ④, then leading ⑤. The bet, written against a measure that
  // already exists — which is why ③ came first.
  lit = "hypothesis";
  boxes.hypothesis.standing = null;
  boxes.leading.standing = "last — what tells us we’re on track early?";
  if (!c.hypothesis) return { lit, boxes };
  boxes.hypothesis.notes.push({ kind: "sticky", text: c.hypothesis, struck: c.earlier.hypothesis });
  lit = "leading";
  boxes.leading.standing = null;
  if (c.leading.length === 0) return { lit, boxes };

  /* ⑤ holds the set. Each early signal is its own sticky, because each is its
     own key result — and while the box is still open it says so in its own
     words rather than by counting what is in it. Idea #147. */
  for (const measure of c.leading) boxes.leading.notes.push({ kind: "sticky", text: measure });
  if (!c.leadingSet) boxes.leading.standing = "anything else that would tell us early?";

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
