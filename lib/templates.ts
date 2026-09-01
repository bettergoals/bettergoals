import fs from "node:fs/promises";
import path from "node:path";

export type Template = {
  /** filename without extension — the URL slug */
  slug: string;
  /** filename as served from /public, e.g. okr-set.md */
  file: string;
  name: string;
  description: string;
  /** e.g. "Fill-in canvas" */
  format: string;
  /** e.g. "20 minutes with the team" */
  time: string;
  /** the markdown body, frontmatter removed */
  body: string;
  /** first fenced code block — the fill-in part people copy */
  fillIn: string;
};

const DIR = path.join(process.cwd(), "public", "templates");

/** Order on the page: the group canvas, then the hypothesis, then the artefacts it feeds. */
const ORDER = ["outcome-canvas", "outcome-hypothesis", "okr-set", "goal-one-pager"];

function field(frontmatter: string, key: string): string {
  return new RegExp(`^${key}:\\s*(.+)$`, "m").exec(frontmatter)?.[1]?.trim() ?? "";
}

function parse(file: string, raw: string): Template {
  const slug = file.replace(/\.md$/, "");
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  const frontmatter = match?.[1] ?? "";
  const body = match ? raw.slice(match[0].length).trimStart() : raw;
  return {
    slug,
    file,
    name: field(frontmatter, "name") || slug,
    description: field(frontmatter, "description"),
    format: field(frontmatter, "format"),
    time: field(frontmatter, "time"),
    body,
    fillIn: /```[a-z]*\n([\s\S]*?)```/.exec(body)?.[1]?.trimEnd() ?? "",
  };
}

export async function getTemplates(): Promise<Template[]> {
  const files = (await fs.readdir(DIR)).filter((f) => f.endsWith(".md"));
  const templates = await Promise.all(
    files.map(async (file) => parse(file, await fs.readFile(path.join(DIR, file), "utf8")))
  );
  return templates.sort((a, b) => {
    const ai = ORDER.indexOf(a.slug);
    const bi = ORDER.indexOf(b.slug);
    if (ai !== bi) return (ai < 0 ? ORDER.length : ai) - (bi < 0 ? ORDER.length : bi);
    return a.name.localeCompare(b.name);
  });
}

export async function getTemplate(slug: string): Promise<Template | null> {
  const templates = await getTemplates();
  return templates.find((t) => t.slug === slug) ?? null;
}
