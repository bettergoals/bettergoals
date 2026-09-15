# 0005 — A coaching question lives in its box

**Status:** decided, 15 September 2026
**Decides:** [Showing Canvas Questions twice](https://github.com/bettergoals/bettergoals/issues/146)
**Binding on:** the column, and anything later that adds a coaching question to it.
**Follows from:** [`0004-the-conversation-quietens.md`](0004-the-conversation-quietens.md) —
the same remedy, taken one step further by the same reporter.
**Deck:** slide 10 (`DRIVER → PROBLEM · WE'RE HERE`) —
[`voice-coach-deck.md`](../reference/voice-coach-deck.md).

## The decision

**Two halves, and they only work together.**

1. **The lit box says, on the box, that it is the lit box.** It carries slide
   10's own marker — `· WE'RE HERE` — beside its label, and a heavier border,
   and the unlit boxes sit back a shade. Never colour alone, and never a border
   weight alone either.

2. **A coaching question folds away once it has an answer.** The spent coaching
   turns between the canvas and the live turn go behind one summary line,
   *everything we've said so far*. The one question still waiting stays where it
   was, at question size, immediately above the box you answer it in.

Triage is untouched. Those questions sit above the canvas, their chips hang
under them (idea #143), and no box on the canvas holds their answers — so there
is nothing duplicated there to fold.

## Why

Issue #146, from the same person as #134, with a ring drawn round the stretch of
column between the canvas and the live turn:

> I feel like we are showing the Canvas questions twice, in the canvas itself
> and then also as text under the canvas … it will be great if the Canvas and
> Coaches box were close to one another instead of being separated by repeated
> text.

That is two complaints and they have one cause. **Every coaching question is a
question about a canvas box.** Answer it and the answer is a sticky in that box,
a few centimetres above the question — so the spent turn underneath is the same
exchange printed a second time, in a second place, with nothing added. Six of
them are what hold the canvas and the box you talk into apart, which is the
thing decision 0001 said would reopen the pinned canvas.

0004 took the first half of 0001's remedy and shortened the conversation by
dropping the asides. This takes the second half: the spent *questions*
themselves, in the one part of the column where the canvas already carries them.

The lighting half is what makes it safe. Once the transcript is not there to
read, the canvas has to be able to say where the conversation is on its own —
and the deck already wrote that down on slide 10 and we had not built it. A
border weight is a comparison; you can only read it by looking at all five boxes
and deciding which is heaviest. `WE'RE HERE` is a fact, sitting on one box, and
it is what a screen reader gets too.

## The option not taken

**Deleting the spent questions outright**, which is closer to what the issue
asks for. Not taken: 0004 says a question stays on screen for good, rule 4 of
the column says nothing is removed, and a transcript you can't get back to is a
different product from a transcript you don't have to scroll past. The
disclosure gives the reporter what they asked for — it is gone from the column,
not one line of it between the canvas and the live turn — and keeps the record.

**Moving the question into the lit box**, which is literally what slide 9 draws.
Not taken here: on a narrow screen the canvas arrives collapsed until the first
answer lands (decision 0002), so the very first coaching question would be
inside a closed disclosure with nothing on screen to answer. Fixing that means
reopening 0003, and CLAUDE.md is explicit that a card which needs to change a
decision has been written wrong. If we want it, it goes back to CARD A.

## The consequence we accept

**The disclosure is closed on arrival, every time.** Every answer is a real page
navigation, so opening it to re-read something and then answering closes it
again. We accept that: it is the plain-document behaviour, it needs no client
state (CLAUDE.md guardrail 6), and the thing people go back for — what they
said — is in the canvas boxes, which are open.

## What is not in scope for this

- **The canvas does not pin, collapse, shrink or map itself.** Decision 0001
  stands in full. What got shorter is the conversation, which is the remedy 0001
  named.
- **No second scroller.** The disclosure has no height, no max-height and no
  overflow. The document is still the only thing that scrolls.
- **No count.** The summary line says what is behind it, never how many turns or
  how far through the canvas you are. "Six questions, answered" is a progress bar
  in a sentence and rule 5 forbids it.
- **Nothing you said is removed**, from the column or from the canvas. The
  struck-through wording, the parked box and the "I don't know" all still behave
  exactly as slides 11 and 12 have them.

## Where this applies

`Said` and `coachTurns` in `app/coach/entry/Column.tsx`; the lit-box treatment in
`app/coach/entry/Canvas.tsx`; `.said-so-far` in `app/globals.css`.

A later card adding a coaching question adds it to `coachTurns` and gets the fold
for free. A question that must stay visible after it is answered needs a reason,
and the reason goes in the code beside it.

## What would reopen this

People answering the live question and then not being able to find what they
said — which would mean the canvas is not, in fact, carrying the conversation.
The answer then is a clearer canvas, not an unfolded transcript and not a pinned
panel.
