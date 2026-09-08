/**
 * The feedback form.
 *
 * Deliberately backend-free. There is no database here and no server-side
 * write: your answers travel in the page address, this module composes them
 * into a readable summary, and the last tap posts that summary as a GitHub
 * issue under your own account — the same route every idea takes, and the same
 * control SECURITY.md claims ("GitHub identity gates all contribution writes").
 *
 * Nothing here asks who you are. Contact details are one optional field you
 * type yourself, and the copy-and-paste route means someone with no GitHub
 * account can send feedback with no identity attached to it at all.
 */

import { REPO_URL, SITE } from "@/lib/config";

/** Long enough for a real answer, short enough to survive a GET address. */
export const MAX_TEXT_LENGTH = 800;
export const MAX_CONTACT_LENGTH = 120;

export type ChoiceQuestion = {
  id: string;
  /** The question, as asked on the page and repeated in the summary. */
  label: string;
  hint?: string;
  /** "one" renders radios, "many" renders checkboxes. */
  type: "one" | "many";
  options: string[];
};

/**
 * Six taps, in the order someone would tell you the story: what you came for,
 * whether you got it, then clarity, ease, barriers and trust. Every one is
 * optional — a partly answered form is still useful feedback.
 */
export const CHOICE_QUESTIONS: ChoiceQuestion[] = [
  {
    id: "intent",
    label: "What did you come here to do?",
    type: "one",
    options: [
      "Sharpen a goal or outcome of my own",
      "Check a goal with the Outcome Coach",
      "Find a template, skill or example",
      "Bring my boss, PMO or peers along",
      "Understand the principles",
      "Have a look around",
    ],
  },
  {
    id: "done",
    label: "Did you get it done?",
    type: "one",
    options: ["Yes", "Partly", "No", "Only browsing"],
  },
  {
    id: "clarity",
    label: "Did the site make sense as you read it?",
    type: "one",
    options: ["Clear throughout", "Mostly clear", "Confusing in places", "Hard to follow"],
  },
  {
    id: "ease",
    label: "How was it to use on your device?",
    type: "one",
    options: ["Easy", "Fine", "Awkward", "Something was broken"],
  },
  {
    id: "blockers",
    label: "Did any of these get in your way?",
    hint: "Tick as many as apply. Accessibility problems are bugs here, not preferences — please do say.",
    type: "many",
    options: [
      "Text too small or hard to read",
      "Not enough colour contrast",
      "Hard to use with a keyboard or screen reader",
      "Too much jargon",
      "Too much text to read",
      "Slow, or something didn’t work",
      "Couldn’t find what I needed",
    ],
  },
  {
    id: "trust",
    label: "Would you put this in front of your team or your boss?",
    type: "one",
    options: ["Already have", "Yes", "Not yet", "No"],
  },
];

export type TextQuestion = {
  id: string;
  label: string;
  hint?: string;
  placeholder: string;
  rows: number;
};

export const TEXT_QUESTIONS: TextQuestion[] = [
  {
    id: "missing",
    label: "What one thing would you add or change?",
    placeholder: "e.g. a worked example for a team that doesn’t set OKRs at all",
    rows: 3,
  },
  {
    id: "coach",
    label: "If you used the Outcome Coach, what did it get wrong or miss?",
    hint: "The check reads structure, not meaning, so it can be wrong. Paste the goal — anonymised — and what you expected instead. This is how it gets better.",
    placeholder:
      "e.g. it scored my goal as missing a measure, but “from 12 days to 3” is right there",
    rows: 3,
  },
  {
    id: "more",
    label: "Anything else you want to say?",
    hint: "Praise, doubts, a provocation — all welcome. Blunt is fine.",
    placeholder: "e.g. the principles page is the bit I’d send to my exec team",
    rows: 3,
  },
];

export const TOTAL_QUESTIONS = CHOICE_QUESTIONS.length + TEXT_QUESTIONS.length;

/**
 * Deep link from the Coach page: prefills "what did you come here to do" and
 * jumps straight to the question about what the check got wrong.
 */
export const COACH_FEEDBACK_HREF = `/feedback?intent=${encodeURIComponent(
  CHOICE_QUESTIONS[0].options[1]
)}#coach`;

export type Answer = { question: string; value: string; free: boolean };

export type Feedback = {
  answers: Answer[];
  contact: string | null;
  /** Summary for the GitHub issue body — contact travels in its own field. */
  markdown: string;
  /** The copy-and-paste version, contact included if one was given. */
  plainText: string;
  title: string;
  /** Prefilled GitHub issue, ready for the person to press Submit. */
  issueUrl: string;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(raw: string | string[] | undefined): string {
  return (Array.isArray(raw) ? raw[0] : raw) ?? "";
}

function all(raw: string | string[] | undefined): string[] {
  if (Array.isArray(raw)) return raw;
  return raw === undefined ? [] : [raw];
}

/** Drop control and zero-width characters, keeping ordinary line breaks. */
function stripInvisible(value: string): string {
  let out = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    const invisible =
      (code < 0x20 && char !== "\n" && char !== "\r" && char !== "\t") ||
      code === 0x7f ||
      (code >= 0x200b && code <= 0x200f) ||
      code === 0xfeff;
    if (!invisible) out += char;
  }
  return out;
}

/** Tidy one answer: no invisibles, no runaway blank lines, capped length. */
function clean(value: string, max: number): string {
  return stripInvisible(value)
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

/** Quote free text so a pasted heading or list can’t reshape the issue. */
function quote(value: string): string {
  return value
    .split("\n")
    .map((line) => `> ${line}`.trimEnd())
    .join("\n");
}

/**
 * Read the answers out of the page address.
 *
 * Choice answers are matched against the options we offered and anything else
 * is dropped, so a hand-edited address can only ever put words in the free-text
 * fields — which the person sees, and can edit, before anything is posted.
 * Returns null when nothing was answered at all.
 */
export function readFeedback(params: RawParams): Feedback | null {
  const answers: Answer[] = [];

  for (const question of CHOICE_QUESTIONS) {
    const chosen = all(params[question.id])
      .map((value) => clean(value, 120))
      .filter((value) => question.options.includes(value));
    if (chosen.length === 0) continue;
    answers.push({
      question: question.label,
      value: question.type === "many" ? chosen.join(", ") : chosen[0],
      free: false,
    });
  }

  for (const question of TEXT_QUESTIONS) {
    const value = clean(first(params[question.id]), MAX_TEXT_LENGTH);
    if (!value) continue;
    answers.push({ question: question.label, value, free: true });
  }

  if (answers.length === 0) return null;

  const contact = clean(first(params.contact), MAX_CONTACT_LENGTH) || null;

  const choices = answers.filter((a) => !a.free);
  const notes = answers.filter((a) => a.free);

  const sections: string[] = [];
  if (choices.length > 0) {
    sections.push(
      ["### How it went", "", ...choices.map((a) => `- **${a.question}** ${a.value}`)].join("\n")
    );
  }
  for (const note of notes) {
    sections.push([`### ${note.question}`, "", quote(note.value)].join("\n"));
  }
  sections.push(`_Sent from the feedback form at ${SITE.url.replace("https://", "")}/feedback._`);

  const markdown = sections.join("\n\n");
  const plainText = contact
    ? `${markdown}\n\nHappy to be asked more: ${contact}`
    : `${markdown}\n\nSent without contact details.`;

  const intent = choices.find((a) => a.question === CHOICE_QUESTIONS[0].label);
  const title = `[Feedback] ${intent ? intent.value : "Feedback on the site"}`;

  const query = new URLSearchParams({
    template: "feedback.yml",
    title,
    summary: markdown,
  });
  if (contact) query.set("contact", contact);

  return {
    answers,
    contact,
    markdown,
    plainText,
    title,
    issueUrl: `${REPO_URL}/issues/new?${query.toString()}`,
  };
}
