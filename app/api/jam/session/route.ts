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

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "not_configured", message: "The voice coach isn't switched on for this deployment yet." },
      { status: 503 }
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
