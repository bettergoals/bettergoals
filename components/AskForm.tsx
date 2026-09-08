import Link from "next/link";
import { EXAMPLE_ASKS } from "@/lib/askRouter";
import { MAX_INPUT_LENGTH } from "@/lib/outcomeCoach";

/**
 * The front door: one box, one question, no reading required.
 *
 * A plain GET form to /start, so it works with no JavaScript at all, and the
 * examples are ordinary links that pre-fill the same page. Two tones because it
 * sits on the dark hero and again, in light, on the answer page.
 */
export function AskForm({
  tone = "dark",
  defaultValue = "",
  label = "What are you trying to achieve?",
  submitLabel = "Show me what to do next",
  showExamples = true,
  autoFocus = false,
}: {
  tone?: "dark" | "light";
  defaultValue?: string;
  label?: string;
  submitLabel?: string;
  showExamples?: boolean;
  autoFocus?: boolean;
}) {
  const dark = tone === "dark";

  return (
    <div>
      <form action="/start" method="get">
        <label htmlFor="q" className={`block font-semibold ${dark ? "text-chalk" : ""}`}>
          {label}
        </label>
        <textarea
          id="q"
          name="q"
          rows={4}
          maxLength={MAX_INPUT_LENGTH}
          autoFocus={autoFocus}
          defaultValue={defaultValue}
          aria-describedby="q-hint"
          placeholder="e.g. I have a high level goal, help me structure this as OKRs — or paste the goal itself, however rough"
          className={`mt-3 w-full rounded-2xl p-4 font-sans text-base leading-relaxed shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 ${
            dark
              ? "border border-chalk/25 bg-chalk/10 text-chalk placeholder:text-chalk/50 focus-visible:outline-sooner"
              : "border border-ink/15 bg-white text-ink placeholder:text-ink-soft/70 focus-visible:outline-ink"
          }`}
        />
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="submit"
            className={`rounded-full px-6 py-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 ${
              dark
                ? "bg-sooner text-ink hover:bg-sooner/90 focus-visible:outline-chalk"
                : "bg-ink text-chalk hover:bg-ink-soft focus-visible:outline-ink"
            }`}
          >
            {submitLabel} →
          </button>
          <p id="q-hint" className={`max-w-md text-sm ${dark ? "text-chalk/60" : "text-ink-soft"}`}>
            One sentence is plenty. Nothing is saved, but your words travel in the page address — so
            leave confidential detail out.
          </p>
        </div>
      </form>

      {showExamples && (
        <div className="mt-8">
          <p className={`text-sm font-semibold ${dark ? "text-chalk/70" : "text-ink-soft"}`}>
            Or start from one of these
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {EXAMPLE_ASKS.map((ask) => (
              <li key={ask}>
                <Link
                  href={`/start?q=${encodeURIComponent(ask)}`}
                  className={`inline-block rounded-full px-4 py-2 text-sm ${
                    dark
                      ? "border border-chalk/25 text-chalk/90 hover:bg-chalk/10"
                      : "border border-ink/15 bg-white shadow-sm hover:bg-ink/5"
                  }`}
                >
                  “{ask}”
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
