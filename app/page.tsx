import Link from "next/link";
import Column from "@/app/coach/entry/Column";
import { BUILD_URL, NEW_IDEA_URL } from "@/lib/config";
import { readRun } from "@/lib/triage";

const PILLARS = [
  {
    word: "Sooner",
    color: "text-sooner",
    border: "border-sooner/40",
    text: "Goals that create value within a quarter, not vague ambitions nobody can judge until year-end. Multi-year outcomes broken into annual, then quarterly — one golden thread, outcome-shaped and testable early.",
  },
  {
    word: "Safer",
    color: "text-safer",
    border: "border-safer/40",
    text: "Goals with psychological safety and governance built in — safe to challenge, safe to learn from in the open.",
  },
  {
    word: "Happier",
    color: "text-happier",
    border: "border-happier/40",
    text: "Goals people actually want to pursue — meaningful for customers, colleagues, and the humans doing the work.",
  },
];

const STEPS = [
  { n: "1", title: "Add an idea", text: "Suggest content, features, or thinking for this site. Every idea is a GitHub issue — one form, two minutes." },
  { n: "2", title: "Vote & discuss", text: "Endorse ideas with a 👍 and shape them in the comments. The board updates live as the group votes." },
  { n: "3", title: "Claude builds it", text: "When the group endorses an idea and it moves to Doing, Claude Code picks it up and builds it into this very site." },
  { n: "4", title: "Review & ship", text: "The change lands as a pull request with a preview link. The community reviews, then it ships to production." },
];

/**
 * The heading pattern /okrs uses, applied to the sections under the column —
 * idea #167.
 *
 * A small uppercase eyebrow saying where you are, then the title, then the one
 * sentence that sets the section up. Two bare `h2`s with a paragraph after one
 * of them was the reason the bottom of this page read as a wall: nothing told
 * you a new section had started, or what it was for.
 *
 * Written out here rather than lifted out of `app/okrs/page.tsx` and shared,
 * because that page is not this idea and a card gets to change one thing.
 */
function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/70">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {children ? <p className="mt-3 leading-relaxed text-ink-soft">{children}</p> : null}
    </div>
  );
}

/**
 * The front door is the conversation.
 *
 * The column built by CARDs 0–6 is the page: the coach's opening, the triage
 * questions, the chips they leave behind, the canvas, and what you leave with.
 * It used to live at `/coach/entry` behind a link. The "What are you trying to
 * achieve?" ask box that stood here before it has been retired rather than left
 * as a second, competing way in.
 *
 * Everything below the column is the site explaining itself, and it is only
 * there before the conversation starts. Once the first answer lands, the page
 * is the column and nothing else — which is what "one continuous column, top to
 * bottom" asks for in `docs/decisions/0001-the-canvas-scrolls.md`. The ask box
 * hid the same sections for the same reason.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // `mode` is the first thing the reader chooses — speaking or typing. Until
  // then nothing has been said, and the site can still introduce itself.
  const started = Boolean(readRun(params).mode);
  /* Idea #124. Whether "◉ Talk to me" reaches the coach itself or the browser's
     own voice reading the questions out. Decided here because it is a
     server-side key (`app/api/jam/session`), and never told to the browser as
     anything but the shape of the column it gets. */
  const voiceConfigured = Boolean(process.env.OPENAI_API_KEY);

  return (
    <div>
      <Column params={params} voiceConfigured={voiceConfigured} />

      {!started && (
        <>
          <section className="mx-auto max-w-6xl px-4 py-16">
            <SectionHeading eyebrow="Sooner · Safer · Happier" title="What makes a goal better?">
              Three things, and a goal that misses any one of them is a goal
              somebody is going to have to be talked into.
            </SectionHeading>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {PILLARS.map((p) => (
                <div
                  key={p.word}
                  className={`rounded-2xl border ${p.border} bg-white p-6 shadow-sm transition hover:shadow-md`}
                >
                  <h3 className={`text-xl font-bold ${p.color}`}>{p.word}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-ink-soft">
              Prefer to read rather than talk? Everything above is also a page:{" "}
              <Link href="/coach" className="font-semibold underline underline-offset-2">
                the Outcome Coach
              </Link>{" "}
              scores a goal you paste,{" "}
              <Link href="/okrs" className="font-semibold underline underline-offset-2">
                OKRs the way SSH think about them
              </Link>{" "}
              is the short version of the pattern, and{" "}
              <Link href="/principles" className="font-semibold underline underline-offset-2">
                the principles
              </Link>{" "}
              are what all of it is built on.
            </p>
          </section>

          <section className="border-y border-ink/10 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-16">
              <SectionHeading eyebrow="In the open" title="How this site gets built">
                This is a living experiment in working the way we talk about working:
                small ideas, fast feedback, shipped continuously.
              </SectionHeading>
              {/* The numeral is the step, so it gets the same medallion the
                  canvas numerals get rather than being a big green digit
                  floating above a heading — idea #167. The tint carries the
                  colour and the digit stays ink, because `sooner` is mid-tone
                  and a green 1 on a green disc is harder to read than the plain
                  one it replaced. Same four steps, same words. */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {STEPS.map((s) => (
                  <div
                    key={s.n}
                    className="rounded-2xl border border-ink/10 bg-chalk p-6 shadow-sm transition hover:shadow-md"
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-sooner/20 text-lg font-bold text-ink">
                      {s.n}
                    </span>
                    <h3 className="mt-3 font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.text}</p>
                  </div>
                ))}
              </div>
              {/* One filled button and one outlined one, as /okrs opens with.
                  Adding your idea is the thing this section is asking for, so it
                  is the one that looks like it. */}
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={NEW_IDEA_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-sooner px-6 py-3 font-semibold text-ink shadow-sm transition hover:bg-sooner/90 hover:shadow-md"
                >
                  Add your idea →
                </a>
                <a
                  href={BUILD_URL}
                  className="rounded-full border border-ink/15 bg-chalk px-6 py-3 font-semibold shadow-sm transition hover:border-ink/40 hover:shadow-md"
                >
                  See the live board ↗
                </a>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-16">
            <div className="rounded-3xl bg-ink px-6 py-12 text-center text-chalk sm:px-12">
              <h2 className="text-2xl font-bold sm:text-3xl">In the room with us?</h2>
              <p className="mx-auto mt-3 max-w-xl text-chalk/80">
                Head to <Link href="/contribute" className="underline underline-offset-2">Contribute</Link> for
                the two-minute path from “I have a thought” to “it’s on the board” —
                whether you live in GitHub or have never touched it.
              </p>
              <p className="mx-auto mt-3 max-w-xl text-chalk/80">
                Used the site already?{" "}
                <Link href="/feedback" className="font-semibold underline underline-offset-2">
                  Tell us what you think
                </Link>{" "}
                — ninety seconds, anonymous if you like. It shapes what gets built next.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
