/**
 * The one database connection this site has.
 *
 * Neon over HTTP: no pool, no long-lived socket, nothing to keep warm between
 * serverless invocations. One `sql` tagged template per statement, one HTTPS
 * round trip. That suits a site whose only write is a feedback form somebody
 * fills in a few times a day.
 *
 * Configuration (server-only environment, never exposed to the browser):
 *   DATABASE_URL   optional — the Neon connection string. Vercel's Neon
 *                  integration sets it for you. Unset = there is no database,
 *                  and every caller falls back to the route that needs none.
 *
 * Unset is a supported state, not a broken one. The feedback form worked with
 * no backend at all before this existed, and it still does: `isDatabaseReady`
 * lets a page choose the GitHub route instead of showing an error nobody
 * visiting the site can fix.
 */

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cached: NeonQueryFunction<false, false> | null = null;

/** True when a connection string is configured. Never throws. */
export function isDatabaseReady(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * The query function, created on first use so a missing DATABASE_URL is a
 * runtime fallback rather than a build failure. Throws if called without one —
 * check `isDatabaseReady()` first.
 */
export function db(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — check isDatabaseReady() before calling db().");
  }
  if (!cached) cached = neon(url);
  return cached;
}
