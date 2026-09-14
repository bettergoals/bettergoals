# CARD 4 — The canvas arrives collapsed on mobile

**Status:** decided, 14 September 2026
**Decides:** a conflict found while building
[CARD 4 — The seam, step 05](https://github.com/bettergoals/bettergoals/issues/99).
**Binding on:** Card 4, and every card that renders the canvas after it.
**Narrows:** [0001 — The canvas scrolls](0001-the-canvas-scrolls.md), rule 4,
by one word. Everything else in 0001 stands unchanged.
**Deck:** slide 8 (the arrival), slide 9 (it is open by the next step) —
[`docs/reference/voice-coach-deck.md`](../reference/voice-coach-deck.md).
**Also binding:** [CARD A](../reference/card-a.md).

## The conflict

CARD 4's scope says, from slide 8:

> mobile arrives collapsed with "we'll start in the centre · tap to open"

Decision 0001's rule 4 says:

> **The canvas is full size on mobile.** The same five boxes, one per row, full
> width, real type. No thumbnail, no map, **no accordion**, no horizontal swipe.
> Mobile gets a longer column, not a smaller canvas.

Read literally, the card asks for something the previous decision forbids. Under
the decisions README that is a card written wrong, and it comes back here rather
than being settled during a build. So here it is.

## The decision

**On a narrow screen the canvas *arrives* collapsed: one line in the
conversation — `canvas ▾ we'll start in the centre · tap to open` — which opens,
on one tap, to the full-size canvas.** Open is where it stays. On a wide screen
there is no collapsed state at all: the canvas is simply there, under the
coach's line, both halves visible at once mid-scroll.

Everything 0001 refuses, this still refuses. Once open the canvas is five boxes,
one per row, full width, real type. There is no thumbnail, no map, no rail, no
mini-canvas, and nothing anywhere — open or closed — that says how many boxes
are filled.

## Why 0001 is narrowed rather than overruled

0001's rule 4 was written to kill one specific thing, and it is named in the
decision's own *Two readings* section: a canvas **permanently** collapsed to a
thumbnail map. The reasoning there is rule 5's — *"a thumbnail of five boxes
with n of them shaded **is** a progress bar."* That reasoning is exactly right
and nothing here touches it.

It does not reach slide 8's arrival, for three reasons:

1. **It isn't permanent.** The deck itself opens it: slide 9's mobile wireframe
   shows the boxes, with the centre one lit and the conversation inside it. The
   collapse lasts until the first tap.
2. **It isn't a map.** A thumbnail is a smaller canvas — five shapes, some
   shaded, standing in for the real thing. This is one line of type that names
   where the coach is about to start. It has no shapes to shade, so there is
   nothing in it that can act as a fill meter. Rule 5 is not engaged.
3. **It doesn't make the canvas smaller.** The open canvas is the same canvas at
   the same size. Mobile still gets a longer column, not a lesser one, which is
   rule 4's actual sentence.

The word "accordion" over-reached: it named a mechanism when the rule was about
an outcome. The outcome stands, and this decision is the correction.

## Why not just ship it open on mobile

That was the tempting alternative — build the rest of CARD 4, quietly drop the
collapse, cite 0001. We didn't, because the collapse is doing real work and
dropping it would fail the card's own acceptance test.

At the seam the reader has just answered "yes, let's look at it together". If
five full-width boxes land between the coach's line and the place they speak,
the live turn is pushed most of a screen down and the first thing they meet is
an apparatus. That is precisely the thing CARD 4 exists to avoid — *"the canvas
reads as something the conversation produced, not a tool you've been handed"*.
One line that says *we'll start in the centre*, sitting in the conversation
where the coach's voice has been all along, is the conversation producing it.

## What it must not become

- It never re-collapses on its own. Nothing closes it but the reader.
- It never counts. Not in the summary line, not open, not ever (rules 5 and 6).
- It is never used on a wide screen to fold the canvas away.
- It never becomes the pattern for anything else in the column. Rule 4 —
  *nothing is ever replaced* — is untouched: the chips above it do not collapse,
  the conversation below it does not collapse, and nothing is cleared away.

## How it is built

A native `<details>` / `<summary>`. No JavaScript, no client component, no
viewport arithmetic — it works as a plain document, takes keyboard focus, and
announces itself to a screen reader as the disclosure it is. The wide-screen
treatment is one CSS rule in `app/globals.css` that hides the summary and forces
the content open, wrapped in `@supports selector(::details-content)` so a
browser that can't do that keeps the summary and the canvas stays one tap away
instead of becoming unreachable.

One consequence to carry forward: `<details>` state does not survive a page
navigation, and every answer in this column is a real link. At step 05 nothing
follows the seam yet, so it doesn't bite. **Card 5 has to decide** whether the
open state rides along in the query string like the rest of the run — it should,
and it costs one parameter — or whether the canvas simply arrives open once
coaching has started.

## What would reopen this

> On a narrow screen, people don't open it — they answer the coach's first
> question without ever having seen the canvas.

If that happens the answer is a better line, or an arrival that is open by
default with the column scrolled to the coach's turn. It is not a thumbnail.
That door stays shut.
