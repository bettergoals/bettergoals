# 0005 — The canvas holds the pattern `/okrs` teaches

**Status:** decided, 15 September 2026
**Decides:** [Ensure the AI Voice Coach is using or referencing how SSH thinks about OKRs](https://github.com/bettergoals/bettergoals/issues/147)
**Binding on:** the coach — both of them — and anything later that touches the
canvas, the measures, or what the coach is told about goals.
**Follows from:** [`../reference/card-a.md`](../reference/card-a.md) — this is
the precedence rule in it, applied.

## The decision

**Where the coach and `/okrs` disagree about goals, `/okrs` wins — in the
coach's brief, in the canvas, and in what leaves here.** Three consequences,
all of them now built:

1. **Both coaches are handed the pattern.** `sshOkrBrief()` in
   `lib/okrPattern.ts` renders the Sooner Safer Happier OKR pattern from the
   same constants the `/okrs` page renders, and it is part of the system prompt
   for the voice coach (`lib/voiceColumn.ts`) and the `/coach` reviewer
   (`lib/coachAi.ts`). Neither had ever been told it.
2. **Box ⑤ holds a set, not a measure.** The pattern is three to five key
   results: one lagging indicator, and three or four leading ones. ③ holds the
   lagging measure; ⑤ takes the leading ones one at a time until the reader says
   that's the set. `KEY_RESULTS` in `lib/okrPattern.ts` is the only place those
   numbers are written down.
3. **Every box the reader has said words into can be reopened, at any point in
   the conversation.** The new wording is what the box carries; the old one
   stays beside it, struck through.

## Why

CARD A says it in as many words:

> **OKRs** — how Sooner Safer Happier thinks about and applies OKRs. This is the
> domain content the coaching is actually teaching. The canvas, the prompts and
> the way a goal is framed all have to be consistent with it.
>
> Precedence: principles first, then the OKRs page, then this deck.

They were not consistent with it. `lib/coachAi.ts` said *"One primary measure
beats seven"* and *"Prefer one primary measure plus at most one guardrail"*;
`lib/outcomeCoach.ts` told people to *"resist adding a third"*. The page they
were meant to agree with says three to five, and shows an OKR with five as the
example of a good one. A leader who took the coaching got the shape the pack
calls **NOT OK**: a single lagging number that tells you at the end whether you
were right, and nothing before it.

Going back was the same shape of gap. CARD A, contract 3, is unambiguous that
out-of-order moves are the coach's to make and that "going backwards is a normal
move, not a correction" — and the coach's brief has always told it to offer to
sharpen a phrase that now looks wrong. It could not: `landAnswer` accepted only
the field the column was waiting on, so the offer was made and then refused.

## What we are not doing

- **Not changing the quality signal.** CARD A, contract 1 holds. `evaluateOutcome()`
  reads the same words and emits the same statuses; nothing is rendered, totalled
  or thresholded, and the nudge is the same translation it was. Two sentences of
  *advice* inside one check changed, because those sentences contradicted
  `/okrs`. The reading did not.
- **Not counting.** Nothing on screen or in the coach's mouth says how many
  measures there are, how many there should be, or how far through anything is.
  One early signal is a finished canvas the moment the reader says it is, and
  "that's the set" sits beside the field the whole time.
- **Not adding a step or a box.** Five boxes, same order, same numerals. ⑤ is
  asked more than once; it is the same question, asked again, in the same box.
- **Not letting the coach run ahead.** Forwards is not symmetrical with
  backwards: a box further down the canvas has nothing under it yet, and an
  answer landed there would be dropped. The coach moves forwards by asking the
  next question.

## The one place this reads as changing the deck

The deck draws box ⑤ with one sticky in it. It does not say ⑤ holds exactly one
measure — it is silent, and CARD A tells us not to improvise where it is silent.
We did not improvise: we took the answer from the page CARD A ranks above the
deck, which states the number outright. **If the deck's author intended ⑤ to
hold exactly one leading indicator, that is a conflict between the deck and
`/okrs`, and per CARD A the deck is wrong — but it is worth saying out loud
rather than deciding quietly.**

## What would reopen this

- `/okrs` changing what the pattern says. Then `lib/okrPattern.ts` changes and
  everything above follows it, which is the point of building it this way.
- Evidence that being asked "what else would tell us early?" reads as a demand
  rather than an offer. The remedy is the wording of that one question, not
  going back to a canvas that holds one measure.
