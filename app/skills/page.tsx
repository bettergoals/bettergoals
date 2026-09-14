import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { REPO_URL } from "@/lib/config";
import {
  broughtInWords,
  carryBackPrompt,
  readCarryBack,
  skillFor,
  type CarryBack,
} from "@/lib/handover";

export const metadata = { title: "Skills" };

type SkillMeta = { file: string; name: string; description: string };

async function getSkills(): Promise<SkillMeta[]> {
  const dir = path.join(process.cwd(), "public", "skills");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md"));
  const skills: SkillMeta[] = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(dir, file), "utf8");
    const name = /^name:\s*(.+)$/m.exec(raw)?.[1]?.trim() ?? file.replace(/\.md$/, "");
    const description = /^description:\s*(.+)$/m.exec(raw)?.[1]?.trim() ?? "";
    skills.push({ file, name, description });
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * CARD 3 — where the can't-share off-ramp lands.
 *
 * Slide 7 of `docs/reference/voice-coach-deck.md` points the "no" answer at
 * step 04 here and deliberately doesn't redraw the screen: skill download →
 * where to install it → the prompt to carry back. The first two were already on
 * this page. This adds the third, and puts the three in the deck's order for
 * whoever arrives from the column.
 *
 * It only appears for an arrival (`?carry=1`). Browsing to /skills is unchanged
 * — this is a handover, not a new front door.
 *
 * Numbered one to three because they're instructions to follow in order, which
 * is the one thing rule 5 is not about: there is nothing here reporting how far
 * through a conversation anybody is.
 */
function CarryBackPanel({ arrival }: { arrival: CarryBack }) {
  const skill = skillFor(arrival.who);
  const prompt = carryBackPrompt(arrival);

  return (
    <section
      id="carry-back"
      aria-labelledby="carry-back-heading"
      className="mb-12 scroll-mt-24 rounded-3xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8"
    >
      <h1 id="carry-back-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
        Take it back in with you
      </h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        {arrival.brought
          ? `You brought ${broughtInWords(arrival.brought)} and it stays where it is. `
          : "Whatever you're working on stays where it is. "}
        Three things and you&rsquo;re running the same conversation inside your own walls — the same
        five boxes, the same questions, in a place we never see.
      </p>

      <ol className="mt-6 space-y-6">
        <li>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-soft/80">
            <span aria-hidden>1 · </span>The skill
          </h2>
          <p className="mt-2 font-mono text-lg font-bold text-sooner">{skill.name}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`/skills/${skill.file}`}
              download
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-chalk hover:bg-ink-soft"
            >
              Download .md
            </a>
            <a
              href={`/skills/${skill.file}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
            >
              View
            </a>
          </div>
        </li>

        <li>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-soft/80">
            <span aria-hidden>2 · </span>Where it goes
          </h2>
          <p className="mt-2 text-ink-soft">
            In Claude Code, save it as{" "}
            <code className="break-all font-mono text-sm">
              ~/.claude/skills/{skill.name}/SKILL.md
            </code>
            . In the
            Claude app, paste it into a project&rsquo;s instructions or attach it to a chat. Same for
            any assistant your organisation has already approved — it&rsquo;s a markdown file, not an
            integration.
          </p>
        </li>

        <li>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-soft/80">
            <span aria-hidden>3 · </span>The prompt to carry back
          </h2>
          <p className="mt-2 text-ink-soft">
            Paste this after the skill. It already knows what you told me out here, which is all it
            ever needed to know.
          </p>
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-ink/[0.04] p-4 font-mono text-xs leading-relaxed text-ink">
            {prompt}
          </pre>
          <div className="mt-3">
            <CopyButton text={prompt} label="Copy the prompt" />
          </div>
        </li>
      </ol>

      <p className="mt-6 border-t border-ink/10 pt-4 text-sm text-ink-soft">
        Take it now — there&rsquo;s no account here and no database, so closing the tab ends it. The
        rest of the shelf is below, and{" "}
        <Link href="/coach/entry" className="underline underline-offset-2">
          the conversation out here
        </Link>{" "}
        is still open if you ever want to run one on something you can share.
      </p>
    </section>
  );
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const skills = await getSkills();
  const arrival = readCarryBack(await searchParams);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {arrival ? <CarryBackPanel arrival={arrival} /> : null}
      {/* Arriving from the off-ramp, the handover is what the page is and the
          shelf is what's underneath it — so the two headings swap rank rather
          than the page carrying two h1s. */}
      {arrival ? (
        <h2 className="text-3xl font-bold tracking-tight">Skills</h2>
      ) : (
        <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
      )}
      <p className="mt-2 max-w-2xl text-ink-soft">
        Downloadable skills for Claude (and other AI assistants) created by this
        community. Drop one into your assistant and it becomes a better-goals
        coach, checker, or facilitator. Point one at a filled-in{" "}
        <Link href="/templates" className="underline underline-offset-2">
          Outcome Canvas
        </Link>{" "}
        for a critique of your draft. Contribute your own via{" "}
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2">
          GitHub
        </a>
        .
      </p>
      <p className="mt-3 max-w-2xl text-sm text-ink-soft">
        The coaching these skills give you follows{" "}
        <Link href="/okrs" className="underline underline-offset-2">
          the SSH OKR Pattern
        </Link>
        . Want a first read without leaving the site? The{" "}
        <Link href="/coach" className="underline underline-offset-2">
          Outcome Coach
        </Link>{" "}
        scores a draft in seconds and hands you a prompt to continue with. Need to bring your boss,
        your PMO or your peers along?{" "}
        <Link href="/teach" className="underline underline-offset-2">
          Teach outcomes
        </Link>{" "}
        is the conversation guide that goes with the{" "}
        <code className="font-mono">teaching-outcomes-to-others</code> skill below.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {skills.map((s) => (
          <div key={s.file} className="flex flex-col rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
            <h2 className="font-mono text-lg font-bold text-sooner">{s.name}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{s.description}</p>
            <div className="mt-4 flex gap-2">
              <a
                href={`/skills/${s.file}`}
                download
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-chalk hover:bg-ink-soft"
              >
                Download .md
              </a>
              <a
                href={`/skills/${s.file}`}
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
      <div className="mt-10 rounded-2xl border border-ink/10 bg-white p-6 text-sm text-ink-soft">
        <h2 className="font-semibold text-ink">How to use a skill</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Download the <code>.md</code> file.</li>
          <li>
            In Claude Code: save it to <code>~/.claude/skills/&lt;name&gt;/SKILL.md</code>. In the
            Claude app: paste it into a project’s instructions or attach it to a chat.
          </li>
          <li>Ask Claude to help with a goal — the skill guides the coaching.</li>
        </ol>
      </div>
    </div>
  );
}
