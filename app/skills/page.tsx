import fs from "node:fs/promises";
import path from "node:path";
import { REPO_URL } from "@/lib/config";

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

export default async function SkillsPage() {
  const skills = await getSkills();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Downloadable skills for Claude (and other AI assistants) created by this
        community. Drop one into your assistant and it becomes a better-goals
        coach, checker, or facilitator. Contribute your own via{" "}
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2">
          GitHub
        </a>
        .
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
