import Link from "next/link";
import Column from "@/app/coach/entry/Column";
import { BUILD_URL, NEW_IDEA_URL } from "@/lib/config";
import { readRun } from "@/lib/triage";

const PILLARS = [
  {
    word: "Sooner",
    color: "text-sooner",
    border: "border-sooner/40",
    text: "Goals that create value in weeks, not vague ambitions parked until year-end. Small, outcome-shaped, and testable early.",
  },
  {
    word: "Safer",
    color: "text-safer",
    border: "border-safer/40",
    text: "Goals with psychological safety and governance built in — safe to challenge, safe to miss, safe to learn from in the open.",
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

  return (
    <div>
      <Column params={params} />

      {!started && (
        <>
          <section className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-2xl font-bold tracking-tight">What makes a goal better?</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {PILLARS.map((p) => (
                <div key={p.word} className={`rounded-2xl border ${p.border} bg-white p-6 shadow-sm`}>
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
              <h2 className="text-2xl font-bold tracking-tight">How this site gets built</h2>
              <p className="mt-2 max-w-2xl text-ink-soft">
                This is a living experiment in working the way we talk about working:
                small ideas, fast feedback, shipped continuously.
              </p>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {STEPS.map((s) => (
                  <div key={s.n} className="relative rounded-2xl border border-ink/10 p-6">
                    <span className="text-3xl font-bold text-sooner">{s.n}</span>
                    <h3 className="mt-2 font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={BUILD_URL}
                  className="rounded-full border border-ink/15 bg-white px-6 py-3 font-semibold shadow-sm hover:bg-ink/5"
                >
                  See the live board ↗
                </a>
                <a
                  href={NEW_IDEA_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-ink/15 bg-white px-6 py-3 font-semibold shadow-sm hover:bg-ink/5"
                >
                  Add your idea →
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
