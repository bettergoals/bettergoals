import Link from "next/link";
import { REPO_URL } from "@/lib/config";

export const metadata = {
  title: "Outcome canvas",
  description:
    "The Sooner Safer Happier outcome canvas laid out to run on a wall — nine boxes that take a rough ambition to an outcome, its key results, and the assumptions underneath.",
};

const QUICK_LEARN_URL =
  "https://www.soonersaferhappier.com/training/quick-learn-outcome-canvas";

type Block = {
  n: number;
  title: string;
  prompt: string;
  hint: string;
  /** Border + heading colour, keyed to the sooner / safer / happier palette */
  border: string;
  heading: string;
};

const CONTEXT: Block[] = [
  {
    n: 2,
    title: "Why now",
    prompt: "Why does this matter, and why now?",
    hint: "Which strategic bet or problem does this serve? If nothing changes, what does it cost us?",
    border: "border-ink/15",
    heading: "text-ink",
  },
  {
    n: 3,
    title: "Who benefits",
    prompt: "Whose life gets better?",
    hint: "Name a specific customer, colleague or citizen — not “the business”, not “stakeholders”.",
    border: "border-ink/15",
    heading: "text-ink",
  },
];

const PILLARS: Block[] = [
  {
    n: 4,
    title: "Better value",
    prompt: "What value do they actually get?",
    hint: "How would we know it's real rather than assumed? What would we see them doing differently?",
    border: "border-ink/15",
    heading: "text-ink",
  },
  {
    n: 5,
    title: "Sooner",
    prompt: "How do we see signal in weeks, not quarters?",
    hint: "What's the smallest slice worth doing? What could we learn from by next Friday?",
    border: "border-sooner/40",
    heading: "text-sooner",
  },
  {
    n: 6,
    title: "Safer",
    prompt: "Safe to attempt, safe to challenge, safe to miss?",
    hint: "Who has argued this is the wrong goal, and what changed because of it? What do we do if the signal never moves?",
    border: "border-safer/40",
    heading: "text-safer",
  },
  {
    n: 7,
    title: "Happier",
    prompt: "Who ends up happier — including the people doing the work?",
    hint: "Would the team choose this goal if it were entirely up to them?",
    border: "border-happier/40",
    heading: "text-happier",
  },
];

const COMMIT: Block[] = [
  {
    n: 8,
    title: "Key results",
    prompt: "One to three measures: baseline → target → by when.",
    hint: "Prefer leading indicators you can move this month over lagging ones you can only read at year-end. Pair each with a guardrail that must not get worse.",
    border: "border-ink/15",
    heading: "text-ink",
  },
  {
    n: 9,
    title: "Assumptions to test",
    prompt: "What are we assuming, and what's the first cheap experiment?",
    hint: "Write down the assumption most likely to be wrong, and how you'd find out within a fortnight.",
    border: "border-ink/15",
    heading: "text-ink",
  },
];

const SMELLS = [
  "Could we complete this and have nothing get better for anyone? Then it's a task list, not a goal.",
  "Is the outcome a solution in disguise — “migrate to X”, “launch Y”, “roll out Z”?",
  "Is there a measure we could hit by gaming rather than by improving?",
  "Will we learn something before the deadline, or only at it?",
  "Could anyone in the room have said “I think this is the wrong goal”?",
  "Is this one goal, or five goals wearing one hat?",
];

function BlockCard({ block }: { block: Block }) {
  return (
    <div className={`flex flex-col rounded-2xl border ${block.border} bg-white p-6 shadow-sm`}>
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-bold tabular-nums text-ink/30">{block.n}</span>
        <h3 className={`text-lg font-bold ${block.heading}`}>{block.title}</h3>
      </div>
      <p className="mt-2 font-medium leading-snug">{block.prompt}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{block.hint}</p>
      <div
        aria-hidden
        className="mt-4 min-h-16 flex-1 rounded-xl border border-dashed border-ink/15 bg-chalk"
      />
    </div>
  );
}

export default function CanvasPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs font-bold uppercase tracking-widest text-sooner">
        Goal &amp; OKR writing canvas
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Outcome canvas</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Nine boxes that take a rough ambition and turn it into an outcome, its key
        results, and the assumptions underneath — so the goals you write describe a
        change in the world rather than a list of things to build. This is the version to
        run on a wall; fill it in <strong>with</strong> the people closest to the work,
        not for them.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/templates/outcome-canvas"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-chalk hover:bg-ink-soft"
        >
          Fill-in version &amp; worked example →
        </Link>
        <a
          href="/templates/outcome-canvas.md"
          download
          className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold hover:bg-ink/5"
        >
          Download .md
        </a>
        <a
          href={QUICK_LEARN_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold hover:bg-ink/5"
        >
          SSH quick-learn guide ↗
        </a>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight">The canvas</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Start at box 1, but expect to rewrite it once you&rsquo;ve worked through 3 to
          7 — that&rsquo;s the canvas doing its job. If a box is hard to answer, write the
          open question in it rather than a comfortable non-answer.
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-ink p-6 text-chalk shadow-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold tabular-nums text-chalk/40">1</span>
              <h3 className="text-lg font-bold text-sooner">Outcome</h3>
            </div>
            <p className="mt-2 max-w-2xl font-medium text-chalk/90">
              What change in the world are we going for? One or two sentences, no
              solutions.
            </p>
            <div
              aria-hidden
              className="mt-4 min-h-20 rounded-xl border border-dashed border-chalk/30"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {CONTEXT.map((b) => (
              <BlockCard key={b.n} block={b} />
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((b) => (
              <BlockCard key={b.n} block={b} />
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {COMMIT.map((b) => (
              <BlockCard key={b.n} block={b} />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight">Running a canvas session</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink-soft">
            <li>
              <strong>Invite the people closest to the work</strong> — including the ones
              most likely to disagree. A canvas written by a leadership team alone is a
              guess.
            </li>
            <li>
              <strong>Budget 90 minutes.</strong> One box at a time, out loud, on a wall or
              a shared doc. Silence on a box is data.
            </li>
            <li>
              <strong>Draft the outcome, then leave it.</strong> Work through who benefits
              and the four lenses, then come back and rewrite box 1.
            </li>
            <li>
              <strong>Cut to one to three key results.</strong> Seven measures means nobody
              knows what matters.
            </li>
            <li>
              <strong>End on assumptions.</strong> Agree the first experiment and who runs
              it before anyone leaves the room.
            </li>
          </ol>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Facilitating solo? The{" "}
            <Link href="/skills" className="font-semibold underline underline-offset-2">
              <code>outcome-canvas</code> skill
            </Link>{" "}
            makes Claude ask the nine questions one at a time.
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight">The smell test</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Before you commit to the canvas, ask these out loud. Any answer in the wrong
            direction means another pass.
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
            {SMELLS.map((s) => (
              <li key={s} className="flex gap-3">
                <span aria-hidden className="text-sooner">
                  ✓
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-14 rounded-3xl bg-ink px-6 py-10 text-chalk sm:px-10">
        <h2 className="text-2xl font-bold tracking-tight">Where this comes from</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-chalk/80">
          The outcome canvas is a{" "}
          <a
            href="https://soonersaferhappier.com"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline underline-offset-2"
          >
            Sooner Safer Happier
          </a>{" "}
          practice — start with the{" "}
          <a
            href={QUICK_LEARN_URL}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline underline-offset-2"
          >
            quick-learn guide
          </a>{" "}
          for the canonical walkthrough. The version on this page is the community&rsquo;s
          interpretation, structured around better value, sooner, safer, happier and
          aligned to our{" "}
          <Link href="/principles" className="font-semibold underline underline-offset-2">
            principles
          </Link>
          . Once the canvas is filled in, the{" "}
          <Link href="/okrs" className="font-semibold underline underline-offset-2">
            OKR framework
          </Link>{" "}
          covers what to do with boxes 8 and 9. Like everything here it&rsquo;s owned by
          the community: if a box should be worded differently or is missing altogether,{" "}
          <a
            href={`${REPO_URL}/edit/main/public/templates/outcome-canvas.md`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline underline-offset-2"
          >
            suggest an edit
          </a>
          .
        </p>
      </section>
    </div>
  );
}
