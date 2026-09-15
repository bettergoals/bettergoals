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
| [0004](0004-the-conversation-quietens.md) | **The conversation quietens as it is spent** — an answered question keeps its wording and loses the help that came with it. The shorter conversation 0001 asked for, not a pinned canvas | Decided, 14 Sep 2026 | The column, onwards |
| [0005](0005-a-coaching-question-lives-in-its-box.md) | **A coaching question lives in its box** — the lit box says "we're here" on itself, and an answered coaching question folds behind one line instead of being read twice. Extends 0004 | Decided, 15 Sep 2026 | The column, onwards |
| [0006](0006-the-canvas-holds-the-ssh-pattern.md) | **The canvas holds the pattern `/okrs` teaches** — both coaches are handed the SSH OKR pattern, ⑤ holds the set of leading indicators rather than one measure, and any box already answered can be reopened | Decided, 15 Sep 2026 | Both coaches, and the canvas |

Each file states the decision, the option not taken and why, the consequence we
accept, what the affected card must now do, and what would reopen it.
