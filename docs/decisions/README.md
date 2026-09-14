# Decisions

Some build cards are decisions, not code. A decision card is done when one
option is written down and its consequence is accepted — so this is where the
answer lives, in the repo, next to the thing it binds.

A decision here is binding on the cards that follow it. If a card looks like it
needs to change one, it has been written wrong: take it back to CARD A rather
than working it out during build.

| # | Decision | Status | Binds |
| - | -------- | ------ | ----- |
| [0001](0001-the-canvas-scrolls.md) | **The canvas scrolls** — it is a block in the one continuous column, never pinned, at every width | Decided, 14 Sep 2026 | Card 1 onwards |
| [0002](0002-the-canvas-arrives-collapsed-on-mobile.md) | **The canvas arrives collapsed on mobile** — one line you tap once to open, never a thumbnail. Narrows 0001's rule 4 | Decided, 14 Sep 2026 | Card 4 onwards |
| [0003](0003-the-canvas-arrives-open-once-coaching-starts.md) | **The canvas arrives open once coaching starts** — tied to the first answer landing, not to a query parameter. Settles the question 0002 left to Card 5 | Decided, 14 Sep 2026 | Card 5 onwards |

Each file states the decision, the option not taken and why, the consequence we
accept, what the affected card must now do, and what would reopen it.
