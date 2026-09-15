# 0007 — The coaches are briefed on the pattern, from the constants the page renders

**Status:** decided, 15 September 2026
**Decides:** [Tell both coaches how SSH actually think about OKRs](https://github.com/bettergoals/bettergoals/issues/164)
**Binding on:** anything that tells a coach — typed, spoken or handed over — what
a good OKR looks like, and anything that states how many key results one carries.
**Follows from:** [`docs/reference/card-a.md`](../reference/card-a.md), "the
principles and the OKRs page are binding": `/okrs` is *"how Sooner Safer Happier
thinks about and applies OKRs… the domain content the coaching is actually
teaching"*, second in precedence only to `PRINCIPLES.md`.
**Pack:** slides 3, 8, 9 and 12 of the *SSH OKR Pattern* pack, contributed as
[idea #28](https://github.com/bettergoals/bettergoals/issues/28) and held in
[`lib/okrPattern.ts`](../../lib/okrPattern.ts).

## The question this had to answer

CARD A has always said the OKRs page is binding on every card in the series. It
had only ever been binding on the **page**. `lib/coachAi.ts` briefed the typed
coach on the outcome principles and the coach design principles;
`lib/voiceColumn.ts` briefed the spoken one on the golden thread and the SSH
sense of "customer". Neither had ever been told the pattern itself — the
objective as an outcome hypothesis, the key results and their counts, the 3Ms.

So the framework the site teaches and the framework the coach coached to had
drifted, and in one place they flatly disagreed. `/okrs` says an OKR carries
three to five key results, of which three or four are leading. The typed coach's
prompt said *"one primary measure beats seven"* and *"prefer one primary measure
plus at most one guardrail"*, and the structural check's next step said *"resist
adding a third"*. A leader who had read the page and then talked to the coach was
being coached against it.

## The decision

**The coaches are handed a brief built from the same constants `/okrs` renders —
never a second copy of the pattern written in prose.**

1. **The counts are a constant.** `KEY_RESULTS` in `lib/okrPattern.ts` holds the
   numbers the pattern specifies — 3 to 5 key results, 3–4 leading, 1 lagging —
   with `KR_RANGE` and `KR_LEADING_RANGE` as the strings anything rendering them
   uses. `OBJECTIVE` holds the three clauses of the hypothesis and why the word
   is deliberate; `GOLDEN_THREAD` holds the nesting. They live with the pattern
   they came from and nowhere else.

2. **One brief, two renderings.** `lib/okrBrief.ts` composes the brief from those
   constants and renders it twice: `okrPatternBrief()` as markdown `###` sections
   for the typed coach's system prompt, and `okrPatternBriefSpoken()` as
   `HEADING. text` paragraphs for the voice coach, whose instructions carry no
   markup because they are spoken. Same content, same source, two house styles.

3. **Every place the counts appear reads the constant.** The Key Results box and
   the four-line summary on `/okrs`, the draft goal under the canvas in
   `app/coach/entry/Column.tsx`, the takeaway file in `lib/takeaway.ts`, and both
   briefs. Five renderings, one number.

4. **The disagreements are resolved in the pattern's favour, on the count only.**
   "One primary measure beats seven", "at most one guardrail" and "resist adding
   a third" are gone. What they were protecting is kept and said as what it
   actually is: *never invent a measure the author hasn't given you*. A candidate
   rewrite still carries only their measures and still leaves a «placeholder»
   rather than a plausible number.

5. **It is a brief, not a script.** Its last section says so to the coach: coach
   this, never recite it, don't name the framework or the counts when a plain
   question would do, and where `PRINCIPLES.md` and the pattern disagree the
   principles win.

## Why this shape

A brief written out in prose would have been quicker and would have drifted by
the third card that touched either file — which is exactly the history here: the
number was already written out by hand in three places before any coach was told
it. Deriving the brief means the page and the coach cannot disagree about the
pattern, because there is only one statement of it. The test of the card is a
leader recognising the conversation, and that only holds if it is literally the
same content.

The counts belong in `lib/okrPattern.ts` rather than beside either coach because
the file's own rule is that it is the pattern as SSH teach it and nothing else.
The brief sits in its own module rather than in that file, because
`lib/okrPattern.ts` is data the page renders and a brief is prose addressed to a
coach — one importing the other keeps both honest about which is which.

## The options not taken

**Write the brief into each coach's prompt.** Two copies, two voices, and the
drift back within a card or two. Not taken: this whole decision exists because
the pattern was already stated in more places than it was defined.

**Put the brief in `lib/okrPattern.ts`.** Fewer files, and defensible. Not taken:
that file is rendered by a page, and a page importing a coach's instructions to
get at a number is the wrong way round.

**Have the coaches fetch `/okrs` and read it.** Genuinely single-source, and
briefly tempting. Not taken: it makes a coaching turn depend on an HTTP request
to our own site, hands a model markup to interpret, and the page is a rendering
of the pattern rather than the pattern itself.

**Hold the coach to the count — refuse to finish until there are three
measures.** Not taken. The count is the pattern, not a quota, and the first
principle of the site is that nothing here is a test. The brief says so in the
same breath as the number.

## The consequence we accept

**Both coach briefs get longer.** The voice coach's instructions grow by about
five paragraphs. Mitigated once: the golden thread was already written out in
`columnCoachInstructions()` and is now carried by the brief, so what is left
there is the part that is about *this conversation* — settle the horizon while
you are on the measure, ask for evidence sooner than the horizon.

**A coach may now mention a count.** It is briefed to coach the pattern and not
to recite it, but "SSH ask for three to five" is a sentence it could now say. We
would rather it could say that than coach a framework the site does not teach —
and where the count and the person's reality disagree, the brief tells it to take
the honest gap.

**The structural check's next step changed wording** without the check itself
changing. `lib/outcomeCoach.ts` still reads words and still scores the same; only
the advice it hands back agrees with the page now.

## Where this applies

`KEY_RESULTS`, `KR_RANGE`, `KR_LEADING_RANGE`, `OBJECTIVE` and `GOLDEN_THREAD` in
`lib/okrPattern.ts`. `lib/okrBrief.ts`. The `## The SSH OKR pattern` section of
the system prompt in `lib/coachAi.ts`, and `columnCoachInstructions()` in
`lib/voiceColumn.ts`. The renderings in `app/okrs/page.tsx`,
`app/coach/entry/Column.tsx` and `lib/takeaway.ts`.

A later card that wants to say how many key results an OKR carries reads the
constant. A card that wants to tell a coach something new about the pattern adds
a section to `lib/okrBrief.ts` and both coaches get it. A card that wants to type
the number out again is asking to reopen this, and per
[`README.md`](README.md) that goes back to CARD A rather than being worked out
during a build.

## What would reopen this

The pack changing — SSH revising the counts or the format — which is a change to
`lib/okrPattern.ts` and nothing else, and is the case this shape was chosen for.
Or the brief proving too long to be held: if the coach starts reciting the
pattern or reaching for the framework's vocabulary instead of a plain question,
the answer is a shorter brief, not a second copy of it somewhere else.
