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
      className={`rounded-xl px-4 py-3 text-ink ${
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
        return (
          <div
            key={box.id}
            aria-current={isLit ? "true" : undefined}
            className={`rounded-2xl p-5 ${PLACE[box.id]} ${
              isLit
                ? "border-2 border-ink bg-white shadow-md"
                : "border border-ink/15 bg-white/60"
            }`}
          >
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span aria-hidden className="text-lg text-ink-soft/60">
                {box.numeral}
              </span>
              <span
                className={`text-xs font-semibold uppercase tracking-widest ${
                  isLit ? "text-ink" : "text-ink-soft/80"
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
              <p className={`mt-3 ${ABOUT} ${isLit ? "text-ink-soft" : "text-ink-soft/70"}`}>
                {here.standing ?? box.waiting}
              </p>
            ) : here.standing ? (
              <p className={`mt-3 ${ABOUT} text-ink-soft/70`}>{here.standing}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
