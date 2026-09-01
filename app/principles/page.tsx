import fs from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import { REPO_URL, SITE } from "@/lib/config";

export const metadata = { title: "Principles" };
export const revalidate = 60;

async function getPrinciples(): Promise<string> {
  // Prefer the live file on GitHub so merged edits appear without a redeploy.
  try {
    const headers: Record<string, string> = { Accept: "application/vnd.github.raw+json" };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(
      `https://api.github.com/repos/${SITE.repo}/contents/PRINCIPLES.md`,
      { headers, next: { revalidate: 60 } }
    );
    if (res.ok) return await res.text();
  } catch {
    /* fall through to local copy */
  }
  return fs.readFile(path.join(process.cwd(), "PRINCIPLES.md"), "utf8");
}

export default async function PrinciplesPage() {
  const markdown = await getPrinciples();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="sr-only">Principles</h1>
        <p className="text-sm text-ink-soft">
          Community-owned · propose changes via pull request
        </p>
        <a
          href={`${REPO_URL}/edit/main/PRINCIPLES.md`}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
        >
          ✏️ Suggest an edit
        </a>
      </div>
      <article className="prose-headings:font-bold prose-headings:tracking-tight [&_a]:underline [&_a]:underline-offset-2 [&_h1]:text-3xl [&_h2]:mt-8 [&_h2]:text-xl [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-ink-soft">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </article>
    </div>
  );
}
