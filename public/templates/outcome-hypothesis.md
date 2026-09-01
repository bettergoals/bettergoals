---
name: Outcome hypothesis
description: Turn "we should build X" into a testable claim about who gets a better experience, what early signal you'd expect, and what would make you stop. The one-pager to start a planning cycle with.
format: Fill-in canvas
time: 20 minutes with the team
---

# Outcome hypothesis

A goal is a bet. This canvas makes the bet explicit: who it's for, what gets
better for them, how you'd see it early, and what you'd do if you're wrong.

Use it *before* your planning cycle commits to a body of work — one canvas per
candidate goal. Most teams find that filling it in kills a third of their
candidates, which is the point.

## The template

```
We believe that <the change we will make>
for <who — a specific customer, colleague or citizen>
will result in <the outcome that gets better for them>.

PRIMARY SIGNAL — the one measure we're steering by
  <measure>: from <today> to <expected> by <a date inside weeks>

SMALLEST SLICE — the least work that would move that signal at all
  <what we'd ship first, and when>

GUARDRAILS — what must not get worse while we chase this
  <measure> stays <threshold>
  <measure> stays <threshold>

SAFE TO CHALLENGE
  Who has argued this is the wrong goal? What did we change because of it?

SAFE TO MISS
  If the signal doesn't move by <date>, we will <stop / pivot / dig deeper>.
  Learning that costs us <effort> and is a good outcome.

HAPPIER
  Who ends up happier if this works — customers, and the people doing the work?
```

## Worked example — a bank's onboarding team

> **We believe that** letting applicants resume an interrupted application from a
> link **for** first-time current-account applicants on mobile **will result in**
> more of them completing without calling the contact centre.
>
> **Primary signal:** mobile application completion rate, from 41% to 55% within
> six weeks of launch.
>
> **Smallest slice:** resume-link email for the ID-upload step only — the single
> step where 60% of drop-off happens. Two weeks.
>
> **Guardrails:** fraud decline rate stays below 0.4%; contact-centre handling
> time doesn't rise.
>
> **Safe to challenge:** two contact-centre agents said the real blocker is the
> ID photo quality message, not the interruption. We're instrumenting both, and
> we'll follow the data rather than the plan.
>
> **Safe to miss:** if completion hasn't moved by week six, we stop and take the
> ID-message hypothesis instead. Cost of learning: one team, three weeks.
>
> **Happier:** applicants stop re-keying the same details; agents stop being the
> workaround for a broken step.

## Worked example — an internal platform team

> **We believe that** a golden-path pipeline template **for** product teams
> shipping their first service **will result in** them reaching production
> without needing a platform engineer in the room.
>
> **Primary signal:** median days from repo created to first production deploy,
> from 19 to under 5, measured across the next 8 onboarding teams.
>
> **Smallest slice:** the template for one runtime (Node services), used by the
> next two teams who ask — with us watching, not helping.
>
> **Guardrails:** change-failure rate doesn't rise; no drop in the security scan
> coverage that the current manual path enforces.
>
> **Safe to challenge:** one staff engineer thinks the delay is approvals, not
> tooling. We're timing both segments of the journey so the disagreement can be
> settled with evidence.
>
> **Safe to miss:** if teams still need us, we've learned the constraint is
> knowledge, not templates — and we'd invest in pairing instead.
>
> **Happier:** product teams stop waiting on a queue; platform engineers stop
> being a ticket desk.

## Common traps

- **A solution wearing a hypothesis costume.** If the "outcome" is "the platform
  is adopted", ask what adoption gets people. Adoption is an output.
- **Signals you can't see for a quarter.** If the earliest evidence is 12 weeks
  out, the slice is too big. Find something you can read in three.
- **No guardrails.** Any single measure can be gamed. Two guardrails is usually
  enough; seven measures is a scorecard, not a goal.
- **Nobody challenged it.** If the "safe to challenge" box is empty, the goal
  hasn't been tested — it's just been announced.

## Related

- Skill: `writing-better-goals` — coach a goal from vague to testable
- Skill: `outcome-vs-output-check` — score a draft in under a minute
