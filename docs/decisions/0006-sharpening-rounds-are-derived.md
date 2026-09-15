# 0006 — Sharpening rounds are derived, not declared

**Status:** decided, 15 September 2026
**Decides:** [Let the assessment decide when the coaching stops](https://github.com/bettergoals/bettergoals/issues/157)
**Binding on:** the coaching state model, and anything later that lets the coach
revisit a box that already has an answer in it.
**Follows from:** [`docs/reference/card-a.md`](../reference/card-a.md) contracts 1
and 3 — the flow reads the quality signal to decide whether to keep going, and
going back is a normal move.
**Deck:** slides 12 and 14–15 —
[`voice-coach-deck.md`](../reference/voice-coach-deck.md).

## The question this had to answer first

Idea #157 asks the assessment to decide whether the coach carries on: where a
dimension in *how it's shown* is at nothing, the coach goes back to the canvas
box that dimension depends on and asks about the thing that is actually thin.

That is a box being asked about **a second time**, and the state model could not
express it. `readCoaching()` reads the run as one fixed sequence —
`const lagging = problem ? first(params.lagging) : null` — one field per question,
each gated on the one before. There is no second `centre` and nowhere to put one.
The gating is not incidental either: it is what stops a hand-edited URL landing a
reader in the middle of a conversation that never happened, and whatever replaces
it has to keep that true.

## The decision

**A sharpening round is a position in a derived chain, never a claim made by the
URL.**

1. **The answers are a numbered, append-only list.** `sharpen1`, `sharpen2`,
   `sharpen3` in the query string; `sharpening: string[]` in `Coaching`. A
   sharpening answer is appended to the canvas box as a second sticky. Nothing is
   replaced and nothing is struck through — the earlier wording was not wrong,
   it was thin.

2. **Nothing in the URL says which box a round went to.** The destination box and
   the question are recomputed, each time, from the canvas as it stood *before*
   that answer landed: fold rounds `1…n-1` onto the canvas, hand the result to the
   same quality signal everything else here reads, and the thinnest dimension at
   nothing names the box. So round *n* exists only if the coach, reading the
   canvas at that point, would have asked it.

3. **The prefix gating is unchanged, and now covers the tail.** A gap still ends
   the run. `nudge` and `out` are readable only once no sharpening round is
   waiting — a hand-edited `out=stop` in the middle of a sharpening round is
   dropped exactly as `lagging` is dropped without a `problem`.

4. **Bounded three ways.** At most three rounds; never the same dimension twice;
   and every round carries *leave it there* beside the field, which ends
   sharpening on the spot. When the rounds are spent the conversation goes on
   whatever the bars say.

## Why this shape

The property that matters is not "the URL is hard to edit" — it is a query
string, anyone can type anything into it. It is that **the conversation the page
renders is always a conversation the coach would have had.** Today that holds
because the sequence of questions is fixed, so a prefix of it is checkable.

Deriving the destination keeps the same property for a sequence that is no longer
fixed: the run is still only ever a *prefix*, and each step of it is still
checked against what the coach would have asked. The reader can put any words
they like in `sharpen2` — those are their words, they are welcome to them — but
they cannot make the coach have asked about box ④ when the canvas said box ②, and
they cannot manufacture a round that was never offered, because the offer is
computed and not read.

Carrying the box in the URL (`sharpen2box=hypothesis`) would have been simpler to
write and is exactly the thing the gating exists to prevent: a URL declaring a
conversation.

## The options not taken

**A session on the server.** Persist the run, key it, and the ordering problem
disappears. Not taken: there is no database and the column's own rule is that the
whole run lives in the query string and closing the tab ends it. That promise is
printed on the page, twice.

**One mutable field per box** — let `centre` be answered again and overwrite.
Not taken: rule 4 of the column is that nothing is replaced, and an overwrite
loses the thing the canvas is for, which is what you actually said and when.

**Struck-through rewriting, as the back-step to ① does.** Not taken here: the
double-back at step 09 replaces a *wording* with a sharper wording of the same
thought, and striking the old one through is the honest record of that. A
sharpening round adds something the canvas never said — a number, a horizon, a
so-what — so there is nothing to strike.

**An unbounded loop until every dimension clears.** Not taken, and the card is
explicit about it: that is a pass/fail gate the reader cannot get past, on a site
whose first principle is that nothing here is a test.

## The consequence we accept

**A run can still end with a dimension at nothing.** Three rounds, one per
dimension, and *leave it there* on every one of them — so a canvas that is thin
in four places, or a reader who would rather get on with it, reaches the doors
with something still at nothing. That is correct: the assessment decides whether
the coach *keeps coaching*, not whether the reader is allowed to leave. What is
still thin is said in words under **Still open**, which is where it belonged all
along.

**A box can hold more than one sticky.** The canvas, the takeaway file and the
carry-on prompt already render every note in a box, so this needed no new
rendering — but the draft OKR reads the *last* note in a box, which means
sharpening the bet visibly sharpens the objective above the assessment. That is
the point of moving it up the page (idea #156) and we want it.

**Three extra reads of the signal per render, worst case.** It is regex over a
few hundred characters, it is pure, and it is the same call the nudge already
makes. Not worth a cache.

## Where this applies

`sharpenFor()` in `lib/nudge.ts` — which dimension is at nothing, which box mends
it, what to ask there. `SHARPEN_ROUNDS`, `ENOUGH`, `sharpenRounds()` and the fold
in `lib/coaching.ts`. `turnFor()` in `lib/voiceColumn.ts`, so the spoken coach
asks the same round. The turns and the answer field in
`app/coach/entry/Column.tsx`.

A later card that wants the coach to revisit a box adds a dimension to the table
in `lib/nudge.ts` and gets the round, the gating and the bound for free. A card
that wants the round to carry its own destination is asking to reopen this, and
per `docs/decisions/README.md` that goes back to CARD A rather than being worked
out during a build.

## What would reopen this

Readers finishing the rounds and the canvas being no sharper for them — which
would mean the signal cannot tell what a sharpening answer added, and the answer
then is a better signal, not more rounds. The bound stays either way.
