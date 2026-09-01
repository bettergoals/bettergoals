---
name: Outcome canvas
description: The Sooner Safer Happier canvas for writing a goal — nine boxes that take a rough ambition to an outcome, its key results, and the assumptions underneath. The one to run as a group session on a wall.
format: Nine-box canvas
time: 90 minutes with the team
---

# Outcome canvas

Most goals go wrong before anyone starts work on them: they get written by the wrong
people, in a hurry, as a list of things to build. This canvas slows that down for
ninety minutes and asks nine questions instead.

It's the Sooner Safer Happier way of writing an outcome — see the
[quick-learn guide](https://www.soonersaferhappier.com/training/quick-learn-outcome-canvas)
for the walkthrough, and [the canvas laid out visually](https://bettergoals.ai/canvas)
if you'd rather run it on a wall.

Fill it in **with** the people closest to the work, not for them. If a box is hard to
answer, that's the finding — write the open question in it rather than a comfortable
non-answer.

## The template

```
OUTCOME OWNER: <name>          DATE: <date>
HORIZON: <when would we expect to know whether this worked?>

1. OUTCOME
   <What change in the world are we going for? One or two sentences, no solutions.>

2. WHY NOW
   <Why does this matter, and why now? Which strategic bet or problem does it serve?
    If nothing changes, what does it cost us?>

3. WHO BENEFITS
   <Whose life gets better — a specific customer, colleague or citizen.
    Not "the business". Not "stakeholders".>

4. BETTER VALUE
   <What value do they actually get? How would we know it's real rather than assumed?
    What would we see them doing differently?>

5. SOONER
   <How do we see signal in weeks rather than quarters?
    Smallest slice worth doing: <what we'd ship first, and when>>

6. SAFER
   <What makes this safe to attempt, safe to challenge, and safe to miss?
    Safe to challenge: who has argued this is the wrong goal, and what changed?
    Safe to miss: if the signal hasn't moved by <date>, we will <stop / pivot / dig>.>

7. HAPPIER
   <Who ends up happier — customers AND the people doing the work?
    Would the team choose this goal if it were entirely up to them?>

8. KEY RESULTS — one to three, no more
   <measure>: from <baseline today> to <target> by <date>   [leading | lagging]
   <measure>: from <baseline today> to <target> by <date>   [leading | lagging]

   GUARDRAILS — what must not get worse while we chase these
   <measure> stays <threshold>
   <measure> stays <threshold>

9. ASSUMPTIONS TO TEST
   <the assumption most likely to be wrong>
     → test: <the cheapest thing that could disprove it>  by <a date inside weeks>
```

## Worked example — a platform team

> **1. Outcome:** teams that need a new service can have it running the same day,
> without asking us — so waiting on the platform team stops being part of how software
> gets built here.
>
> **2. Why now:** platform requests are our biggest source of delivery delay. 40% of
> team lead-time is spent waiting on us, and it's the top complaint in the last two
> engagement surveys.
>
> **3. Who benefits:** an engineer on a stream-aligned team who needs a new service
> running, and their tech lead who currently chases our queue.
>
> **4. Better value:** teams ship their own services without a ticket — visible as
> fewer platform tickets and shorter team lead-time, not as "platform maturity".
>
> **5. Sooner:** one language, one service shape, three volunteer teams self-serving
> within a fortnight — then watch where they get stuck.
>
> **6. Safer:** self-service paths are pre-approved by security, so nothing ships less
> compliant. *Safe to challenge:* two engineers argued the real blocker is our
> approval SLA, not tooling — so we're measuring both. *Safe to miss:* if fewer than
> a third of new services are self-served by end of Q3, we've backed the wrong
> constraint and we say so.
>
> **7. Happier:** teams stop queueing; the platform team stops being a ticket desk and
> gets to build the paved road it's wanted for a year.
>
> **8. Key results:** services created without a platform ticket, 0% → 60% by end of
> Q3 *(leading)*. Median wait for a new service, 9 days → under 1 day *(lagging)*.
> **Guardrails:** change-failure rate stays at or below 8%; on-call pages per week
> don't rise.
>
> **9. Assumptions to test:** we assume teams *want* to self-serve rather than hand
> off. → Test: offer three teams the choice this sprint and see who takes it. By the
> 19th.

Notice what the example does: the outcome names who gets a better experience, every
key result is paired with a guardrail, the smallest slice is two weeks long, and box 6
records an actual disagreement rather than claiming there wasn't one.

## Before you commit — the smell test

- Could we complete this and have nothing get better for anyone? Then it's a task
  list, not a goal.
- Is the outcome a solution in disguise — "migrate to X", "launch Y", "roll out Z"?
- Is there a measure we could hit by gaming rather than by improving?
- Will we learn something *before* the deadline, or only at it?
- Could anyone in the room have said "I think this is the wrong goal"? If nobody
  could, the canvas isn't finished — psychological safety is a prerequisite, not a
  nice-to-have.
- Is this one goal, or five goals wearing one hat?

## Pair it with a skill

The [`outcome-canvas` skill](https://bettergoals.ai/skills) turns Claude into a
facilitator for this canvas — one box at a time, one question at a time, and it runs
the smell test with you at the end.
