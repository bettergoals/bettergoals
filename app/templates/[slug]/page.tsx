import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import CopyButton from "@/components/CopyButton";
import { getTemplate, getTemplates } from "@/lib/templates";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const templates = await getTemplates();
  return templates.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props) {
  const template = await getTemplate((await params).slug);
  if (!template) return { title: "Template not found" };
  return { title: template.name, description: template.description };
}

/** The body already opens with an h1 matching the frontmatter name. */
function stripLeadingHeading(body: string) {
  return body.replace(/^#\s+.+\n+/, "");
}

const PROSE = [
  "[&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight",
  "[&_h3]:mt-6 [&_h3]:font-semibold",
  "[&_p]:mt-4 [&_p]:leading-relaxed [&_p]:text-ink-soft",
  "[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:text-ink-soft",
  "[&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol]:text-ink-soft",
  "[&_li]:leading-relaxed",
  "[&_strong]:font-semibold [&_strong]:text-ink",
  "[&_a]:underline [&_a]:underline-offset-2",
  "[&_blockquote]:mt-4 [&_blockquote]:rounded-2xl [&_blockquote]:border [&_blockquote]:border-sooner/30 [&_blockquote]:bg-sooner/5 [&_blockquote]:px-5 [&_blockquote]:py-1 [&_blockquote]:pb-4",
  "[&_pre]:mt-4 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-ink [&_pre]:p-5 [&_pre]:text-sm [&_pre]:leading-relaxed [&_pre]:text-chalk",
  "[&_code]:font-mono [&_code]:text-[0.9em]",
  "[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-ink/5 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5",
].join(" ");

export default async function TemplatePage({ params }: Props) {
  const { slug } = await params;
  const [template, all] = await Promise.all([getTemplate(slug), getTemplates()]);
  if (!template) notFound();
  const others = all.filter((t) => t.slug !== template.slug);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/templates" className="text-sm font-semibold text-ink-soft hover:underline underline-offset-4">
        ← All templates
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest">
        {template.format && <span className="text-sooner">{template.format}</span>}
        {template.time && <span className="text-ink-soft/70">· {template.time}</span>}
      </div>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{template.name}</h1>
      <p className="mt-3 text-ink-soft">{template.description}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {template.fillIn && <CopyButton text={template.fillIn} label="Copy the fill-in template" />}
        <a
          href={`/templates/${template.file}`}
          download
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
        >
          Download .md
        </a>
      </div>

      <article className={`mt-8 ${PROSE}`}>
        <ReactMarkdown>{stripLeadingHeading(template.body)}</ReactMarkdown>
      </article>

      {others.length > 0 && (
        <div className="mt-12 border-t border-ink/10 pt-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-ink-soft">
            Other templates
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {others.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/templates/${t.slug}`}
                  className="block rounded-2xl border border-ink/10 bg-white p-4 shadow-sm hover:border-ink/25"
                >
                  <span className="font-semibold">{t.name}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                    {t.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
