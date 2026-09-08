"use client";

import { useState } from "react";

/**
 * Progressive enhancement only — the text being copied is always visible and
 * selectable on the page, so nothing is lost without JavaScript.
 */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
