import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { CANVAS_OPENS_ON, CANVAS_ORDER } from "@/lib/canvas";
import {
  ANSWER_MAX,
  DONT_KNOW,
  DONT_KNOW_ANSWER,
  canvasFor,
  canvasText,
  carried,
  columnHref,
  leaving,
  readCoaching,
  type Coaching,
  type CanvasState,
} from "@/lib/coaching";
import { COLUMN_PATH, REPO_URL } from "@/lib/config";
import { broughtInWords, handoverHref, skillFor } from "@/lib/handover";
import { nudgeFor, standingFor } from "@/lib/nudge";
import { stillOpenInWords, takeawayFor, takeawayHref, takeawayText } from "@/lib/takeaway";
import {
  BROUGHT_ANSWERS,
  BROUGHT_MAX,
  MODE_ANSWERS,
  NAME_ANSWERS,
  NAME_MAX,
  NO_NAME,
  SHARE_ANSWERS,
  WHO_ANSWERS,
  WHO_QUESTION,
  broughtQuestion,
  callThem,
  chipsFor,
  nameQuestion,
  readRun,
  readsAloud,
  runHref,
  shareQuestion,
  type Run,
  type TriageAnswer,
} from "@/lib/triage";
import { COACH_ASKS } from "@/lib/voiceColumn";
import { Canvas } from "./Canvas";
import { SayIt } from "./SayIt";
import { TalkToMe } from "./TalkToMe";
import { PrintCanvas, TakeIt } from "./Takeaway";

/**
 * The column itself, as a component rather than a page.
 *
 * It renders wherever the conversation lives — today that is the site's front
 * door, `/`. Keeping it in one file means there is exactly one column rather
 * than a copy per route, and `columnHref()` in `lib/coaching.ts` stays the
 * single place that knows which path it is served from.
 */

/*
 * CARD 1 — The column. The shell everything else lives inside.
 * CARD 2 — Triage, steps 01–04. The four questions that fill it in.
 * CARD 3 — The can't-share off-ramp. Where "no" at step 04 goes.
 * CARD 4 — The seam, step 05. The canvas rises into the column.
 * CARD 5 — Coaching, steps 06–11. The lit box moves; the canvas fills itself.
 * CARD 6 — Leaving, steps 12–13. Three doors, and something to take with you.
 *
 * Binding: `docs/decisions/0001-the-canvas-scrolls.md` (the canvas is a block
 * in ordinary document flow at every width),
 * `docs/decisions/0002-the-canvas-arrives-collapsed-on-mobile.md`,
 * `docs/decisions/0003-the-canvas-arrives-open-once-coaching-starts.md`,
 * `docs/reference/card-a.md`, and slides 1–16 of
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
 *  - the conversation stays short. A question stays once it is answered; the
 *    help that came with it does not — see `Turn`'s `aside`. Decision 0001
 *    named the one thing that would reopen the scrolling canvas — the
 *    conversation running long enough that the canvas sits two screens above
 *    the live turn — and said the answer is a shorter conversation rather than
 *    a pinned panel. Idea #134 is that answer being taken, and
 *    `docs/decisions/0004-the-conversation-quietens.md` records it.
 *  - no progress bar, no step numbers, no count, no score. The canvas filling
 *    in is the only orientation there is.
 *  - no persistence. The whole run is in the query string; close the tab and
 *    it is gone — and at step 13 that is said on screen, in words, because by
 *    then it is the reader's problem and not just ours.
 *  - it works as a plain document. Every answer is a real link or a real GET
 *    form, so the run works with JavaScript off. Speaking an answer is an
 *    enhancement on top of that and never the only way through.
 *  - nothing makes a sound on arrival. Idea #121 gave the coach a voice and
 *    opened the microphone on its own; idea #124 made that voice the coach
 *    itself, live (`TalkToMe`). Either way it is only inside speaking mode,
 *    which only a press on "◉ Talk to me" can reach. While it is talking there
 *    is a control that stops it, and `voice=off` stops it for the rest of the
 *    run.
 */

/**
 * A turn the coach has taken. Greys once it has been answered; never removed.
 *
 * Greyed, not faded out: a spent turn is still the record of what was said, and
 * at step 04 it is the data line itself. It stays above 4.5:1 on chalk.
 *
 * It prints the column's own wording, including while the coach is talking. The
 * coach says it its own way now, and for a while this printed what it actually
 * said — which meant a paragraph rewriting itself, at question size, in the
 * middle of the column, every time it spoke. The question is the steady thing
 * on the page; what the coach said belongs in the quiet line by the controls.
 *
 * `aside` is the help that comes with a question — what "customer" means here,
 * why the coach asked in this order, what happens to either answer. It is on
 * screen while the question is live and gone once the question is spent, which
 * is idea #134: by then it is a paragraph of help with something that already
 * has an answer above it, and six of those are what put the canvas and the
 * question you are answering two screens apart. Rule 4 still holds — nothing
 * you said is removed and no question is removed, they grey and they stay. What
 * goes is the coach's own scaffolding, and decision 0001 is explicit that a
 * conversation that has grown too long is shortened rather than pinned.
 */
function Turn({
  spent = false,
  aside,
  children,
}: {
  spent?: boolean;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={spent ? "text-ink-soft/70" : "text-ink"}>
      <div className="space-y-2 text-lg leading-relaxed sm:text-xl">{children}</div>
      {aside && !spent ? (
        <div className="mt-2 space-y-2 text-base text-ink-soft sm:text-lg">{aside}</div>
      ) : null}
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
    /* `printable` is what "print the canvas" means: on paper this section and
       the takeaway are the whole page, and the conversation around them is not.
       See the print rules in `globals.css`. */
    <section aria-labelledby="canvas-heading" className="printable">
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
 * The canvas, walked round once before anything is asked — idea #131.
 *
 * "The transition to the Canvas is too harsh": five boxes arrived with no
 * account of what they were or which order they'd be worked, and the very next
 * thing that happened was a question. This is the account, said in the coach's
 * voice, in the shared order (CARD A, contract 2), in the boxes' own words.
 *
 * What it is careful not to be: a plan, a count, an agenda or an estimate.
 * There is no total, no "five", no time, nothing numbered as a step and nothing
 * that can later be ticked. The numerals are the boxes' names — the same ones
 * on the canvas below it — which is how you can read this and then recognise
 * what you are looking at. Rule 5 holds: the canvas filling in is still the
 * only orientation there is.
 */
function Tour() {
  return (
    <div className="text-base text-ink-soft sm:text-lg">
      <p>Here&rsquo;s the shape of it, so you know where we&rsquo;re going:</p>
      <ul className="mt-2 space-y-1">
        {CANVAS_ORDER.map((box) => (
          <li key={box.id} className="flex gap-2">
            <span aria-hidden className="text-ink-soft/70">
              {box.numeral}
            </span>
            <span>{box.tour}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2">We start in the middle and work outwards. You can stop me anywhere.</p>
    </div>
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

/** The two switches above the live turn share a shape: quiet, always there. */
const SWITCH = "rounded-full border border-ink/15 px-3 py-1.5 text-sm text-ink-soft hover:bg-ink/5";

/**
 * Available at any point, in both directions, at every step of the run. In
 * speaking mode it is also the way out of a conversation that is happening out
 * loud — so switching to typing ends the coach's call, because `TalkToMe` only
 * exists inside speaking mode and unmounts with it.
 */
function ModeSwitch({ run, coaching }: { run: Run; coaching: Coaching }) {
  const to = run.mode === "speak" ? "type" : "speak";
  return (
    <Link href={columnHref(run, coaching, { mode: to })} className={SWITCH}>
      {to === "type" ? "⌨ switch to typing" : "◉ switch to speaking"}
    </Link>
  );
}

/**
 * The coach's own voice, off and on — idea #121.
 *
 * Speaking mode means the coach reads its questions out loud, and there has to
 * be a way to say no to that which lasts longer than one question: someone with
 * a screen reader already has a voice in their ear, and someone in an open-plan
 * office may want to talk without being talked back to. It is a link like every
 * other answer here, so it works with JavaScript off, and the decision rides in
 * the query string with the rest of the run.
 *
 * Only offered in speaking mode. Typing was never going to read itself out.
 *
 * Since idea #124 this is also the switch that ends a live call with the coach,
 * so it says which of the two it is about to turn off. Both readings are the
 * same promise: the audio stops, for the rest of the run, from one control that
 * is always on screen.
 */
function VoiceSwitch({ run, coaching, talking }: { run: Run; coaching: Coaching; talking: boolean }) {
  const quiet = run.voice === "off";
  return (
    <Link href={columnHref(run, coaching, { voice: quiet ? null : "off" })} className={SWITCH}>
      {quiet ? "♪ talk to me out loud again" : talking ? "◼ stop talking, I'll answer here" : "◼ stop reading the questions out"}
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
  aloud,
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
  /** Whether the coach reads `label` out before the microphone opens. */
  aloud: boolean;
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
        /* `label` is the coach's question and nothing else — the turn above it
           may carry a sentence of reasoning too, and a coach that reads its own
           reasoning aloud is a coach you wait twenty seconds to answer. What is
           said is what is asked. */
        <SayIt
          answers={spoken}
          hrefs={spokenHrefs}
          freeTextHref={columnHref(run, coaching, { [name]: "__SAID__" } as Partial<Coaching>)}
          invitation="…just say it"
          max={ANSWER_MAX}
          say={aloud ? label : undefined}
          auto
        />
      ) : null}
      <form method="get" action={COLUMN_PATH} className="space-y-2">
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

/**
 * One of the three ways out (slide 15). Three identically weighted cards, in
 * the deck's order, and nothing anywhere marks one of them as the one to take:
 * no primary styling, no "recommended", no default focus, and no fourth control
 * that finishes anything. Going through one never closes the other two — the
 * one already taken says so, quietly, and stays exactly where it was.
 */
function Door({
  href: to,
  label,
  aside,
  go,
  taken = false,
}: {
  href: string;
  label: string;
  aside: string;
  go: string;
  taken?: boolean;
}) {
  return (
    <Link
      href={to}
      aria-current={taken ? "true" : undefined}
      className={`flex flex-col rounded-2xl bg-white px-5 py-4 text-left transition-colors hover:border-ink/40 hover:bg-ink/[0.03] ${
        taken ? "border-2 border-ink/45" : "border border-ink/15"
      }`}
    >
      <span className="font-semibold">{label}</span>
      <span className="mt-0.5 text-sm text-ink-soft">{aside}</span>
      <span className="mt-3 text-sm font-semibold text-ink-soft">
        {go} <span aria-hidden>→</span>
      </span>
      {taken ? (
        <span className="mt-1 text-xs uppercase tracking-widest text-ink-soft/70">
          the one you took
        </span>
      ) : null}
    </Link>
  );
}

/** A heading inside the leaving screens. Never a step, never a count. */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-widest text-ink-soft">{children}</h3>
  );
}

export default function Column({
  params,
  voiceConfigured = false,
}: {
  params: Record<string, string | string[] | undefined>;
  /**
   * Whether this deployment can put the reader through to the coach itself.
   * It needs a server-side key (see `app/api/jam/session`), so it is decided on
   * the server and handed down — a browser is never told either way.
   */
  voiceConfigured?: boolean;
}) {
  const run = readRun(params);
  const { mode, who, name, brought, share } = run;
  /* What to call them, or null — including when they said they'd rather not,
     which is an answer the column has to be able to tell from silence. */
  const you = callThem(run);

  const chips = chipsFor(run);
  const speaking = mode === "speak";
  /* Idea #121. "Talk to me" means a conversation: the coach reads its question
     out loud and the microphone opens when it stops, at every turn, until the
     reader asks it to be quiet. Nothing speaks before that press. */
  const aloud = readsAloud(run);

  /* Idea #124. Where the coach can actually be reached, "talk to me" is a call
     to the coach rather than the browser reading the page out: `TalkToMe` runs
     the same questions, in the same order, and lands each answer exactly where
     tapping it would have.
     The two never run at once — two microphones and two voices in one column
     would be neither. Without the key, `localVoice` is idea #121 unchanged, and
     that is also what `voice=off` leaves behind. */
  const talking = speaking && voiceConfigured && aloud;
  const localVoice = speaking && !talking;

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

  /* CARD 6. The doors are on screen once the coach has run out of questions —
     the last answer has landed, and the nudge has been either answered or never
     offered (a room never gets one). This is the only place in the column that
     decides when step 12 exists, and it decides it from the conversation rather
     than from a count of how many steps have gone by. */
  const atTheDoors = Boolean(coaching.leading) && (!nudge || Boolean(coaching.nudge));
  const out = atTheDoors ? coaching.out : null;

  /* Step 12, said honestly. Two readings, kept apart on purpose: the signal's,
     translated into words by the same table the nudge uses (`standing`), and
     the canvas's own — an open question, a box nobody wrote in — which needs no
     signal to be true. Neither is ever a number. */
  const takeaway = atTheDoors ? takeawayFor(run, canvas) : null;
  const standing = atTheDoors ? standingFor(canvasText(canvas)) : null;
  const sharp = standing?.sharp ?? [];
  const stillOpen = [...(standing?.open ?? []), ...(takeaway ? stillOpenInWords(takeaway) : [])];

  /* Step 13. Built here, once, so the file you download, the text you copy and
     the words on the screen are the same words. Nothing is written anywhere. */
  const file = leaving(out) ? takeawayText(run, canvas) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-20">
      {/* The first thing anyone reads, so it says what this is and what happens
          to what they type — and nothing else (idea #135). The wording before
          that described the column to someone who had not seen it yet ("the
          chips they leave behind", "the canvas"), which only makes sense once
          you are further down the page than this box.

          Idea #134 takes the coloured panel it was down to one quiet line. It
          sits above the canvas for the whole run, and as a panel it held the
          canvas and the question you were answering further apart — which is
          the complaint #134 was raised about. The words are #135's; the weight
          is #134's. */}
      <p className="no-print mb-8 text-sm text-ink-soft/75">
        <strong className="font-semibold text-ink-soft">
          This is the AI Outcome Coach, being built in the open by the Sooner Safer Happier
          community.
        </strong>{" "}
        Nothing you say here is stored anywhere — the conversation lives in this tab&rsquo;s address
        bar, and closing the tab ends it.
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
            <p>{WHO_QUESTION}</p>
          </Turn>
        ) : null}

        {/* 02a What to call you — idea #131. Not a slide: the deck goes from
            who's here straight to what you brought, and taking two facts in a
            row without ever asking who you are is what made this read as a
            form. The coach says the last answer back here, as slide 5 has it,
            and then asks the one thing that makes the rest a conversation.

            It is a courtesy, not a field. "I'd rather not say" is beside it,
            weighted the same, and nothing downstream needs an answer either
            way — PRINCIPLES.md, "Accessible to everyone". */}
        {who ? (
          <Turn spent={Boolean(name)}>
            <p>{nameQuestion(who)}</p>
          </Turn>
        ) : null}

        {/* 03 What you brought. Slide 5 — the coach greets you by name the
            first turn it has one. */}
        {name ? (
          <Turn spent={Boolean(brought)}>
            <p>{broughtQuestion(run)}</p>
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
          <Turn
            spent={Boolean(share)}
            aside={
              <p>
                Before you answer — there&rsquo;s no account here, no database, and I keep nothing
                when you close the tab. Even so, some things can only be talked about inside your
                own organisation, and if that&rsquo;s this, I&rsquo;ll set you up to run this same
                conversation in there. Your call, and either answer is a good one.
              </p>
            }
          >
            <p>{shareQuestion(run)}</p>
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
                chips because that is what it is about — and it goes once the
                coaching has started, because by then you have watched three
                turns grey and stay put and the sentence is telling you
                something the page is already doing (idea #134). */}
            {share === "yes" && !coaching.centre ? (
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
            <Turn
              spent={Boolean(coaching.centre)}
              aside={
                <>
                  <p>
                    I&rsquo;m going to put your canvas up as we go. You don&rsquo;t have to fill it
                    in — I&rsquo;ll ask, you talk, and it fills itself.
                  </p>
                  {/* Idea #131. The canvas used to simply appear, and the next
                      thing that happened was a question — which is the hand-off
                      reading as harsh. So here is the shape of it first, in the
                      order we actually work, said once before anything is asked
                      of anyone.

                      It is the boxes' own names and their own clauses, from
                      `CANVAS_ORDER`, so this can never describe a canvas the
                      coach isn't running. It is not a plan and not a count: no
                      total, no "five steps", no how-long-this-takes, nothing
                      here reports progress and nothing ticks. */}
                  <Tour />
                </>
              }
            >
              <p>
                {you ? `Good, ${you} — ` : "Good — "}then I&rsquo;ve got everything I need to be
                useful.
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
            {/* 06 · centre ①. Slide 9, whose own title for this box is
                "customer and behaviour change" — so idea #131 asking for the
                word "customer" here is the deck's intent, not a departure from
                it. "Who is this for" was being answered with whoever asked for
                the work, which is the wrong end of it every time.

                The second line is the one that makes "customer" safe to say:
                PRINCIPLES.md means it in the widest sense, and plenty of people
                on this site have patients, residents or colleagues rather than
                customers. Their word wins. */}
            <Turn
              spent={Boolean(coaching.centre)}
              aside={
                <p>
                  Customer, colleague or citizen — whoever&rsquo;s on the other end of this and
                  would notice it got better. Use your word for them, not mine.
                </p>
              }
            >
              <p>{COACH_ASKS.centre}</p>
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
              <Turn
                spent={Boolean(coaching.lagging)}
                aside={
                  <Why>
                    I do it this way round on purpose: write the clever sentence first and
                    we&rsquo;ll pick measures that flatter it.
                  </Why>
                }
              >
                <p>Now — before we write the bet, tell me how you&rsquo;d know it landed.</p>
              </Turn>
            ) : null}

            {/* 08 · "I don't know" ③. The digging happens inside the box — that
                is the whole point of slide 11, and it is why there is no turn
                for it here. The box grows to hold it. */}

            {/* 09 · going backwards to ①. The coach's call and the coach's
                wording. It asks, because it is written as a question, and both
                answers are real ones. */}
            {settled ? (
              <Turn
                spent={Boolean(coaching.back)}
                aside={
                  <p>
                    Your lagging measure can only be as sharp as the behaviour underneath it — so
                    let&rsquo;s sharpen that, and this box will write itself. Nothing you&rsquo;ve
                    said is wrong. We&rsquo;re fixing it upstream.
                  </p>
                }
              >
                <p>Can I take you back a step? I don&rsquo;t think the problem is here.</p>
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
                the field below.

                The question is first and the reflection is the aside under it,
                so that what stays on screen once this turn is spent is the
                question that was asked (idea #134). Both are said either way;
                this is only which of the two the column keeps. */}
            {coaching.hypothesis ? (
              <Turn
                spent={Boolean(coaching.leading)}
                aside={
                  <p>
                    That&rsquo;s the bet, and it&rsquo;s written against a measure that already
                    exists — which is why I asked you for the measure first.
                  </p>
                }
              >
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

            {/* CARD 6 · 12 — three ways out. Slide 15.

                Where this stands, said honestly and said in words. Two readings
                side by side: what the signal makes of it, translated by the
                same table the nudge uses, and what the canvas says about
                itself. Neither is a number, neither is added up, and the
                asymmetry is deliberate — a thin canvas has more in the right
                column than the left, which is the only defence against wording
                a goal to look finished.

                The doors themselves are in the live turn below, because they
                are answers, and answers are always the last thing in the
                column. The canvas stays on screen behind all of it. */}
            {atTheDoors ? (
              <section aria-labelledby="standing-heading" className="space-y-4">
                {/* The hand-over into it — idea #134. "Where this stands,
                    honestly" used to arrive as a heading, straight after the
                    last answer, with nothing to say the questions had finished
                    or what the next thing was for. Two sentences in the coach's
                    voice: the questions are over, and what follows is an
                    opinion offered rather than a verdict handed down. It says
                    what it isn't, too, because a heading with two columns under
                    it can read as a mark if nobody says otherwise. */}
                <Turn>
                  <p>
                    {you
                      ? `That's the last of my questions, ${you}.`
                      : "That's the last of my questions."}
                  </p>
                  <p>
                    Before you pick what happens next, here&rsquo;s what I make of it — what&rsquo;s
                    sharp, and what I&rsquo;d still be uneasy about. No score and no mark: just what
                    I&rsquo;d say if we were sat looking at this together.
                  </p>
                </Turn>
                <Turn>
                  <h2 id="standing-heading" className="text-lg leading-relaxed sm:text-xl">
                    Where this stands, honestly.
                  </h2>
                </Turn>
                {sharp.length === 0 && stillOpen.length === 0 ? (
                  <Turn>
                    <p>
                      You&rsquo;ve written the whole thing down. What&rsquo;s sharp and what
                      isn&rsquo;t is yours to judge from here — I&rsquo;d rather say nothing than
                      make something up about it.
                    </p>
                  </Turn>
                ) : (
                  <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                    {sharp.length > 0 ? (
                      <div className="space-y-2 rounded-2xl border border-ink/15 bg-white px-5 py-4">
                        <Label>Sharp</Label>
                        <ul className="space-y-2 text-ink-soft">
                          {sharp.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {stillOpen.length > 0 ? (
                      <div className="space-y-2 rounded-2xl border border-ink/15 bg-white px-5 py-4">
                        <Label>Still open</Label>
                        <ul className="space-y-2 text-ink-soft">
                          {stillOpen.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )}
              </section>
            ) : null}

            {/* The door you took, answered in the coach's voice before
                anything else happens.

                Idea #134: only the first door had a reply. "Stop here" and
                "take the questions away" went from a card you tapped straight
                to a heading about downloads, which is the one moment in the run
                where a sentence of warmth costs nothing and its absence is
                felt. All three carry on in the same column — no new page,
                nothing cleared away, and the other two doors still open
                below. */}
            {out === "refine" ? (
              <Turn>
                <p>{standing?.start ? `Right — ${standing.start}, then.` : "Right. Let's keep going."}</p>
                <p>
                  Nothing&rsquo;s going anywhere. Change what you want to change and we&rsquo;ll pick
                  it up from there; the other two doors are still open underneath.
                </p>
              </Turn>
            ) : out === "stop" ? (
              <Turn>
                <p>{you ? `Then we'll leave it there, ${you}.` : "Then we'll leave it there."}</p>
                <p>
                  You&rsquo;ve written the bet down and said what would tell you in weeks.
                  Here&rsquo;s everything to take with you — and if you change your mind, the other
                  two doors are still open underneath.
                </p>
              </Turn>
            ) : out === "questions" ? (
              <Turn>
                <p>Good — then we pack it up as it stands.</p>
                <p>
                  What&rsquo;s still open travels with you as a question rather than a gap, which is
                  the whole point of taking them. It&rsquo;s all below, and the other two doors are
                  still open underneath.
                </p>
              </Turn>
            ) : null}

            {/* CARD 6 · 13 — the takeaway. Slide 16.

                Three artefacts and three ways to take them, and the sentence
                that makes all of it necessary said first and said plainly. The
                canvas above is untouched: this is appended under it, like
                everything else in this column. */}
            {leaving(out) && file && takeaway ? (
              <section
                id="takeaway"
                aria-labelledby="takeaway-heading"
                className="printable scroll-mt-24 space-y-6"
              >
                <Turn>
                  <h2 id="takeaway-heading" className="text-lg leading-relaxed sm:text-xl">
                    Take this now — I don&rsquo;t keep a copy.
                  </h2>
                  <p className="text-base text-ink-soft sm:text-lg">
                    No account, no database, nothing saved anywhere. Close this tab and the
                    conversation, the canvas and this are all gone — there is no coming back later,
                    and I can&rsquo;t send it on to you.
                  </p>
                </Turn>

                {/* "Take the questions away" doesn't get a different takeaway —
                    it gets the same one with what they came for at the front.
                    The questions are marked as questions everywhere they
                    appear, here and in the file (rule 9). */}
                {out === "questions" ? (
                  <div className="space-y-2 rounded-2xl border border-safer/50 bg-safer/10 px-5 py-4">
                    <Label>The questions you&rsquo;re taking</Label>
                    {takeaway.open.length > 0 ? (
                      <ul className="space-y-2">
                        {takeaway.open.map((q) => (
                          <li key={`${q.box.id}-${q.text}`}>
                            {q.text}{" "}
                            <span className="text-ink-soft">— {q.box.short}, and it&rsquo;s a question, not a blank.</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-ink-soft">
                        You answered everything I asked. Nothing is waiting on your team — the canvas
                        travels with you anyway.
                      </p>
                    )}
                  </div>
                ) : null}

                <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                  <div className="space-y-3 rounded-2xl border border-ink/15 bg-white px-5 py-4">
                    <Label>1 · The goal, SSH pattern</Label>
                    <p className="text-sm text-ink-soft">Objective — an outcome hypothesis</p>
                    <p className="border-l-2 border-ink/15 pl-4">
                      {takeaway.goal.objective ?? "We didn’t get to the bet."}
                    </p>
                    {takeaway.goal.forWhom ? (
                      <p className="text-ink-soft">
                        <span className="text-sm">For:</span> {takeaway.goal.forWhom}
                      </p>
                    ) : null}
                    <p className="text-sm text-ink-soft">Key results</p>
                    <ul className="space-y-2">
                      <li>
                        <span className="text-sm text-ink-soft">Leading — what tells us in weeks:</span>{" "}
                        {takeaway.goal.leading ?? "still open"}
                      </li>
                      <li>
                        <span className="text-sm text-ink-soft">
                          Lagging — what would convince a sceptic:
                        </span>{" "}
                        {takeaway.goal.lagging ?? "still an open question — it travels as one"}
                      </li>
                    </ul>
                    {/* The OKRs page, not this column, is what says how many key
                        results an OKR carries. Saying where the conversation got
                        to is not the same as saying it fell short. */}
                    <p className="text-sm text-ink-soft/75">
                      Sooner Safer Happier asks for three to five key results, leading and lagging.
                      This is where we got to, not the finished set.
                    </p>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-ink/15 bg-white px-5 py-4">
                    <Label>2 · The canvas, gaps and all</Label>
                    <ul className="space-y-2">
                      {takeaway.boxes.map(({ box, notes }) => (
                        <li key={box.id}>
                          <span className="text-sm text-ink-soft">
                            <span aria-hidden>{box.numeral} </span>
                            {box.short}:
                          </span>{" "}
                          {notes.length === 0 ? (
                            <span className="text-ink-soft">
                              left alone, on purpose
                            </span>
                          ) : (
                            notes.map((note, i) => (
                              <span key={i}>
                                {i > 0 ? " · " : null}
                                {note.kind === "open" ? (
                                  <>
                                    <span className="text-ink-soft">open question — </span>
                                    {note.text}
                                  </>
                                ) : (
                                  note.text
                                )}
                              </span>
                            ))
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-ink-soft/75">
                      It goes as it is. Nothing is tidied up on the way out, and nothing you left
                      open is written as a blank.
                    </p>
                  </div>
                </div>

                <div className="no-print space-y-3 rounded-2xl border border-ink/15 bg-white px-5 py-4">
                  <Label>3 · Carry on elsewhere</Label>
                  <p className="text-ink-soft">
                    A prompt with your canvas already in it, for your own assistant — the same
                    questions, asked the same way, wherever you go next.
                  </p>
                  <details>
                    <summary className="cursor-pointer text-sm text-ink-soft underline underline-offset-4">
                      read the prompt
                    </summary>
                    <pre className="mt-3 whitespace-pre-wrap border-l-2 border-ink/15 pl-4 font-sans text-sm text-ink-soft">
                      {takeaway.prompt}
                    </pre>
                  </details>
                  <CopyButton text={takeaway.prompt} label="⧉ Copy the prompt" />
                </div>

                {/* Download first, and the only thing here that is pushed. The
                    other two are the same three artefacts by another route. */}
                <div className="no-print flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <TakeIt href={takeawayHref(carried(run, coaching))} />
                  <CopyButton text={file} label="⧉ Copy as text" />
                  <PrintCanvas />
                  {/* Idea #134 made the download a PDF, because that is what
                      gets put in front of other people. The same file as plain
                      text stays one link away and is not hidden: it is the
                      lossless copy, it pastes into anything, and an untagged
                      PDF is the poorer document of the two for anyone reading
                      with a screen reader. Same words, same route. */}
                  <a
                    href={takeawayHref(carried(run, coaching), { as: "text" })}
                    download
                    className="text-sm text-ink-soft underline underline-offset-4 sm:basis-full"
                  >
                    …or take the same thing as a plain text file
                  </a>
                </div>
              </section>
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
                I&rsquo;ll ask a few short questions first, so I know who I&rsquo;m talking to and
                what you&rsquo;ve brought. Works for one person or a whole room.
              </p>
              {/* Said before the press, not after it. Talking means the coach
                  talks back and the microphone opens on its own, and both are
                  worth knowing about a moment before your browser asks you for
                  the microphone rather than a moment after. */}
              <p className="text-sm text-ink-soft/75">
                {voiceConfigured ? (
                  <>
                    Talk to me and we&rsquo;ll have the conversation out loud &mdash; your browser will ask
                    you for the microphone, and your voice goes to OpenAI while we talk. Nothing is
                    recorded or kept. You can stop me at any point, tap an answer instead mid-sentence,
                    and typing is always there.
                  </>
                ) : (
                  <>
                    Talk to me and I&rsquo;ll ask them out loud, then listen for your answer &mdash; your
                    browser will ask you for the microphone. You can tell me to stop reading them out at
                    any point, and typing is always there.
                  </>
                )}
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <ModeSwitch run={run} coaching={coaching} />
                {speaking ? <VoiceSwitch run={run} coaching={coaching} talking={talking} /> : null}
              </div>

              {/* The coach, on the line. It runs the same questions in the same
                  order and lands every answer through the same links, so
                  everything below stays live while it talks: tap an answer or
                  type one mid-sentence and the coach picks the conversation up
                  from wherever the column went. */}
              {talking ? <TalkToMe run={run} coaching={coaching} /> : null}

              {!who ? (
                <>
                  <Answers answers={WHO_ANSWERS} hrefs={hrefsFor(run, "who", WHO_ANSWERS)} />
                  {localVoice ? (
                    <SayIt
                      answers={WHO_ANSWERS}
                      hrefs={hrefsFor(run, "who", WHO_ANSWERS)}
                      invitation="…or just say it"
                      say={aloud ? WHO_QUESTION : undefined}
                      auto
                    />
                  ) : null}
                </>
              ) : null}

              {/* 02a · what to call you. A plain GET form like every other
                  answer here, so it works with JavaScript off, and "I'd rather
                  not say" beside it as a real answer rather than a skip —
                  it moves the conversation on exactly as far. */}
              {who && !name ? (
                <>
                  {localVoice ? (
                    <SayIt
                      answers={NAME_ANSWERS}
                      hrefs={hrefsFor(run, "name", NAME_ANSWERS)}
                      freeTextHref={runHref(run, { name: "__SAID__" })}
                      invitation="…or just say it"
                      max={NAME_MAX}
                      say={aloud ? nameQuestion(who) : undefined}
                      auto
                    />
                  ) : null}
                  <form method="get" action={COLUMN_PATH} className="flex flex-col gap-2 sm:flex-row">
                    {carried(run, coaching).map((field) => (
                      <input key={field.name} type="hidden" name={field.name} value={field.value} />
                    ))}
                    <label htmlFor="your-name" className="sr-only">
                      What should I call you?
                    </label>
                    <input
                      id="your-name"
                      name="name"
                      type="text"
                      maxLength={NAME_MAX}
                      autoComplete="given-name"
                      placeholder="…first name is plenty"
                      className="flex-1 rounded-2xl border border-ink/15 bg-white px-5 py-4 placeholder:text-ink-soft/75"
                    />
                    <button
                      type="submit"
                      className="rounded-2xl bg-ink px-5 py-4 font-semibold text-chalk hover:bg-ink-soft sm:px-6"
                    >
                      ↵ send
                    </button>
                  </form>
                  <Choice href={runHref(run, { name: NO_NAME })}>I&rsquo;d rather not say</Choice>
                  <p className="text-sm text-ink-soft/75">
                    It only travels in this tab&rsquo;s address bar, like everything else here, and
                    nothing below needs it.
                  </p>
                </>
              ) : null}

              {who && name && !brought ? (
                <>
                  <Answers answers={BROUGHT_ANSWERS} hrefs={hrefsFor(run, "brought", BROUGHT_ANSWERS)} />
                  {localVoice ? (
                    <SayIt
                      answers={BROUGHT_ANSWERS}
                      hrefs={hrefsFor(run, "brought", BROUGHT_ANSWERS)}
                      freeTextHref={runHref(run, { brought: "__SAID__" })}
                      invitation="…or say it however you like"
                      say={aloud ? broughtQuestion(run) : undefined}
                      auto
                    />
                  ) : null}
                  {/* …or tell me in your own words. A plain GET form, so it
                      works with JavaScript off like everything else here, and
                      it stays available whichever way you're answering. */}
                  <form method="get" action={COLUMN_PATH} className="flex flex-col gap-2 sm:flex-row">
                    {/* The whole run so far, including what to call you — the
                        same hidden fields every other form in this column
                        carries. */}
                    {carried(run, coaching).map((field) => (
                      <input key={field.name} type="hidden" name={field.name} value={field.value} />
                    ))}
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
                  {localVoice ? (
                    <SayIt
                      answers={SHARE_ANSWERS}
                      hrefs={hrefsFor(run, "share", SHARE_ANSWERS)}
                      invitation="…or just say it"
                      say={aloud ? shareQuestion(run) : undefined}
                      auto
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
                  label={COACH_ASKS.centre}
                  placeholder="district managers, counting in daylight…"
                  speaking={localVoice}
                  aloud={aloud}
                />
              ) : null}

              {share === "yes" && coaching.centre && !coaching.problem ? (
                <Ask
                  run={run}
                  coaching={coaching}
                  name="problem"
                  label={COACH_ASKS.problem}
                  placeholder="counts take three hours and happen at night…"
                  speaking={localVoice}
                  aloud={aloud}
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
                  label={COACH_ASKS.lagging}
                  placeholder="what would convince a sceptic…"
                  speaking={localVoice}
                  aloud={aloud}
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
                  label={COACH_ASKS.whoKnows}
                  placeholder="ask Priya's team…"
                  speaking={localVoice}
                  aloud={aloud}
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
                  label={COACH_ASKS.centreAgain}
                  placeholder="counting a shelf in minutes, before lunch…"
                  speaking={localVoice}
                  aloud={aloud}
                />
              ) : null}

              {share === "yes" && moved && !coaching.hypothesis ? (
                <Ask
                  run={run}
                  coaching={coaching}
                  name="hypothesis"
                  label={COACH_ASKS.hypothesis}
                  placeholder="we believe that…"
                  speaking={localVoice}
                  aloud={aloud}
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
                  label={COACH_ASKS.leading}
                  placeholder="what tells us in weeks…"
                  speaking={localVoice}
                  aloud={aloud}
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

              {/* CARD 6 · 12 — the three doors themselves, in the deck's order.
                  They are answers, so they live here with every other answer,
                  and they stay here after one is taken: going through a door
                  never closes the other two. There is no finish button beside
                  them and no fourth control that ends the run. */}
              {atTheDoors ? (
                <>
                  {/* The hand-over into next steps — idea #134. The three
                      doors used to arrive as three cards with nothing said
                      above them, so the moment the conversation turned into a
                      decision was something you had to notice for yourself.

                      One sentence, and it is careful to stay even: it says
                      out loud that none of the three is the recommended one,
                      which is the promise the cards themselves keep by being
                      identically weighted. It goes once a door is taken —
                      the coach's reply to that door is on screen by then,
                      and it says the same thing better. */}
                  {!out ? (
                    <p className="text-lg leading-relaxed sm:text-xl">
                      So — three ways to go from here, and none of them is the one I&rsquo;d have you
                      pick. Take whichever matches how you feel about it.
                    </p>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Door
                      href={columnHref(run, coaching, { out: "refine" })}
                      label="Keep refining"
                      aside={
                        standing?.start
                          ? `I'd start with ${standing.start}`
                          : "there's more in this if you want it"
                      }
                      go="Carry on"
                      taken={out === "refine"}
                    />
                    <Door
                      href={columnHref(run, coaching, { out: "stop" }, "#takeaway")}
                      label="Stop here"
                      aside="this is already sharper than most"
                      go="Take it and go"
                      taken={out === "stop"}
                    />
                    <Door
                      href={columnHref(run, coaching, { out: "questions" }, "#takeaway")}
                      label="Take the questions away"
                      aside={
                        takeaway && takeaway.open.length > 0
                          ? `${takeaway.open.length === 1 ? "one answer lives" : `${takeaway.open.length} answers live`} with your team, not with me`
                          : "nothing's open right now — this still packs the canvas up"
                      }
                      go="Pack them up"
                      taken={out === "questions"}
                    />
                  </div>
                </>
              ) : null}

              {/* Carrying on. The two answers that can be reopened without
                  unpicking what sits under them — the same "let me redo it"
                  the bet already had at step 10, not a new kind of move. Taking
                  one back never deletes anything else you said. */}
              {out === "refine" ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <Link
                      href={columnHref(run, coaching, { leading: null })}
                      className="text-ink-soft underline underline-offset-2"
                    >
                      …let me redo what tells us in weeks
                    </Link>
                  </p>
                  <p>
                    <Link
                      href={columnHref(run, coaching, { hypothesis: null })}
                      className="text-ink-soft underline underline-offset-2"
                    >
                      …or let me redo the bet
                    </Link>
                  </p>
                  <p className="text-ink-soft/75">
                    Those are the two I can reopen without pulling apart everything underneath them.
                    Anything further up the canvas, take away and sharpen it there — the prompt goes
                    with you.
                  </p>
                </div>
              ) : null}

              {/* The end of the column. It says which way you're talking, as it
                  has at every step, and it says the one thing that is still
                  true whichever door you took. */}
              {atTheDoors ? (
                <div className="no-print rounded-2xl border border-dashed border-ink/25 bg-white/60 px-5 py-4">
                  <p className="text-sm text-ink-soft">
                    {speaking ? "◉ Speaking." : "⌨ Typing."}{" "}
                    {who === "room"
                      ? "In a room I keep the nudge to myself — nobody needs one person told what's thin in front of everyone. "
                      : null}
                    {leaving(out)
                      ? "The canvas is still up there, exactly as you left it. Nothing is saved here, so take what you want before you close the tab."
                      : "No rush, and no wrong door. Nothing is saved here either way."}
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
