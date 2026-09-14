# Reference material

Source documents that are **binding on a series of build cards**, committed here
so they can be read directly — by a reviewer, and by the automated build, which
cannot reach files attached to a GitHub issue.

| File | What it is |
| --- | --- |
| [`card-a.md`](card-a.md) · [`card-a.pdf`](card-a.pdf) | CARD A — the boundary card for the voice-coach series. Existing systems not to change, what the deck does and doesn't bind, and the three contracts. |
| [`voice-coach-deck.md`](voice-coach-deck.md) · [`voice-coach-deck.pdf`](voice-coach-deck.pdf) | The 18-slide entry deck the cards cite by slide number. |

## Why these live in the repo

Both were attached to [issue #95](https://github.com/bettergoals/bettergoals/issues/95).
Attachments live on `github.com/user-attachments`, which the build Action could
not fetch — so the first card in the series was decided without them, and got a
line wrong as a result (see
[`../decisions/0001-the-canvas-scrolls.md`](../decisions/0001-the-canvas-scrolls.md)).

Material that binds *every* card in a series is not really a per-card
attachment. Committing it means it is versioned, diffable, reviewable, and
readable by whoever — or whatever — is building the next card.

## The two formats

The PDF is the source of record: it carries the wireframes and layout, which
matter because the deck is binding on structure. The markdown is the same
content as text, so it can be read by tooling, quoted in review, and diffed when
it changes. **If the two disagree, the PDF wins.**

## Precedence

Per CARD A, when these conflict with the product's own pages:

1. [`PRINCIPLES.md`](../../PRINCIPLES.md) — read live, it changes by PR
2. [`/okrs`](https://bettergoals.ai/okrs) — how SSH frames goals
3. the deck

The wireframes describe an interface; they do not override how the product is
meant to behave. Where the deck appears to conflict with either page, the deck
is wrong — raise it rather than building it.

## Adding to this folder

Only material that binds more than one card. A screenshot that explains a single
idea belongs on that idea's issue. Keep the original alongside any extracted
text, and say in the file's header where it came from and who wrote it — see
principle 8, *Respect IP and give credit*.
