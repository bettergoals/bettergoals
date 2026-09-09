import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isDatabaseReady, listFeedback } from "@/lib/feedbackStore";

/**
 * Reading the feedback back out.
 *
 * There is no admin UI and no login on this site, and inventing one to read a
 * handful of rows would be a bigger surface than the thing it protects. So:
 * one token-guarded endpoint that returns everything as JSON, for whoever
 * holds the token.
 *
 *   curl -H "Authorization: Bearer $FEEDBACK_ADMIN_TOKEN" \
 *     https://bettergoals.ai/api/feedback/export
 *
 * Configuration (server-only environment, never exposed to the browser):
 *   FEEDBACK_ADMIN_TOKEN   required — a long random string. Unset = the route
 *                          is off and answers 404, so a half-configured deploy
 *                          can't leak. Generate one with `openssl rand -hex 32`.
 *   DATABASE_URL           required — see lib/db.ts.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokenMatches(header: string | null, expected: string): boolean {
  const given = header?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on a length mismatch, which would itself leak length.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  const expected = process.env.FEEDBACK_ADMIN_TOKEN;
  if (!expected || !isDatabaseReady()) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!tokenMatches(req.headers.get("authorization"), expected)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Bearer" },
    });
  }

  try {
    const feedback = await listFeedback();
    return NextResponse.json(
      { count: feedback.length, feedback },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (error) {
    console.error("feedback export: could not read", error);
    return new NextResponse("Could not read feedback", { status: 500 });
  }
}
