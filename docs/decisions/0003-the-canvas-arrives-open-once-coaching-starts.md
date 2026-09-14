# CARD 5 — The canvas arrives open once coaching starts

**Status:** decided, 14 September 2026
**Decides:** the question
[0002](0002-the-canvas-arrives-collapsed-on-mobile.md) handed to Card 5 by name.
**Binding on:** Card 5, and every card that renders the canvas after it.
**Extends:** 0002. Nothing in 0001 or 0002 is narrowed or overruled.
**Deck:** slide 8 (the arrival, collapsed on mobile), slide 9 (open, with the
conversation inside the lit box) —
[`../reference/voice-coach-deck.md`](../reference/voice-coach-deck.md).
**Also binding:** [CARD A](../reference/card-a.md).

## The question

Decision 0002 ends by naming the thing it could not settle:

> One consequence to carry forward: `<details>` state does not survive a page
> navigation, and every answer in this column is a real link. At step 05 nothing
> follows the seam yet, so it doesn't bite. **Card 5 has to decide** whether the
> open state rides along in the query string like the rest of the run — it
> should, and it costs one parameter — or whether the canvas simply arrives open
> once coaching has started.

Card 5 is the card where it bites: from step 06 on, every answer is a link, and
on a narrow screen a canvas that re-collapses on every navigation would close
itself in the reader's face six times in one conversation. 0002 forbids exactly
that — *"it never re-collapses on its own."*

## The decision

**The canvas is a closed disclosure until the first coaching answer lands, and
open from that moment on.** In markup: `<details open={started}>`, where
`started` is "the reader has said something into box ①". No parameter, no
client state, no script.

On a wide screen nothing changes: there is no collapsed state there at all.

The summary line changes with it, because it is the same line saying the same
kind of thing at two different moments:

- before anything has landed — `canvas — we'll start in the centre · tap to open`
- once it has — `canvas — we're in lagging`

Both name the box the coach is in. Neither says how many boxes are filled, and
neither can: the line has no shapes in it to shade (0002's second reason, and
rule 5).

## Why not the query string

It costs one parameter, as 0002 says — but the parameter would be the only thing
in the run that is about the interface rather than about the conversation.
Everything else in that query string is something the reader told the coach.
A `canvas=open` sitting among them is a different kind of fact, and it would
have to be carried by every link, every form and every href builder for the rest
of the series.

It is also strictly worse at the job. A parameter records what the reader last
did to the disclosure — so a reader who never opened it on a narrow screen keeps
a closed canvas while their own words land in it unseen. That is precisely the
failure 0002 names under *what would reopen this*:

> On a narrow screen, people don't open it — they answer the coach's first
> question without ever having seen the canvas.

Tying it to the conversation instead of to the reader's last tap closes that
door: the canvas opens the instant there is something of theirs in it.

## What we accept

A reader who opens the canvas at the seam, closes it again, and then answers the
coach's first question gets it back open. That is a real consequence and we take
it: it lasts one navigation, the thing that reopened it is their own words
arriving, and slide 9 is unambiguous that the canvas is open by then. The
alternative — honouring a "closed" they chose before there was anything in it —
hides the answer they just gave.

## What it must not become

- It never closes on its own. `open` only ever goes false → true.
- It never becomes a parameter later "for symmetry". If the open state ever
  needs to be remembered, that is a new decision with a reason of its own.
- It is never used on a wide screen to fold the canvas away (0002, unchanged).
- The summary line never counts (rules 5 and 6, unchanged).

## What would reopen this

> A reader deliberately closes the canvas mid-conversation and wants it to stay
> closed.

That is a real want and this decision does not serve it. The answer then is a
parameter after all — but a parameter that means *"I closed this on purpose"*,
set only by a reader who closed an open canvas, not a general record of
disclosure state. It is not the thing 0002 offered, and it is not needed until
someone asks for it.
