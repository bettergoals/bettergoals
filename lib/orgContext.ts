/**
 * Your context — the organisation you work in and the role you work from.
 *
 * The coach reads a sentence, not your organisation. That is the honest limit
 * printed on /coach, and it is why good coaching can still land wrong: it
 * doesn't know that "partner" means broker here, that goals are set annually
 * and signed off in a slide pack, or that you are coaching four team leads
 * rather than writing your own goal.
 *
 * This module is that missing half. A visitor writes a short profile once — the
 * organisation, their role, how goals work there, the language people use — and
 * it travels with every draft they coach, in the prompt and in the copy-paste
 * handoff.
 *
 * Two rules shape everything here:
 *
 *   It is framing, never evidence. Context tells the coach how to read the
 *   draft and how to pitch the questions. It never supplies a customer, a
 *   baseline, a target or a fact about the goal — only the draft and the
 *   author's own answers do that. See CONTEXT_RULES, which says so to the model.
 *
 *   It stays in the browser. There is no database and no account on this site
 *   (see /privacy), so the profile lives in localStorage on one device and is
 *   sent with a draft only when a coach call is actually made. It is also
 *   rendered as ordinary form fields, so the coach still works with JavaScript
 *   off — the context simply posts with the draft.
 */

export type ContextFieldId = "org" | "role" | "goals" | "language";

/** One visitor's context. Every field is optional; most people fill in two. */
export type OrgContext = Record<ContextFieldId, string>;

export const EMPTY_CONTEXT: OrgContext = { org: "", role: "", goals: "", language: "" };

/** Where the browser keeps it. Versioned so the shape can change later. */
export const CONTEXT_STORAGE_KEY = "bettergoals.context.v1";

export type ContextFieldDef = {
  id: ContextFieldId;
  label: string;
  /** Why we're asking, in the visitor's terms. */
  hint: string;
  placeholder: string;
  rows: number;
  max: number;
  /** How this field is introduced to the model. */
  promptLabel: string;
};

/**
 * Four fields, deliberately. A form long enough to feel like onboarding is a
 * form nobody fills in, and the coach's own principle is to ask for the least
 * detail needed to be useful.
 */
export const CONTEXT_FIELDS: readonly ContextFieldDef[] = [
  {
    id: "org",
    label: "Your organisation",
    hint: "What it does, who it serves, roughly how big, and anything about it that changes what a good goal looks like.",
    placeholder:
      "e.g. A 400-person general insurer. Most revenue is renewals through brokers, so brokers are as much our customer as policyholders. Regulated — anything touching claims moves slowly.",
    rows: 3,
    max: 700,
    promptLabel: "Their organisation",
  },
  {
    id: "role",
    label: "Your role",
    hint: "What you’re accountable for, and whether you’re writing your own goals, your team’s, or coaching someone else’s.",
    placeholder:
      "e.g. I lead the claims technology group — four teams, about 40 people. I write the group’s quarterly goals and review my team leads’.",
    rows: 3,
    max: 500,
    promptLabel: "Their role and what they’re accountable for",
  },
  {
    id: "goals",
    label: "How goals work here",
    hint: "What you call them, how often you set them, who signs them off, and what usually goes wrong.",
    placeholder:
      "e.g. Quarterly OKRs rolled up to annual “must-wins”. The exec review is a slide pack, so goals get written to look green rather than to be learned from.",
    rows: 3,
    max: 700,
    promptLabel: "How goals work where they work",
  },
  {
    id: "language",
    label: "Language and culture",
    hint: "Terms and acronyms your people use and what they mean, words to avoid, and how bluntly people can talk to each other.",
    placeholder:
      "e.g. “Partner” always means broker, never employee. The board watches NPS. Don’t say “customer obsession” — it was a failed programme people still wince at.",
    rows: 3,
    max: 700,
    promptLabel: "Their language and culture",
  },
];

/** The form field name for one context field, shared by the panel and the action. */
export function contextFieldName(id: ContextFieldId): string {
  return `ctx_${id}`;
}

/**
 * Drop control characters — a paste from a PDF or a hand-edited localStorage
 * value can carry them — while keeping the author's line breaks.
 */
function stripControl(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (ch === "\n" || (code >= 32 && code !== 127)) out += ch;
  }
  return out;
}

/**
 * Trim, clamp and de-noise whatever arrived — a form post, localStorage that
 * someone edited by hand, or a JSON body. Anything unrecognised becomes "".
 */
export function sanitiseContext(raw: unknown): OrgContext {
  const source = (raw ?? {}) as Partial<Record<ContextFieldId, unknown>>;
  const out: OrgContext = { ...EMPTY_CONTEXT };
  for (const field of CONTEXT_FIELDS) {
    const value = source[field.id];
    if (typeof value !== "string") continue;
    out[field.id] = stripControl(value.replace(/\r\n?/g, "\n"))
      // Collapse runs of spaces and tabs, but keep the author's line breaks.
      .replace(/[^\S\n]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, field.max);
  }
  return out;
}

/** Whether there is anything worth sending. */
export function hasContext(context: OrgContext | null | undefined): boolean {
  return Boolean(context) && CONTEXT_FIELDS.some((f) => Boolean(context?.[f.id]));
}

/** How many of the four are filled in — the panel's summary counts these. */
export function contextFilledCount(context: OrgContext | null | undefined): number {
  return CONTEXT_FIELDS.filter((f) => Boolean(context?.[f.id])).length;
}

function contextLines(context: OrgContext): string[] {
  return CONTEXT_FIELDS.filter((f) => context[f.id]).map((f) => `${f.promptLabel}: ${context[f.id]}`);
}

/**
 * How the coach is told to use the context. Kept next to the fields rather
 * than buried in the system prompt, because these rules are the feature: the
 * difference between coaching that lands and coaching that quietly invents
 * your baseline is entirely in this list.
 */
export const CONTEXT_RULES = `The author may have told this site about their organisation, their role, how goals work where they work, and the language their people use. When they have, it appears below the draft. Use it like this:

- Read the draft through it. Expand their acronyms, recognise their customers, products and teams, and take their framework and cadence as given rather than arguing with it.
- Pitch the coaching at their role. A team lead and a group executive own different-sized outcomes; ask the questions the person in front of you can actually act on, about the goals they actually write.
- Write candidates in their vocabulary, to their cadence, and avoid the words they told you to avoid.
- It is framing, never evidence. It never supplies a customer, a baseline, a target, a measure or any fact about THIS goal — only the draft and the author's answers do that. If the context makes you feel you know a number, you don't: it stays a «placeholder».
- Never spend a question on something the context already tells you. Knowing their role and their world is exactly what buys you a sharper question about this goal.
- Never score the draft on the context. A goal is not stronger because its author described their organisation well, and a missing check is still missing.
- Don't recite it back. They know where they work — use it, don't quote it.
- "Anyone can understand it" still means someone who joined last week. A term the context explains is fair game in a candidate; a term that hides what would actually be different for someone is not, however normal it is there.
- The personal-information rule covers the context too: if it names an identifiable person, set it aside and work with the role.
- When no context is given, coach the draft as it stands. Don't ask them to fill in a profile — one sharp question about their world is worth more than a form.`;

/** The context block that goes to the model, or null when there's nothing to say. */
export function contextPromptBlock(context: OrgContext | null | undefined): string | null {
  if (!context || !hasContext(context)) return null;
  return [
    "The author's context (their words, about where they work — not about this goal; framing, never evidence):",
    ...contextLines(context),
  ].join("\n");
}

/**
 * The same context, written for the prompt the author copies into their own AI
 * assistant, so a conversation that carries on elsewhere carries on informed.
 */
export function contextHandoffBlock(context: OrgContext | null | undefined): string[] {
  if (!context || !hasContext(context)) return [];
  return [
    "Context about where I work — use it to interpret my draft and to pitch your questions,",
    "never as a source of facts about this goal:",
    ...contextLines(context),
    "",
  ];
}

/**
 * A single paragraph of context for the voice coach, whose instructions are one
 * long string rather than a structured prompt.
 */
export function contextVoiceBlock(context: OrgContext | null | undefined): string | null {
  if (!context || !hasContext(context)) return null;
  return [
    "THEIR WORLD. Someone in the room told this site where they work. Use it to interpret what you hear, to pitch your questions at the right altitude and to speak their language — never as a source of facts, numbers or baselines about the goal, and don't read it back to them.",
    ...contextLines(context),
  ].join("\n");
}
