/**
 * Triage — steps 01–04 of the entry column. CARD 2.
 *
 * The things the coach establishes before any coaching starts: how you want to
 * talk, who is in the room, what to call you, what you brought, and whether the
 * two of you can work on it out here. Every answer leaves an outline chip
 * behind — a fact about you, not your thinking — and that chip sits under the
 * question it answered, above the canvas, for the rest of the run.
 *
 * Source: slides 3, 4, 5 and 6 of `docs/reference/voice-coach-deck.md`, under
 * `docs/reference/card-a.md`. The deck is binding on what is asked, in what
 * order, and what each answer produces. It is not binding on how any of it
 * looks.
 *
 * Idea #131 adds one turn the deck does not have, and rewords a second.
 * "It doesn't ask for our name or start to build rapport, it just moved to the
 * next step" — so between who's here and what you brought, the coach asks what
 * to call you, and uses it. The deck is binding on order, and this is an
 * insertion rather than a rearrangement: nothing the deck asks for has moved.
 * And the share question now asks the thing it was always for — whether the two
 * of you can work on this out here, or whether it can only happen inside their
 * organisation — because "can you share it with me?" read as a request for the
 * document rather than a fork in where the work happens.
 *
 * Two things this file deliberately does not do:
 *  - it does not count. There is no total, no "of three", no step number. Two
 *    chips read as two chips.
 *  - it does not persist. The whole run is the query string; close the tab and
 *    it is gone.
 */

import { COLUMN_PATH } from "./config";

export type Mode = "speak" | "type";
export type Who = "me" | "room";
export type Share = "yes" | "no";

/**
 * Whether the coach reads its questions out loud. Only ever `"off"` or unset:
 * choosing to talk is choosing to be talked to, so there is nothing to switch
 * on. It is here rather than in a preference because the query string is the
 * only state this thing has — and because WCAG 2.0 AA, 1.4.2, wants a way to
 * stop audio that started on its own. See `SayIt`.
 */
export type Voice = "off";

export type Run = {
  /** Unset until the landing screen is answered — that answer is what starts it. */
  mode: Mode | null;
  who: Who | null;
  /**
   * What to call them. Their own words, or `NO_NAME` when they'd rather not
   * say — which is an answer and moves the conversation on exactly as far.
   */
  name: string | null;
  /** One of the three offered answers, or the leader's own words. */
  brought: string | null;
  share: Share | null;
  /** Unset means the coach speaks. Answerable at any point, in both directions. */
  voice: Voice | null;
};

export type TriageAnswer = {
  value: string;
  label: string;
  /** The quieter second line the deck puts under each answer. */
  aside: string;
  /** What this answer leaves behind as a chip, in the leader's terms. */
  chip: string;
  /**
   * What this answer can sound like said out loud. Matched on whole words, so
   * "I don't know" never reads as "no". Only ever used to route a spoken
   * answer to the same place tapping it would have gone.
   */
  phrases: string[];
};

/** Slide 3. How you want to talk — the answer that starts the column. */
export const MODE_ANSWERS: readonly TriageAnswer[] = [
  {
    value: "speak",
    label: "◉ Talk to me",
    aside: "about four minutes, out loud",
    chip: "out loud",
    phrases: ["talk", "speak", "speaking", "out loud"],
  },
  {
    value: "type",
    label: "⌨ Type to me instead",
    aside: "same conversation, typed",
    chip: "typed",
    phrases: ["type", "typing", "typed", "write"],
  },
];

/** Slide 4. Who's here — the first chip. */
export const WHO_ANSWERS: readonly TriageAnswer[] = [
  {
    value: "me",
    label: "Just me",
    aside: "we'll have a conversation",
    chip: "one person, not a room",
    phrases: ["just me", "me", "myself", "on my own", "one person", "alone", "solo"],
  },
  {
    value: "room",
    label: "There's a room of us",
    aside: "I'll go on the big screen",
    chip: "a room of us",
    phrases: ["room", "a room of us", "a group", "group", "team", "big screen", "everyone"],
  },
];

/**
 * What to call them — idea #131. Not on a slide: the deck goes straight from
 * who's here to what you brought, and that jump is exactly what read as
 * robotic.
 *
 * The only fixed answer is the one that declines, and it is weighted like every
 * other answer in this column rather than offered as a skip. A name is a
 * courtesy the coach asks for, never a field it requires — PRINCIPLES.md,
 * "Accessible to everyone", and there is nothing downstream that needs it.
 */
export const NO_NAME = "anon";

export const NAME_ANSWERS: readonly TriageAnswer[] = [
  {
    value: NO_NAME,
    label: "I’d rather not say",
    aside: "that’s fine — nothing here needs it",
    // No chip. The turn greying is the acknowledgement; a chip saying what you
    // declined to tell me would be a record of the wrong thing.
    chip: "",
    phrases: [
      "rather not",
      "rather not say",
      "prefer not",
      "prefer not to",
      "no name",
      "not saying",
      "keep it to myself",
      "anonymous",
      "skip",
      "skip it",
      "next",
    ],
  },
];

/** The longest name we'll carry. A courtesy bound, not a safety one. */
export const NAME_MAX = 40;

/**
 * What people actually say when asked their name — "I'm Sam", "call me Sam",
 * "my name's Sam". Only the lead-in is trimmed; the name itself is theirs and
 * is never corrected, capitalised or otherwise tidied up.
 */
const NAME_LEAD_IN = /^(?:hi|hey|hello)?[\s,!.]*(?:i'?m|it'?s|this is|my name'?s|my name is|the name'?s|they call me|you can call me|call me|name'?s)\s+/i;

export function cleanName(said: string): string {
  return said
    .replace(/\s+/g, " ")
    .trim()
    .replace(NAME_LEAD_IN, "")
    .replace(/^["'“”‘’\s,.!-]+/, "")
    .replace(/["'“”‘’\s,.!]+$/, "")
    .slice(0, NAME_MAX)
    .trim();
}

/**
 * What the coach should call them, or null when there is nothing to call them.
 * Every use of the name goes through here, so "I'd rather not say" can never
 * leak into a sentence as the word "anon".
 */
export function callThem(run: Run): string | null {
  return run.name && run.name !== NO_NAME ? run.name : null;
}

/** Slide 5. What you brought — the second chip. Free text is offered alongside. */
export const BROUGHT_ANSWERS: readonly TriageAnswer[] = [
  {
    value: "nothing",
    label: "Nothing yet",
    aside: "a hunch, an itch, a problem",
    chip: "nothing yet",
    phrases: ["nothing", "nothing yet", "a hunch", "hunch", "an itch", "itch", "not yet"],
  },
  {
    value: "work",
    label: "Something from work",
    aside: "an OKR, a target, a mandate",
    chip: "something from work",
    phrases: ["from work", "work", "an okr", "okr", "okrs", "a target", "target", "a mandate", "mandate"],
  },
  {
    value: "draft",
    label: "A draft I wrote",
    aside: "I've had a go myself",
    chip: "a draft I wrote",
    phrases: ["a draft", "draft", "had a go", "wrote one", "written one"],
  },
];

/**
 * Slide 6. The fork. Both answers leave this screen forward, and the wording,
 * the weight and the shape of the two are deliberately identical — neither one
 * is the recommended answer.
 *
 * Idea #131 rewrote what the two answers say. The deck asks "can you share it
 * with me?", which reads as a request to hand something over — so people
 * answered it as if the coach wanted their document, and the follow-up made no
 * sense. The fork was never about the document. It is about where the work
 * happens: out here with the coach, or inside their own organisation with the
 * skill and the prompt. That is what both answers now say, and it is the same
 * fork the handover has always described (`lib/handover.ts`).
 */
export const SHARE_ANSWERS: readonly TriageAnswer[] = [
  {
    value: "yes",
    label: "Yes — we can work through it here",
    aside: "we start now, together",
    chip: "we can work on it out here",
    phrases: [
      "yes",
      "yeah",
      "yep",
      "sure",
      "of course",
      "go ahead",
      "happy to",
      "lets look",
      "work through it here",
      "work on it here",
      "out here",
      "in the open",
      "fine to",
    ],
  },
  {
    value: "no",
    label: "No — it stays inside our organisation",
    aside: "I'll set you up to coach it in there",
    chip: "it stays inside our organisation",
    phrases: [
      "no",
      "nope",
      "cant",
      "cannot",
      "it stays",
      "stays inside",
      "inside our",
      "in house",
      "internal",
      "internally",
      "confidential",
      "rather not",
      "better not",
    ],
  },
];

/** The longest free-text answer we'll carry. A UX bound, not a safety one. */
export const BROUGHT_MAX = 120;

function first(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/** The run so far, in the order it has to be answered — a gap ends it. */
export function readRun(params: Record<string, string | string[] | undefined>): Run {
  const mode = oneOf(first(params.mode), ["speak", "type"] as const);
  const who = mode ? oneOf(first(params.who), ["me", "room"] as const) : null;
  const nameRaw = who ? first(params.name) : null;
  // "I'd rather not say" is an answer and travels as itself. Anything else is
  // their own words, with only the lead-in trimmed off.
  const name = nameRaw === NO_NAME ? NO_NAME : nameRaw ? cleanName(nameRaw) || null : null;
  const broughtRaw = name ? first(params.brought) : null;
  const brought = broughtRaw ? broughtRaw.slice(0, BROUGHT_MAX) : null;
  const share = brought ? oneOf(first(params.share), ["yes", "no"] as const) : null;
  // Not gated by anything above it. Asking the coach to be quiet is not a turn
  // in the conversation, and it has to work at whatever point it is asked.
  const voice = oneOf(first(params.voice), ["off"] as const);
  return { mode, who, name, brought, share, voice };
}

/**
 * Whether the coach reads its questions out loud right now. Speaking mode is
 * what turns it on — "Talk to me" means a conversation, not a page with a
 * microphone button on it.
 */
export function readsAloud(run: Run): boolean {
  return run.mode === "speak" && run.voice !== "off";
}

/**
 * Every answer is a link back to this same page with one more thing known, so
 * there is never a route change and never a page to start. `#live` lands the
 * reader on the live turn, which is where they already were when they answered.
 */
export function runHref(run: Run, next: Partial<Run>, hash = "#live"): string {
  const merged = { ...run, ...next };
  const q = new URLSearchParams();
  if (merged.mode) q.set("mode", merged.mode);
  if (merged.who) q.set("who", merged.who);
  if (merged.name) q.set("name", merged.name.slice(0, NAME_MAX));
  if (merged.brought) q.set("brought", merged.brought);
  if (merged.share) q.set("share", merged.share);
  if (merged.voice) q.set("voice", merged.voice);
  const s = q.toString();
  return `${COLUMN_PATH}${s ? `?${s}` : ""}${hash}`;
}

function chipOf(answers: readonly TriageAnswer[], value: string): string {
  return answers.find((a) => a.value === value)?.chip ?? value;
}

/** The four turns that can leave a chip behind. Mode is not one of them. */
export type TriageTurn = "who" | "name" | "brought" | "share";

/**
 * What one answered turn left behind, or null when it left nothing.
 *
 * Idea #143 asks the chips by turn rather than as a list, because that is where
 * they now sit: under the question they answered rather than collected in a row
 * of their own, where "one person, not a room" had nothing next to it saying
 * which question it was the answer to. They are still chips, still greyed, and
 * still above the canvas for the rest of the run — the deck's contract (slides
 * 5, 7 and 8) is about where they stay, not about them being in one row.
 *
 * The mode answer is still not one of them: the deck never shows it as a chip,
 * and it is the one answer you can change at any time.
 */
export function chipFor(run: Run, turn: TriageTurn): string | null {
  switch (turn) {
    case "who":
      return run.who ? chipOf(WHO_ANSWERS, run.who) : null;
    // Their name in their own spelling, and nothing at all when they'd rather
    // not say — declining leaves no trace, which is the point of being able to.
    case "name":
      return callThem(run);
    case "brought":
      return run.brought ? chipOf(BROUGHT_ANSWERS, run.brought) : null;
    case "share":
      return run.share ? chipOf(SHARE_ANSWERS, run.share) : null;
  }
}

/**
 * Slide 4. The first thing the coach asks once you have said how you want to
 * talk.
 *
 * The triage questions live here as strings rather than as text inside the
 * column, because in speaking mode the coach now reads them out loud. One
 * string, said once and printed once, so what you hear and what you can see
 * can never drift apart.
 */
export const WHO_QUESTION = "First — is it just you, or is there a room of you?";

/**
 * Idea #131's new turn. It is where the coach says the who answer back — the
 * deck's habit, kept — and then asks the one thing that turns a questionnaire
 * into a conversation.
 *
 * It says why it is asking, in the same breath, because a name asked for
 * without a reason is a form field.
 */
export function nameQuestion(who: Who): string {
  return who === "me"
    ? "Just you and me, then. What should I call you?"
    : "A room of you — even better. What should I call you? You’re the one I’ll be talking to.";
}

/**
 * Slide 5, with the name in it: the coach greets them by it the first time it
 * has one, and then asks what they brought. Declining is answered too — being
 * unnamed should not read as having been ignored.
 */
export function broughtQuestion(run: Run): string {
  const you = callThem(run);
  const hello = you ? `Good to meet you, ${you}.` : "No name needed — that’s genuinely fine.";
  return run.who === "room"
    ? `${hello} So, what have you all brought with you today?`
    : `${hello} So, what have you brought with you today?`;
}

/** What they brought, named the way the question needs to name it. */
function broughtAs(brought: string | null): string {
  if (brought === "draft") return "that draft";
  if (brought === "nothing") return "whatever comes up";
  if (brought === "work") return "it";
  if (brought && BROUGHT_ANSWERS.some((a) => a.value === brought)) return "it";
  return "that";
}

/**
 * Slide 6, asking the thing the fork was always for — idea #131.
 *
 * The deck's "can you share it with me?" is a question about a document, and
 * people answered it as one. What actually forks here is where the work
 * happens: out here with this coach, or inside their own organisation with the
 * skill and a prompt. So that is what it asks, and the answers below say the
 * same two things in the same words.
 */
export function shareQuestion(run: Run): string {
  const you = callThem(run);
  return `One more thing before we start${you ? `, ${you}` : ""} — can we work through ${broughtAs(
    run.brought,
  )} out here, together? Or does it need to stay inside your organisation?`;
}

/** Whole-word matching, so "I don't know" is not a "no" and "work" is not "wo". */
function padded(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9']+/gi, " ").trim()} `;
}

/**
 * Route something said out loud to the answer it means. Longest phrase wins,
 * so "just me" beats "me" and an answer is never picked on a stray word.
 * Returns null when nothing matched — which is not an error, just a miss.
 */
export function matchSpoken(
  said: string,
  /* Anything with a value and the phrases it can sound like. The triage answers
     above are the usual caller; the voice coach's other fixed answers (idea
     #124) carry no chip and no aside, and don't need to invent one to be
     matched the same way. */
  answers: readonly { value: string; phrases: string[] }[],
): string | null {
  const heard = padded(said);
  let best: { value: string; length: number } | null = null;
  for (const answer of answers) {
    for (const phrase of answer.phrases) {
      const needle = padded(phrase);
      if (needle.trim() && heard.includes(needle) && (!best || needle.length > best.length)) {
        best = { value: answer.value, length: needle.length };
      }
    }
  }
  return best ? best.value : null;
}

/** How many words were actually said. Used to tell a short answer from a story. */
export function wordCount(said: string): number {
  return said.trim().split(/\s+/).filter(Boolean).length;
}
