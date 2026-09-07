import fs from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import { REPO_URL, SITE } from "@/lib/config";

export const metadata = { title: "Principles" };
export const revalidate = 60;

async function getPrinciples(): Promise<string> {
  // In production, prefer the live file on GitHub so merged edits appear
  // without a redeploy. Everywhere else (previews, dev) use the checked-out
  // copy, so a PR that edits PRINCIPLES.md is reviewable on its preview URL —
  // the GitHub API reads the default branch, not this branch.
  if (process.env.VERCEL_ENV === "production") {
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
  }
  return fs.readFile(path.join(process.cwd(), "PRINCIPLES.md"), "utf8");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

type Section = { title: string; slug: string; body: string };

/**
 * Splits PRINCIPLES.md into the intro and one section per `##` framing
 * (Guardrails, AI Outcome Coach, Outcome Definition). Falls back gracefully
 * to a single unnamed section if the community restructures the file.
 */
function parsePrinciples(markdown: string): { intro: string; sections: Section[] } {
  const lines = markdown.split("\n");
  const introLines: string[] = [];
  const sections: Section[] = [];

  for (const line of lines) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      const title = heading[1];
      sections.push({ title, slug: slugify(title), body: "" });
    } else if (sections.length > 0) {
      sections[sections.length - 1].body += `${line}\n`;
    } else {
      introLines.push(line);
    }
  }

  return { intro: introLines.join("\n").trim(), sections };
}

/**
 * One accent per framing, cycling if the community adds more sections.
 * Class names are written in full so Tailwind's scanner picks them up.
 */
const ACCENTS = [
  {
    text: "text-sooner",
    border: "border-sooner/40",
    dot: "bg-sooner",
    rule: "[&_h3]:border-sooner/40",
  },
  {
    text: "text-safer",
    border: "border-safer/40",
    dot: "bg-safer",
    rule: "[&_h3]:border-safer/40",
  },
  {
    text: "text-happier",
    border: "border-happier/40",
    dot: "bg-happier",
    rule: "[&_h3]:border-happier/40",
  },
];

export default async function PrinciplesPage() {
  const markdown = await getPrinciples();
  const { intro, sections } = parsePrinciples(markdown);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
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

      <article className="[&_a]:underline [&_a]:underline-offset-2 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-ink-soft">
        <ReactMarkdown>{intro}</ReactMarkdown>
      </article>

      {sections.length > 1 && (
        <nav aria-label="Principle framings" className="mt-8 flex flex-wrap gap-2">
          {sections.map((section, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <a
                key={section.slug}
                href={`#${section.slug}`}
                className={`flex items-center gap-2 rounded-full border ${accent.border} bg-white px-4 py-2 text-sm font-semibold hover:bg-ink/5`}
              >
                <span className={`h-2 w-2 rounded-full ${accent.dot}`} aria-hidden="true" />
                {section.title}
              </a>
            );
          })}
        </nav>
      )}

      {sections.map((section, i) => {
        const accent = ACCENTS[i % ACCENTS.length];
        return (
          <section
            key={section.slug}
            id={section.slug}
            className="mt-10 scroll-mt-8 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8"
          >
            <h2 className={`text-xl font-bold tracking-tight ${accent.text}`}>{section.title}</h2>
            <div
              className={`[&_a]:underline [&_a]:underline-offset-2 [&_h3]:mt-6 [&_h3]:border-l-2 [&_h3]:pl-3 [&_h3]:font-bold [&_h3]:tracking-tight ${accent.rule} [&_p]:mt-2 [&_p]:leading-relaxed [&_p]:text-ink-soft [&_p:first-child]:mt-0`}
            >
              <ReactMarkdown>{section.body.trim()}</ReactMarkdown>
            </div>
          </section>
        );
      })}
    </div>
  );
}
