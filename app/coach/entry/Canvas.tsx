import { CANVAS_ORDER, type CanvasBoxId } from "@/lib/canvas";
import type { CanvasState, Note } from "@/lib/coaching";

/*
 * The canvas. CARD 4 raised it into the column; CARD 5 makes it react.
 *
 * One component, and only one on the page. The lit box moves around it as the
 * coach moves — that is the whole pattern, and it is driven entirely by the
 * `CanvasState` it is handed. Nothing in here decides where the coach is, what
 * gets asked, or what happens next; it renders what has already been decided
 * elsewhere. See `lib/coaching.ts` and CARD A, contract 2.
 *
 * The rules it exists to keep:
 *  - all five boxes, always, full size at every width. No thumbnail, no map, no
 *    rail (decision 0001, narrowed by 0002).
 *  - nothing is ever replaced. A rewritten sticky keeps the old words, struck
 *    through. A parked box keeps its answer and says so.
 *  - no progress bar, no step numbers, no count, no score. The numerals are the
 *    names CARD A gives the boxes, not a position in a sequence.
 *  - nothing renders as an error, a validation failure or a skip. There is no
 *    tick, no cross, no "required", and no empty state that reads as a fault.
 *  - never colour alone. Lighting is a heavier border *and* the box saying
 *    where the conversation is; a blue note is blue *and* says in words that it
 *    is an open question.
 *  - the lit box is unmistakable (idea #146). It carries slide 10's own marker —
 *    "DRIVER → PROBLEM · WE'RE HERE" — so which box the conversation is in is
 *    said in words on the box itself, not inferred from a border weight or read
 *    off a line of transcript somewhere below the canvas. The border is heavier
 *    too, and the unlit boxes sit back a shade; neither of those is carrying it
 *    on its own.
 *  - colour names a box; it never reports anything (idea #167). Each numeral is
 *    washed in the colour /okrs gives that same idea, so the canvas and the
 *    pattern the site teaches read as one thing. Take every colour out and the
 *    canvas still says everything it said before — which is the test, and the
 *    reason this is allowed to sit beside "never colour alone".
 *  - two sizes of text in a box and no more (idea #143). What you said is at
 *    reading size; everything the coach says about a box — what it is waiting
 *    for, where it stands, the digging, the wording you replaced — is a step
 *    down and soft. The same line used to be `text-base` in an empty box and
 *    `text-sm` in a full one, which is a box that changes voice depending on
 *    how much is in it. Size is meaning here, so it follows what the words are
 *    rather than what else is on screen.
 */

/** Your words, in a box. The one thing in the canvas at reading size. */
const SAID = "text-base";

/** The coach's own voice about a box: a step down, never below `text-sm`. */
const ABOUT = "text-sm";

/**
 * The colour behind each box's numeral — idea #167, and borrowed rather than
 * invented.
 *
 * /okrs already colours these ideas, and it is the page the reporter called out
 * as the one that reads well: the Objective is `sooner`, the Key Results are
 * `safer`. So box ④ — the outcome hypothesis, which *is* the Objective — is
 * `sooner`, boxes ③ and ⑤ — the lagging and leading measures, which *are* the
 * Key Results — are `safer`, and the two boxes about the people and what is in
 * their way are `happier`. Someone who has read /okrs recognises the canvas, and
 * the canvas cannot drift away from the pattern the site teaches.
 *
 * It sits here rather than in `lib/canvas.ts` because it is presentation, like
 * `PLACE` below: CARD A's contract 2 is the five names and their order, and a
 * colour is not an opinion about what the coach asks or when.
 *
 * The colour is the wash and the numeral stays ink, rather than the other way
 * round. `sooner`, `safer` and `happier` are all mid-tone at full strength, and
 * a coloured glyph on a tint of its own colour is the thing this idea was raised
 * about — something you have to work to read. A tint behind ink is legible at
 * any size and still says which box you are looking at.
 *
 * It is never what tells you anything. Which box the conversation is in is the
 * heavier border, the shadow and the box saying "we're here" in words (rule 6);
 * what is in a box is the words in it. Five washed numerals with no lit box
 * among them say exactly nothing, which is the test. And it is not the sticky
 * system (rule 9): a note's colour is a fact about the note and says itself in
 * words inside the note.
 */
const WASH: Record<CanvasBoxId, string> = {
  centre: "bg-happier/20",
  problem: "bg-happier/20",
  lagging: "bg-safer/20",
  hypothesis: "bg-sooner/20",
  leading: "bg-safer/20",
};

/**
 * Where each box sits on a wide screen: the centre in the centre, the other
 * four around it, exactly as slides 8–13 arrange them. The DOM order is always
 * the canvas order, so a screen reader, a narrow screen and a printout all get
 * the five boxes in the sequence CARD A agreed.
 */
const PLACE: Record<CanvasBoxId, string> = {
  centre: "md:col-start-1 md:col-span-2 md:row-start-2",
  problem: "md:col-start-1 md:row-start-1",
  lagging: "md:col-start-2 md:row-start-3",
  hypothesis: "md:col-start-2 md:row-start-1",
  leading: "md:col-start-1 md:row-start-3",
};

/**
 * Two chip systems coexist deliberately, and this is the second of them
 * (rule 9). A yellow sticky is your thinking. Blue is an open question you take
 * back to your team — a legitimate output and the most interesting answer on
 * the canvas, never an error, so it says what it is in words rather than
 * leaving the colour to carry it.
 *
 * A rewritten sticky keeps both wordings: the old one struck through above the
 * new one. Nothing is ever cleared away, including by you.
 */
function Sticky({ note }: { note: Note }) {
  const open = note.kind === "open";
  return (
    <li
      className={`rounded-xl px-4 py-3 text-ink shadow-sm ${
        open ? "border border-safer/50 bg-safer/10" : "border border-happier/40 bg-happier/10"
      }`}
    >
      {note.struck ? (
        <p className={`${ABOUT} text-ink-soft/70`}>
          <s>{note.struck}</s>
        </p>
      ) : null}
      <p className={`${SAID} ${note.struck ? "mt-1" : ""}`}>{note.text}</p>
      {open ? (
        <p className={`mt-2 ${ABOUT} text-ink-soft`}>
          An open question — take this one back to your team. It counts.
        </p>
      ) : null}
    </li>
  );
}

export function Canvas({ state }: { state: CanvasState }) {
  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
      {CANVAS_ORDER.map((box) => {
        const here = state.boxes[box.id];
        const isLit = box.id === state.lit;
        const said = here.notes.length > 0 || here.digging.length > 0;
        const wash = WASH[box.id];
        return (
          <div
            key={box.id}
            aria-current={isLit ? "true" : undefined}
            /* Every box is a card on the chalk now, not a wash of it (idea
               #167). `bg-white/60` on `#f7f8f5` is a box you have to look for,
               and five of those is the "dull" the reporter saw — so an unlit box
               is white with a shadow like every other card on this site, and the
               lit one is the same card lifted: two-pixel ink border, a deeper
               shadow, and "we're here" on it in words. The distance between lit
               and unlit is wider than it was, not narrower. */
            className={`rounded-2xl p-5 ${PLACE[box.id]} ${
              isLit
                ? "border-2 border-ink bg-white shadow-md"
                : "border border-ink/10 bg-white shadow-sm"
            }`}
          >
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {/* The numeral is the box's name (CARD A), so it is given the
                  weight of one: its own medallion, washed in the colour /okrs
                  gives this idea. It is decoration carrying a name, never a
                  value — see `WASH`. */}
              <span
                aria-hidden
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-lg text-ink-soft ${wash}`}
              >
                {box.numeral}
              </span>
              <span
                className={`text-xs font-semibold uppercase tracking-widest ${
                  isLit ? "text-ink" : "text-ink-soft"
                }`}
              >
                {box.label}
              </span>
              {/* Slide 10's own marker, in the deck's own words. It is the
                  lighting said out loud: the border tells you at a glance, this
                  tells you for certain, and a screen reader gets it from here
                  rather than from `aria-current` alone (idea #146). */}
              {isLit ? (
                <span className="rounded-full bg-ink px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-chalk">
                  we&rsquo;re here
                </span>
              ) : null}
              {/* Parked is a state of the conversation, not of the answer. It
                  is said in the label so it is unmissable, and the box keeps
                  everything that was already in it. */}
              {here.parked ? (
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-soft/60">
                  · parked
                </span>
              ) : null}
            </p>

            {/* The digging. The box grows because there is more in it — no
                height, no max-height, no animation to miss. Standing still has
                to look like progress, and this growth is the only cue that the
                conversation is going deeper rather than stalling (slide 11). */}
            {here.digging.length > 0 ? (
              <div className={`mt-3 space-y-2 border-l-2 border-ink/15 pl-4 ${ABOUT} text-ink-soft`}>
                {here.digging.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            ) : null}

            {here.notes.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {here.notes.map((note, i) => (
                  <Sticky key={i} note={note} />
                ))}
              </ul>
            ) : null}

            {/* What the box is waiting for, in its own words — a question not
                yet asked, or what the coach has said about it on its way past.
                Never "empty", never "incomplete", never a count. */}
            {!said ? (
              <p className={`mt-3 ${ABOUT} ${isLit ? "text-ink-soft" : "text-ink-soft/80"}`}>
                {here.standing ?? box.waiting}
              </p>
            ) : here.standing ? (
              <p className={`mt-3 ${ABOUT} text-ink-soft/75`}>{here.standing}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
