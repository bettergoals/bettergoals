import Link from "next/link";
import { CANVAS_OPENS_ON, CANVAS_ORDER } from "@/lib/canvas";
import {
  ANSWER_MAX,
  DONT_KNOW,
  DONT_KNOW_ANSWER,
  canvasFor,
  canvasText,
  carried,
  columnHref,
  readCoaching,
  type Coaching,
  type CanvasState,
} from "@/lib/coaching";
import { REPO_URL } from "@/lib/config";
import { broughtInWords, handoverHref, skillFor } from "@/lib/handover";
import { nudgeFor } from "@/lib/nudge";
import {
  BROUGHT_ANSWERS,
  BROUGHT_MAX,
  MODE_ANSWERS,
  SHARE_ANSWERS,
  WHO_ANSWERS,
  chipsFor,
  readRun,
  reflectWho,
  runHref,
  shareQuestion,
  type Run,
  type TriageAnswer,
} from "@/lib/triage";
import { Canvas } from "./Canvas";
import { SayIt } from "./SayIt";

export const metadata = {
  title: "The column",
  description:
    "One continuous column, from the landing screen to the canvas. Nothing is replaced, nothing is cleared away, and nothing reports how far through you are.",
};

/*
 * CARD 1 — The column. The shell everything else lives inside.
 * CARD 2 — Triage, steps 01–04. The four questions that fill it in.
 * CARD 3 — The can't-share off-ramp. Where "no" at step 04 goes.
 * CARD 4 — The seam, step 05. The canvas rises into the column.
 * CARD 5 — Coaching, steps 06–11. The lit box moves; the canvas fills itself.
 *
 * Binding: `docs/decisions/0001-the-canvas-scrolls.md` (the canvas is a block
 * in ordinary document flow at every width),
 * `docs/decisions/0002-the-canvas-arrives-collapsed-on-mobile.md`,
 * `docs/decisions/0003-the-canvas-arrives-open-once-coaching-starts.md`,
 * `docs/reference/card-a.md`, and slides 1–14 of
 * `docs/reference/voice-coach-deck.md`. The wording of the questions and the
 * answers is the deck's; the layout is not.
 *
 * The rules this file exists to keep:
 *  - one scroller. Nothing here is sticky, fixed, or given a height, an
 *    overflow or a max-height. The nav in SiteChrome is the page's only sticky
 *    element and it is site chrome, not part of the column.
 *  - one order, both breakpoints, appended to and never rearranged:
 *    the opening · the triage turns · the chips · the canvas · the
 *    conversation · the live turn.
 *  - nothing is replaced. Answered triage turns grey; their chips stay above
 *    the canvas for good.
 *  - no progress bar, no step numbers, no count, no score. The canvas filling
 *    in is the only orientation there is.
 *  - no persistence. The whole run is in the query string; close the tab and
 *    it is gone.
 *  - it works as a plain document. Every answer is a real link or a real GET
 *    form, so the run works with JavaScript off. Speaking an answer is an
 *    enhancement on top of that and never the only way through.
 */

/**
 * A turn the coach has taken. Greys once it has been answered; never removed.
 *
 * Greyed, not faded out: a spent turn is still the record of what was said, and
 * at step 04 it is the data line itself. It stays above 4.5:1 on chalk.
 */
function Turn({ spent = false, children }: { spent?: boolean; children: React.ReactNode }) {
  return (
    <div className={spent ? "text-ink-soft/70" : "text-ink"}>
      <div className="space-y-2 text-lg leading-relaxed sm:text-xl">{children}</div>
    </div>
  );
}

/** Triage answers are outline chips — facts about you, not your thinking. */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-full border border-ink/25 px-3 py-1 text-sm text-ink-soft/75">{children}</li>
  );
}

function Answer({ href: to, label, aside }: { href: string; label: string; aside?: string }) {
  return (
    <Link
      href={to}
      className="flex flex-col rounded-2xl border border-ink/15 bg-white px-5 py-4 text-left transition-colors hover:border-ink/40 hover:bg-ink/[0.03] sm:min-w-56 sm:flex-1"
    >
      <span className="font-semibold">{label}</span>
      {aside ? <span className="mt-0.5 text-sm text-ink-soft">{aside}</span> : null}
    </Link>
  );
}

/**
 * Every answer to one question, side by side and identically weighted. Nothing
 * here marks one of them as the expected one — at step 04 in particular, both
 * answers are good answers and have to look like it.
 */
function Answers({
  answers,
  hrefs,
}: {
  answers: readonly TriageAnswer[];
  hrefs: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {answers.map((answer) => (
        <Answer key={answer.value} href={hrefs[answer.value]} label={answer.label} aside={answer.aside} />
      ))}
    </div>
  );
}

/** The same links the buttons use, keyed by answer, so a spoken answer lands identically. */
function hrefsFor(run: Run, key: keyof Run, answers: readonly TriageAnswer[]): Record<string, string> {
  return Object.fromEntries(answers.map((a) => [a.value, runHref(run, { [key]: a.value } as Partial<Run>)]));
}

/**
 * CARD 4 — the seam. The canvas rises into the column the conversation was
 * already in: no transition, no "start" button, no new page, and nothing above
 * it cleared away.
 *
 * Slide 8 gives it two arrivals. On a wide screen it is simply there, under the
 * coach's line, both halves in view at once. On a narrow one it arrives
 * collapsed to a single line you tap to open — which is a native disclosure,
 * not a thumbnail of itself, and never a report of how much of it is done.
 * Which of the two you get is decided in CSS by the width of the screen, so the
 * markup, the DOM order and the plain-document reading are the same either way.
 *
 * CARD 5 answers the question decision 0002 left it: once a word of coaching
 * has landed the canvas arrives open, and the summary line says which box the
 * coach is in rather than which one it is about to start in. It never
 * re-collapses on its own — `open` only ever goes from false to true. See
 * `docs/decisions/0003-the-canvas-arrives-open-once-coaching-starts.md`.
 *
 * There is one canvas in the column and it stays where it landed. Everything
 * the coaching does to it happens here, in place.
 */
function Seam({ state, started }: { state: CanvasState; started: boolean }) {
  const where = CANVAS_ORDER.find((box) => box.id === state.lit) ?? CANVAS_OPENS_ON;
  return (
    <section aria-labelledby="canvas-heading">
      <h2 id="canvas-heading" className="sr-only">
        Your canvas
      </h2>
      <details className="canvas-arrives" open={started}>
        <summary className="mb-3 flex cursor-pointer list-none items-baseline gap-2 rounded-2xl border border-dashed border-ink/25 bg-white/60 px-5 py-4 text-ink-soft hover:bg-white">
          <span aria-hidden>▾</span>
          <span>
            <span className="font-semibold text-ink">canvas</span> —{" "}
            {started ? <>we&rsquo;re in {where.short}</> : <>we&rsquo;ll start in {where.short}</>}
            {started ? null : (
              <span className="mt-0.5 block text-sm text-ink-soft/75">tap to open</span>
            )}
          </span>
        </summary>
        <Canvas state={state} />
      </details>
    </section>
  );
}

/**
 * Why the coach went where it did (slide 10). One sentence, in the flow of
 * talk — never a diagram and never "step 3 of 5".
 *
 * On a wide screen it is simply said. On a narrow one, where the coach's turn
 * has to stay short enough to read above your own, it is the deck's "why?"
 * affordance: a native disclosure carrying the same sentence, one tap away. The
 * markup is identical either way; CSS decides which you get.
 */
function Why({ children }: { children: React.ReactNode }) {
  return (
    <details className="why-on-narrow">
      <summary className="cursor-pointer list-none text-base text-ink-soft underline underline-offset-4 sm:text-lg">
        why? <span aria-hidden>▸</span>
      </summary>
      <p className="mt-2 text-base text-ink-soft sm:text-lg">{children}</p>
    </details>
  );
}

/** Available at any point, in both directions, at every step of the run. */
function ModeSwitch({ run, coaching }: { run: Run; coaching: Coaching }) {
  const to = run.mode === "speak" ? "type" : "speak";
  return (
    <Link
      href={columnHref(run, coaching, { mode: to })}
      className="self-start rounded-full border border-ink/15 px-3 py-1.5 text-sm text-ink-soft hover:bg-ink/5"
    >
      {to === "type" ? "⌨ switch to typing" : "◉ switch to speaking"}
    </Link>
  );
}

/**
 * Your turn, in your own words — the shape every coaching answer takes.
 *
 * A plain GET form carrying the whole run in hidden fields, so it works with
 * JavaScript off like everything else in this column, and speaking is an
 * enhancement laid on top of it rather than a second way in. There is no
 * "required", no validation, no minimum: an answer is whatever you say, and
 * nothing you could type here renders as a fault.
 */
function Ask({
  run,
  coaching,
  name,
  label,
  placeholder,
  speaking,
  showLabel = false,
  spoken = [],
  spokenHrefs = {},
  children,
}: {
  run: Run;
  coaching: Coaching;
  name: keyof Coaching;
  label: string;
  placeholder: string;
  speaking: boolean;
  /** When the coach's question was said inside the canvas rather than here. */
  showLabel?: boolean;
  /**
   * Answers that are on screen as buttons beside this field, so saying one of
   * them out loud lands exactly where tapping it would have. Anything else you
   * say stays in your own words.
   */
  spoken?: readonly TriageAnswer[];
  spokenHrefs?: Record<string, string>;
  /** Any other answer to this question that isn't the reader's own words. */
  children?: React.ReactNode;
}) {
  const id = `say-${name}`;
  return (
    <>
      {speaking ? (
        <SayIt
          answers={spoken}
          hrefs={spokenHrefs}
          freeTextHref={columnHref(run, coaching, { [name]: "__SAID__" } as Partial<Coaching>)}
          invitation="…just say it"
          max={ANSWER_MAX}
        />
      ) : null}
      <form method="get" action="/coach/entry" className="space-y-2">
        {carried(run, coaching).map((field) => (
          <input key={field.name} type="hidden" name={field.name} value={field.value} />
        ))}
        <label
          htmlFor={id}
          className={showLabel ? "block text-lg leading-relaxed sm:text-xl" : "sr-only"}
        >
          {label}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={id}
            name={name}
            type="text"
            maxLength={ANSWER_MAX}
            autoComplete="off"
            placeholder={placeholder}
            className="flex-1 rounded-2xl border border-ink/15 bg-white px-5 py-4 placeholder:text-ink-soft/75"
          />
          <button
            type="submit"
            className="rounded-2xl bg-ink px-5 py-4 font-semibold text-chalk hover:bg-ink-soft sm:px-6"
          >
            ↵ send
          </button>
        </div>
      </form>
      {children}
    </>
  );
}

/**
 * An answer that isn't the reader's own words — "I don't know", "go on then",
 * "not now". The deck's buttons. Identically weighted with everything beside
 * them: none of these is the expected answer, and at step 08 in particular the
 * one that looks like a shrug is the most interesting thing on the canvas.
 */
function Choice({ href: to, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={to}
      className="rounded-2xl border border-ink/15 bg-white px-5 py-4 text-left font-semibold transition-colors hover:border-ink/40 hover:bg-ink/[0.03]"
    >
      {children}
    </Link>
  );
}

export default async function ColumnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const run = readRun(params);
  const { mode, who, brought, share } = run;

  const chips = chipsFor(run);
  const speaking = mode === "speak";

  /* CARD 5. Where the coach is, and everything that has landed on the canvas so
     far. `canvasFor` is the only thing that decides either, and it decides them
     from the coach's route — nothing below reads an answer and forms an opinion
     about where the conversation should go next. */
  const coaching = readCoaching(params, run);
  const canvas = canvasFor(coaching);
  const digging = coaching.lagging === DONT_KNOW;
  /* Step 08 is finished when a measure has landed, or — after "I don't know" —
     when the open question has. Neither is the lesser answer. */
  const settled = Boolean(coaching.lagging) && (!digging || Boolean(coaching.whoKnows));
  const moved = coaching.back === "no" || Boolean(coaching.centreAgain);

  /* Step 11. The signal has been running underneath this whole conversation,
     exactly as it does today; this is the first and only moment anything is
     said about it, and what is said is words. `null` means there is nothing to
     say — in a room, always. See `lib/nudge.ts` and CARD A, contract 1. */
  const nudge = coaching.leading
    ? nudgeFor(canvasText(canvas), { room: who === "room" })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-20">
      <p className="mb-10 rounded-2xl border border-safer/40 bg-safer/10 px-4 py-3 text-sm text-ink-soft">
        <strong className="text-ink">This is the column, being built in the open.</strong> The
        questions below are real, so are the chips they leave behind, so is the canvas, and so is the
        coaching that fills it in. What is not here yet is what happens at the end — the ways out, and
        what you take away with you, arrive in later cards.
      </p>

      {/* One column. One scroller. Everything below is appended in order and
          nothing in it ever moves. */}
      <article className="the-column space-y-8">
        {/* 01 Landing. Slide 3 — unchanged by anything that happens later. The
            open-source line is part of the opening and stays with it, greying
            along with it rather than being cleared away. */}
        <div className="space-y-3">
          <Turn spent={Boolean(mode)}>
            <h1 className="text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
              Hello. I help you turn a goal into an outcome worth chasing.
            </h1>
            <p>Shall we talk it through? Speaking is quicker. Typing works just as well.</p>
          </Turn>
          <p className="text-sm text-ink-soft/75">
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              Open source
            </a>{" "}
            ·{" "}
            <Link href="/contribute" className="underline underline-offset-2">
              built by the community
            </Link>
          </p>
        </div>

        {/* 02 Who's here. Slide 4. */}
        {mode ? (
          <Turn spent={Boolean(who)}>
            <p>First — is it just you, or is there a room of you?</p>
          </Turn>
        ) : null}

        {/* 03 What you brought. Slide 5 — the coach says the last answer back
            before asking the next thing. */}
        {who ? (
          <Turn spent={Boolean(brought)}>
            <p>
              {reflectWho(who)} And what have you brought with you today?
            </p>
          </Turn>
        ) : null}

        {/* The room fork, flagged and not built. The deck runs the same thirteen
            steps on a big screen with the nudge suppressed; that spine is a
            later card, and pretending otherwise would be worse than saying so. */}
        {who === "room" ? (
          <aside className="border-l-2 border-ink/15 pl-4 text-sm text-ink-soft">
            <p>
              <strong className="text-ink">The big-screen run isn&rsquo;t in this column yet.</strong> A
              room of you forks the whole thing onto its own spine — the same questions and the same
              canvas, up where everyone can see them, and no nudge, because a room doesn&rsquo;t need
              one person told what&rsquo;s thin. It&rsquo;s deferred, not dropped.
            </p>
            <p className="mt-2">
              What already does a room today is{" "}
              <Link href="/coach/jam" className="underline underline-offset-2">
                the goal jam
              </Link>
              . Carry on here and the questions are the same ones.
            </p>
          </aside>
        ) : null}

        {/* 04 Can you share it. Slide 6 — the fork, and the one place the data
            line is said. It is not repeated anywhere else in the column. */}
        {brought ? (
          <Turn spent={Boolean(share)}>
            <p>{shareQuestion(brought)}</p>
            <p className="text-base text-ink-soft sm:text-lg">
              Before you answer — there&rsquo;s no account here, no database, and I keep nothing when
              you close the tab. Even so, some wording isn&rsquo;t yours to paste anywhere. Your call,
              and either answer is a good one.
            </p>
          </Turn>
        ) : null}

        {/* The chips. They accumulate here, they grey, and they are never
            cleared — so the canvas below reads as something the conversation
            produced rather than a new tool you have been handed. Two chips read
            as two chips: there is nothing here that counts them. */}
        {chips.length > 0 ? (
          <section aria-labelledby="chips-heading">
            <h2 id="chips-heading" className="sr-only">
              What you have told the coach
            </h2>
            <ul className="flex flex-wrap gap-2">
              {chips.map((chip, i) => (
                <Chip key={`${i}-${chip}`}>{chip}</Chip>
              ))}
            </ul>
            {/* Slide 8's footnote, said once, at the moment the canvas arrives
                and the worry it answers actually exists. It points up at the
                chips because that is what it is about. */}
            {share === "yes" ? (
              <p className="mt-3 text-sm text-ink-soft/75">
                <span aria-hidden>↑ </span>
                What you told me stays up there, greyed. Nothing has been cleared away.
              </p>
            ) : null}
          </section>
        ) : null}

        {/* The seam. No transition, no "start" button, no new page — the canvas
            simply rises into the column the conversation was already in. */}
        {share === "yes" ? (
          <>
            <Turn spent={Boolean(coaching.centre)}>
              <p>Good — then I&rsquo;ve got everything I need to be useful.</p>
              <p>
                I&rsquo;m going to put your canvas up as we go. You don&rsquo;t have to fill it in —
                I&rsquo;ll ask, you talk, and it fills itself.
              </p>
            </Turn>
            <Seam state={canvas} started={Boolean(coaching.centre)} />
            {/* Slide 9's footnote, said once, at the one moment it is exactly
                true: the canvas is up, the first question is about to be asked,
                and nothing has landed in any box yet. It is about the lighting,
                not about how much is done. */}
            {!coaching.centre ? (
              <p className="-mt-4 text-sm text-ink-soft/75">
                The lit box is where we&rsquo;re talking. The others are questions I haven&rsquo;t
                asked yet.
              </p>
            ) : null}
          </>
        ) : null}

        {/* CARD 5 — the coaching. One loop, six steps of it, and the canvas
            above reacting to every one.

            Every line here is the coach's, in the coach's voice, and every move
            between boxes is the coach's call (CARD A, contracts 2 and 3). The
            column renders them; it never decides them. Two moves in particular
            have to land without drama: the jump past ④ at step 07, narrated in
            one sentence in the flow of talk, and the double-back to ① at step
            09, where nothing — not the struck-through wording, not the parked
            box, not the answer that was "I don't know" — is allowed to read as
            an error, a validation failure or a skip. */}
        {share === "yes" ? (
          <>
            {/* 06 · centre ①. Slide 9. */}
            <Turn spent={Boolean(coaching.centre)}>
              <p>Who is this actually for, and what would they be doing differently?</p>
            </Turn>

            {/* 07 · problem ②. Slide 10. The deck gives box ② its label and its
                answer but not the coach's question for it; this is that label
                said out loud, in the voice the rest of the column uses. */}
            {coaching.centre ? (
              <Turn spent={Boolean(coaching.problem)}>
                <p>Good. Now the driver — due to what? What&rsquo;s in their way today?</p>
              </Turn>
            ) : null}

            {/* 07 · the jump to ③. The coach skips ④ and says why, in one
                sentence, in the flow of talk. The canvas moves the lit box to
                follow and box ④ says "not yet — see below" in its own words, so
                nothing up there reads as skipped. */}
            {coaching.problem ? (
              <Turn spent={Boolean(coaching.lagging)}>
                <p>Now — before we write the bet, tell me how you&rsquo;d know it landed.</p>
                <Why>
                  I do it this way round on purpose: write the clever sentence first and we&rsquo;ll
                  pick measures that flatter it.
                </Why>
              </Turn>
            ) : null}

            {/* 08 · "I don't know" ③. The digging happens inside the box — that
                is the whole point of slide 11, and it is why there is no turn
                for it here. The box grows to hold it. */}

            {/* 09 · going backwards to ①. The coach's call and the coach's
                wording. It asks, because it is written as a question, and both
                answers are real ones. */}
            {settled ? (
              <Turn spent={Boolean(coaching.back)}>
                <p>Can I take you back a step? I don&rsquo;t think the problem is here.</p>
                <p>
                  Your lagging measure can only be as sharp as the behaviour underneath it — so
                  let&rsquo;s sharpen that, and this box will write itself. Nothing you&rsquo;ve said
                  is wrong. We&rsquo;re fixing it upstream.
                </p>
              </Turn>
            ) : null}

            {/* 09 · the rewrite. Your old words stay on the canvas, struck
                through, and box ③ says your words are safe while we're away. */}
            {coaching.back === "yes" ? (
              <Turn spent={Boolean(coaching.centreAgain)}>
                <p>So — what would they actually be doing, on a Tuesday?</p>
              </Turn>
            ) : null}

            {/* 10 · hypothesis ④. Slide 13. */}
            {moved ? (
              <Turn spent={Boolean(coaching.hypothesis)}>
                <p>So: what&rsquo;s the bet, and which of those numbers should move?</p>
              </Turn>
            ) : null}

            {/* 10 · leading ⑤. The bet said back, and the reason it came second
                — that is the deck's "that's it", and "let me redo it" is beside
                the field below. */}
            {coaching.hypothesis ? (
              <Turn spent={Boolean(coaching.leading)}>
                <p>
                  That&rsquo;s the bet, and it&rsquo;s written against a measure that already exists
                  — which is why I asked you for the measure first.
                </p>
                <p>Last one. What tells us in weeks?</p>
              </Turn>
            ) : null}

            {/* 11 · the nudge. The gap in words, never a number, and never at
                all in a room. */}
            {nudge ? (
              <Turn spent={Boolean(coaching.nudge)}>
                <p>{nudge.opening}</p>
                <p>{nudge.gap}</p>
              </Turn>
            ) : null}

            {/* "Show me which ones" — the same gap, drawn. The glyphs are how
                the gap is expressed, not a value: three fixed segments per
                dimension, nothing added up, and every one of them bound to the
                sentence beside it, so the picture is never carrying anything on
                its own. */}
            {nudge && coaching.nudge === "show" ? (
              <section aria-labelledby="nudge-heading" className="space-y-3">
                <h2 id="nudge-heading" className="text-sm font-semibold uppercase tracking-widest text-ink-soft">
                  How it&rsquo;s shown
                </h2>
                <ul className="space-y-2">
                  {nudge.bars.map((bar) => (
                    <li
                      key={bar.label}
                      className="flex flex-col gap-1 rounded-2xl border border-ink/15 bg-white px-5 py-4 sm:flex-row sm:items-baseline sm:gap-4"
                    >
                      <span aria-hidden className="font-mono tracking-widest text-ink-soft/70">
                        {bar.glyph}
                      </span>
                      <span className="sm:flex-1">
                        <span className="font-semibold">{bar.label}</span>
                        <span className="mt-0.5 block text-ink-soft">{bar.words}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-ink-soft/75">
                  No total, no percentage, no headline number — not here and not anywhere. This is
                  the same thing I just said, drawn.
                </p>
              </section>
            ) : null}

            {nudge && coaching.nudge === "later" ? (
              <Turn>
                <p>Right. It&rsquo;ll keep.</p>
              </Turn>
            ) : null}
          </>
        ) : null}

        {/* CARD 3 — the off-ramp. Slide 7: it leaves the spine for the handover
            that already exists, and it doesn't come back. Two things it has to
            get right.

            It must not read as a downgrade. Step 04 weighted both answers the
            same and this is where that promise is kept or broken, so the exit
            is a full-weight panel — the same size and the same voice as the
            seam the other answer gets — and it says what you're being given
            rather than what you're not. PRINCIPLES.md, "Safe to share": never
            require confidential material to give a good answer.

            And the column must not close. Nothing above is cleared, the chips
            stay, and the live turn below still says which way things went. */}
        {share === "no" ? (
          <>
            <Turn>
              <p>Right — then we do it in there, not out here.</p>
              <p>
                Nothing about this needs me to see your wording. The coaching is the questions, and
                the questions travel: take the skill, put it in front of your own assistant, and run
                this same conversation behind your own walls with the material in the room.
              </p>
            </Turn>
            <Link
              href={handoverHref(run)}
              className="block rounded-2xl border border-ink/15 bg-white p-5 transition-colors hover:border-ink/40 hover:bg-ink/[0.03] sm:p-6"
            >
              <span className="text-lg font-semibold sm:text-xl">
                The skill, where to install it, and the prompt to carry back{" "}
                <span aria-hidden>→</span>
              </span>
              {/* The three things screen D holds, in the deck's order, named so
                  the link is a description of what's on the other side rather
                  than a leap of faith. */}
              <span className="mt-2 block text-ink-soft">
                <code className="font-mono text-sm">{skillFor(who).name}</code> · where it goes in
                Claude · a prompt that already knows you brought{" "}
                {brought ? broughtInWords(brought) : "nothing down yet"}
              </span>
            </Link>
          </>
        ) : null}

        {/* The live turn — where you speak or type. Always the last thing in
            the column, at every width, at every step. */}
        <section id="live" aria-labelledby="live-heading" className="scroll-mt-24 space-y-4">
          <h2 id="live-heading" className="sr-only">
            Your turn
          </h2>

          {!mode ? (
            <>
              <Answers answers={MODE_ANSWERS} hrefs={hrefsFor(run, "mode", MODE_ANSWERS)} />
              <p className="text-sm text-ink-soft">
                I&rsquo;ll ask three short questions first, so I know who I&rsquo;m coaching. Works for
                one person or a whole room.
              </p>
            </>
          ) : (
            <>
              <ModeSwitch run={run} coaching={coaching} />

              {!who ? (
                <>
                  <Answers answers={WHO_ANSWERS} hrefs={hrefsFor(run, "who", WHO_ANSWERS)} />
                  {speaking ? (
                    <SayIt
                      answers={WHO_ANSWERS}
                      hrefs={hrefsFor(run, "who", WHO_ANSWERS)}
                      invitation="…or just say it"
                    />
                  ) : null}
                </>
              ) : null}

              {who && !brought ? (
                <>
                  <Answers answers={BROUGHT_ANSWERS} hrefs={hrefsFor(run, "brought", BROUGHT_ANSWERS)} />
                  {speaking ? (
                    <SayIt
                      answers={BROUGHT_ANSWERS}
                      hrefs={hrefsFor(run, "brought", BROUGHT_ANSWERS)}
                      freeTextHref={runHref(run, { brought: "__SAID__" })}
                      invitation="…or say it however you like"
                    />
                  ) : null}
                  {/* …or tell me in your own words. A plain GET form, so it
                      works with JavaScript off like everything else here, and
                      it stays available whichever way you're answering. */}
                  <form method="get" action="/coach/entry" className="flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="mode" value={mode} />
                    <input type="hidden" name="who" value={who} />
                    <label htmlFor="brought-own" className="sr-only">
                      Tell me in your own words what you have brought
                    </label>
                    <input
                      id="brought-own"
                      name="brought"
                      type="text"
                      maxLength={BROUGHT_MAX}
                      autoComplete="off"
                      placeholder="…or tell me in your own words"
                      className="flex-1 rounded-2xl border border-ink/15 bg-white px-5 py-4 placeholder:text-ink-soft/75"
                    />
                    <button
                      type="submit"
                      className="rounded-2xl bg-ink px-5 py-4 font-semibold text-chalk hover:bg-ink-soft sm:px-6"
                    >
                      ↵ send
                    </button>
                  </form>
                </>
              ) : null}

              {brought && !share ? (
                <>
                  <Answers answers={SHARE_ANSWERS} hrefs={hrefsFor(run, "share", SHARE_ANSWERS)} />
                  {speaking ? (
                    <SayIt
                      answers={SHARE_ANSWERS}
                      hrefs={hrefsFor(run, "share", SHARE_ANSWERS)}
                      invitation="…or just say it"
                    />
                  ) : null}
                </>
              ) : null}

              {share === "no" ? (
                <div className="rounded-2xl border border-dashed border-ink/25 bg-white/60 px-5 py-4">
                  <p className="text-sm text-ink-soft">
                    {speaking ? "◉ Speaking." : "⌨ Typing."} The handover above is where this run
                    goes next. The column stays open behind it.
                  </p>
                </div>
              ) : null}

              {/* CARD 5 — answering the coach. Always the last thing in the
                  column, at every width, at every step, and always in the same
                  place: you never have to go and find where to speak. */}
              {share === "yes" && !coaching.centre ? (
                <Ask
                  run={run}
                  coaching={coaching}
                  name="centre"
                  label="Who is this for, and what would they be doing differently?"
                  placeholder="district managers, counting in daylight…"
                  speaking={speaking}
                />
              ) : null}

              {share === "yes" && coaching.centre && !coaching.problem ? (
                <Ask
                  run={run}
                  coaching={coaching}
                  name="problem"
                  label="Due to what? What's in their way today?"
                  placeholder="counts take three hours and happen at night…"
                  speaking={speaking}
                />
              ) : null}

              {/* 08. "I don't know" sits beside your own words, weighted the
                  same, because it is not a lesser answer — it is the one that
                  makes the box grow. There is no skip here to offer instead. */}
              {share === "yes" && coaching.problem && !coaching.lagging ? (
                <Ask
                  run={run}
                  coaching={coaching}
                  name="lagging"
                  label="How would you know it landed? What would convince a sceptic?"
                  placeholder="what would convince a sceptic…"
                  speaking={speaking}
                  spoken={[DONT_KNOW_ANSWER]}
                  spokenHrefs={{ [DONT_KNOW]: columnHref(run, coaching, { lagging: DONT_KNOW }) }}
                >
                  <Choice href={columnHref(run, coaching, { lagging: DONT_KNOW })}>
                    I don&rsquo;t know what our baseline is
                  </Choice>
                </Ask>
              ) : null}

              {/* The digging. The coach's question for this one was asked
                  inside the box, so it is said again here as the field's own
                  label rather than left implied. */}
              {share === "yes" && digging && !coaching.whoKnows ? (
                <Ask
                  run={run}
                  coaching={coaching}
                  name="whoKnows"
                  label="Who would know? And has anyone ever been able to tell whether this got better?"
                  placeholder="ask Priya's team…"
                  speaking={speaking}
                  showLabel
                />
              ) : null}

              {/* 09. Both answers are real answers. Going backwards is a normal
                  move, so neither of these is the recommended one. */}
              {share === "yes" && settled && !coaching.back ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Choice href={columnHref(run, coaching, { back: "yes" })}>Go on then</Choice>
                  <Choice href={columnHref(run, coaching, { back: "no" })}>
                    I&rsquo;d rather push on
                  </Choice>
                </div>
              ) : null}

              {share === "yes" && coaching.back === "yes" && !coaching.centreAgain ? (
                <Ask
                  run={run}
                  coaching={coaching}
                  name="centreAgain"
                  label="What would they actually be doing, on a Tuesday?"
                  placeholder="counting a shelf in minutes, before lunch…"
                  speaking={speaking}
                />
              ) : null}

              {share === "yes" && moved && !coaching.hypothesis ? (
                <Ask
                  run={run}
                  coaching={coaching}
                  name="hypothesis"
                  label="What's the bet, and which of those numbers should move?"
                  placeholder="we believe that…"
                  speaking={speaking}
                />
              ) : null}

              {/* Slide 13's two answers. Carrying on is "that's it"; "let me
                  redo it" puts the bet back in your hands, and takes nothing
                  off the canvas that you didn't take off yourself. */}
              {share === "yes" && coaching.hypothesis && !coaching.leading ? (
                <Ask
                  run={run}
                  coaching={coaching}
                  name="leading"
                  label="What tells us in weeks?"
                  placeholder="what tells us in weeks…"
                  speaking={speaking}
                >
                  <p className="text-sm">
                    <Link
                      href={columnHref(run, coaching, { hypothesis: null })}
                      className="text-ink-soft underline underline-offset-2"
                    >
                      …or let me redo the bet
                    </Link>
                  </p>
                </Ask>
              ) : null}

              {share === "yes" && nudge && !coaching.nudge ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Choice href={columnHref(run, coaching, { nudge: "show" })}>
                    Show me which ones
                  </Choice>
                  <Choice href={columnHref(run, coaching, { nudge: "later" })}>Not now</Choice>
                </div>
              ) : null}

              {/* Where the column runs out for now. The canvas above stays
                  exactly as you left it — nothing is cleared away here either. */}
              {share === "yes" && coaching.leading && (!nudge || coaching.nudge) ? (
                <div className="rounded-2xl border border-dashed border-ink/25 bg-white/60 px-5 py-4">
                  <p className="text-sm text-ink-soft">
                    {speaking ? "◉ Speaking." : "⌨ Typing."} That&rsquo;s the canvas.{" "}
                    {who === "room"
                      ? "In a room I keep the nudge to myself — nobody needs one person told what's thin in front of everyone."
                      : null}{" "}
                    What happens next — the three ways out, and what you take away with you — is a
                    later card.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </section>
      </article>
    </div>
  );
}
