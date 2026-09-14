# 0004 — The conversation quietens as it is spent

**Status:** decided, 14 September 2026
**Decides:** [During Canvas Completion there is unnecessary text appearing from the conversation](https://github.com/bettergoals/bettergoals/issues/134)
**Binding on:** the column, and anything later that adds words to it.
**Follows from:** [`0001-the-canvas-scrolls.md`](0001-the-canvas-scrolls.md) —
this is the remedy that decision named.

## The decision

**A question stays on screen for good. The help that came with it does not.**

Every coaching turn in the column may carry an `aside`: the sentence or two
that helps you answer the question — what "customer" means here, why the coach
asked in this order, what happens to either answer, the walk round the canvas
before the first question. It is on screen the whole time the question is live,
and it is gone once the question has an answer above it.

Nothing the reader said is ever removed. No question is ever removed. Spent
turns still grey and still stay exactly where they were, and the chips still sit
above the canvas for good — rule 4 of the column is untouched.

## Why

Decision 0001 chose a scrolling canvas over a pinned one, accepted the cost in
writing, and named the one thing that would reopen it:

> The conversation routinely runs long enough that the canvas sits more than
> about two screens above the live turn, and people stop looking at it.
>
> If that happens, the answer is a shorter conversation or a tighter canvas —
> not a pinned panel.

Issue #134 is that report, from the person the column was built for: *"you can't
see the Canvas and the box where the Voice AI is asking its questions"*. So this
is the answer 0001 specified, taken as specified. **Nothing here pins, floats,
collapses or mini-maps the canvas, and 0001 does not reopen.**

The asides were what made the conversation long. Six questions are six lines.
Six questions each trailing a paragraph of help with something already answered
is most of a screen — and every line of it sits between the canvas and the place
you are being asked to talk.

## What is not in scope for this

The help is not deleted, and this is not a licence to say less to a reader who
needs it:

- an aside is on screen for the whole time the question it belongs to is being
  answered. That is when it is help. Removing it *then* would be a different and
  much worse change;
- the one place the data line is said (step 04) still says it, and the one-line
  version at the top of the column is permanent, so there is never a moment
  where nothing on screen says nothing is stored;
- the privacy disclosure while the coach has your microphone is whole, always,
  and is not an aside.

## Where this applies

`Turn`'s `aside` prop in `app/coach/entry/Column.tsx`. If a later card wants to
add a paragraph of explanation under a question, that paragraph is an aside
unless there is a reason it has to outlive the answer — and the reason goes in
the code beside it.
