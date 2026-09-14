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
};

export const CANVAS_ORDER: readonly CanvasBox[] = [
  {
    id: "centre",
    numeral: "①",
    label: "Who is this for · what changes in their behaviour",
    waiting: "we start in the middle",
  },
  {
    id: "problem",
    numeral: "②",
    label: "Driver → problem",
    waiting: "Due to…",
  },
  {
    id: "lagging",
    numeral: "③",
    label: "Lagging",
    waiting: "what would convince a sceptic?",
  },
  {
    id: "hypothesis",
    numeral: "④",
    label: "Outcome hypothesis",
    waiting: "We believe that…",
  },
  {
    id: "leading",
    numeral: "⑤",
    label: "Leading",
    waiting: "what tells us in weeks?",
  },
];
