"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { type BoardItem, applyBoardAction, boardAsMarkdown, runBoardTool } from "@/lib/jamBoard";
import { readStoredContext } from "@/lib/contextStore";
import { hasContext } from "@/lib/orgContext";
import { Chalkboard } from "./Chalkboard";

/**
 * One room, one microphone, one board.
 *
 * The browser talks to the OpenAI Realtime API directly over WebRTC using a
 * ten-minute client secret from `/api/jam/session`. Audio goes both ways on the
 * peer connection; the coach's board edits arrive as function calls on the
 * data channel and are applied here. The board never leaves this browser —
 * except to a second tab on the same machine (`?view=board`, for the room's
 * big screen) over a BroadcastChannel.
 */

type Status = "idle" | "connecting" | "live" | "ended" | "error";
type Line = { who: "coach" | "room"; text: string };

const CHANNEL = "bettergoals-goal-jam";
const MAX_LINES = 12;

type RealtimeEvent = {
  type: string;
  name?: string;
  call_id?: string;
  arguments?: string;
  transcript?: string;
  item?: { type?: string; name?: string; call_id?: string; arguments?: string };
  error?: { message?: string };
};

export function JamRoom({ configured, boardOnly }: { configured: boolean; boardOnly: boolean }) {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [names, setNames] = useState("");
  const [typed, setTyped] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  const boardRef = useRef<BoardItem[]>([]);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const responseActive = useRef(false);
  const responseQueued = useRef(false);
  const handledCalls = useRef(new Set<string>());

  const setBoard = useCallback((next: BoardItem[]) => {
    boardRef.current = next;
    setItems(next);
    channelRef.current?.postMessage({ type: "board", items: next });
  }, []);

  // Second-screen sync: the host tab answers "hello" with the board and
  // broadcasts every change; a board-only tab just listens.
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(CHANNEL);
    channelRef.current = ch;
    ch.onmessage = (e: MessageEvent) => {
      const msg = e.data as { type?: string; items?: BoardItem[] };
      if (boardOnly && msg?.type === "board" && Array.isArray(msg.items)) {
        boardRef.current = msg.items;
        setItems(msg.items);
      }
      if (!boardOnly && msg?.type === "hello") ch.postMessage({ type: "board", items: boardRef.current });
    };
    if (boardOnly) ch.postMessage({ type: "hello" });
    return () => {
      ch.close();
      channelRef.current = null;
    };
  }, [boardOnly]);

  const send = useCallback((event: Record<string, unknown>) => {
    const dc = dcRef.current;
    if (dc && dc.readyState === "open") dc.send(JSON.stringify(event));
  }, []);

  /** One response at a time — the API rejects a second while one is active. */
  const requestResponse = useCallback(() => {
    if (responseActive.current) {
      responseQueued.current = true;
      return;
    }
    responseActive.current = true;
    send({ type: "response.create" });
  }, [send]);

  const addLine = useCallback((who: Line["who"], text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setLines((prev) => [...prev, { who, text: clean }].slice(-MAX_LINES));
  }, []);

  const runToolCall = useCallback(
    (name?: string, callId?: string, rawArgs?: string) => {
      if (!name || !callId || handledCalls.current.has(callId)) return;
      handledCalls.current.add(callId);
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(rawArgs || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      const { items: next, result } = runBoardTool(boardRef.current, name, args);
      setBoard(next);
      send({
        type: "conversation.item.create",
        item: { type: "function_call_output", call_id: callId, output: JSON.stringify(result) },
      });
      // The tool ran inside an active response; the follow-up goes out once it finishes.
      responseQueued.current = true;
    },
    [send, setBoard]
  );

  const handleEvent = useCallback(
    (ev: RealtimeEvent) => {
      switch (ev.type) {
        case "response.created":
          responseActive.current = true;
          break;
        case "response.done":
          responseActive.current = false;
          if (responseQueued.current) {
            responseQueued.current = false;
            requestResponse();
          }
          break;
        // The same tool call arrives twice — once as its arguments finish, once
        // as the completed output item (the only one whose `name` is in the
        // published schema). Whichever lands first runs it; the other is ignored.
        case "response.function_call_arguments.done":
          runToolCall(ev.name, ev.call_id, ev.arguments);
          break;
        case "response.output_item.done":
          if (ev.item?.type === "function_call") runToolCall(ev.item.name, ev.item.call_id, ev.item.arguments);
          break;
        case "conversation.item.input_audio_transcription.completed":
          if (ev.transcript) addLine("room", ev.transcript);
          break;
        case "response.output_audio_transcript.done":
          if (ev.transcript) addLine("coach", ev.transcript);
          break;
        case "error":
          // A failed response never sends response.done; don't wait for one.
          responseActive.current = false;
          responseQueued.current = false;
          setError(ev.error?.message ?? "The coach hit an error.");
          break;
      }
    },
    [addLine, requestResponse, runToolCall]
  );

  const stop = useCallback((ended = true) => {
    dcRef.current?.close();
    dcRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    micRef.current?.getTracks().forEach((t) => t.stop());
    micRef.current = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    responseActive.current = false;
    responseQueued.current = false;
    handledCalls.current.clear();
    setMuted(false);
    if (ended) setStatus("ended");
  }, []);

  useEffect(() => () => stop(false), [stop]);

  async function start() {
    setError(null);
    setStatus("connecting");
    try {
      const roster = names
        .split(/[,\n]/)
        .map((n) => n.trim())
        .filter(Boolean);
      // Where this browser says it works, if anything is saved there — the
      // coach speaks the room's language instead of asking them to explain it.
      const context = readStoredContext();
      const res = await fetch("/api/jam/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: roster, context: hasContext(context) ? context : undefined }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message || "Couldn't start a session.");
      }
      const { clientSecret } = (await res.json()) as { clientSecret: string };

      let mic: MediaStream;
      try {
        mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        throw new Error("The coach needs the room's microphone. Allow microphone access in the browser and try again.");
      }
      micRef.current = mic;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      pc.ontrack = (e) => {
        if (audioRef.current) audioRef.current.srcObject = e.streams[0];
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          setError("The connection to the coach dropped.");
          stop();
        }
      };
      mic.getTracks().forEach((t) => pc.addTrack(t, mic));

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (e) => {
        try {
          handleEvent(JSON.parse(e.data) as RealtimeEvent);
        } catch {
          // Ignore anything that isn't an event.
        }
      };
      dc.onopen = () => {
        setStatus("live");
        responseActive.current = true;
        send({
          type: "response.create",
          response: {
            instructions:
              "Open the session in two short sentences: say hello to the room, then ask what change they are hoping to see, and for whom.",
          },
        });
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: { Authorization: `Bearer ${clientSecret}`, "Content-Type": "application/sdp" },
        body: offer.sdp,
      });
      if (!sdpRes.ok) throw new Error(`OpenAI didn't accept the call (HTTP ${sdpRes.status}).`);
      await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });
    } catch (err) {
      stop(false);
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function toggleMute() {
    const next = !muted;
    micRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  }

  function sendTyped() {
    const text = typed.trim();
    if (!text) return;
    send({
      type: "conversation.item.create",
      item: { type: "message", role: "user", content: [{ type: "input_text", text }] },
    });
    addLine("room", text);
    setTyped("");
    requestResponse();
  }

  const live = status === "live";

  if (boardOnly) {
    return (
      <div>
        <Chalkboard items={items} large />
        <p className="mt-4 text-center text-sm text-ink-soft">
          Mirroring the board from the tab running the coach on this machine. {items.length === 0 && "Waiting for the first chalk mark…"}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <audio ref={audioRef} autoPlay hidden />

      {!configured && (
        <div className="rounded-2xl border border-happier/50 bg-happier/10 p-6 text-sm leading-relaxed text-ink">
          <p className="font-semibold">The voice coach isn&rsquo;t switched on for this deployment yet.</p>
          <p className="mt-1 text-ink-soft">
            It needs a server-side <code>OPENAI_API_KEY</code>. Until then the board below still works as a shared
            canvas on this screen — you just don&rsquo;t get the coach&rsquo;s voice.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex-1 min-w-[16rem] text-sm">
            <span className="font-semibold">Who&rsquo;s in the room? <span className="font-normal text-ink-soft">(optional, first names)</span></span>
            <input
              type="text"
              value={names}
              onChange={(e) => setNames(e.target.value)}
              disabled={live || status === "connecting"}
              placeholder="Priya, Tom, Adaeze…"
              className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 disabled:bg-ink/5"
            />
            <span className="mt-1 block text-xs text-ink-soft">
              So the coach can bring quieter voices in by name.
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {!live ? (
              <button
                type="button"
                onClick={start}
                disabled={!configured || status === "connecting"}
                className="rounded-full bg-sooner px-6 py-3 font-semibold text-ink hover:bg-sooner/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "connecting" ? "Connecting…" : status === "ended" ? "Start again" : "Start the jam"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-pressed={muted}
                  className="rounded-full border border-ink/15 px-5 py-3 font-semibold hover:bg-ink/5"
                >
                  {muted ? "Unmute room" : "Mute room"}
                </button>
                <button
                  type="button"
                  onClick={() => stop()}
                  className="rounded-full bg-ink px-5 py-3 font-semibold text-chalk hover:bg-ink-soft"
                >
                  End session
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold ${
              live
                ? "border-sooner/40 bg-sooner/10"
                : status === "error"
                  ? "border-red-300 bg-red-50"
                  : "border-ink/15 bg-ink/5"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${live ? "bg-sooner" : status === "connecting" ? "bg-happier" : "bg-ink/40"}`}
            />
            {status === "idle" && "Not started"}
            {status === "connecting" && "Connecting to the coach…"}
            {status === "live" && (muted ? "Live — room muted" : "Live — the coach is listening")}
            {status === "ended" && "Session ended — the board stays"}
            {status === "error" && "Couldn't connect"}
          </span>
          {error && <span className="text-red-700">{error}</span>}
        </div>
      </div>

      <Chalkboard
        items={items}
        onErase={(id) => setBoard(applyBoardAction(boardRef.current, { type: "erase", id }))}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <CopyButton text={boardAsMarkdown(items)} label="Copy board as markdown" />
          <button
            type="button"
            onClick={() => setBoard([])}
            disabled={items.length === 0}
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-ink/5 disabled:opacity-40"
          >
            Wipe board
          </button>
        </div>
        <a
          href="/coach/jam?view=board"
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold underline underline-offset-2"
        >
          Open board-only view for the big screen ↗
        </a>
      </div>

      {live && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendTyped();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Or type something to the coach…"
            className="flex-1 rounded-xl border border-ink/15 px-3 py-2 text-sm"
            aria-label="Type a message to the coach"
          />
          <button type="submit" className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-ink/5">
            Send
          </button>
        </form>
      )}

      {lines.length > 0 && (
        <details className="rounded-2xl border border-ink/10 bg-white p-4 text-sm">
          <summary className="cursor-pointer font-semibold">What&rsquo;s been said (last {MAX_LINES} turns, this browser only)</summary>
          <ul className="mt-3 space-y-2 text-ink-soft">
            {lines.map((l, i) => (
              <li key={i}>
                <span className={`font-semibold ${l.who === "coach" ? "text-sooner" : "text-ink"}`}>
                  {l.who === "coach" ? "Coach" : "Room"}:
                </span>{" "}
                {l.text}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
