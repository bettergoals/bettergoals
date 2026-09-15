/**
 * The SSH OKR pattern, briefed to a coach — idea #164.
 *
 * `/okrs` is, per CARD A, "how Sooner Safer Happier thinks about and applies
 * OKRs… the domain content the coaching is actually teaching", and it is binding
 * on every card in the series, second only to `PRINCIPLES.md`. Until this file
 * existed it was only ever binding on the *page*: both coaches were briefed on
 * the outcome principles and told nothing about the pattern, so the framework
 * the site teaches and the framework the coach coached to had drifted apart —
 * most visibly on how many measures a goal carries.
 *
 * So the brief is **built from the same constants the page renders**
 * (`lib/okrPattern.ts`) rather than written out a second time in prose. Change
 * the count in one place and the page, the draft goal, the takeaway and both
 * coaches change with it. They cannot disagree, because there is only one of
 * them. See `docs/decisions/0007-the-coaches-are-briefed-on-the-pattern.md`.
 *
 * Two renderings, one content:
 *  - `okrPatternBrief()` — markdown `###` sections, for the typed coach's system
 *    prompt (`lib/coachAi.ts`), which is written in markdown throughout.
 *  - `okrPatternBriefSpoken()` — `HEADING. text` paragraphs, the house style of
 *    the voice coach's instructions (`lib/voiceColumn.ts`), which carry no
 *    markup because they are read, not rendered.
 *
 * It is a brief, not a script. The last section says so to the coach, and it is
 * the rule that governs the rest: the coach coaches this, never recites it,
 * never names the framework when a plain question would do, and where
 * `PRINCIPLES.md` and the pattern disagree the principles win.
 */

import {
  CADENCE,
  GOLDEN_THREAD,
  KEY_RESULTS,
  KR_LEADING_RANGE,
  KR_RANGE,
  OBJECTIVE,
  THREE_MS,
} from "./okrPattern";

/** The line that says what this is and where it comes from. */
const PREAMBLE =
  "This is how Sooner Safer Happier think about and apply OKRs — the same pattern bettergoals.ai/okrs teaches, so what you coach and what the site teaches are one thing from one source. A leader who has read that page should recognise the conversation they then have with you.";

/**
 * The three clauses as a sentence: "Due to <…>, we believe that <…>, will
 * result in <…>". The page prints the leads as labels, where the capitals are
 * right; in prose only the first one starts a sentence.
 */
const objectiveFormat = OBJECTIVE.clauses
  .map(({ lead, fills }, i) => `${i === 0 ? lead : lead.toLowerCase()} <${fills}>`)
  .join(", ");

const threeMs = THREE_MS.map((m) => `**${m.m}** (${m.scope}) — ${m.text}`).join(" ");
const cadence = CADENCE.map((c) => `**${c.horizon}**: ${c.text}`).join(" ");

type Section = { heading: string; body: string };

const SECTIONS: readonly Section[] = [
  {
    heading: "The Objective is an outcome hypothesis",
    body:
      `The Objective carries the bet you are placing and the capability you are building: where you want to play and how you are going to win. SSH write it as an outcome hypothesis — ${OBJECTIVE.equation} — in three clauses: "${objectiveFormat}." ` +
      `${OBJECTIVE.whyHypothesis} ` +
      "That word is the one to hold them to. A leader who finds out early that their bet was wrong has had a good quarter, not a bad one — so an objective stated as a certainty, or as a solution already chosen, is the thing worth pushing on.",
  },
  {
    heading: "The Key Results are the feedback",
    body:
      `Key Results are the leading and lagging metrics that tell you how the journey is going and what success looks like. An OKR carries ${KR_RANGE} of them: ${KR_LEADING_RANGE} leading indicators and ${KEY_RESULTS.lagging} lagging indicator. Leading — ${lower(KEY_RESULTS.leadingText)} Lagging — ${lower(KEY_RESULTS.laggingText)} ` +
      `Each one is measurable and written in the same shape, \`${KEY_RESULTS.format}\` — which is to say a measure of behaviour or movement, with a baseline, a target and a date. ${KEY_RESULTS.promise} is the question a set of them answers. ` +
      "A list of things to deliver is not a set of Key Results, however well it is numbered. Nor is a single number on its own: one measure tells you whether the thing you already chose to build got built, and leaves you nothing to pivot on while there is still time. " +
      `But ${KR_RANGE} is the pattern, not a quota. Never chase someone up to the count by inventing measures, and never tell a leader their one good measure is wrong — say what a full set looks like, ask what else would move if this were working, and let a measure that does not exist yet be an honest open question.`,
  },
  {
    heading: "More than a framework — the 3Ms",
    body:
      `${threeMs} ` +
      "Mindset is the one that gets skipped, and the one that decides whether any of the rest works: OKRs held deterministically become a contract to be judged against, which is the behaviour the pattern exists to move away from.",
  },
  {
    heading: "OKRs nest — the golden thread",
    body:
      `Outcomes hang on a thread of three horizons. ${cadence} ${GOLDEN_THREAD} ` +
      "So every goal sits at one of the three, and which one changes what a good measure looks like — the outcome lands at the end of its horizon, and a leading indicator is whatever tells you you are on track long before it does. Weeks for a quarterly outcome, months for an annual or multi-year one. Ask for evidence sooner than their horizon, never for value in weeks.",
  },
  {
    heading: "A brief, not a script",
    body:
      "You coach this; you never recite it. Don't read the pattern out, don't name the framework, the slides or the counts when a plain question would do, and never turn the conversation into a compliance check against it. " +
      "The community's principles come first: where they and this pattern disagree, the principles win — nothing here is a test, \"I don't know\" is a legitimate answer, and a leader leaves owning their goal. " +
      "And where the pattern would have you ask for something they haven't got — a baseline nobody measures, a fifth measure that doesn't exist — the honest gap is the better answer. Never invent one to complete the shape.",
  },
];

/** Lower-case a sentence's first letter so it can be spliced mid-sentence. */
function lower(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * The brief as markdown, for a system prompt written in markdown. `###`
 * headings, to sit under a `##` section beside the other briefs there.
 */
export function okrPatternBrief(): string {
  return [PREAMBLE, ...SECTIONS.map((s) => `### ${s.heading}\n${s.body}`)].join("\n\n");
}

/**
 * The same brief as spoken instructions: no markup, and each section led by its
 * heading in capitals, which is how the voice coach's brief is written
 * throughout. Emphasis and code marks are stripped rather than said out loud.
 */
export function okrPatternBriefSpoken(): string {
  return [
    `HOW SSH THINK ABOUT OKRS. ${PREAMBLE}`,
    ...SECTIONS.map((s) => `${s.heading.toUpperCase()}. ${plain(s.body)}`),
  ].join("\n\n");
}

/**
 * Markdown marks and the format's angle brackets would be read out as
 * punctuation. Take them out: "due to <this belief>" is spoken as "due to this
 * belief", which is the sentence anyway.
 */
function plain(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/[<>]/g, "");
}
