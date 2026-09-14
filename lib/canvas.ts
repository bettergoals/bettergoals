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
    label: "Who is this for · what changes in their behaviour",
    waiting: "we start in the middle",
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
    short: "the problem",
  },
  {
    id: "lagging",
    numeral: "③",
    label: "Lagging",
    waiting: "what would convince a sceptic?",
    short: "lagging",
  },
  {
    id: "hypothesis",
    numeral: "④",
    label: "Outcome hypothesis",
    waiting: "We believe that… — later, on purpose",
    short: "the hypothesis",
  },
  {
    id: "leading",
    numeral: "⑤",
    label: "Leading",
    waiting: "what tells us in weeks?",
    short: "leading",
  },
];

/**
 * The box the canvas opens on. It is the first box in the shared order, by
 * definition — CARD A, contract 2 — not a decision this file gets to make, and
 * not the UI having an opinion about what the coach asks first.
 */
export const CANVAS_OPENS_ON: CanvasBox = CANVAS_ORDER[0];
