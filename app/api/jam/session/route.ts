import { NextResponse } from "next/server";
import { JAM_TOOLS, coachInstructions } from "@/lib/jamBoard";

/**
 * Mints a short-lived client secret for the OpenAI Realtime API, so the
 * browser can open a WebRTC session directly with the voice model without the
 * real key ever leaving the server.
 *
 * Configuration (server-only environment, never exposed to the browser):
 *   OPENAI_API_KEY             required — unset = the jam page says it isn't switched on.
 *   OPENAI_REALTIME_MODEL      optional — default gpt-realtime-2.1 (reasoning + tool use).
 *   OPENAI_REALTIME_REASONING  optional — reasoning effort for gpt-realtime-2.x; default low.
 *                              Higher raises quality on hard turns and adds latency; a
 *                              room waiting on a reply notices latency first. Ignored for
 *                              models that don't reason (gpt-realtime, gpt-realtime-1.5).
 *   OPENAI_REALTIME_VOICE      optional — default marin.
 *
 * Nothing about the session is stored here: no audio, no transcript, no board.
 */

export const runtime = "nodejs";

const MODEL = () => process.env.OPENAI_REALTIME_MODEL || "gpt-realtime-2.1";
const VOICE = () => process.env.OPENAI_REALTIME_VOICE || "marin";

/**
 * `reasoning` is only accepted by the reasoning models (gpt-realtime-2 and later).
 * Match a one- or two-digit major version so the dated snapshot of the
 * non-reasoning model, gpt-realtime-2025-08-28, isn't mistaken for one.
 */
function isReasoningModel(model: string): boolean {
  const m = /^gpt-realtime-(\d{1,2})(?:\.\d+)?(?:-|$)/.exec(model);
  return m !== null && Number(m[1]) >= 2;
}

function reasoning(model: string): { effort: string } | undefined {
  if (!isReasoningModel(model)) return undefined;
  return { effort: process.env.OPENAI_REALTIME_REASONING || "low" };
}
const MAX_NAMES = 20;

/**
 * Cost guard. Every secret this route hands out can start one call on the
 * site's account, and OpenAI lets a call run for up to an hour — the 600s
 * expiry below only bounds how long the secret can be used to *start* it. So
 * the route only serves requests a browser on this site would make, and only
 * so many of them.
 *
 * The counters live in memory, per serverless instance, and reset on a cold
 * start — a brake, not a wall. A malicious client can forge an Origin header
 * too. Proper protection (a signed session, a durable rate limit) is a
 * follow-up; this keeps a casual script from running up the bill.
 */
const WINDOW_MS = 10 * 60_000;
const PER_CLIENT = 6;
const PER_INSTANCE = 60;
const seen = new Map<string, number[]>();
let instanceHits: number[] = [];

function sameOrigin(req: Request): boolean {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

function overLimit(req: Request, now: number): boolean {
  const client = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const fresh = (stamps: number[]) => stamps.filter((t) => now - t < WINDOW_MS);
  instanceHits = fresh(instanceHits);
  const mine = fresh(seen.get(client) ?? []);
  if (instanceHits.length >= PER_INSTANCE || mine.length >= PER_CLIENT) return true;
  instanceHits.push(now);
  mine.push(now);
  seen.set(client, mine);
  if (seen.size > 5000) seen.clear();
  return false;
}

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "not_configured", message: "The voice coach isn't switched on for this deployment yet." },
      { status: 503 }
    );
  }
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "forbidden", message: "Sessions can only be started from this site." }, { status: 403 });
  }
  if (overLimit(req, Date.now())) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many sessions started recently. Give it a few minutes and try again." },
      { status: 429 }
    );
  }

  let names: string[] = [];
  try {
    const body = (await req.json()) as { names?: unknown };
    if (Array.isArray(body?.names)) {
      names = body.names
        .filter((n): n is string => typeof n === "string")
        .map((n) => n.replace(/\s+/g, " ").trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, MAX_NAMES);
    }
  } catch {
    // No body is fine — the coach will ask for names itself.
  }

  const upstream = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      expires_after: { anchor: "created_at", seconds: 600 },
      session: {
        type: "realtime",
        model: MODEL(),
        instructions: coachInstructions(names),
        tools: JAM_TOOLS,
        tool_choice: "auto",
        reasoning: reasoning(MODEL()),
        audio: {
          input: {
            transcription: { model: "gpt-4o-mini-transcribe" },
            // "auto" balances letting a room finish a thought against replying promptly.
            // "low" waited noticeably longer before every reply; "high" would talk over people.
            turn_detection: { type: "semantic_vad", eagerness: "auto", create_response: true, interrupt_response: true },
          },
          output: { voice: VOICE() },
        },
      },
    }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.error(`[jam] OpenAI refused the session: ${upstream.status} ${detail.slice(0, 400)}`);
    return NextResponse.json(
      {
        error: "upstream",
        message: `OpenAI wouldn't start a session (HTTP ${upstream.status}). Check the key, model and reasoning settings.`,
      },
      { status: 502 }
    );
  }

  const data = (await upstream.json()) as { value?: string; expires_at?: number };
  if (!data.value) {
    return NextResponse.json({ error: "upstream", message: "OpenAI returned no client secret." }, { status: 502 });
  }
  return NextResponse.json({ clientSecret: data.value, expiresAt: data.expires_at ?? null, model: MODEL() });
}
