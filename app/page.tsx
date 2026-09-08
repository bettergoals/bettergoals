import Link from "next/link";
import { AskForm } from "@/components/AskForm";
import { BUILD_URL, NEW_IDEA_URL } from "@/lib/config";

/** The three words, one line each. The detail lives on /principles. */
const PILLARS = [
  {
    word: "Sooner",
    color: "text-sooner",
    border: "border-sooner/40",
    text: "Value in weeks, not ambitions parked until year-end.",
  },
  {
    word: "Safer",
    color: "text-safer",
    border: "border-safer/40",
    text: "Safe to challenge, safe to miss, safe to learn from in the open.",
  },
  {
    word: "Happier",
    color: "text-happier",
    border: "border-happier/40",
    text: "Goals people actually want to pursue, for customers and colleagues alike.",
  },
];

/** The rest of the site, one line each, for when you'd rather browse. */
const ELSEWHERE = [
  { href: "/coach", label: "Score a goal you've written", note: "Outcome Coach" },
  { href: "/principles", label: "What makes a goal better", note: "Principles" },
  { href: "/okrs", label: "Objectives and Key Results, the SSH way", note: "OKRs" },
  { href: "/templates", label: "The Outcome Canvas, blank and worked", note: "Templates" },
  { href: "/teach", label: "Bring your boss, PMO and peers along", note: "Teach outcomes" },
  { href: "/skills", label: "Coaching skills for your own AI", note: "Skills" },
];

export default function Home() {
  return (
    <div>
      <section className="bg-ink text-chalk">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-chalk/60">
            A Sooner Safer Happier community resource
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            What are you trying to achieve?
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-chalk/80">
            Say it in a sentence — a rough ambition, a finished OKR, or the argument you keep having
            with your boss. You&rsquo;ll get one next step: the guidance, template, coaching
            questions or prompt that fits. No reading list.
          </p>
          <div className="mt-8">
            <AskForm tone="dark" autoFocus />
          </div>
        </div>
      </section>

      <section className="border-b border-ink/10 bg-white">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.word} className={`rounded-2xl border ${p.border} p-5`}>
              <h2 className={`font-bold ${p.color}`}>{p.word}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight">Or go straight to it</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ELSEWHERE.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block h-full rounded-2xl border border-ink/10 bg-white p-5 shadow-sm hover:bg-ink/5"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
                  {item.note}
                </p>
                <p className="mt-1 font-semibold">{item.label} →</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl bg-ink px-6 py-10 text-chalk sm:px-12">
          <h2 className="text-2xl font-bold tracking-tight">This site is built by the community</h2>
          <p className="mt-3 max-w-2xl text-chalk/80">
            Every page here started as an idea on the board. The community proposes it, endorses it
            with a 👍, and Claude Code builds it into this site as a pull request the community
            reviews.{" "}
            <Link href="/contribute" className="font-semibold underline underline-offset-2">
              Contribute
            </Link>{" "}
            is the two-minute path from &ldquo;I have a thought&rdquo; to &ldquo;it&rsquo;s on the
            board&rdquo; — whether you live in GitHub or have never touched it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={BUILD_URL}
              className="rounded-full border border-chalk/30 px-5 py-2.5 font-semibold hover:bg-chalk/10"
            >
              See the live board ↗
            </a>
            <a
              href={NEW_IDEA_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-chalk/30 px-5 py-2.5 font-semibold hover:bg-chalk/10"
            >
              Add your idea →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
