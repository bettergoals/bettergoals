import Link from "next/link";
import { JamRoom } from "./JamRoom";

export const metadata = {
  title: "Goal jam",
  description:
    "A voice coach for goal-setting sessions: it listens to the room, asks the questions that sharpen a goal — by name — and chalks the emerging outcome onto a live shared board.",
};

export default async function JamPage({ searchParams }: { searchParams: Promise<{ view?: string | string[] }> }) {
  const { view } = await searchParams;
  const boardOnly = (Array.isArray(view) ? view[0] : view) === "board";
  const configured = Boolean(process.env.OPENAI_API_KEY);

  if (boardOnly) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <JamRoom configured={configured} boardOnly />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-ink-soft">
        <Link href="/coach" className="underline underline-offset-2">Outcome Coach</Link> · Goal jam
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Talk it through. Watch the goal appear.</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        A voice coach for goal-setting sessions. Put this page on the room&rsquo;s screen and talk. The coach
        listens, asks the questions that turn an ambition into an outcome — inviting quieter voices in by name —
        and chalks the emerging goal onto the board as you go. The board is the artefact; the conversation is
        the work.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-ink-soft">
        Your audio streams to OpenAI&rsquo;s Realtime API for the length of the session and this site keeps
        none of it — no recording, no transcript, no board — see{" "}
        <Link href="/privacy" className="underline underline-offset-2">privacy</Link>. Copy the board before you
        close the tab.
      </p>

      <JamRoom configured={configured} boardOnly={false} />

      <section className="mt-14 rounded-2xl border border-ink/10 bg-white p-6 text-sm leading-relaxed text-ink-soft">
        <h2 className="font-semibold text-ink">Running a good jam</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>One laptop, one microphone, the board on the big screen. Give the coach first names so it can call on people.</li>
          <li>Start with the change you want in the world, not the thing you want to build. The coach will push back on outputs dressed as outcomes.</li>
          <li>Aim to leave with one to three goals in the form <em>For [who], [what gets better], seen by [early signal]</em>, each with a guardrail.</li>
          <li>Anyone can rub an item off the board. Copy it as markdown when you&rsquo;re done — nothing is saved for you.</li>
        </ol>
        <p className="mt-3">
          If you&rsquo;ve set up{" "}
          <Link href="/context" className="underline underline-offset-2">
            your context
          </Link>{" "}
          on this browser, the coach starts the session already speaking your language — your acronyms, your
          cadence, the words your organisation avoids — instead of making the room explain itself out loud.
          Nothing about it is stored here either.
        </p>
        <p className="mt-3">
          Prefer to work a single goal in writing? That&rsquo;s the{" "}
          <Link href="/coach" className="underline underline-offset-2">Outcome Coach</Link>. Running the session
          yourself? Download the{" "}
          <Link href="/skills" className="underline underline-offset-2">goal-jam-facilitator skill</Link>.
        </p>
      </section>
    </div>
  );
}
