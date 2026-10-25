/**
 * The goal anti-patterns gallery.
 *
 * Each entry is a goal as it was actually written somewhere, paired with the
 * same intent rewritten as an outcome. The goals are composites: drawn from
 * goals the community has seen in the wild, with the organisation, the numbers
 * and the identifying detail changed. That is deliberate — PRINCIPLES.md says
 * this site refuses personal information, and a verbatim goal is often
 * traceable to the team that wrote it.
 *
 * The point of naming a pattern is recognition. A leader who has read
 * "output fixation" once tends to catch it in their own draft the next time.
 */

export type AntiPattern = {
  /** Anchor id, used by the jump list at the top of the page. */
  id: string;
  /** The name to remember it by. */
  name: string;
  /** What people usually call it in the room. */
  aka: string;
  /** One line: how you spot it in a draft. */
  tell: string;
  /** Where this kind of goal tends to show up. */
  context: string;
  /** The goal, as written. */
  before: string;
  /** What makes it a bad goal. */
  why: string[];
  /** The same intent, rewritten as an outcome. */
  after: string;
  /** What the rewrite buys you. */
  better: string[];
  /** The heading in PRINCIPLES.md this one fails hardest. */
  principle: string;
};

export const ANTI_PATTERNS: AntiPattern[] = [
  {
    id: "output-fixation",
    name: "Output fixation",
    aka: "The delivery checklist",
    tell: "The goal is finished when the work is finished — not when anything is better.",
    context: "The headline quarterly goal of a 200-person technology group.",
    before: "Deliver the Customer Data Platform migration by 31 December.",
    why: [
      "It is complete the moment the work stops, whether or not a single customer noticed.",
      "Nobody has to ask whether the migration was the right bet — that question was closed when the goal was written.",
      "You can hit it in full, on time, and be worse off.",
      "Because success is a date, the only levers left near the end are cutting scope and burning people.",
    ],
    after:
      "By 31 December, service agents resolve a billing query in one call 60% of the time, up from 34% — because they can finally see the whole customer in one place.",
    better: [
      "Names who gets a better experience: the agent on the call, and the customer who stops repeating themselves.",
      "Measures a change in behaviour, from x to y, so you can tell movement from activity.",
      "The migration is now the bet, not the goal — if a smaller slice moves the number, you are allowed to stop.",
    ],
    principle: "Outcomes over outputs",
  },
  {
    id: "vanity-metric",
    name: "The vanity metric",
    aka: "The number that only goes up",
    tell: "The measure cannot go down, and nobody can say what changes for a customer when it goes up.",
    context: "A marketing team's headline key result, repeated for three years running.",
    before: "Grow our community to 50,000 followers this year.",
    why: [
      "Nothing in the number separates a person who buys from a person who scrolled past once.",
      "It only ever goes up, so it can never tell you a bet is failing — and a measure that cannot deliver bad news is not feedback.",
      "It can be bought. Spend enough and you hit it without any part of the strategy being true.",
      "Hitting it and missing the business by a mile are perfectly compatible, which is how it survives three years.",
    ],
    after:
      "Raise the share of new customers who say a community member helped them choose us from 4% to 15% by Q4.",
    better: [
      "Measures value received, not attention collected.",
      "It can fall, which makes it honest — and makes an early drop worth acting on.",
      "You cannot buy it; you can only earn it by making the community genuinely useful.",
    ],
    principle: "Measure movement and impact",
  },
  {
    id: "kpi-sprawl",
    name: "Forty-seven KPIs",
    aka: "The dashboard as strategy",
    tell: "You cannot say what the team would drop everything for, because everything is on the scorecard.",
    context: "The monthly operating rhythm of a division in a large bank.",
    before:
      "Team scorecard: 47 KPIs across five pillars, each rated red / amber / green every month.",
    why: [
      "With 47 measures there is no priority, only a colouring exercise.",
      "Collecting and rating the numbers costs more effort than moving any one of them.",
      "Almost everything settles at amber, where no one is wrong and nothing is urgent.",
      "Leadership attention goes to whichever square went red this month, which is not the same as strategy.",
    ],
    after:
      "One objective this quarter. One lagging measure of value, and three leading indicators the team can read weekly. The other 43 numbers move to a health dashboard: watched, alarmed if they break, not chased.",
    better: [
      "Fewer, bigger, bolder — the team can say out loud what this quarter is for.",
      "Separates the bet you are making from the health you are protecting; both matter, they are not the same list.",
      "Three leading indicators readable in a week means you can change your mind in week three rather than month eleven.",
    ],
    principle: "Fewer, bigger, bolder",
  },
  {
    id: "unchallengeable",
    name: "The goal nobody can challenge",
    aka: "The number from the top",
    tell: "The number arrived without its reasoning, and the person who questions it is the problem.",
    context: "The Monday after a board meeting.",
    before: "Reduce operating cost by 22%. Non-negotiable. Cascaded to every team by Friday.",
    why: [
      "The reasoning did not travel with the number, so nobody downstream can test whether 22% is the right number — only whether they are loyal.",
      "Disagreement now reads as disloyalty, so the risks stay quiet until the year-end review makes them undeniable.",
      "Teams hit it the cheapest way: moving cost off their line rather than out of the business.",
      "It is a goal in the shape of an instruction, so it produces compliance and no thinking.",
    ],
    after:
      "We need to free up £4m of run cost this year to fund the new platform — here is the board's reasoning and the constraints. Each area proposes where its share comes from and what breaks if it does. We review together in two weeks, and if the evidence says the total is wrong, the total moves.",
    better: [
      "Safe to challenge: the reasoning is on the table, so disagreement is about the evidence rather than about you.",
      "Keeps the judgement with the people closest to the work, which is also where the cheap cuts and the dangerous ones are told apart.",
      "Names the reason behind the number, so a team can find a better way to serve it.",
    ],
    principle: "Safe to challenge",
  },
  {
    id: "the-cascade",
    name: "The cascade",
    aka: "A goal for every person",
    tell: "Goals were produced by copying downward, so every level's goals are the level above, chopped up.",
    context: "A 140-person product organisation, every quarter, for two days each time.",
    before:
      "Every person has three personal OKRs, aligned to their manager's, aligned to their director's.",
    why: [
      "It cascades tasks upward-aligned rather than intent downward-shared: 420 objectives, of which nobody reads more than six.",
      "Individual OKRs quietly become performance ratings, and the moment they do, people set goals they already know they will hit.",
      "The seams between teams — where customer value actually breaks — belong to no individual, so nobody owns them.",
      "Two days a quarter of goal admin buys alignment on paper and not much else.",
    ],
    after:
      "Three organisation-level outcomes. Each team writes one shared outcome naming its contribution, including the ones it can only reach with another team. Individual objectives exist for growth conversations, and stay out of the scorecard.",
    better: [
      "Shares intent instead of cascading tasks, so teams can find their own route.",
      "Shared team outcomes give the gaps between teams an owner.",
      "Separating growth from delivery takes the fear out of goal-setting, which is what stops people sandbagging.",
    ],
    principle: "Connect to strategy and value",
  },
  {
    id: "no-learning-loop",
    name: "No learning loop",
    aka: "All lagging, no leading",
    tell: "The first honest read on the goal arrives in month eleven.",
    context: "An annual goal in a commercial team, reviewed quarterly, missed annually.",
    before: "Increase annual revenue per customer by 12% by year-end.",
    why: [
      "The only measure lands after the year it was meant to guide.",
      "There is nothing to pivot on: the team cannot tell a good week from a bad one.",
      "It measures the result and says nothing about the behaviour meant to produce it, so a miss teaches you nothing about why.",
      "By the time it is clearly off track, the time you would have needed to act is gone.",
    ],
    after:
      "Keep the 12% as the lagging measure of value, and add three leading indicators read weekly: share of accounts with a completed needs review, share of reviews that open a second product conversation, and days from conversation to quote. Revisit the bet at week six.",
    better: [
      "Leading indicators make the hypothesis testable in weeks, so a wrong bet costs six weeks rather than a year.",
      "The leading measures describe behaviour, so a miss points at something you can change.",
      "The lagging number still holds everyone honest about value — it just stops being the only signal.",
    ],
    principle: "Outcomes are hypotheses",
  },
  {
    id: "weasel-goal",
    name: "The weasel goal",
    aka: "The one you cannot fail",
    tell: "Everyone in the room agrees with it, and no two people mean the same thing by it.",
    context: "Slide 4 of most strategy decks.",
    before:
      "Improve the customer experience and drive best-in-class engagement, leveraging our digital capability.",
    why: [
      "No customer is named, no measure is given, no date is set — so nothing about it can be wrong.",
      "Universal agreement is a warning sign here: it means the words are carrying everybody's private definition.",
      "Anyone can declare it achieved at any time, and anyone can claim it never was.",
      "It is unfalsifiable, so it cannot teach the organisation anything at all.",
    ],
    after:
      "First-time renters complete an application in under 10 minutes by the end of Q3 — today the median is 31 minutes and 44% abandon part-way.",
    better: [
      "Names one customer segment and the problem they are actually having.",
      "States today's number as well as the target, so progress is arguable with evidence.",
      "Written so anyone can understand it — no one needs the deck to know whether it happened.",
    ],
    principle: "Written so anyone can understand it",
  },
  {
    id: "pre-won",
    name: "The pre-won goal",
    aka: "Sandbagging",
    tell: "Compare the target with last year's actual: the goal was met on the day it was written.",
    context: "An operations goal in an organisation where missing a goal costs you your bonus.",
    before: "Achieve 99.5% platform availability this year. (Last year: 99.7%.)",
    why: [
      "The target sits below the current run rate, so the goal is already achieved before anyone does anything.",
      "This is what a system produces when missing a goal is punished: goals that were never a stretch.",
      "A percentage this high hides the thing customers feel — a single four-hour outage at 9am on payday barely moves it.",
      "The real risks never get named, because naming one would mean setting a goal you might miss.",
    ],
    after:
      "Halve the customer-minutes lost to unplanned downtime, from 40,000 to 20,000, by Q4. We do not yet know if that is reachable, and we would rather find out than not ask.",
    better: [
      "Measures what customers actually lose rather than a percentage that flatters the worst outages.",
      "Held as a hypothesis and safe to miss, so the team can aim at something worth aiming at.",
      "Stated honestly as uncertain, which makes it safe for someone to say early that it is not working.",
    ],
    principle: "Better value, sooner, safer, happier",
  },
];

/**
 * The five questions that catch most of the gallery in one pass — the thing to
 * run over your own draft before you send it.
 */
export const SPOT_CHECK = [
  {
    question: "Could we do all of this and nothing gets better for anyone?",
    catches: "Output fixation, the weasel goal",
  },
  {
    question: "Can this measure go down? Would we want to know if it did?",
    catches: "The vanity metric, the pre-won goal",
  },
  {
    question: "What tells us in three weeks that this is working?",
    catches: "No learning loop",
  },
  {
    question: "Who in this organisation can say “I think this goal is wrong”, and what happens to them?",
    catches: "The goal nobody can challenge",
  },
  {
    question: "If we could only keep one of these goals, which one — and why is the rest of the list still here?",
    catches: "Forty-seven KPIs, the cascade",
  },
];
