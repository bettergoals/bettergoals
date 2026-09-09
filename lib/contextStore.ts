/**
 * Where your context lives: this browser's localStorage, and nowhere else.
 *
 * It is a genuine external store — another tab can change it, and it outlives
 * the page — so it is exposed the way React expects one: a subscribe, a
 * snapshot, and a server snapshot of nothing at all. Components read it with
 * `useSyncExternalStore`, which is also why the first paint on the server and
 * the first paint in the browser agree.
 *
 * The snapshot is cached against the raw string so repeated reads hand back the
 * same object; React needs that stability, and it means a keystroke costs one
 * write rather than a re-parse.
 */

import { CONTEXT_STORAGE_KEY, EMPTY_CONTEXT, type OrgContext, hasContext, sanitiseContext } from "./orgContext";

/** The last raw string we saw, and what it parsed to. */
let cachedRaw: string | null = null;
let cached: OrgContext = EMPTY_CONTEXT;

const listeners = new Set<() => void>();

function announce() {
  for (const listener of listeners) listener();
}

/** Subscribe to changes here and in this site's other tabs. */
export function subscribeContext(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** What this browser has saved, sanitised — and `EMPTY_CONTEXT` if anything is off. */
export function readStoredContext(): OrgContext {
  if (typeof window === "undefined") return EMPTY_CONTEXT;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(CONTEXT_STORAGE_KEY);
  } catch {
    // Storage switched off entirely. Nothing saved, then.
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? sanitiseContext(JSON.parse(raw)) : EMPTY_CONTEXT;
    } catch {
      cached = EMPTY_CONTEXT;
    }
  }
  return cached;
}

/** Nothing is known on the server: there is no account to look anything up in. */
export function readServerContext(): OrgContext {
  return EMPTY_CONTEXT;
}

/**
 * Save it, or forget it entirely once every box is empty. Returns whether the
 * browser actually took it — private browsing and a full quota both refuse, and
 * the panel says so rather than claiming a save that didn't happen.
 */
export function writeStoredContext(context: OrgContext): boolean {
  if (typeof window === "undefined") return false;
  const raw = hasContext(context) ? JSON.stringify(context) : null;
  try {
    if (raw) window.localStorage.setItem(CONTEXT_STORAGE_KEY, raw);
    else window.localStorage.removeItem(CONTEXT_STORAGE_KEY);
  } catch {
    return false;
  }
  // Cache what was written rather than re-reading it, so a half-typed word
  // isn't tidied up under the cursor by the sanitiser.
  cachedRaw = raw;
  cached = context;
  announce();
  return true;
}
