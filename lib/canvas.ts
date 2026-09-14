/**
 * The canvas order — a shared constant, agreed up front and known to both sides.
 *
 * CARD A, contract 2: five boxes and the sequence they are meant to be
 * completed in. The coach follows that order and deviates where the
 * conversation demands; the UI reflects. Nothing here gives the UI an opinion
 * about what gets asked, or when.
 *
 * Source: `docs/reference/card-a.md` (the five names and the sequence) and
 * slides 8–13 of `docs/reference/voice-coach-deck.md` (the labels each box
 * carries and what it is waiting for).
 *
 * The numerals are the names CARD A gives the boxes. They are not step numbers
 * and nothing derived from them may report progress — see rule 5.
 */
export type CanvasBoxId = "centre" | "problem" | "lagging" | "hypothesis" | "leading";

export type CanvasBox = {
  /** Stable id. What the coach's box signal will eventually name. */
  id: CanvasBoxId;
  /** The numeral CARD A names the box with — ①…⑤. */
  numeral: string;
  /** The label the box carries, from the deck. */
  label: string;
  /** What the box is waiting for, before anything has been said into it. */
  waiting: string;
  /**
   * The box in one clause, for the walk-through the coach gives before the
   * first question — idea #131. Written to be read in a list of five, in
   * order, so each one is a phrase rather than a sentence. See `canvasTour`.
   */
  tour: string;
  /**
   * The box's name in a sentence — "we'll start in **the centre**". Used where
   * the canvas has to refer to itself in one line, as it does on the mobile
   * summary at slide 8 and again at slide 9.
   */
  short: string;
};

export const CANVAS_ORDER: readonly CanvasBox[] = [
  {
    id: "centre",
    numeral: "①",
    // "Who is this for" tested badly — idea #131: people read it as who the
    // work is being done for, which is usually their own boss. Slide 9 titles
    // this box "Centre ① — customer and behaviour change", so naming the
    // customer here is the deck's own intent said in the deck's own word.
    // Customer, colleague or citizen: PRINCIPLES.md is what makes that clear,
    // and the coach says it in their language, not ours.
    label: "Who is the customer · what changes in their behaviour",
    waiting: "we start in the middle",
    tour: "who the customer is, and what they’d be doing differently",
    short: "the centre",
  },
  {
    id: "problem",
    numeral: "②",
    label: "Driver → problem",
    // Slide 8 puts the coach's route on the two boxes that would otherwise read
    // as skipped. It is the shared order said out loud, not a step number and
    // not a count — see rule 5.
    waiting: "Due to… — I’ll ask you next",
    tour: "what’s in their way today",
    short: "the problem",
  },
  {
    id: "lagging",
    numeral: "③",
    label: "Lagging",
    waiting: "what would convince a sceptic?",
    tour: "how you’d know it landed — what would convince a sceptic",
    short: "lagging",
  },
  {
    id: "hypothesis",
    numeral: "④",
    label: "Outcome hypothesis",
    waiting: "We believe that… — later, on purpose",
    tour: "the bet itself, which comes after the measure on purpose",
    short: "the hypothesis",
  },
  {
    id: "leading",
    numeral: "⑤",
    label: "Leading",
    waiting: "what tells us in weeks?",
    tour: "what tells us in weeks",
    short: "leading",
  },
];

/**
 * The canvas walked through once, out loud, before a word lands in it — the
 * high-level overview idea #131 asks for at the seam. "The transition to the
 * Canvas is too harsh": arriving at five boxes with no idea what they are or
 * which order they get worked is what made it harsh.
 *
 * It is the shared order said in a sentence (CARD A, contract 2), built from
 * `CANVAS_ORDER` so a tour can never describe a canvas the coach isn't running.
 * It is not a plan, a count or a promise: no total, no "five things", nothing
 * derived from it reports progress — rule 5 holds here as everywhere else.
 */
export function canvasTour(): string {
  const clauses = CANVAS_ORDER.map((box) => box.tour);
  return `${clauses.slice(0, -1).join(", then ")}, and last, ${clauses[clauses.length - 1]}`;
}

/**
 * The box the canvas opens on. It is the first box in the shared order, by
 * definition — CARD A, contract 2 — not a decision this file gets to make, and
 * not the UI having an opinion about what the coach asks first.
 */
export const CANVAS_OPENS_ON: CanvasBox = CANVAS_ORDER[0];
