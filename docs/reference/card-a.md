# CARD A — Existing systems: do not change

> **Source of record.** Text extracted from `CARD A.docx`, attached by the
> author to [issue #95](https://github.com/bettergoals/bettergoals/issues/95).
> The original is committed alongside this file as `card-a.pdf` — read that if
> you need the layout. This markdown exists so the text is readable by tooling
> and diffable in review; if the two ever disagree, the PDF wins.
>
> CARD A is **binding reference, never "done"**. Read it before building any
> card in the voice-coach series, and again before calling one done.

---
CARD A — Existing systems: do not change
Type: boundary · Status: reference, never "done" · Owner: the voice coach's author
Two things already exist and already work: the voice coach and the quality-signal engine that runs behind it. Nothing in this deck asks for either to be rebuilt, replaced, or tuned. Every card below describes presentation — what the user sees while those two do what they already do.
If a card seems to require a change to coach behaviour or scoring logic, stop and bring it back here. That is a sign the card is wrong, not that the coach is.
The principles and the OKRs page are binding
Two pages on bettergoals.ai are constraints on every card, alongside the deck:
Principles — how the product is meant to behave toward the person using it. Community-owned, maintained in PRINCIPLES.md in the repo and edited by PR, so read them live rather than from any copy. They can change under you; that's by design.
OKRs — how Sooner Safer Happier thinks about and applies OKRs. This is the domain content the coaching is actually teaching. The canvas, the prompts and the way a goal is framed all have to be consistent with it.
Precedence: principles first, then the OKRs page, then this deck. The wireframes describe an interface; they do not override how the product is meant to behave or how SSH frames goals. Where the deck appears to conflict with either page, the deck is wrong — raise it rather than building it.
On every card: before building, read both pages. Before calling a card done, re-read them and confirm nothing in the card contradicts them.
The deck is low-fidelity on purpose — read this before building
The wireframes fix structure, sequence and behaviour. They do not fix visual design.
Binding: what appears on screen, in what order, what happens when the user answers, what stays and what greys out, what is never shown. Every rule below is binding.
Not binding: layout proportions, spacing, typography, colour palette, iconography, motion, the grey-box aesthetic itself. The deck is drawn rough so it reads as structure, not as a design to copy.
Do not reproduce the wireframes literally. Grey rectangles and placeholder type are notation. Build the real thing.
Do not improvise behaviour to fill the gaps. If the deck is silent on how something behaves, ask — don't invent a progress indicator, a completion state, or a score display because it seems helpful. The rules exist precisely because the obvious instinct is usually wrong here.
Short version: the what and the when are specified; the how it looks is open, as long as the rules hold.
Contract 1 — The quality signal
The engine keeps emitting its signal about goal quality, unchanged, on the same terms it does today.
The flow reads that signal to decide whether to keep going or offer the way out. It does not recompute, second-guess, or threshold it in the UI layer.
The signal is never rendered. No total, no percentage, no grade, no gauge.
Step 11, the nudge, is a translation of the signal into words — what's thin and why. The bar glyphs on slide 14 show how the gap is expressed, not a value.
In room mode the nudge is suppressed. The signal keeps running underneath regardless.
Already true today: the score doesn't surface anywhere in the current build. This contract is preserving that, not changing it. Nothing is being taken away from the existing coach.
Contract 2 — The canvas order is a shared constant; the coach follows it
Confirmed with the coach's author: use the coach the way it's built. It is not strictly sequential — it already moves through topics in whatever order the conversation demands.
So there is no runtime ownership question. The canvas order isn't dynamic state either side has to hold:
The canvas defines the order. Five boxes — centre ①, problem ②, "I don't know" ③, hypothesis ④, leading ⑤ — and the sequence they're meant to be completed in. This is a shared reference both sides know up front, not something negotiated during a session.
The coach follows that order and does what it needs to. It asks, follows up, digs, reflects back, and deviates from the sequence where the conversation calls for it — jumping ahead or going back — then returns. That behaviour already exists and is not being changed.
The UI reflects. It lights the box the coach is on and renders what lands in it. It does not decide what's next, does not withhold a box, does not correct the coach's route.
Neither side orchestrates the other. The order is the contract; the coach moves through it; the canvas shows where he is.
The one thing to establish early (Card 5): does the coach emit a signal when it moves between boxes — a topic or box identifier the UI can subscribe to? If yes, Card 5 is straightforward wiring. If the UI has to infer the current box from the conversation, that inference is the real work in Card 5 and should be sized accordingly. Ask this before estimating Card 5.
Contract 3 — Out-of-order moves are the coach's, not the UI's
Slides 11 and 12 show the coach jumping ahead to box three and later going back to box one. Both are the coach's calls, made for conversational reasons, and it already works this way.
Trigger and wording: the coach's. "The fix is upstream" is its sentence, in its voice.
The UI's job: render it without drama. Move the lit box, strike through the old sticky and write the new one, park the box-two answer with your-words-are-safe.
Nothing renders as an error, a validation failure, or a skip. Going backwards is a normal move, not a correction.
The quality signal may well be what prompts the coach to double back — that's internal to the existing systems and doesn't need specifying here.
