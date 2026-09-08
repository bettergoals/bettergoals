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
      "No newsletter, no “enter your email to download” — every template and skill downloads straight away. The feedback form asks for contact details only as an optional field you can leave blank.",
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
        When you send feedback
      </h2>
      <p className="mt-3 leading-relaxed text-ink-soft">
        The{" "}
        <Link href="/feedback" className="underline underline-offset-2">
          feedback form
        </Link>{" "}
        has no server behind it. Your answers travel in the page address so the page
        can show you a summary, and the last tap posts that summary to GitHub from
        your own browser — we never receive it, and there is nowhere here for it to
        be stored. Every question is optional, none of them asks who you are, and
        the contact field is yours to leave blank; copying the summary and pasting it
        elsewhere sends it with no identity attached at all.
      </p>

      <h2 className="mt-12 text-2xl font-bold tracking-tight">
        When the coach helps with a goal
      </h2>
      <p className="mt-3 leading-relaxed text-ink-soft">
        The{" "}
        <Link href="/skills" className="underline underline-offset-2">
          coaching skills
        </Link>{" "}
        you download run inside your own AI assistant — nothing comes back here.
        They are written to refuse personal information: they never ask for
        names, contact details, or individual performance or health data, and if
        you paste some anyway they say so, swap it for the role, and carry on
        without it. Coaching a goal never requires knowing who someone is, and
        goals aimed at outcomes rarely name a person.
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
