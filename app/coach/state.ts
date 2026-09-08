import type { CoachReview, CoachTurn } from "@/lib/coachAi";
import type { Evaluation } from "@/lib/outcomeCoach";

/**
 * Everything the page needs to render one moment of the conversation. It is
 * the whole state: nothing lives on the server between requests, so the form
 * carries the questions and answers so far back up as hidden fields, and the
 * next review is of the draft as clarified by them.
 */
export type CoachState = {
  draft: string;
  /** Questions the coach has asked and the author has answered. */
  turns: CoachTurn[];
  /** The AI review, when the coach could run. */
  review: CoachReview | null;
  /** The structural check, shown when the coach can't run (no key, or an error). */
  fallback: Evaluation | null;
  /** Why the structural check is being shown instead of the coach. */
  fallbackReason: string | null;
  /** Something to tell the author that isn't a review — e.g. "your draft was replaced". */
  notice: string | null;
  /** The draft was too short to review at all. */
  tooShort: boolean;
  /** The author asked to start again, so the draft and the conversation were cleared. */
  cleared: boolean;
  /** Bumps on every submission so the client can key its transient UI. */
  seq: number;
};

export const INITIAL_STATE: CoachState = {
  draft: "",
  turns: [],
  review: null,
  fallback: null,
  fallbackReason: null,
  notice: null,
  tooShort: false,
  cleared: false,
  seq: 0,
};
