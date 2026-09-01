"use client";

import { useState } from "react";

/** Copies a block of plain text. Degrades to a disabled-looking no-op if the
 *  clipboard API is unavailable — the text is always visible on the page too. */
export default function CopyButton({ text, label = "Copy template" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the user can still select the text below */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-chalk hover:bg-ink-soft"
      aria-live="polite"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
