import { NextResponse } from "next/server";
import { JAM_TOOLS, coachInstructions } from "@/lib/jamBoard";

/**
 * Mints a short-lived client secret for the OpenAI Realtime API, so the
 * browser can open a WebRTC session directly with the voice model without the
 * real key ever leaving the server.
 *
 * Configuration (server-only environment, never exposed to the browser):
 *   OPENAI_API_KEY          required — unset = the jam page says it isn't switched on.
 *   OPENAI_REALTIME_MODEL   optional — default gpt-realtime.
 *   OPENAI_REALTIME_VOICE   optional — default marin.
 *
 * Nothing about the session is stored here: no audio, no transcript, no board.
 */

export const runtime = "nodejs";

const MODEL = () => process.env.OPENAI_REALTIME_MODEL || "gpt-realtime";
const VOICE = () => process.env.OPENAI_REALTIME_VOICE || "marin";
const MAX_NAMES = 20;

/**
 * Cost guard. Every secret this route hands out can stream ten minutes of
 * real-time audio on the site's account, so it only serves requests that a
 * browser on this site would make, and only so many of them.
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
        audio: {
          input: {
            transcription: { model: "gpt-4o-mini-transcribe" },
            // A room talks among itself; low eagerness keeps the coach from jumping in on every pause.
            turn_detection: { type: "semantic_vad", eagerness: "low", create_response: true, interrupt_response: true },
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
      { error: "upstream", message: `OpenAI wouldn't start a session (HTTP ${upstream.status}). Check the key and model.` },
      { status: 502 }
    );
  }

  const data = (await upstream.json()) as { value?: string; expires_at?: number };
  if (!data.value) {
    return NextResponse.json({ error: "upstream", message: "OpenAI returned no client secret." }, { status: 502 });
  }
  return NextResponse.json({ clientSecret: data.value, expiresAt: data.expires_at ?? null, model: MODEL() });
}
