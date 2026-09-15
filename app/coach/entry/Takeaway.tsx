"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/*
 * The two bits of step 13 that need the browser. CARD 6, slide 16.
 *
 * Everything else about the takeaway is server-rendered and works with
 * JavaScript off: the artefacts are on the page as text — the canvas and the
 * goal further up the column since idea #156, the prompt here — the download is
 * a real link to a real file, and the file is built from the query string. These
 * two are enhancements on top of that, and neither of them is the only way to
 * anything.
 */

/**
 * How long counts as lingering.
 *
 * Long enough to read the three artefacts and think about them; short enough
 * that it still lands while the reader is here. This is the one place in the
 * whole column where a mild interruption is allowed — the deck says so, because
 * there is no "come back later" to fall back on — so it happens once, quietly,
 * beside the button it is about, and never again.
 */
const LINGER_MS = 45_000;

/**
 * Download all three — the primary action, and the only one the column ever
 * pushes.
 *
 * The anchor is server-rendered and works on its own: a plain link to
 * `/coach/entry/takeaway` carrying the run. What this component adds is the
 * push — one line, after a while, if the reader hasn't taken it. It is a
 * sentence in the coach's voice in the flow of the page, not a dialog, not a
 * banner, and not something that has to be dismissed before you can carry on
 * reading what you came for.
 *
 * It stops pushing the moment the link is used, and never asks twice.
 */
export function TakeIt({ href }: { href: string }) {
  const [taken, setTaken] = useState(false);
  const [lingering, setLingering] = useState(false);

  useEffect(() => {
    if (taken) return;
    const timer = setTimeout(() => setLingering(true), LINGER_MS);
    return () => clearTimeout(timer);
  }, [taken]);

  return (
    <>
      <a
        href={href}
        download
        onClick={() => {
          setTaken(true);
          setLingering(false);
        }}
        className="rounded-2xl bg-ink px-5 py-4 text-center font-semibold text-chalk transition-colors hover:bg-ink-soft"
      >
        <span aria-hidden>⤓ </span>Download all three
        <span className="font-normal"> (PDF)</span>
      </a>
      {/* Polite, not assertive: it waits its turn in a screen reader rather
          than cutting across whatever is being read. */}
      <p role="status" className="text-sm text-ink-soft sm:basis-full">
        {lingering && !taken
          ? "Still here? Take it before you go — there's no copy of this anywhere, and I can't send it to you later."
          : taken
            ? "That's it, in your downloads — one PDF, and it's the only copy there is."
            : ""}
      </p>
    </>
  );
}

/**
 * Print the canvas.
 *
 * Rendered only once the browser is running it, because a button that does
 * nothing is worse than no button: without JavaScript the reader still has
 * their browser's own print, and the print stylesheet in `globals.css` is what
 * makes either of them produce the canvas rather than the conversation.
 */
export function PrintCanvas() {
  // Is React actually running in a browser here? `false` on the server and on
  // the first client render, so the markup matches and nothing flickers into a
  // different layout; `true` afterwards. Nothing is ever subscribed to, which
  // is why the subscribe function returns an unsubscribe that does nothing.
  const running = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!running) return null;

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="self-start rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <span aria-hidden>⎙ </span>Print the canvas
    </button>
  );
}
