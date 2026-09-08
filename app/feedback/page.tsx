import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import {
  CHOICE_QUESTIONS,
  MAX_CONTACT_LENGTH,
  MAX_TEXT_LENGTH,
  TEXT_QUESTIONS,
  TOTAL_QUESTIONS,
  readFeedback,
  type ChoiceQuestion,
} from "@/lib/feedback";
import { NEW_IDEA_URL } from "@/lib/config";

export const metadata = {
  title: "Give feedback",
  description:
    "Ninety seconds of honest feedback on bettergoals.ai and the Outcome Coach — what worked, what got in your way, and what's missing. Anonymous unless you choose otherwise.",
};

type Params = Record<string, string | string[] | undefined>;

function one(raw: string | string[] | undefined): string {
  return (Array.isArray(raw) ? raw[0] : raw) ?? "";
}

function chosen(raw: string | string[] | undefined): string[] {
  if (Array.isArray(raw)) return raw;
  return raw === undefined ? [] : [raw];
}

const OPTION_CLASS =
  "flex cursor-pointer items-start gap-3 rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm leading-snug shadow-sm hover:bg-ink/5 has-[:checked]:border-ink has-[:checked]:bg-ink/5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink";

function ChoiceField({
  question,
  number,
  params,
}: {
  question: ChoiceQuestion;
  number: number;
  params: Params;
}) {
  const selected = chosen(params[question.id]);
  const hintId = question.hint ? `${question.id}-hint` : undefined;

  return (
    <fieldset
      aria-describedby={hintId}
      className="rounded-2xl border border-ink/10 bg-chalk p-5"
    >
      <legend className="px-1 font-semibold">
        <span className="text-ink-soft">{number}.</span> {question.label}
      </legend>
      {question.hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-soft">
          {question.hint}
        </p>
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {question.options.map((option) => (
          <label key={option} className={OPTION_CLASS}>
            <input
              type={question.type === "many" ? "checkbox" : "radio"}
              name={question.id}
              value={option}
              defaultChecked={selected.includes(option)}
              className="mt-0.5 size-4 shrink-0 accent-ink"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const feedback = readFeedback(params);
  const reviewing = one(params.review) === "1";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Tell us what you think</h1>
      <p className="mt-3 text-lg text-ink-soft">
        A small group built this site. You are the wider community it was built
        for — so the fastest way to make it better is to tell us where it works
        and where it doesn&rsquo;t.
      </p>
      <p className="mt-3 leading-relaxed text-ink-soft">
        About ninety seconds: six taps, and a sentence or two only if you want to
        write one. Every question is optional and you can stay completely
        anonymous. Blunt is more useful than polite — this is a community
        experiment, and &ldquo;fast feedback&rdquo; is the whole point.
      </p>

      {reviewing && !feedback && (
        <div className="mt-8 rounded-2xl border border-happier/40 bg-happier/10 p-6">
          <h2 className="font-bold">Nothing to send yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            The form came back empty. Answer at least one question below — even a
            single tap tells us something.
          </p>
        </div>
      )}

      {reviewing && feedback && (
        <section
          aria-labelledby="ready-heading"
          className="mt-8 rounded-3xl border-2 border-sooner/40 bg-white p-6 shadow-sm sm:p-8"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-sooner">
            Step 2 of 2 · nothing sent yet
          </p>
          <h2 id="ready-heading" className="mt-1 text-2xl font-bold tracking-tight">
            Your feedback is ready to send
          </h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            You get the last word: this is exactly what gets sent, and you can edit
            it before or after it leaves. Sending posts it as a public issue on the
            project&rsquo;s GitHub, where the community reads and replies to it —
            the same place ideas live.
          </p>
          <pre className="mt-5 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-chalk p-4 font-mono text-xs leading-relaxed text-ink-soft">
            {feedback.plainText}
          </pre>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href={feedback.issueUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-ink px-6 py-3 font-semibold text-chalk hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Send it on GitHub ↗
            </a>
            <CopyButton text={feedback.plainText} label="Copy it instead" />
            <a href="#form" className="text-sm font-semibold underline underline-offset-2">
              Change an answer ↓
            </a>
          </div>
          <div className="mt-6 grid gap-4 border-t border-ink/10 pt-5 text-sm leading-relaxed text-ink-soft sm:grid-cols-2">
            <p>
              <strong className="block text-ink">Sending on GitHub</strong>
              GitHub opens with all of this filled in. Press{" "}
              <strong>Submit new issue</strong> and you&rsquo;ll land on your posted
              feedback with a link to it — that page is your confirmation, and you
              can edit or delete it whenever you like. It appears under your GitHub
              name.
            </p>
            <p>
              <strong className="block text-ink">Staying anonymous</strong>
              No GitHub account, or would rather not be named? Copy it and paste it
              wherever suits — an email to whoever invited you, or your community
              channel. Nothing in the copied text says who you are unless you typed
              it in yourself.
            </p>
          </div>
        </section>
      )}

      <form action="/feedback" method="get" id="form" className="mt-10 space-y-4">
        <input type="hidden" name="review" value="1" />
        {reviewing && (
          <h2 className="text-2xl font-bold tracking-tight">Change an answer</h2>
        )}

        {CHOICE_QUESTIONS.map((question, i) => (
          <ChoiceField key={question.id} question={question} number={i + 1} params={params} />
        ))}

        {TEXT_QUESTIONS.map((question, i) => (
          <div key={question.id} className="rounded-2xl border border-ink/10 bg-chalk p-5">
            <label htmlFor={question.id} className="block font-semibold">
              <span className="text-ink-soft">{CHOICE_QUESTIONS.length + i + 1}.</span>{" "}
              {question.label}{" "}
              <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            {question.hint && (
              <p id={`${question.id}-hint`} className="mt-1 text-sm text-ink-soft">
                {question.hint}
              </p>
            )}
            <textarea
              id={question.id}
              name={question.id}
              rows={question.rows}
              maxLength={MAX_TEXT_LENGTH}
              aria-describedby={question.hint ? `${question.id}-hint` : undefined}
              defaultValue={one(params[question.id])}
              placeholder={question.placeholder}
              className="mt-3 w-full rounded-xl border border-ink/15 bg-white p-3 font-sans text-base leading-relaxed shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
          </div>
        ))}

        <div className="rounded-2xl border border-ink/10 bg-chalk p-5">
          <label htmlFor="contact" className="block font-semibold">
            <span className="text-ink-soft">{TOTAL_QUESTIONS + 1}.</span> Happy to be
            asked more? <span className="font-normal text-ink-soft">(optional)</span>
          </label>
          <p id="contact-hint" className="mt-1 text-sm text-ink-soft">
            A first name, email or GitHub handle, if you&rsquo;d like a reply. Leave it
            blank to stay anonymous — the feedback counts exactly the same either way.
          </p>
          <input
            type="text"
            id="contact"
            name="contact"
            maxLength={MAX_CONTACT_LENGTH}
            aria-describedby="contact-hint"
            defaultValue={one(params.contact)}
            placeholder="e.g. Jane, jane@example.com, @janedoe"
            className="mt-3 w-full rounded-xl border border-ink/15 bg-white p-3 text-base shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:max-w-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-sooner px-6 py-3 font-semibold text-ink hover:bg-sooner/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {reviewing ? "Update my feedback →" : "Review my feedback →"}
          </button>
          {reviewing && (
            <Link href="/feedback" className="text-sm font-semibold underline underline-offset-2">
              Start again
            </Link>
          )}
          <p className="text-sm text-ink-soft">
            {reviewing
              ? "Takes you back to the summary above."
              : "Shows you the summary first. Nothing is sent until you say so."}
          </p>
        </div>
      </form>

      <section className="mt-12 rounded-2xl border border-ink/10 bg-white p-6 text-sm leading-relaxed text-ink-soft">
        <h2 className="font-semibold text-ink">Where your answers go, and what we don&rsquo;t keep</h2>
        <p className="mt-2">
          There is no database behind this form and no server here that receives it.
          Your answers travel in the page address so this page can show you the
          summary — the same way the{" "}
          <Link href="/coach" className="underline underline-offset-2">
            Outcome Coach
          </Link>{" "}
          works — and the last tap posts that summary to GitHub from your own browser.
          Web requests are logged by our host, as with any website, so leave
          confidential detail out and anonymise any goal you paste.
        </p>
        <p className="mt-2">
          Feedback becomes a public issue labelled <code>feedback</code>, discussed
          in the open like everything else here, and it may turn into an{" "}
          <a
            href={NEW_IDEA_URL}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            idea on the board
          </a>{" "}
          that the community endorses and builds. Full detail on our{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            privacy page
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
