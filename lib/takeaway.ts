/**
 * The takeaway — step 13 of the entry column. CARD 6, slide 16.
 *
 * Three artefacts, and the one file they leave as: the goal in the Sooner Safer
 * Happier pattern, the canvas with gaps and all, and a prompt to carry on
 * somewhere else. Nothing is stored anywhere; this module is the only thing that
 * turns a run into something you can keep, and it is handed the run from the
 * query string every time it is asked.
 *
 * Source: slide 16 of `docs/reference/voice-coach-deck.md` for what the three
 * artefacts are and in what order, `/okrs` for what the SSH pattern actually
 * says, and `docs/reference/card-a.md` for what must never appear in any of
 * them.
 *
 * The rules this file exists to keep:
 *  - it arranges the reader's words; it does not write them. Every line of
 *    content below is something the reader said, put under a label. Nothing here
 *    drafts an objective, improves a phrase or fills a gap — "coach, don't
 *    dictate", and a goal the coach wrote is not the reader's goal.
 *  - the open questions travel, marked as questions. A blue note is an answer
 *    the reader takes back to their team (rule 9); in a file that has left this
 *    site it has to say so in words, because nothing out there is blue.
 *  - a box nobody wrote in is named as a leave, not a blank. It is only ever
 *    said when it is true — the deck's example has one and a finished run here
 *    may not, and inventing one to match a wireframe would be a lie about the
 *    reader's own canvas.
 *  - no score, no total, no percentage, no headline number — in the file as much
 *    as on the screen. CARD A, contract 1.
 *  - no persistence, and it says so. The file's own first lines are the "closing
 *    the tab loses everything" sentence, because the file is the only part of
 *    this that outlives the tab.
 */

import { CANVAS_ORDER, type CanvasBox } from "./canvas";
import type { CanvasState, Note } from "./coaching";
import { COACHING_RULES, skillFor } from "./handover";
import { KR_RANGE } from "./okrPattern";
import type { Run } from "./triage";

/** What the reader said they'd take back to their team, and which box it was in. */
export type OpenQuestion = { box: CanvasBox; text: string };

/** A box nobody wrote in. Named, never counted, and never called incomplete. */
export type Untouched = { box: CanvasBox };

/**
 * The goal, in the SSH pattern — artefact 1.
 *
 * The pattern is the OKRs page's, not this file's: an objective that is an
 * outcome hypothesis, and key results that are leading indicators of movement
 * plus a lagging indicator of impact. Every field is nullable because the
 * conversation is allowed to end without it, and an empty one is shown as
 * missing rather than quietly dropped.
 */
export type Goal = {
  /** The bet, in the reader's words. */
  objective: string | null;
  /** Who it's for and what changes in their behaviour — the current wording. */
  forWhom: string | null;
  /** What tells us we're on track, long before the outcome is due. */
  leading: string | null;
  /** What would convince a sceptic — null when that answer was a question. */
  lagging: string | null;
};

export type Takeaway = {
  goal: Goal;
  /** The canvas, in canvas order, exactly as it stands. */
  boxes: { box: CanvasBox; notes: Note[] }[];
  open: OpenQuestion[];
  untouched: Untouched[];
  /** A prompt with the canvas in it, for carrying on elsewhere. */
  prompt: string;
};

/** The last thing said into a box. Nothing is lost — `struck` carries the rest. */
function noteIn(state: CanvasState, id: CanvasBox["id"]): Note | null {
  const notes = state.boxes[id].notes;
  return notes.length > 0 ? notes[notes.length - 1] : null;
}

/** What the reader is taking with them, in whatever state it's in. */
export function takeawayFor(run: Run, state: CanvasState): Takeaway {
  const boxes = CANVAS_ORDER.map((box) => ({ box, notes: state.boxes[box.id].notes }));

  const open: OpenQuestion[] = boxes.flatMap(({ box, notes }) =>
    notes.filter((n) => n.kind === "open").map((n) => ({ box, text: n.text })),
  );
  const untouched: Untouched[] = boxes.filter(({ notes }) => notes.length === 0).map(({ box }) => ({ box }));

  const lagging = noteIn(state, "lagging");
  const goal: Goal = {
    objective: noteIn(state, "hypothesis")?.text ?? null,
    forWhom: noteIn(state, "centre")?.text ?? null,
    leading: noteIn(state, "leading")?.text ?? null,
    lagging: lagging && lagging.kind === "sticky" ? lagging.text : null,
  };

  return { goal, boxes, open, untouched, prompt: carryOnPrompt(run, { goal, boxes, open, untouched }) };
}

/**
 * What the canvas says about itself at step 12 — the half of "still open" that
 * needs no signal to be true, because it is the reader's own material.
 *
 * The deck's example ends with one box untouched and says so out loud. A run
 * here may end with none, and then this says nothing about it: a sentence about
 * an untouched box, said when every box has something in it, would be the
 * column lying about the reader's canvas to match a wireframe.
 */
export function stillOpenInWords({ open, untouched }: Pick<Takeaway, "open" | "untouched">): string[] {
  const said = open.map(
    (q) => `“${q.text}” is still a question — ${q.box.short}, and it goes with you as a question, not a blank.`,
  );
  if (untouched.length === 1) {
    said.push(`One box we never wrote in — ${untouched[0].box.short}. That's a leave, not a miss.`);
  } else if (untouched.length > 1) {
    said.push(
      `Boxes we never wrote in: ${untouched.map((u) => u.box.short).join(", ")}. Left, not missed.`,
    );
  }
  return said;
}

/* ------------------------------------------------------------------------ */
/* Artefact 3 — a prompt with your canvas in it                              */
/* ------------------------------------------------------------------------ */

/**
 * The prompt to carry on elsewhere.
 *
 * The off-ramp's prompt (`carryBackPrompt`) starts a conversation somewhere we
 * can't see; this one resumes the conversation we just had, so it carries the
 * canvas. Both ask for the coaching to be done the same way — that list is
 * `COACHING_RULES`, shared, so the two can never drift apart.
 *
 * It asks the reader's assistant to pick up the open questions as questions. It
 * does not ask it to answer them.
 */
function carryOnPrompt(
  run: Run,
  { goal, boxes, open, untouched }: Omit<Takeaway, "prompt">,
): string {
  const skill = skillFor(run.who);
  const lines: string[] = [
    `I've been working on a goal with the coach on bettergoals.ai. Nothing is saved there, so here's where I got to — I'd like to carry on with you.`,
    ``,
    `This is the SSH Outcome Canvas, in the order it's worked:`,
    ``,
  ];

  for (const { box, notes } of boxes) {
    lines.push(`${box.numeral} ${box.label}`);
    if (notes.length === 0) {
      lines.push(`   (we never wrote in this one)`);
      continue;
    }
    for (const note of notes) {
      if (note.struck) lines.push(`   (earlier wording, kept: ${note.struck})`);
      lines.push(note.kind === "open" ? `   OPEN QUESTION: ${note.text}` : `   ${note.text}`);
    }
  }

  lines.push(``);
  if (goal.objective) {
    lines.push(`The bet I'm making: ${goal.objective}`);
  }
  if (open.length > 0) {
    lines.push(
      ``,
      `${open.length === 1 ? "One thing is" : `${open.length} things are`} still open. ${
        open.length === 1 ? "It's a question" : "They're questions"
      } for my team, not ${open.length === 1 ? "a gap" : "gaps"} for you to fill:`,
      ...open.map((q) => `- ${q.text} (${q.box.short})`),
    );
  }
  if (untouched.length > 0) {
    lines.push(
      ``,
      `We left ${untouched.length === 1 ? "one box" : `${untouched.length} boxes`} alone on purpose: ${untouched
        .map((u) => u.box.short)
        .join(", ")}.`,
    );
  }

  lines.push(
    ``,
    `Use the "${skill.name}" skill from bettergoals.ai/skills if you have it.`,
    ``,
    `How I'd like you to do it:`,
    ...COACHING_RULES,
    `- Start from what's here. Don't make me say it all again.`,
    ``,
    `Finish with the goal in the Sooner Safer Happier pattern: an objective written as an outcome hypothesis at its horizon, leading indicators that tell us we're on track long before that and a lagging indicator that would convince a sceptic. Show me the canvas, open questions and all.`,
  );

  return lines.join("\n");
}

/* ------------------------------------------------------------------------ */
/* The file                                                                   */
/* ------------------------------------------------------------------------ */

/**
 * What the plain-text copy is called. One file, three artefacts, markdown.
 * Since idea #134 the download itself is a PDF rendered from these same words
 * (`lib/takeawayPdf.ts`); this is the lossless copy beside it.
 */
export const TAKEAWAY_FILENAME = "better-goal.md";

/** A blank line, named so the assembly below reads as the file it produces. */
const BLANK = "";

/**
 * All three artefacts as one piece of plain text — what "copy as text" copies,
 * what the plain-text file contains, and the words the PDF is rendered from.
 * The same words however the reader takes it, so nothing depends on which
 * button they reached for.
 *
 * Markdown, because PRINCIPLES.md asks that what leaves here is plain,
 * structured text anyone can read, paste and reuse — no meaning locked inside a
 * colour, a diagram or a layout. The blue note that is an open question says
 * "open question" in words; the box nobody wrote in says so in words too.
 */
export function takeawayText(run: Run, state: CanvasState): string {
  const { goal, boxes, open, untouched, prompt } = takeawayFor(run, state);
  const out: string[] = [
    `# Your goal, your canvas, and a prompt to carry on`,
    BLANK,
    `From a coaching conversation on bettergoals.ai. There's no account and no`,
    `database behind it, and no copy anywhere else — this file is it.`,
    BLANK,
    `## 1 · The goal, in the Sooner Safer Happier pattern`,
    BLANK,
    `**Objective — an outcome hypothesis**`,
    BLANK,
    goal.objective ? `> ${goal.objective}` : `> (we didn't get to the bet)`,
    BLANK,
  ];

  if (goal.forWhom) out.push(`For: ${goal.forWhom}`, BLANK);

  out.push(`**Key results**`, BLANK);
  out.push(
    goal.leading
      ? `- Leading — what tells us we're on track early: ${goal.leading}`
      : `- Leading — what tells us we're on track early: (still open)`,
  );
  out.push(
    goal.lagging
      ? `- Lagging — what would convince a sceptic: ${goal.lagging}`
      : `- Lagging — what would convince a sceptic: (still open — see the questions below)`,
  );
  out.push(
    BLANK,
    `Sooner Safer Happier asks for ${KR_RANGE} key results, leading and lagging.`,
    `This is where the conversation got to, not the finished set.`,
    BLANK,
    `## 2 · The canvas, gaps and all`,
    BLANK,
  );

  for (const { box, notes } of boxes) {
    out.push(`### ${box.numeral} ${box.label}`, BLANK);
    if (notes.length === 0) {
      out.push(`We never wrote in this one. That's a leave, not a blank.`, BLANK);
      continue;
    }
    for (const note of notes) {
      if (note.struck) out.push(`- ~~${note.struck}~~ *(earlier wording, kept)*`);
      out.push(note.kind === "open" ? `- **Open question:** ${note.text}` : `- ${note.text}`);
    }
    out.push(BLANK);
  }

  if (open.length > 0) {
    out.push(
      `### The questions you're taking away`,
      BLANK,
      `${open.length === 1 ? "This is a question" : "These are questions"}, not ${
        open.length === 1 ? "a blank" : "blanks"
      }. ${open.length === 1 ? "It lives" : "They live"} with your team.`,
      BLANK,
      ...open.map((q) => `- ${q.text} — ${q.box.short}`),
      BLANK,
    );
  }

  if (untouched.length > 0) {
    out.push(
      `### Left alone, on purpose`,
      BLANK,
      ...untouched.map((u) => `- ${u.box.numeral} ${u.box.label}`),
      BLANK,
    );
  }

  out.push(`## 3 · Carry on elsewhere`, BLANK, `Paste this into your own AI assistant.`, BLANK, prompt, BLANK);

  return out.join("\n");
}

/**
 * The link the download hangs off. It carries the whole run, because the run is
 * the only place any of this lives — there is nothing on a server to ask for.
 *
 * `as: "text"` asks for this same file as markdown rather than the PDF the
 * download became in idea #134. Same words, same route, one parameter.
 */
export function takeawayHref(
  params: { name: string; value: string }[],
  { as }: { as?: "text" } = {},
): string {
  const q = new URLSearchParams();
  for (const { name, value } of params) q.set(name, value);
  if (as) q.set("as", as);
  const s = q.toString();
  return `/coach/entry/takeaway${s ? `?${s}` : ""}`;
}
