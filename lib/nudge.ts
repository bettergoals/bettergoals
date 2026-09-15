/**
 * The nudge — step 11 of the entry column. CARD 5, slide 14 — and the honest
 * standing at step 12. CARD 6, slide 15.
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
 *
 * Idea #155 adds `centreGapFor()` — whether the coach has a reason to take the
 * reader back to box ①, and what it asks when it gets there. It is the same
 * translation, read at step 09 instead of step 11, and it is contract 1 being
 * kept rather than extended: "the flow reads that signal to decide whether to
 * keep going", and contract 3's "the quality signal may well be what prompts the
 * coach to double back". Before it, the double-back fired on every single run
 * from a fixed position in the chain and asked one hard-coded question.
 *
 * CARD 6 adds `standingFor()` — what's sharp and what's still open at step 12,
 * read off the same signal and said in the same words. It is the same
 * translation table, split by status rather than sorted to one sentence, and it
 * is subject to every line of contract 1 above: no total, no percentage, no
 * headline number, and nothing recomputed here.
 *
 * One difference, deliberately. `standingFor()` takes no room option, because
 * the suppression in contract 1 is the nudge's: slide 14 is annotated "solo
 * mode · in a room this is off" and slide 15 carries no such annotation. Step 11
 * is one person being told what's thin; step 12 is the honest state of the thing
 * everyone in the room has been looking at. Suppressing it would leave a room
 * with three doors and no reason to pick one.
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
 *
 * `start` is the same dimension said as the thing you'd pick up next, for the
 * quiet line under the first door on slide 15 — "I'd start with the leading
 * indicators". It is wording for an element the deck already draws, not a new
 * opinion about what happens next: the door is the reader's to open or ignore.
 */
const TRANSLATION: Record<
  string,
  { label: string; start: string; strong: string; partial: string; missing: string }
> = {
  customer: {
    label: "behaviour change",
    start: "who this is for, and what they'd be doing differently",
    strong: "You've named who this is for and what they'd be doing differently.",
    partial: "There's a who, but not much about what they'd be doing differently.",
    missing: "Nothing on the canvas yet says whose behaviour changes.",
  },
  outcome: {
    label: "not a deliverable",
    start: "the difference this makes, rather than the thing you'd ship",
    strong: "This describes something getting better, not something being delivered.",
    partial: "Some of this is a change in the world; some of it is still a thing you'd ship.",
    missing: "This reads as work you'd complete rather than a change you'd cause.",
  },
  measures: {
    label: "measurable outcome",
    start: "the leading indicators — what tells you you’re on track early",
    strong: "You've said how you'd see movement and how you'd see impact.",
    partial: "There's one kind of measure here — the early signal and the impact aren't both covered.",
    missing: "Nothing here would tell you whether it moved.",
  },
  baseline: {
    label: "a number that already exists",
    start: "the baseline — where you're starting from, and by when",
    strong: "Where you're starting from, where you're heading and by when are all here.",
    partial: "Part of the baseline, target and timeframe is here; the rest isn't.",
    missing: "There's no baseline, target or timeframe to hang the bet on.",
  },
  hypothesis: {
    label: "a bet, not a certainty",
    start: "the bet underneath, written so you could be wrong about it",
    strong: "The belief underneath is explicit and testable.",
    partial: "There's a belief in here, but it isn't stated as something you could be wrong about.",
    missing: "Nothing here is written as a bet you could test in weeks.",
  },
  sowhat: {
    label: "the so what",
    start: "the so what — what's better for the organisation if this lands",
    strong: "It's clear what value this creates and why it matters now.",
    partial: "The value is implied rather than said.",
    missing: "The canvas doesn't say what's better for the organisation if this lands.",
  },
  plain: {
    label: "anyone can read it",
    start: "the wording, so someone who joined last week could read it",
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

/* ------------------------------------------------------------------------ */
/* Going back to ① — step 09, slide 12. Idea #155.                           */
/* ------------------------------------------------------------------------ */

/**
 * The dimensions box ① carries, and so the only ones a trip back to ① could
 * fix. `customer` is the box said in the engine's words — who this is for and
 * what they'd be doing differently — and `outcome` is the other half of the same
 * sentence: whether what's written there is a change in what someone does or a
 * thing you'd ship.
 *
 * The other five are deliberately not here. `measures`, `baseline` and
 * `hypothesis` are fixed in ③ and ④, where they are asked; `sowhat` and `plain`
 * are read across the whole canvas and going back to ① would not be where you'd
 * mend either. A back-step that fires on a gap box ① cannot close is the thing
 * idea #155 is removing, only with a different excuse.
 *
 * `because` is slide 12's own reason — "your lagging measure is vague because
 * 'count faster' is vague" — said for the dimension that is actually thin, and
 * `question` is what the coach asks once it is back there. The Tuesday line is
 * still here, because for a thin *behaviour* it is the right question and it is
 * the deck's; it just isn't asked about anything else any more.
 */
const BACK_TO_CENTRE: Record<
  string,
  { because: string; question: string; placeholder: string }
> = {
  customer: {
    because: "Your lagging measure can only be as sharp as the behaviour underneath it.",
    question: "What would they actually be doing, on a Tuesday?",
    placeholder: "counting a shelf in minutes, before lunch…",
  },
  outcome: {
    because: "A measure written against something you'd ship can only ever tell you that you shipped it.",
    question: "Say it as the change rather than the thing — what's different for them once it's there?",
    placeholder: "district managers trusting the count without redoing it…",
  },
};

/**
 * What the coach would go back to ① for, or `null` when it has no reason to.
 *
 * `null` is the ordinary case and the point of the whole thing: when ① is fine,
 * the conversation carries on to ④ and ⑤ and nobody is walked backwards through
 * a good answer. It is also `null` when the engine declined to read so little
 * text — its existing judgement, not a threshold applied here.
 *
 * Contract 1 holds exactly as it does above: `check.status` and nothing else,
 * no recompute, no second-guess, and nothing about it rendered as a value.
 */
export type CentreGap = {
  /** The thin dimension, in the reader's terms. The nudge's own label. */
  label: string;
  /** Why we're going back, in words — what's thin, and what it costs upstream. */
  why: string;
  /** What to ask when we get there. Derived from what's thin, never a stock line. */
  question: string;
  /** An example answer for the field, in the shape that question asks for. */
  placeholder: string;
};

export function centreGapFor(text: string): CentreGap | null {
  const signal = evaluateOutcome(text);
  if (!signal) return null;

  const thin = signal.checks
    .filter((c) => BACK_TO_CENTRE[c.id] && c.status !== "strong")
    .sort((a, b) => THINNEST[a.status] - THINNEST[b.status])[0];
  if (!thin) return null;

  const back = BACK_TO_CENTRE[thin.id];
  return {
    label: TRANSLATION[thin.id].label,
    why: `${TRANSLATION[thin.id][thin.status]} ${back.because}`,
    question: back.question,
    placeholder: back.placeholder,
  };
}

/**
 * Where this stands, honestly — step 12, slide 15. CARD 6.
 *
 * Two lists of sentences and one more sentence, all of them the same words the
 * nudge uses. Nothing here is added up, ranked against a threshold or turned
 * into a headline: `sharp` is the dimensions the signal reads as strong, `open`
 * is everything else, thinnest first, and `start` is the thinnest one said as
 * the thing you'd pick up next.
 *
 * `null` when the engine declined to read so little text — its existing
 * judgement, not a threshold applied here. The doors still open; the column just
 * doesn't put words in the coach's mouth about a canvas the engine wouldn't
 * read. What the *canvas* says about itself — an open question, a box nobody
 * wrote in — is read separately in `lib/takeaway.ts`, because that is the
 * reader's own material and needs no signal to be true.
 */
export type Standing = {
  /** What's sharp, in words. Empty is a legitimate answer, not a failure. */
  sharp: string[];
  /** What's still open, thinnest first. */
  open: string[];
  /** The one thing the coach would pick up first, for the door's quiet line. */
  start: string | null;
};

export function standingFor(text: string): Standing | null {
  const signal = evaluateOutcome(text);
  if (!signal) return null;

  const known = signal.checks.filter((c) => TRANSLATION[c.id]);
  if (known.length === 0) return null;

  const thin = known
    .filter((c) => c.status !== "strong")
    .sort((a, b) => THINNEST[a.status] - THINNEST[b.status]);

  return {
    sharp: known.filter((c) => c.status === "strong").map((c) => TRANSLATION[c.id].strong),
    open: thin.map((c) => TRANSLATION[c.id][c.status]),
    start: thin[0] ? TRANSLATION[thin[0].id].start : null,
  };
}
