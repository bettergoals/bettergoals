import Link from "next/link";
import { BUILD_URL, NEW_IDEA_URL, REPO_URL } from "@/lib/config";

export const metadata = {
  title: "Privacy",
  description:
    "bettergoals.ai refuses to collect or store personal information: no accounts, no analytics, no tracking cookies, no database.",
};

/** Things a site like this usually collects, and what we do instead. */
const NOT_COLLECTED = [
  {
    thing: "Accounts and passwords",
    detail:
      "There is nothing to sign up for on this site, so there is no user record to hold, breach or delete.",
  },
  {
    thing: "Analytics and tracking",
    detail:
      "No analytics scripts, no advertising or tracking cookies, no fingerprinting. We don’t know who visited, or which pages you read.",
  },
  {
    thing: "Contact and mailing details",
    detail:
      "No contact forms, no newsletter, no “enter your email to download”. Every template and skill downloads straight away.",
  },
  {
    thing: "A database",
    detail:
      "There isn’t one. Content is markdown files in the repository; ideas are GitHub issues. Nothing about you is stored server-side.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
      <p className="mt-3 text-lg text-ink-soft">
        This tool refuses to collect or store personal information. Not “we
        handle it carefully” — we don’t take it in the first place. The safest
        place for your data is somewhere it was never collected.
      </p>

      <h2 className="mt-10 text-2xl font-bold tracking-tight">
        What this site doesn’t collect
      </h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {NOT_COLLECTED.map((item) => (
          <li
            key={item.thing}
            className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm"
          >
            <h3 className="font-semibold">
              <span aria-hidden="true" className="mr-2 text-sooner">
                ✕
              </span>
              {item.thing}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {item.detail}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-ink-soft">
        Pages are served by Vercel, which keeps short-lived operational request
        logs (including IP addresses) to run and protect the servers, as any web
        host does. We don’t read them for analytics and we add nothing to them.
      </p>

      <h2 className="mt-12 text-2xl font-bold tracking-tight">
        When you contribute
      </h2>
      <p className="mt-3 leading-relaxed text-ink-soft">
        Ideas, comments and endorsements live as{" "}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          GitHub issues
        </a>
        , under your own GitHub account and GitHub’s privacy terms — not ours.
        That means everything you contribute is public, attributed to your
        GitHub name or display name, and yours to edit or delete. We hold no
        copy of your profile.
      </p>
      <p className="mt-3 leading-relaxed text-ink-soft">
        The{" "}
        <a
          href={BUILD_URL}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          ideas board
        </a>{" "}
        is a separate app. Moving a card asks for a shared facilitator passcode,
        held in a cookie in your own browser for 12 hours — it identifies the
        workshop, not you.
      </p>

      <h2 className="mt-12 text-2xl font-bold tracking-tight">
        When the coach helps with a goal
      </h2>
      <p className="mt-3 leading-relaxed text-ink-soft">
        The{" "}
        <Link href="/coach" className="underline underline-offset-2">
          Outcome Coach
        </Link>{" "}
        on this site sends the goal you paste, and any answers you give it, to
        an AI model through Vercel&rsquo;s AI Gateway to write the review. That
        is the one place text you type leaves this site. We store none of it:
        there is no database and no account, and the conversation exists only
        on the page in front of you until you leave it. The model provider
        processes the text to generate the reply, under{" "}
        <a
          href="https://vercel.com/docs/ai-gateway"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          Vercel&rsquo;s AI Gateway terms
        </a>
        . Anonymise anything sensitive before you paste it &mdash; the coaching
        is just as good on a redacted version. If the AI coach isn&rsquo;t
        switched on for a deployment, the page runs a structural check that
        sends nothing anywhere.
      </p>
      <p className="mt-3 leading-relaxed text-ink-soft">
        The{" "}
        <Link href="/skills" className="underline underline-offset-2">
          coaching skills
        </Link>{" "}
        you download run inside your own AI assistant &mdash; nothing comes back
        here. Both the on-site coach and the skills are written to refuse
        personal information: they never ask for names, contact details, or
        individual performance or health data, and if you paste some anyway
        they say so, swap it for the role, and carry on without it. Coaching a
        goal never requires knowing who someone is, and goals aimed at outcomes
        rarely name a person.
      </p>

      <h2 className="mt-12 text-2xl font-bold tracking-tight">
        Holding us to it
      </h2>
      <p className="mt-3 leading-relaxed text-ink-soft">
        “Refuses personal information” is one of the community{" "}
        <Link href="/principles" className="underline underline-offset-2">
          principles
        </Link>
        , so it is reviewable like anything else here: this site is open source,
        and any feature that would collect personal data has to be argued for in
        public before it ships. If you think something on this site collects
        more than this page claims,{" "}
        <a
          href={NEW_IDEA_URL}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          raise it
        </a>{" "}
        — that challenge is always welcome. Security contact and controls are in{" "}
        <a
          href={`${REPO_URL}/blob/main/SECURITY.md`}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          SECURITY.md
        </a>
        .
      </p>
    </div>
  );
}
