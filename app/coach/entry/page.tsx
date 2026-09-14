import Link from "next/link";
import { CANVAS_ORDER, type CanvasBoxId } from "@/lib/canvas";

export const metadata = {
  title: "The column",
  description:
    "One continuous column, from the landing screen to the canvas. Nothing is replaced, nothing is cleared away, and nothing reports how far through you are.",
};

/*
 * CARD 1 — The column. The shell everything else lives inside.
 *
 * Binding: `docs/decisions/0001-the-canvas-scrolls.md` (the canvas is a block
 * in ordinary document flow at every width), `docs/reference/card-a.md`, and
 * slides 1, 2, 7 and 8 of `docs/reference/voice-coach-deck.md`.
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
 *    form, so the run works with JavaScript off.
 */

type Mode = "speak" | "type";
type Who = "me" | "room";
type Share = "yes" | "no";

type Run = {
  /** Unset until the landing screen is answered — that answer is what starts it. */
  mode: Mode | null;
  who: Who | null;
  /** One of the three offered answers, or the leader's own words. */
  brought: string | null;
  share: Share | null;
};

const BROUGHT_OFFERED: Record<string, { label: string; aside: string; chip: string }> = {
  nothing: { label: "Nothing yet", aside: "a hunch, an itch, a problem", chip: "nothing yet" },
  work: { label: "Something from work", aside: "an OKR, a target, a mandate", chip: "something from work" },
  draft: { label: "A draft I wrote", aside: "I've had a go myself", chip: "a draft I wrote" },
};

function first(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/** The run so far, in the order it has to be answered — a gap ends it. */
function readRun(params: Record<string, string | string[] | undefined>): Run {
  const mode = oneOf(first(params.mode), ["speak", "type"] as const);
  const who = mode ? oneOf(first(params.who), ["me", "room"] as const) : null;
  const broughtRaw = who ? first(params.brought) : null;
  const brought = broughtRaw ? broughtRaw.slice(0, 120) : null;
  const share = brought ? oneOf(first(params.share), ["yes", "no"] as const) : null;
  return { mode, who, brought, share };
}

/**
 * Every answer is a link back to this same page with one more thing known, so
 * there is never a route change and never a page to start. `#live` lands the
 * reader on the live turn, which is where they already were when they answered.
 */
function href(run: Run, next: Partial<Run>, hash = "#live"): string {
  const merged = { ...run, ...next };
  const q = new URLSearchParams();
  if (merged.mode) q.set("mode", merged.mode);
  if (merged.who) q.set("who", merged.who);
  if (merged.brought) q.set("brought", merged.brought);
  if (merged.share) q.set("share", merged.share);
  const s = q.toString();
  return `/coach/entry${s ? `?${s}` : ""}${hash}`;
}

/** A turn the coach has taken. Greys once it has been answered; never removed. */
function Turn({ spent = false, children }: { spent?: boolean; children: React.ReactNode }) {
  return (
    <div className={spent ? "text-ink-soft/55" : "text-ink"}>
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
      className="flex flex-col rounded-2xl border border-ink/15 bg-white px-5 py-4 text-left transition-colors hover:border-ink/40 hover:bg-ink/[0.03] sm:min-w-64 sm:flex-1"
    >
      <span className="font-semibold">{label}</span>
      {aside ? <span className="mt-0.5 text-sm text-ink-soft">{aside}</span> : null}
    </Link>
  );
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
 * Full width at every breakpoint — no thumbnail, no map, no accordion, per the
 * CARD 0 decision. Boxes are sized by their content and never scroll.
 */
function Canvas() {
  return (
    <section aria-labelledby="canvas-heading">
      <h2 id="canvas-heading" className="sr-only">
        Your canvas
      </h2>
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {CANVAS_ORDER.map((box) => (
          <div
            key={box.id}
            className={`rounded-2xl border border-ink/15 bg-white p-5 ${PLACE[box.id]}`}
          >
            <p className="flex items-baseline gap-2">
              <span aria-hidden className="text-lg text-ink-soft/60">
                {box.numeral}
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-ink-soft/80">
                {box.label}
              </span>
            </p>
            <p className="mt-3 text-ink-soft/70">{box.waiting}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Available at any point, in both directions, at every step of the run. */
function ModeSwitch({ run }: { run: Run }) {
  const to: Mode = run.mode === "speak" ? "type" : "speak";
  return (
    <Link
      href={href(run, { mode: to })}
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

  const chips: string[] = [];
  if (who) chips.push(who === "me" ? "one person, not a room" : "a room of us");
  if (brought) chips.push(BROUGHT_OFFERED[brought]?.chip ?? brought);
  if (share) chips.push(share === "yes" ? "happy to share it" : "it stays inside our walls");

  const typing = mode === "type";

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-20">
      <p className="mb-10 rounded-2xl border border-safer/40 bg-safer/10 px-4 py-3 text-sm text-ink-soft">
        <strong className="text-ink">This is the column, being built in the open.</strong> The shell
        the coaching lives inside — one page from the landing screen to the canvas, with nothing
        replaced along the way. The coach&rsquo;s real questions and voice capture arrive in later
        cards; the answers below are a stub run through the shape.
      </p>

      {/* One column. One scroller. Everything below is appended in order and
          nothing in it ever moves. */}
      <article className="the-column space-y-8">
        {/* The opening. Slide 3 — unchanged by anything that happens later. */}
        <Turn spent={Boolean(mode)}>
          <h1 className="text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
            Hello. I help you turn a goal into an outcome worth chasing.
          </h1>
          <p>Shall we talk it through? Speaking is quicker. Typing works just as well.</p>
        </Turn>

        {/* The triage turns. Each one lands here and stays here. */}
        {mode ? (
          <Turn spent={Boolean(who)}>
            <p>First — is it just you, or is there a room of you?</p>
          </Turn>
        ) : null}

        {who ? (
          <Turn spent={Boolean(brought)}>
            <p>
              {who === "me" ? "Just you today — noted." : "A room of you — noted."} And what have you
              brought with you?
            </p>
          </Turn>
        ) : null}

        {brought ? (
          <Turn spent={Boolean(share)}>
            <p>Last question. Can you share it with me?</p>
            <p className="text-base text-ink-soft sm:text-lg">
              Before you answer — there&rsquo;s no account here, no database, and I keep nothing when
              you close the tab. Even so, some wording isn&rsquo;t yours to paste anywhere. Your call,
              and either answer is a good one.
            </p>
          </Turn>
        ) : null}

        {/* The chips. They accumulate here, they grey, and they are never
            cleared — so the canvas below reads as something the conversation
            produced rather than a new tool you have been handed. */}
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
            <Canvas />
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
              <div className="flex flex-col gap-3 sm:flex-row">
                <Answer
                  href={href(run, { mode: "speak" })}
                  label="◉ Talk to me"
                  aside="about four minutes, out loud"
                />
                <Answer
                  href={href(run, { mode: "type" })}
                  label="⌨ Type to me instead"
                  aside="same conversation, typed"
                />
              </div>
              <p className="text-sm text-ink-soft">
                I&rsquo;ll ask a few short questions first, so I know who I&rsquo;m coaching. Works for
                one person or a whole room.
              </p>
            </>
          ) : (
            <>
              <ModeSwitch run={run} />

              {!who ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Answer
                    href={href(run, { who: "me" })}
                    label="Just me"
                    aside="we'll have a conversation"
                  />
                  <Answer
                    href={href(run, { who: "room" })}
                    label="There's a room of us"
                    aside="I'll go on the big screen"
                  />
                </div>
              ) : null}

              {who && !brought ? (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {Object.entries(BROUGHT_OFFERED).map(([value, option]) => (
                      <Answer
                        key={value}
                        href={href(run, { brought: value })}
                        label={option.label}
                        aside={option.aside}
                      />
                    ))}
                  </div>
                  {/* …or tell me in your own words. A plain GET form, so it
                      works with JavaScript off like everything else here. */}
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
                      maxLength={120}
                      autoComplete="off"
                      placeholder="…or tell me in your own words"
                      className="flex-1 rounded-2xl border border-ink/15 bg-white px-5 py-4 placeholder:text-ink-soft/60"
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
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Answer
                    href={href(run, { share: "yes" })}
                    label="Yes — let's look at it together"
                    aside="we start coaching now"
                  />
                  <Answer
                    href={href(run, { share: "no" })}
                    label="No — it stays inside our walls"
                    aside="I'll set you up to coach it in there"
                  />
                </div>
              ) : null}

              {share ? (
                <div className="rounded-2xl border border-dashed border-ink/25 bg-white/60 px-5 py-4">
                  <p className="text-sm text-ink-soft">
                    {typing ? "⌨ Typing." : "◉ Speaking."}{" "}
                    {share === "yes"
                      ? "The coach's first question lands here, and the canvas above fills itself in as you answer. That's a later card — this one is the column it all lands in."
                      : "The handover above is where this run goes next. The column stays open behind it."}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-ink-soft">
                  {typing ? "⌨ Type your answer, or tap one." : "◉ …or just say it. Tap one, either way."}
                </p>
              )}
            </>
          )}
        </section>
      </article>
    </div>
  );
}
