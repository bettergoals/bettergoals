/**
 * The nudge — step 11 of the entry column. CARD 5, slide 14.
 *
 * This is a translation layer over the quality signal that already exists. It
 * is not a new score and it does not compute one.
 *
 * CARD A, contract 1, in full:
 *  - the engine keeps emitting its signal, unchanged, on the same terms as
 *    today. Here that engine is `evaluateOutcome()` in `lib/outcomeCoach.ts`,
 *    called exactly as `/coach` calls it and not modified by this card.
 *  - the flow reads the signal. It does not recompute, second-guess or
 *    threshold it. Everything below reads `check.status` and nothing else —
 *    never `score`, never `max`, never `band`, which is why none of them are
 *    imported.
 *  - the signal is never rendered. No total, no percentage, no grade, no gauge.
 *  - the nudge says what's thin, in words. The bar glyphs show how the gap is
 *    expressed, not a value — every glyph below is bound to the sentence that
 *    says the same thing, so nothing depends on reading a picture.
 *  - in room mode it is suppressed entirely. The signal keeps running
 *    underneath regardless, which is what `nudgeFor()` returning `null` means:
 *    nothing to show, not nothing happening.
 */

import { type Check, evaluateOutcome } from "./outcomeCoach";

/** One line of the "how it's shown" legend: a glyph, and the words it draws. */
export type NudgeBar = {
  /** The dimension, in the reader's terms rather than the engine's. */
  label: string;
  /** The glyph. Decoration: `words` carries the meaning, never this. */
  glyph: string;
  /** What that dimension is saying about the canvas, in a sentence. */
  words: string;
};

export type Nudge = {
  /** The coach opening the subject, in its voice. */
  opening: string;
  /** The gap, in words. The whole point of the translation. */
  gap: string;
  /** The legend, shown only when the reader asks to see which ones. */
  bars: NudgeBar[];
};

/**
 * The translation. One entry per check the engine emits, saying in plain words
 * what a thin reading of it means for the canvas in front of the reader.
 *
 * This is the layer CARD 5 asks for: the engine's vocabulary is the rubric's,
 * and the reader is mid-conversation about their own goal. The `label` is the
 * dimension named as the deck names it on slide 14 — "behaviour change",
 * "measurable outcome", "not a deliverable" — and the sentences are what the
 * coach would actually say out loud about it.
 */
const TRANSLATION: Record<string, { label: string; strong: string; partial: string; missing: string }> = {
  customer: {
    label: "behaviour change",
    strong: "You've named who this is for and what they'd be doing differently.",
    partial: "There's a who, but not much about what they'd be doing differently.",
    missing: "Nothing on the canvas yet says whose behaviour changes.",
  },
  outcome: {
    label: "not a deliverable",
    strong: "This describes something getting better, not something being delivered.",
    partial: "Some of this is a change in the world; some of it is still a thing you'd ship.",
    missing: "This reads as work you'd complete rather than a change you'd cause.",
  },
  measures: {
    label: "measurable outcome",
    strong: "You've said how you'd see movement and how you'd see impact.",
    partial: "There's one kind of measure here — the early signal and the impact aren't both covered.",
    missing: "Nothing here would tell you whether it moved.",
  },
  baseline: {
    label: "a number that already exists",
    strong: "Where you're starting from, where you're heading and by when are all here.",
    partial: "Part of the baseline, target and timeframe is here; the rest isn't.",
    missing: "There's no baseline, target or timeframe to hang the bet on.",
  },
  hypothesis: {
    label: "a bet, not a certainty",
    strong: "The belief underneath is explicit and testable.",
    partial: "There's a belief in here, but it isn't stated as something you could be wrong about.",
    missing: "Nothing here is written as a bet you could test in weeks.",
  },
  sowhat: {
    label: "the so what",
    strong: "It's clear what value this creates and why it matters now.",
    partial: "The value is implied rather than said.",
    missing: "The canvas doesn't say what's better for the organisation if this lands.",
  },
  plain: {
    label: "anyone can read it",
    strong: "Someone who joined last week could tell what would be different.",
    partial: "A couple of phrases here would need explaining to someone new.",
    missing: "This is written for people already in the room.",
  },
};

/**
 * The glyph. Three segments, fixed, per dimension — so nothing about it can be
 * added up, and nothing about it changes shape to report how far through you
 * are. It is drawn `aria-hidden`; the words beside it are the content.
 */
const GLYPH: Record<Check["status"], string> = {
  strong: "▰▰▰",
  partial: "▰▰▱",
  missing: "▱▱▱",
};

/** The dimensions, worst first, so the sentence the coach says is the thinnest one. */
const THINNEST: Record<Check["status"], number> = { missing: 0, partial: 1, strong: 2 };

/**
 * The nudge for what's on the canvas, or `null` when there is nothing to say.
 *
 * `null` in three cases, all of them legitimate:
 *  - room mode. Suppressed entirely — a room doesn't need one person told
 *    what's thin. The signal keeps running underneath.
 *  - the engine declined to read so little text. Better to say nothing than to
 *    score a fragment; that is the engine's existing judgement, not a threshold
 *    applied here.
 *  - nothing is thin. Then there is no gap to speak, and inventing one to fill
 *    the step would be exactly the improvisation CARD A forbids.
 */
export function nudgeFor(text: string, opts: { room: boolean }): Nudge | null {
  if (opts.room) return null;

  const signal = evaluateOutcome(text);
  if (!signal) return null;

  const known = signal.checks.filter((c) => TRANSLATION[c.id]);
  const thin = [...known].sort((a, b) => THINNEST[a.status] - THINNEST[b.status])[0];
  if (!thin || thin.status === "strong") return null;

  return {
    opening: "One thing I keep tripping over.",
    gap: `${TRANSLATION[thin.id][thin.status]} That's the gap I'd close before anything else.`,
    bars: known.map((c) => ({
      label: TRANSLATION[c.id].label,
      glyph: GLYPH[c.status],
      words: TRANSLATION[c.id][c.status],
    })),
  };
}
