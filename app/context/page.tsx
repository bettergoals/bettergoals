import Link from "next/link";
import { ContextPanel } from "@/components/ContextPanel";
import { EMPTY_CONTEXT } from "@/lib/orgContext";

export const metadata = {
  title: "Your context",
  description:
    "Tell the Outcome Coach where you work — your organisation, your role, how goals are set and the language your people use — so the coaching lands in your world. It stays in your browser.",
};

/** What the coach does with the context, and the one thing it never does. */
const USES = [
  {
    thing: "Reads your draft through it",
    detail:
      "Your acronyms get expanded, not flagged. Your customers, products and teams are recognised. Your framework and cadence are taken as given rather than argued with.",
  },
  {
    thing: "Asks at your altitude",
    detail:
      "A team lead and a group executive own different-sized outcomes. Knowing which you are means questions you can act on, about the goals you actually write.",
  },
  {
    thing: "Writes in your language",
    detail:
      "Candidate phrasings come back in your vocabulary and to your cadence — and avoid the words you said to avoid, including the ones with history.",
  },
  {
    thing: "Never treats it as evidence",
    detail:
      "It frames the coaching; it never supplies a customer, a baseline, a target or a fact about your goal. Anything the coach doesn’t know from your draft stays a «placeholder» for you to fill in.",
  },
];

export default function ContextPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-ink-soft">
        <Link href="/coach" className="underline underline-offset-2">
          Outcome Coach
        </Link>{" "}
        · Your context
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">The coach reads a sentence. You work in an organisation.</h1>
      <p className="mt-3 text-lg text-ink-soft">
        That gap is where good coaching goes wrong. It doesn&rsquo;t know that &ldquo;partner&rdquo; means
        broker here, that goals are set once a year and signed off in a slide pack, or that you&rsquo;re
        coaching four team leads rather than writing your own goal. Tell it once, and every review afterwards
        is framed by where you actually work.
      </p>
      <p className="mt-3 text-ink-soft">
        All four boxes are optional and short answers are fine — two lines of truth beat a page of
        boilerplate. Leave a box empty and the coach simply won&rsquo;t assume anything about it.
      </p>

      <ContextPanel initial={{ ...EMPTY_CONTEXT }} variant="page" />

      <h2 className="mt-14 text-2xl font-bold tracking-tight">What the coach does with it</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {USES.map((use) => (
          <li key={use.thing} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
            <h3 className="font-semibold">{use.thing}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{use.detail}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        One check is deliberately unmoved by any of this. &ldquo;Anyone can understand it&rdquo; still means
        someone who joined last week: a term your context explains is fair game in a candidate, but a term
        that hides what would actually be different for someone is still called out, however normal it is
        where you work.
      </p>

      <h2 className="mt-14 text-2xl font-bold tracking-tight">Where it lives</h2>
      <div className="mt-4 rounded-3xl border border-safer/40 bg-safer/10 p-6 text-sm leading-relaxed sm:p-8">
        <p>
          In this browser, on this device, and nowhere else. There is no account and no database on this site,
          so there is nothing here to sync, breach or hand to anyone. Clear it with the button above and it is
          gone — no copy is kept.
        </p>
        <p className="mt-3">
          It is sent only when you actually coach a goal: it travels with that draft to the model, under{" "}
          <Link href="/privacy" className="font-semibold underline underline-offset-2">
            zero data retention
          </Link>
          , to write that one review, and is kept by nobody afterwards. Write it the way you&rsquo;d brief a
          new colleague on their first morning — enough to be useful, nothing commercially confidential, and
          no names. The coach never needs to know who anyone is, and if a name turns up it sets it aside and
          works with the role.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link
          href="/coach"
          className="rounded-full bg-ink px-6 py-3 font-semibold text-chalk hover:bg-ink-soft"
        >
          Coach a goal with this →
        </Link>
        <Link
          href="/coach/jam"
          className="rounded-full border border-ink/15 bg-white px-6 py-3 font-semibold shadow-sm hover:bg-ink/5"
        >
          Or run a goal jam
        </Link>
      </div>
    </div>
  );
}
