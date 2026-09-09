"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  readServerContext,
  readStoredContext,
  subscribeContext,
  writeStoredContext,
} from "@/lib/contextStore";
import {
  CONTEXT_FIELDS,
  EMPTY_CONTEXT,
  type ContextFieldId,
  type OrgContext,
  contextFieldName,
  contextFilledCount,
  hasContext,
} from "@/lib/orgContext";

/**
 * The editor for "your context" — the organisation you work in and the role
 * you work from, so the coaching lands in your world rather than a generic one.
 *
 * It renders ordinary named textareas, so wherever it sits inside a form the
 * context posts with that form and the coach works with JavaScript off. With
 * JavaScript on it also reads and writes localStorage, which is the only place
 * this ever lives: there is no account and no database here, so the profile is
 * yours, on this device, and never leaves it except as part of a coach call you
 * asked for.
 */

function Fields({
  context,
  onChange,
}: {
  context: OrgContext;
  onChange: (id: ContextFieldId, value: string) => void;
}) {
  return (
    <div className="space-y-5">
      {CONTEXT_FIELDS.map((field) => {
        const id = `ctx-${field.id}`;
        return (
          <div key={field.id}>
            <label htmlFor={id} className="block font-semibold">
              {field.label}
            </label>
            <p id={`${id}-hint`} className="mt-1 text-sm text-ink-soft">
              {field.hint}
            </p>
            <textarea
              id={id}
              name={contextFieldName(field.id)}
              rows={field.rows}
              maxLength={field.max}
              aria-describedby={`${id}-hint`}
              value={context[field.id]}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="mt-2 w-full rounded-2xl border border-ink/15 bg-white p-3 text-sm leading-relaxed shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
          </div>
        );
      })}
    </div>
  );
}

export function ContextPanel({
  initial,
  variant,
  aiEnabled = true,
}: {
  /** What the server rendered — the values that came back from the last post. */
  initial: OrgContext;
  /** "coach" tucks it into a disclosure beside the draft; "page" lays it out in full. */
  variant: "coach" | "page";
  /**
   * Whether the AI coach can run here. When it can't, the page is running the
   * structural check — which reads words, not meaning — so the context changes
   * nothing about the score and only travels into the prompt you copy. Saying
   * so beats letting someone fill in four boxes for nothing.
   */
  aiEnabled?: boolean;
}) {
  // The browser's store is the source of truth, and it can change in another
  // tab, so it is read as the external store it is rather than copied into
  // state on mount.
  const stored = useSyncExternalStore(subscribeContext, readStoredContext, readServerContext);
  // What's being typed right now wins over both, so a browser that refuses to
  // store anything (private mode, full quota) still lets you write context and
  // coach with it — it just won't be here tomorrow, and the status says so.
  const [edited, setEdited] = useState<OrgContext | null>(null);
  const context = edited ?? (hasContext(stored) ? stored : initial);

  function update(id: ContextFieldId, value: string) {
    const next = { ...context, [id]: value };
    setEdited(next);
    writeStoredContext(next);
  }

  function clear() {
    const next = { ...EMPTY_CONTEXT };
    setEdited(next);
    writeStoredContext(next);
  }

  const filled = contextFilledCount(context);
  const saved = hasContext(stored);
  const status = saved
    ? `Saved in this browser — ${filled} of ${CONTEXT_FIELDS.length} filled in.`
    : filled > 0
      ? "This browser won’t let the site save anything, so it’ll go with this goal but won’t be here next time."
      : "Nothing saved yet. Whatever you write here stays in this browser.";

  const footer = (
    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink/10 pt-4 text-sm text-ink-soft">
      <p role="status">{status}</p>
      {filled > 0 && (
        <button
          type="button"
          onClick={clear}
          className="font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Clear my context
        </button>
      )}
    </div>
  );

  if (variant === "page") {
    return (
      <div className="mt-8 rounded-3xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
        <Fields context={context} onChange={update} />
        {footer}
        <p className="mt-4 text-sm text-ink-soft">
          Nothing here is sent anywhere until you coach a goal — then it goes with that goal, to write that
          one review, and is kept by nobody. Take it to the{" "}
          <Link href="/coach" className="font-semibold underline underline-offset-2">
            Outcome Coach
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <details className="mt-4 rounded-2xl border border-ink/10 bg-white px-5 py-4 shadow-sm">
      <summary className="cursor-pointer font-semibold">
        Your context{" "}
        <span className="font-normal text-ink-soft">
          {filled > 0
            ? `— your organisation and role, ${filled} of ${CONTEXT_FIELDS.length} filled in`
            : "— optional: tell the coach where you work, so the coaching fits"}
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        {aiEnabled ? (
          <>
            The coach reads a sentence, not your organisation — so it can miss what your team takes for
            granted. Tell it once and it frames every review: your words, your cadence, questions pitched at
            your role. It stays in this browser, and it never becomes a fact about your goal —{" "}
          </>
        ) : (
          <>
            This deployment is running the structural check, which reads words rather than meaning, so your
            context can&rsquo;t change the score here. It still travels into the prompt you copy at the end,
            so the assistant you carry on with knows where you work. It stays in this browser —{" "}
          </>
        )}
        <Link href="/context" className="font-semibold underline underline-offset-2">
          more about how it&rsquo;s used
        </Link>
        .
      </p>
      <div className="mt-5">
        <Fields context={context} onChange={update} />
      </div>
      {footer}
    </details>
  );
}
