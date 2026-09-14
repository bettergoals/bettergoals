/**
 * Triage — steps 01–04 of the entry column. CARD 2.
 *
 * Four things the coach establishes before any coaching starts: how you want
 * to talk, who is in the room, what you brought, and whether you can share it.
 * Every answer leaves an outline chip behind — a fact about you, not your
 * thinking — and those chips stay above the canvas for the rest of the run.
 *
 * Source: slides 3, 4, 5 and 6 of `docs/reference/voice-coach-deck.md`, under
 * `docs/reference/card-a.md`. The deck is binding on what is asked, in what
 * order, and what each answer produces. It is not binding on how any of it
 * looks.
 *
 * Two things this file deliberately does not do:
 *  - it does not count. There is no total, no "of three", no step number. Two
 *    chips read as two chips.
 *  - it does not persist. The whole run is the query string; close the tab and
 *    it is gone.
 */

export type Mode = "speak" | "type";
export type Who = "me" | "room";
export type Share = "yes" | "no";

export type Run = {
  /** Unset until the landing screen is answered — that answer is what starts it. */
  mode: Mode | null;
  who: Who | null;
  /** One of the three offered answers, or the leader's own words. */
  brought: string | null;
  share: Share | null;
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
 */
export const SHARE_ANSWERS: readonly TriageAnswer[] = [
  {
    value: "yes",
    label: "Yes — let's look at it together",
    aside: "we start coaching now",
    chip: "happy to share it",
    phrases: ["yes", "yeah", "yep", "sure", "of course", "go ahead", "happy to", "lets look"],
  },
  {
    value: "no",
    label: "No — it stays inside our walls",
    aside: "I'll set you up to coach it in there",
    chip: "it stays inside our walls",
    phrases: ["no", "nope", "cant", "cannot", "it stays", "stays inside", "rather not", "better not"],
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
  const broughtRaw = who ? first(params.brought) : null;
  const brought = broughtRaw ? broughtRaw.slice(0, BROUGHT_MAX) : null;
  const share = brought ? oneOf(first(params.share), ["yes", "no"] as const) : null;
  return { mode, who, brought, share };
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
  if (merged.brought) q.set("brought", merged.brought);
  if (merged.share) q.set("share", merged.share);
  const s = q.toString();
  return `/coach/entry${s ? `?${s}` : ""}${hash}`;
}

function chipFor(answers: readonly TriageAnswer[], value: string): string {
  return answers.find((a) => a.value === value)?.chip ?? value;
}

/**
 * The chips, in the order they were earned. The mode answer is not one of
 * them — the deck never shows it as a chip, and it is the one answer you can
 * change at any time.
 */
export function chipsFor(run: Run): string[] {
  const chips: string[] = [];
  if (run.who) chips.push(chipFor(WHO_ANSWERS, run.who));
  if (run.brought) chips.push(chipFor(BROUGHT_ANSWERS, run.brought));
  if (run.share) chips.push(chipFor(SHARE_ANSWERS, run.share));
  return chips;
}

/** Slide 5. The coach says the last answer back before asking the next thing. */
export function reflectWho(who: Who): string {
  return who === "me" ? "You said “just me”. Good." : "You said “there’s a room of us”. Good.";
}

/**
 * Slide 6. The same question either way; it just names what you actually said
 * you had. Reflecting the answer back is the coach's habit, not new behaviour.
 */
export function shareQuestion(brought: string): string {
  if (brought === "draft") return "Last question. Can you share that draft with me?";
  if (BROUGHT_ANSWERS.some((a) => a.value === brought)) return "Last question. Can you share it with me?";
  return "Last question. Can you share that with me?";
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
export function matchSpoken(said: string, answers: readonly TriageAnswer[]): string | null {
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
