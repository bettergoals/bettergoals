import Link from "next/link";

export const metadata = {
  title: "Templates",
  description:
    "The Sooner Safer Happier Outcome Canvas — a blank canvas to fill in, and the same canvas with a worked example. The two templates that match the SSH quick learn.",
};

const QUICK_LEARN_URL =
  "https://www.soonersaferhappier.com/training/quick-learn-outcome-canvas";
const SSH_URL = "https://soonersaferhappier.com";

/**
 * Exactly two templates, matching the SSH quick learn: the blank canvas and the
 * same canvas with a worked example. Both are the PDFs Sooner Safer Happier
 * publishes, so the two sites never drift apart.
 */
const TEMPLATES = [
  {
    file: "ssh-outcome-canvas.pdf",
    name: "SSH Outcome Canvas",
    format: "Fill-in canvas",
    description:
      "The blank canvas. Print it A3 for the wall, or fill it in on screen — one page that takes a team from the problem they can see to the outcome they’re betting on.",
    primary: true,
  },
  {
    file: "ssh-outcome-canvas-with-example.pdf",
    name: "SSH Outcome Canvas — with example",
    format: "Worked example",
    description:
      "The same canvas, filled in. Read this one first if you’ve never run the canvas before: it shows the level of specificity each box is asking for.",
    primary: false,
  },
];

const BOXES = [
  {
    title: "Problem Statement",
    aside: "Driver / Opportunity",
    prompt: "Due to <this data or insight, feedback or belief>",
    accent: "border-happier/40",
    label: "text-happier",
  },
  {
    title: "Outcome Hypothesis",
    aside: "Data › Insight › Belief › Bet",
    prompt: "We believe that <bet> will result in <this outcome>",
    accent: "border-sooner/40",
    label: "text-sooner",
  },
  {
    title: "Key Results — Leading Indicators",
    aside: "Early signal",
    prompt: "What tells us within weeks that the bet is working?",
    accent: "border-safer/40",
    label: "text-safer",
  },
  {
    title: "Key Results — Lagging Indicators",
    aside: "Confirmed value",
    prompt: "What confirms the outcome actually landed?",
    accent: "border-safer/40",
    label: "text-safer",
  },
];

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        One canvas, two versions. The Outcome Canvas is the Sooner Safer Happier
        way to turn a rough ambition into an outcome you can test — and these are
        the same two files used in the{" "}
        <a
          href={QUICK_LEARN_URL}
          target="_blank"
          rel="noreferrer"
          className="font-semibold underline underline-offset-2"
        >
          Outcome Canvas quick learn
        </a>
        , so what you learn there is what you download here.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <div
            key={t.file}
            className="flex flex-col rounded-2xl border border-ink/10 bg-white p-6 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-sooner">
              {t.format}
            </p>
            <h2 className="mt-1 text-lg font-bold">{t.name}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
              {t.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`/templates/${t.file}`}
                download
                className={
                  t.primary
                    ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-chalk hover:bg-ink-soft"
                    : "rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
                }
              >
                Download PDF
              </a>
              <a
                href={`/templates/${t.file}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
              >
                View
              </a>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-bold tracking-tight">What’s on the canvas</h2>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Four boxes around two questions in the middle. The middle is the part
        teams skip and the part that makes the rest honest.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {BOXES.map((b) => (
          <div
            key={b.title}
            className={`rounded-2xl border ${b.accent} bg-white p-6 shadow-sm`}
          >
            <p className={`text-xs font-semibold uppercase tracking-widest ${b.label}`}>
              {b.aside}
            </p>
            <h3 className="mt-1 font-semibold">{b.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{b.prompt}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-ink/10 bg-ink p-6 text-chalk shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-chalk/60">
          At the centre
        </p>
        <ul className="mt-2 space-y-1 text-sm leading-relaxed text-chalk/85">
          <li>Who is the customer, or customer segment?</li>
          <li>What behaviour change are you expecting?</li>
        </ul>
      </div>

      <div className="mt-10 rounded-2xl border border-ink/10 bg-white p-6 text-sm text-ink-soft">
        <h2 className="font-semibold text-ink">How to use it</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Read the worked example, then work the{" "}
            <a href={QUICK_LEARN_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              quick learn
            </a>{" "}
            on the SSH site.
          </li>
          <li>Fill the blank canvas in with the team — problem first, never the solution.</li>
          <li>
            Pressure-test the draft with a{" "}
            <Link href="/skills" className="underline underline-offset-2">
              skill
            </Link>
            : <code>outcome-vs-output-check</code> will tell you if your outcome is
            really an output wearing a nicer word.
          </li>
        </ol>
      </div>

      <div className="mt-10 rounded-2xl bg-ink px-6 py-8 text-chalk">
        <p className="text-xs font-semibold uppercase tracking-widest text-chalk/60">
          Attribution
        </p>
        <p className="mt-2 text-sm leading-relaxed text-chalk/80">
          The Outcome Canvas is the work of{" "}
          <a
            href={SSH_URL}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline underline-offset-2"
          >
            Sooner Safer Happier
          </a>
          . Both files here are the PDFs SSH publishes for the{" "}
          <a
            href={QUICK_LEARN_URL}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Outcome Canvas quick learn
          </a>{" "}
          — shared with the community’s thanks, not recreated — and the canvas, its
          structure and its wording remain © Sooner Safer Happier. Keep the credit
          with it if you adapt or reshare it, as{" "}
          <Link href="/principles" className="underline underline-offset-2">
            our principles
          </Link>{" "}
          ask.
        </p>
      </div>
    </div>
  );
}
