import Link from "next/link";
import { BUILD_URL, NEW_IDEA_URL, SITE } from "@/lib/config";

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

export default function Home() {
  return (
    <div>
      <section className="bg-ink text-chalk">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-chalk/60">
            A Sooner Safer Happier community resource
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Craft better goals.{" "}
            <span className="text-sooner">Sooner</span>,{" "}
            <span className="text-safer">safer</span>,{" "}
            <span className="text-happier">happier</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-chalk/80">
            {SITE.description} Built live, in the open, by the community — every
            feature on this site started as an idea on the board.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={BUILD_URL}
              className="rounded-full bg-sooner px-6 py-3 font-semibold text-ink hover:bg-sooner/90"
            >
              See the live board ↗
            </a>
            <a
              href={NEW_IDEA_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-chalk/30 px-6 py-3 font-semibold hover:bg-chalk/10"
            >
              Add your idea →
            </a>
          </div>
        </div>
      </section>

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
          Want the mechanics?{" "}
          <Link href="/okrs" className="font-semibold underline underline-offset-2">
            Read the OKR framework
          </Link>{" "}
          — objectives as outcome hypotheses, key results that measure behaviour,
          and a golden thread from strategy to experiment. Starting a planning
          cycle?{" "}
          <Link href="/templates" className="font-semibold underline underline-offset-2">
            Take a starter template
          </Link>{" "}
          — outcome hypotheses, OKRs and goal one-pagers, with worked examples from this community.
          Already have a goal written?{" "}
          <Link href="/checker" className="font-semibold underline underline-offset-2">
            Run it through the checker
          </Link>{" "}
          — thirty seconds, in your browser, and it will tell you honestly whether
          you’ve written an outcome or an output.
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
        </div>
      </section>
    </div>
  );
}
