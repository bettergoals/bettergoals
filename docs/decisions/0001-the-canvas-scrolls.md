# CARD 0 — The canvas scrolls

**Status:** decided, 14 September 2026
**Decides:** [CARD 0 — Decide: does the canvas pin, or scroll?](https://github.com/bettergoals/bettergoals/issues/95)
**Binding on:** Card 1, and therefore everything after it.
**Deck:** slide 18 (call 1), slide 7 (the cost), slide 17 (strain 1) —
[`docs/reference/voice-coach-deck.md`](../reference/voice-coach-deck.md).
**Also binding:** [CARD A](../reference/card-a.md).

## The decision

**The canvas scrolls.**

It is a block in the one continuous column, in ordinary document flow, at every
width. It is never pinned, never sticky, never fixed, never given a scrollbar of
its own, and never shrunk to a map of itself.

## Why not pin

Pinning is the tempting one. It keeps the coach's turns and the canvas on screen
together, and it means nobody ever has to hunt for the thing they're building.
We're not taking it, for four reasons in descending order of weight.

1. **It breaks rule 3.** "One continuous column, top to bottom." A pinned canvas
   isn't a block in a column, it's a second region with its own scroll
   behaviour — a panel beside a transcript. The column stops being the thing and
   becomes one of two things.
2. **It kills the inflating box at step 08.** A box that grows to hold what's
   just been written needs a container that can get taller. A pinned panel is
   sized by the viewport, so the box can only inflate into a scrollbar or a
   truncation. The deck is binding on behaviour (rule 2); this is behaviour the
   deck shows, and pinning makes it impossible.
3. **A pinned canvas is a progress bar wearing a canvas costume.** Rule 5 says
   the only orientation is the canvas filling in. Held permanently in the corner
   of the eye, "how full is it" turns into a status readout — which is exactly
   the ambient progress indicator rule 5 exists to prevent. On mobile it gets
   worse, because the only pinned thing that fits is a thumbnail, and a thumbnail
   of five boxes with n of them shaded *is* a progress bar.
4. **It fails the plain-document tests.** Pinned regions need viewport
   arithmetic, which means client state (CLAUDE.md guardrail 6), and they
   reflow badly at 400% zoom, which is a WCAG 2.0 AA reflow problem and
   therefore part of "done" under *Accessible to everyone*. The site has exactly
   one sticky element today — the nav header in `components/SiteChrome.tsx` —
   and a pinned canvas would have to stack under it, eating more of an already
   short mobile viewport.

## The consequence we accept

**By step 10, the canvas is off the top of the screen and the live turn is at
the bottom. Seeing the whole picture costs a deliberate scroll, and so does
re-reading what you said at step 3.**

Orientation is something you go and get, not something held in front of you.
The canvas is a thing you built and can walk back to, not a dashboard watching
you work.

We accept that, and **we do not buy it back.** None of the following ship, on
Card 1 or any card after it:

- a sticky or fixed canvas, at any breakpoint or above any breakpoint;
- a mini-map, thumbnail, rail, summary bar or collapsed strip of the canvas;
- a floating "jump to the canvas" or "jump to latest" control;
- a second scroll region anywhere in the column;
- a count, a fraction, a fill meter, or anything else that says how much of the
  canvas is done (rules 5 and 6).

If a future card wants one of these, it has been written wrong — take it back
to CARD A.

## What the trade buys

- The seam stays honest. The chips, the canvas and the conversation are one
  piece of material in one order, which is what the deck shows and what rule 4
  ("nothing is ever replaced") assumes.
- The step-08 inflating box works, because nothing constrains a box's height.
- Mobile gets the real canvas at full width instead of a thumbnail, so rule 8 is
  satisfiable rather than fudged.
- It works as a plain document: no JavaScript, screen reader in document order,
  400% zoom, print. The whole column reads top to bottom in the order it
  happened.

## Card 1's scroll behaviour

This is the unambiguous part. Card 1 implements exactly this and decides nothing
further about scrolling.

1. **One scroller.** The document scrolls; nothing inside it does. No
   `position: sticky` and no `position: fixed` anywhere in the column. No
   `overflow-y: auto | scroll`, no `height`/`max-height` on the column, the
   canvas, a canvas box, the conversation, or a turn. The nav header stays
   sticky — it is site chrome, not part of the column, and it is the only
   exception on the page.

2. **One order, both breakpoints, top to bottom.** It never changes, and nothing
   ever moves from one position to another as the session goes on:

   1. the goal as it was given;
   2. the triage chips — outline chips, greyed once answered, never removed and
      never collapsed;
   3. the canvas — all five boxes, always all five, in the shared canvas order
      constant, with the empty ones visibly present and labelled;
   4. the conversation — oldest first, newest last, nothing removed, sticky
      notes for the leader's thinking and blue for an open question they're
      taking back to their team;
   5. the live turn — where you speak or type — always the last thing in the
      column.

3. **Boxes grow; they never scroll and never truncate.** A canvas box is sized by
   its content. The inflating box at step 08 is just a box with more in it: no
   max-height, no "show more", no inner scrollbar. The column gets longer. That
   is the point.

4. **The canvas is full size on mobile.** The same five boxes, one per row, full
   width, real type. No thumbnail, no map, no accordion, no horizontal swipe.
   Mobile gets a longer column, not a smaller canvas.

5. **Scrolling follows the reader, not the coach.** New content is always
   appended at the end of the column.
   - If the reader is already at the bottom when it arrives — within 96px of the
     end of the document — the page follows the new content down, so the live
     turn stays visible.
   - If the reader has scrolled up, nothing moves. The page stays exactly where
     they put it until they scroll back down themselves. Reading the canvas mid
     conversation must never be interrupted by the page moving.
   - Smooth where the browser allows it; instant under
     `prefers-reduced-motion: reduce`.
   - Leave browser scroll anchoring alone (don't set `overflow-anchor: none`).
     It already keeps earlier turns still.

6. **Nothing pulls the reader to the canvas.** When a box fills in, the page does
   not scroll to it, flash it, badge it, toast it, or announce a count. A box
   that has just been written may settle in — one brief, motion-safe transition
   on the new note — and nothing more. The canvas filling in is orientation you
   go and look at, not a notification.

7. **Focus is the only other thing allowed to move the page.** Keyboard focus
   landing on the live turn's input scrolls it into view, as any browser would.
   That is an accessibility behaviour, not a layout one, and it is the only
   automatic scroll besides rule 5.

8. **It has to work as a plain document.** With JavaScript off, the column is
   still in the right order, the canvas is still full size, and the whole page
   still scrolls. Rules 5 and 6 are enhancements; nothing depends on them.

None of the above gives the UI an opinion about what the coach asks or when
(rule 11), and none of it changes coach behaviour or scoring (rule 10). The
coach writes; the column reflects; the reader scrolls.

## Two readings we had to settle

The card is ambiguous in two places. These are the readings Card 1 is built on.
If either is wrong, correct it here and Card 1 changes with it — don't work it
out during build.

- **"On mobile the canvas is permanently collapsed to a thumbnail map."**
  Settled against the deck itself. Slide 17's first strain is titled *"The seam
  works, the scroll doesn't"*:

  > Keeping one column means the canvas inherits the column's width and the
  > transcript scrolls away above it. Nothing breaks, but by step 10 the coach's
  > earlier turns are a long way up — and on mobile the canvas is permanently
  > collapsed to a thumbnail map.

  So the thumbnail is a cost the deck puts on **scrolling** — the option we
  chose — and not, as this decision first recorded, a cost of trying to keep the
  canvas in sight while scrolling. The decision does not change, but the honest
  framing does: we take the first half of that strain as the consequence already
  accepted above, and we refuse the second half. The canvas is **not** collapsed
  to a thumbnail on mobile. Rule 5 forbids it — a thumbnail of five boxes with
  *n* shaded is a progress bar — and Card 1's rule 4 makes the opposite binding.
  Mobile gets a longer column, not a smaller canvas. Where the deck assumes the
  thumbnail, the deck is wrong in CARD A's sense, and this is the raise.
- **"The coach's earlier turns are a long way up"** is true of any transcript
  that grows downward, so it doesn't tell us where the canvas sits. We've put
  the canvas above the conversation, because rule 4 says the triage chips stay
  *above the canvas*, which only makes sense if the canvas is near the top of
  the column and the conversation accumulates beneath it.

## What would reopen this

One thing, and it isn't "people had to scroll":

> The conversation routinely runs long enough that the canvas sits more than
> about two screens above the live turn, and people stop looking at it.

If that happens, the answer is a shorter conversation or a tighter canvas — not
a pinned panel. This decision comes back to CARD A before any card proposes
pinning again.

## Provenance

This decision was first written without CARD A or the deck: both were attached
to issue #95, and attachments live on `github.com/user-attachments`, which the
build Action cannot fetch. The first reading under *Two readings we had to
settle* was wrong as a result, and has been corrected against slide 17.

Both documents are now committed at
[`docs/reference/`](../reference/README.md), so the next card in this series is
decided with them open rather than inferred from a summary.
