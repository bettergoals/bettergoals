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
 *    forms an opinion about where the conversation should go next — including
 *    `backToCentre()`, which asks the existing quality signal whether there is
 *    anything upstream worth going back for and does no judging of its own.
 *    Before idea #155 the double-back fired unconditionally, from a fixed
 *    position in this chain, on every run there has ever been; CARD A contract 1
 *    always said the flow reads that signal to decide whether to keep going, and
 *    contract 3 that the signal "may well be what prompts the coach to double
 *    back". This is that, kept. The same is true of the sharpening rounds added
 *    by idea #157: `sharpenFor()` says which dimension is at nothing and which
 *    box mends it, and `fold()` walks there. Nothing here forms an opinion about
 *    a canvas.
 *  - it does not count. No step numbers, no totals, no "n of five". The boxes
 *    filling in are the only orientation there is.
 */

import { COLUMN_PATH } from "./config";
import { CANVAS_ORDER, type CanvasBoxId } from "./canvas";
import { centreGapFor, sharpenFor, type CentreGap, type Sharpen } from "./nudge";
import { BROUGHT_MAX, NAME_MAX, type Run, type TriageAnswer } from "./triage";

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
  /**
   * 09 · the reader's answer to "can I take you back a step?" — asked only when
   * the coach has a reason to ask it. See `backToCentre()`.
   */
  back: "yes" | "no" | null;
  /** 09 · the sharper wording for ①. The old words are struck through, not lost. */
  centreAgain: string | null;
  /** 10 · hypothesis ④. The bet. */
  hypothesis: string | null;
  /** 10 · leading ⑤. What tells us we’re on track, long before the outcome is due. */
  leading: string | null;
  /**
   * 11a · the sharpening. One entry per round the coach has taken back into a
   * box that already had an answer in it, in the order it took them, each one
   * the reader's own words — or `ENOUGH`, which ends the sharpening.
   *
   * Append-only, and deliberately not keyed by box: where a round went is
   * recomputed from the canvas as it stood before it, never carried. See
   * `sharpenRounds()` and
   * `docs/decisions/0006-sharpening-rounds-are-derived.md`.
   */
  sharpening: string[];
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
  sharpening: [],
  nudge: null,
  out: null,
};

/**
 * How many times the coach will go back into the canvas before it stops asking —
 * idea #157, and the whole of what "bounded" means here.
 *
 * Three, fixed. Not "until every dimension clears", which is a pass/fail gate
 * the reader cannot get past, and not one, which would leave a canvas thin in
 * two places no better off. A round also never repeats a dimension
 * (`sharpenFor`), and `ENOUGH` ends the lot — so three is a ceiling and not a
 * quota, and nothing anywhere counts down to it on screen.
 */
export const SHARPEN_ROUNDS = 3;

/**
 * "Leave it there" — the answer to a sharpening question that isn't an answer at
 * all, and ends the sharpening on the spot.
 *
 * It sits beside the field, weighted like every other answer in this column, and
 * it is what keeps this from being a gate: the assessment decides whether the
 * coach *keeps coaching*, never whether the reader is allowed to leave.
 */
export const ENOUGH = "leave-it";

export const ENOUGH_ANSWER: TriageAnswer = {
  value: ENOUGH,
  label: "Leave it there",
  aside: "I’ll take it as it is",
  chip: "left as it was",
  /* Said out loud, this answer sits beside a field the reader is otherwise
     answering in their own words — so every phrase here has to be one nobody
     says by accident in the middle of a sentence about their goal. "Move on",
     "carry on" and "push on" were all in here and all came out: `matchSpoken`
     looks for them anywhere in what was said, and "…so the shelf count can move
     on" is an answer, not a request to stop. */
  phrases: [
    "leave it there",
    "leave it as it is",
    "take it as it is",
    "rather leave it",
    "that'll do",
    "thatll do",
    "that will do",
  ],
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
 * Since idea #157 the order is no longer entirely fixed — the tail of it is the
 * sharpening rounds, and how many there are and where they go depends on what
 * the reader wrote. The gating is the same gating all the same: the run is still
 * only ever a prefix, and each step of the prefix is still checked against what
 * the coach would have asked at that point. What changed is that the check is
 * computed rather than written down. See
 * `docs/decisions/0006-sharpening-rounds-are-derived.md`.
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
  const settled = laggingSettled({ ...NO_COACHING, lagging, whoKnows });
  /* 09 · the double-back exists only when the signal says box ① has something
     in it worth going back for (idea #155). No gap, no question — and so no
     `back` and no `centreAgain` to read, whatever the address bar says. */
  const gap = settled ? backToCentre({ ...NO_COACHING, centre, problem, lagging, whoKnows }) : null;
  const back = gap ? oneOf(first(params.back), ["yes", "no"] as const) : null;
  const centreAgain = back === "yes" ? first(params.centreAgain) : null;
  // Past ① and on to the bet: either the coach never stopped there, or it did
  // and the reader has answered — by pushing on, or by sharpening the wording.
  const moved = settled && (!gap || back === "no" || Boolean(centreAgain));
  const hypothesis = moved ? first(params.hypothesis) : null;
  const leading = hypothesis ? first(params.leading) : null;

  /* 11a · the sharpening rounds, read the same way and on the same terms: one at
     a time, each one gated on the coach having had a reason to ask it.

     The reason is not in the query string and cannot be put there. `sharpenRounds`
     folds the rounds already read onto the canvas and asks the signal what is
     still at nothing; only if it answers is `sharpenN` read at all. So a
     hand-edited URL can supply words for a round — they are the reader's words,
     they are welcome to them — but not a round the coach never offered, and not
     one aimed at a box the canvas didn't send it to. Decision 0006. */
  const sharpening: string[] = [];
  if (leading) {
    const said = { ...NO_COACHING, centre, problem, lagging, whoKnows, back, centreAgain, hypothesis, leading };
    for (let i = 0; i < SHARPEN_ROUNDS; i++) {
      const rounds = sharpenRounds({ ...said, sharpening });
      const waiting = rounds.length > 0 && rounds[rounds.length - 1].said === null;
      if (!waiting) break;
      const answer = first(params[`sharpen${i + 1}`]);
      if (!answer) break;
      sharpening.push(answer);
      if (answer === ENOUGH) break;
    }
  }
  /* Past the sharpening: either the coach had nothing to go back for, or it has
     been back as far as it goes, or the reader said leave it. Until then there is
     no nudge and no door, whatever the address bar says — a run cannot be
     finished while the coach is mid-question. */
  const sharpened =
    Boolean(leading) &&
    !sharpenRounds({ ...NO_COACHING, centre, problem, lagging, whoKnows, back, centreAgain, hypothesis, leading, sharpening })
      .some((round) => round.said === null);

  const nudge = sharpened ? oneOf(first(params.nudge), ["show", "later"] as const) : null;
  // The doors exist once the last answer has landed. Whether they are on screen
  // is the column's call, because the nudge sits between the two and a room
  // never gets one — but nothing can be *through* a door before the canvas is.
  const out = sharpened ? oneOf(first(params.out), DOORS) : null;

  return { centre, problem, lagging, whoKnows, back, centreAgain, hypothesis, leading, sharpening, nudge, out };
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
  if (merged.name) q.set("name", merged.name.slice(0, NAME_MAX));
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
  /* The sharpening rounds, numbered in the order they were taken. The number is
     the position in the chain and nothing else — it names no box, and it is
     never shown to anyone. Decision 0006. */
  (merged.sharpening ?? []).slice(0, SHARPEN_ROUNDS).forEach((said, i) => put(`sharpen${i + 1}`, said));
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
 * The canvas up to the last of the coach's fixed questions — steps 06–10.
 *
 * Every move in here is the coach's, transcribed from slides 9–14: the jump
 * past ④ to ③ at step 07, the box that inflates at 08, the double-back to ① at
 * 09, and the order it returns in. The fold renders them; it does not choose
 * them.
 *
 * What comes after it — the sharpening rounds — is in `fold()` below, because
 * where those go is read off this canvas rather than written down anywhere.
 */
function beforeSharpening(c: Coaching): CanvasState {
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
  boxes.hypothesis.notes.push({ kind: "sticky", text: c.hypothesis });
  lit = "leading";
  boxes.leading.standing = null;
  if (!c.leading) return { lit, boxes };
  boxes.leading.notes.push({ kind: "sticky", text: c.leading });

  return { lit, boxes };
}

/**
 * One sharpening round: where the coach went back to and what it asked, and the
 * reader's answer to it — `null` on the one still waiting, of which there is
 * never more than one.
 */
export type Round = { ask: Sharpen; said: string | null };

/**
 * The whole canvas, and the rounds that shaped the tail of it — idea #157.
 *
 * The loop is the decision record in ten lines. Each time round: hand the canvas
 * *as it stands* to the signal, and if a dimension is at nothing, that is a
 * round — the box it names, the question it asks. The reader's answer for that
 * position, if there is one, goes into that box as a second sticky, and the next
 * turn of the loop reads the canvas again, now including it.
 *
 * So the destination is derived every time, from material that is all on screen,
 * and nothing about where a round went is carried anywhere. That is what keeps a
 * hand-edited URL from faking a conversation once the run stops being a fixed
 * sequence of questions. See
 * `docs/decisions/0006-sharpening-rounds-are-derived.md`.
 *
 * Three bounds, all of them here: `SHARPEN_ROUNDS`, never the same dimension
 * twice (`asked`), and `ENOUGH` ending it outright. None of them is counted out
 * loud anywhere.
 *
 * As everywhere else in this file, the route is not this module's opinion: the
 * signal says what is thin, `lib/nudge.ts` says which box mends it, and this
 * only folds the result.
 */
function fold(c: Coaching): { state: CanvasState; rounds: Round[] } {
  const state = beforeSharpening(c);
  const rounds: Round[] = [];
  // Sharpening exists only once the coach has run out of its own questions —
  // before ⑤ has landed there is a next box to go to, and going back instead
  // would be the coach interrupting itself.
  if (!c.leading) return { state, rounds };

  const asked: string[] = [];
  for (let i = 0; i < SHARPEN_ROUNDS; i++) {
    const ask = sharpenFor(canvasText(state), asked);
    if (!ask) break;
    const said = c.sharpening[i] ?? null;
    rounds.push({ ask, said });
    // The round still waiting. The canvas re-lights that box, because that is
    // where the conversation now is — the same move the double-back makes.
    if (!said) {
      state.lit = ask.box;
      break;
    }
    if (said === ENOUGH) break;
    // Appended, never replacing. The earlier wording was not wrong, it was
    // thin, so there is nothing here to strike through.
    state.boxes[ask.box].notes.push({ kind: "sticky", text: said });
    asked.push(ask.id);
  }

  return { state, rounds };
}

/** The canvas as it stands, folded from what the reader has said. */
export function canvasFor(c: Coaching): CanvasState {
  return fold(c).state;
}

/**
 * The sharpening rounds this run has, in order. The last one has `said === null`
 * when the coach is waiting on it; when they are all answered, or there was
 * never anything to go back for, the conversation is at the doors.
 */
export function sharpenRounds(c: Coaching): Round[] {
  return fold(c).rounds;
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
