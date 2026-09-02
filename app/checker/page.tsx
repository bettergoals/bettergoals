import Link from "next/link";
import GoalChecker from "@/components/GoalChecker";

export const metadata = {
  title: "Outcome vs output checker",
  description:
    "Paste a goal and get an honest 30-second read: is it an outcome or an output, does it name a customer, and could you see early signal in weeks?",
};

const CAN_SEE = [
  "Whether anyone is named — and whether they are a category or a person you could picture.",
  "Whether a measure moves, and whether it has a baseline as well as a target.",
  "Whether there is a by-when, and how far out it is.",
  "Whether a guardrail is present, and whether the measure looks easy to game.",
  "Whether the language is plain enough that a team would rally around it.",
];

const CANNOT_SEE = [
  "Whether this is the right goal. A beautifully-shaped goal can still be the wrong bet.",
  "Whether the measure you chose is the one that matters to the customer.",
  "Whether the number is achievable, or whether anyone believes it.",
  "Context it has no way of knowing — your market, your constraints, last quarter.",
];

export default async function CheckerPage({
  searchParams,
}: {
  searchParams: Promise<{ goal?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.goal) ? params.goal[0] : params.goal;
  const goal = (raw ?? "").slice(0, 1200);

  return (
    <div>
      <section className="bg-ink text-chalk">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-chalk/60">
            A 30-second sparring partner
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Outcome, or output?
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-chalk/80">
            Paste a goal before it goes in front of the team. You’ll get a
            verdict, a score on the five things that make a goal better, and the
            one question you most need to answer — from the same five dimensions
            as the{" "}
            <Link href="/skills" className="font-semibold underline underline-offset-2">
              outcome-vs-output-check skill
            </Link>
            .
          </p>
          <p className="mt-4 max-w-2xl text-sm text-chalk/60">
            Be warned: most goals people paste are outputs. That’s the point.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10">
        {/* Keyed on the goal so a shared ?goal= link, or an example link, remounts
            with the right starting text. */}
        <GoalChecker key={goal} initialGoal={goal} />
      </section>

      <section className="border-t border-ink/10 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-soft/70">
            Read the small print
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            This is a pattern check, not a judgement
          </h2>
          <p className="mt-3 max-w-2xl text-ink-soft">
            No model, no API call, no data leaving your browser — just the
            patterns that separate outcomes from outputs, applied honestly and
            fast. Treat a low score as a prompt to think again, never as a
            verdict on your work.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-sooner/40 bg-chalk p-6">
              <h3 className="font-bold text-sooner">What it can see</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
                {CAN_SEE.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-ink/15 bg-chalk p-6">
              <h3 className="font-bold text-ink-soft">What it can’t</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
                {CANNOT_SEE.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-8 text-ink-soft">
            Happy with the shape and want to write the whole thing?{" "}
            <Link href="/templates/outcome-hypothesis" className="font-semibold underline underline-offset-2">
              Take the outcome hypothesis template
            </Link>
            . Want the thinking behind the five dimensions?{" "}
            <Link href="/okrs" className="font-semibold underline underline-offset-2">
              Read the OKR framework
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
