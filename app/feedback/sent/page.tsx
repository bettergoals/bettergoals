import Link from "next/link";
import { NEW_IDEA_URL } from "@/lib/config";

export const metadata = {
  title: "Thanks for the feedback",
  description: "Your feedback reached the people who build bettergoals.ai.",
  robots: { index: false },
};

export default function FeedbackSentPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-xs font-bold uppercase tracking-widest text-sooner">Sent</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Thank you — that landed.</h1>
      <p className="mt-4 text-lg text-ink-soft">
        Your answers went to the people who build this site. No account, no
        follow-up email, nothing else taken from your visit.
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border border-ink/10 bg-chalk p-6 text-sm leading-relaxed text-ink-soft">
        <p>
          <strong className="block text-ink">What happens next</strong>
          We read everything. The themes that come up more than once turn into
          ideas the community can endorse and build, and blunt feedback moves
          faster than polite feedback — so thank you for the sharp bits.
        </p>
        <p>
          <strong className="block text-ink">If you left contact details</strong>
          Someone may reply. If you left them blank, this is genuinely anonymous
          and we have no way to reach you — which is fine, the feedback counts the
          same.
        </p>
        <p>
          <strong className="block text-ink">Changed your mind?</strong>
          Email whoever invited you, or open an issue on the repository, and we
          will delete it. Nothing here is public unless you post it yourself.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          href="/"
          className="rounded-full bg-ink px-6 py-3 font-semibold text-chalk hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Back to the site
        </Link>
        <a
          href={NEW_IDEA_URL}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold underline underline-offset-2"
        >
          Propose it as an idea instead ↗
        </a>
        <Link href="/feedback" className="text-sm font-semibold underline underline-offset-2">
          Send more feedback
        </Link>
      </div>
    </div>
  );
}
