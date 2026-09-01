import { NEW_IDEA_URL, REPO_URL, SITE } from "@/lib/config";

export const metadata = { title: "Contribute" };

export default function ContributePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Contribute</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Everything here is community-built. Pick your lane — both end up in the
        same place: the ideas board.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-sooner/40 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-sooner">New to GitHub?</p>
          <h2 className="mt-1 text-xl font-bold">The two-minute path</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink-soft">
            <li>
              <a href="https://github.com/signup" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
                Create a free GitHub account
              </a>{" "}
              (email + username, ~60 seconds).
            </li>
            <li>
              <a href={NEW_IDEA_URL} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
                Open the idea form
              </a>{" "}
              and describe your idea — content, a feature, a question, a provocation. Plain language is perfect.
            </li>
            <li>Hit <strong>Submit new issue</strong>. Your idea appears on the board within seconds.</li>
            <li>
              Vote for ideas you'd endorse: open any card and click the <strong>👍</strong> reaction under
              the description. Comment to shape it.
            </li>
          </ol>
        </section>

        <section className="rounded-2xl border border-safer/40 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-safer">Advanced</p>
          <h2 className="mt-1 text-xl font-bold">Build it yourself</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-ink-soft">
            <li>
              Fork{" "}
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
                {SITE.repo}
              </a>{" "}
              and open a pull request — every PR gets an automatic preview deployment.
            </li>
            <li>
              Contribute a downloadable <strong>skill</strong>: add a markdown file to{" "}
              <code>public/skills/</code> and it appears on the Skills page.
            </li>
            <li>
              Propose changes to the <strong>principles</strong> by editing <code>PRINCIPLES.md</code>.
            </li>
            <li>
              Go big: suggest and build an integration — e.g. an ElevenLabs voice agent that coaches
              goal-writing while sketching on a live chalkboard for group jam sessions. Pitch it as an
              idea first so the group can endorse it.
            </li>
          </ul>
        </section>
      </div>

      <section className="mt-8 rounded-2xl bg-ink p-6 text-chalk sm:p-8">
        <h2 className="text-xl font-bold">What happens when an idea is endorsed?</h2>
        <p className="mt-3 text-sm leading-relaxed text-chalk/80">
          When the group endorses an idea (3+ 👍) and a maintainer moves it to <strong>Doing</strong>{" "}
          (by adding the <code>doing</code> label), Claude Code picks it up automatically: it reads the
          issue, builds the feature into this site, and opens a pull request with a preview link posted
          back on the issue. The community reviews the preview together — and merging ships it to
          production at {SITE.url.replace("https://", "")}. Humans endorse; AI accelerates; humans ship.
        </p>
      </section>
    </div>
  );
}
