import Link from "next/link";
import { CANVAS_OPENS_ON, CANVAS_ORDER, type CanvasBoxId } from "@/lib/canvas";
import { REPO_URL } from "@/lib/config";
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
import { SayIt } from "./SayIt";

export const metadata = {
  title: "The column",
  description:
    "One continuous column, from the landing screen to the canvas. Nothing is replaced, nothing is cleared away, and nothing reports how far through you are.",
};

/*
 * CARD 1 — The column. The shell everything else lives inside.
 * CARD 2 — Triage, steps 01–04. The four questions that fill it in.
 * CARD 4 — The seam, step 05. The canvas rises into the column.
 *
 * Binding: `docs/decisions/0001-the-canvas-scrolls.md` (the canvas is a block
 * in ordinary document flow at every width),
 * `docs/decisions/0002-the-canvas-arrives-collapsed-on-mobile.md`,
 * `docs/reference/card-a.md`, and slides 1–8 of
 * `docs/reference/voice-coach-deck.md`. The wording of the four triage
 * questions and their answers is the deck's; the layout is not.
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
 * All five boxes, always all five, empty ones visibly present and labelled.
 * Full size at every breakpoint — no thumbnail, no map, per the CARD 0
 * decision. Boxes are sized by their content and never scroll.
 *
 * One of them is lit: the box the conversation is in, or — at the seam, before
 * a word of coaching — the box it is about to start in. Lighting is a heavier
 * border, not a colour, and the box says in words what it is waiting for, so
 * nothing here depends on seeing a difference in shade.
 */
function Canvas({ lit }: { lit: CanvasBoxId }) {
  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
      {CANVAS_ORDER.map((box) => {
        const isLit = box.id === lit;
        return (
          <div
            key={box.id}
            aria-current={isLit ? "true" : undefined}
            className={`rounded-2xl bg-white p-5 ${PLACE[box.id]} ${
              isLit ? "border-2 border-ink/45 shadow-sm" : "border border-ink/15"
            }`}
          >
            <p className="flex items-baseline gap-2">
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
            </p>
            <p className={`mt-3 ${isLit ? "text-ink-soft" : "text-ink-soft/70"}`}>{box.waiting}</p>
          </div>
        );
      })}
    </div>
  );
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
 */
function Seam() {
  const opening = CANVAS_OPENS_ON;
  return (
    <section aria-labelledby="canvas-heading">
      <h2 id="canvas-heading" className="sr-only">
        Your canvas
      </h2>
      <details className="canvas-arrives">
        <summary className="mb-3 flex cursor-pointer list-none items-baseline gap-2 rounded-2xl border border-dashed border-ink/25 bg-white/60 px-5 py-4 text-ink-soft hover:bg-white">
          <span aria-hidden>▾</span>
          <span>
            <span className="font-semibold text-ink">canvas</span> — we&rsquo;ll start in{" "}
            {opening.short}
            <span className="mt-0.5 block text-sm text-ink-soft/75">tap to open</span>
          </span>
        </summary>
        <Canvas lit={opening.id} />
      </details>
    </section>
  );
}

/** Available at any point, in both directions, at every step of the run. */
function ModeSwitch({ run }: { run: Run }) {
  const to = run.mode === "speak" ? "type" : "speak";
  return (
    <Link
      href={runHref(run, { mode: to })}
      className="self-start rounded-full border border-ink/15 px-3 py-1.5 text-sm text-ink-soft hover:bg-ink/5"
    >
      {to === "type" ? "⌨ switch to typing" : "◉ switch to speaking"}
    </Link>
  );
}

export default async function ColumnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const run = readRun(await searchParams);
  const { mode, who, brought, share } = run;

  const chips = chipsFor(run);
  const speaking = mode === "speak";

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-20">
      <p className="mb-10 rounded-2xl border border-safer/40 bg-safer/10 px-4 py-3 text-sm text-ink-soft">
        <strong className="text-ink">This is the column, being built in the open.</strong> The four
        questions below are real, so are the chips they leave behind, and so is the canvas they hand
        you on to. What is not here yet is the coaching — the boxes filling in as you talk arrives in
        later cards.
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
            <Turn>
              <p>Good — then I&rsquo;ve got everything I need to be useful.</p>
              <p>
                I&rsquo;m going to put your canvas up as we go. You don&rsquo;t have to fill it in —
                I&rsquo;ll ask, you talk, and it fills itself.
              </p>
            </Turn>
            <Seam />
          </>
        ) : null}

        {/* The off-ramp. It leaves the spine and never reaches the canvas, but
            the column it leaves from does not close. */}
        {share === "no" ? (
          <Turn>
            <p>Understood — and thank you for saying so.</p>
            <p>
              Then let&rsquo;s set you up to coach it where it already lives. Take the skill and the
              prompt with you, and run the same conversation inside your own walls.
            </p>
            <p className="text-base sm:text-lg">
              <Link href="/skills" className="font-semibold underline underline-offset-2">
                The skill, where to install it, and the prompt to carry back →
              </Link>
            </p>
          </Turn>
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
              <ModeSwitch run={run} />

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

              {share ? (
                <div className="rounded-2xl border border-dashed border-ink/25 bg-white/60 px-5 py-4">
                  <p className="text-sm text-ink-soft">
                    {speaking ? "◉ Speaking." : "⌨ Typing."}{" "}
                    {share === "yes"
                      ? "The canvas is up. The coach's first question lands here — in the centre, the box that's lit — and the boxes fill themselves in as you answer. That part is a later card."
                      : "The handover above is where this run goes next. The column stays open behind it."}
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
