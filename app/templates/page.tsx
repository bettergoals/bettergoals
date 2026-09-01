import Link from "next/link";
import { REPO_URL } from "@/lib/config";
import { getTemplates } from "@/lib/templates";

export const metadata = {
  title: "Templates",
  description:
    "Starter templates for outcome hypotheses, OKRs and goal one-pagers — with worked examples from the Sooner Safer Happier community.",
};

export default async function TemplatesPage() {
  const templates = await getTemplates();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        A better starting point than a blank page — or last quarter’s
        copy-paste. Each template is a fill-in canvas plus worked examples from
        this community, aligned to better value, sooner, safer, happier. Copy
        one into your planning doc, or download the markdown. New to this? The{" "}
        <Link href="/okrs" className="font-semibold underline underline-offset-2">
          OKR framework
        </Link>{" "}
        explains the thinking behind these.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {templates.map((t) => (
          <div
            key={t.slug}
            className="flex flex-col rounded-2xl border border-ink/10 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest">
              {t.format && <span className="text-sooner">{t.format}</span>}
              {t.time && <span className="text-ink-soft/70">· {t.time}</span>}
            </div>
            <h2 className="mt-1 text-lg font-bold">
              <Link href={`/templates/${t.slug}`} className="hover:underline underline-offset-4">
                {t.name}
              </Link>
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{t.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/templates/${t.slug}`}
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-chalk hover:bg-ink-soft"
              >
                Open template
              </Link>
              <a
                href={`/templates/${t.file}`}
                download
                className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
              >
                Download .md
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 bg-white p-6 text-sm text-ink-soft">
          <h2 className="font-semibold text-ink">Which one do I need?</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              Start with an <strong>outcome hypothesis</strong> per candidate goal — it
              kills the ones that aren’t outcomes.
            </li>
            <li>
              Turn the survivors into an <strong>OKR set</strong>: one objective, two or
              three key results, guardrails.
            </li>
            <li>
              Write a <strong>goal one-pager</strong> for the version that gets forwarded
              to everyone else.
            </li>
          </ol>
        </div>
        <div className="rounded-2xl border border-safer/40 bg-white p-6 text-sm text-ink-soft">
          <h2 className="font-semibold text-ink">Pair them with a skill</h2>
          <p className="mt-2">
            The <Link href="/skills" className="underline underline-offset-2">Skills</Link> page has
            downloadable coaching skills for Claude. Paste a filled-in template into an
            assistant running <code>outcome-vs-output-check</code> and you get a critique
            of your draft in seconds.
          </p>
          <p className="mt-3">
            Got a template that worked for your team?{" "}
            <a
              href={`${REPO_URL}/tree/main/public/templates`}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              Add a markdown file
            </a>{" "}
            to <code>public/templates/</code> and it appears here.
          </p>
        </div>
      </div>
    </div>
  );
}
