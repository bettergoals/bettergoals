"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import {
  KIND_LABEL,
  type BoardItem,
  type BoardKind,
  applyBoardAction,
  boardAsMarkdown,
  boardSummary,
  runBoardTool,
} from "@/lib/jamBoard";
import { type Activity, Chalkboard, type ShownItem } from "./Chalkboard";

/**
 * One room, one microphone, one board.
 *
 * The browser talks to the OpenAI Realtime API directly over WebRTC using a
 * ten-minute client secret from `/api/jam/session`. Audio goes both ways on the
 * peer connection; the coach's board edits arrive as function calls on the
 * data channel and are applied here. People in the room can pick up the chalk
 * too — their edits are applied locally and mentioned to the coach as a
 * `[board]` note so it doesn't undo them. "Present full screen" puts the
 * board alone on the room's display; the coach keeps running in the same tab.
 *
 * The board never leaves this browser.
 */

type Status = "idle" | "connecting" | "live" | "ended" | "error";
type Line = { who: "coach" | "room"; text: string };

const MAX_LINES = 12;
/** A UX guard on the typed box, not a cost boundary — that's the session route's rate limit. */
const MAX_TYPED = 1000;
/** How long a rubbed-out item smears before it's gone. Matches `chalk-out` in globals.css. */
const SCRUB_MS = 550;

type RealtimeEvent = {
  type: string;
  name?: string;
  call_id?: string;
  arguments?: string;
  transcript?: string;
  delta?: string;
  /** Output items. gpt-realtime-2.x tags each with a phase: "commentary" (preamble, tool calls) or "final_answer". */
  item?: { type?: string; name?: string; call_id?: string; arguments?: string; phase?: string; status?: string };
  /** On response.done: completed | cancelled | failed | incomplete. */
  response?: { status?: string };
  error?: { code?: string; message?: string };
};

const OFF: Activity = { state: "off", caption: "" };

export function JamRoom({ configured }: { configured: boolean }) {
  const [shown, setShown] = useState<ShownItem[]>([]);
  const [activity, setActivity] = useState<Activity>(OFF);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [names, setNames] = useState("");
  const [typed, setTyped] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);

  /** The board as the coach knows it. `shown` = this plus items mid-scrub. */
  const boardRef = useRef<BoardItem[]>([]);
  const ghostsRef = useRef<Map<string, BoardItem>>(new Map());
  const activityRef = useRef<Activity>(OFF);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const responseActive = useRef(false);
  const responseQueued = useRef(false);
  const toolsThisResponse = useRef(false);
  /** Any audio at all — drives the indicator. */
  const spokeThisResponse = useRef(false);
  /** A proper reply, not just a "let me note that" preamble before tool calls. */
  const answeredThisResponse = useRef(false);
  const captionRef = useRef("");
  const handledCalls = useRef(new Set<string>());
  const mountedRef = useRef(true);

  // --- Board state -----------------------------------------------------------

  /** The logical board plus anything mid-scrub, in the order it was written. */
  const computeShown = useCallback((): ShownItem[] => {
    const ghosts = [...ghostsRef.current.values()].map((g) => ({ ...g, ghost: true }));
    return [...boardRef.current, ...ghosts].sort(
      (a, b) => (Number.parseInt(a.id.slice(1), 10) || 0) - (Number.parseInt(b.id.slice(1), 10) || 0)
    );
  }, []);

  const render = useCallback(() => {
    setShown(computeShown());
  }, [computeShown]);

  /** Commit a new logical board. Anything removed lingers as a ghost while it smears out. */
  const commit = useCallback(
    (next: BoardItem[]) => {
      const prev = boardRef.current;
      boardRef.current = next;
      // An id that comes back (erase then write, or clear then write) must not also be a ghost.
      next.forEach((n) => ghostsRef.current.delete(n.id));
      const removed = prev.filter((p) => !next.some((n) => n.id === p.id));
      if (removed.length > 0) {
        removed.forEach((r) => ghostsRef.current.set(r.id, r));
        setTimeout(() => {
          removed.forEach((r) => ghostsRef.current.delete(r.id));
          render();
        }, SCRUB_MS);
      }
      render();
    },
    [render]
  );

  const setAct = useCallback((patch: Partial<Activity>) => {
    activityRef.current = { ...activityRef.current, ...patch };
    setActivity(activityRef.current);
  }, []);

  // --- Realtime session ------------------------------------------------------

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

  /** Tell the coach about something the room did by hand. No reply is asked for; it sees it next turn. */
  const noteToCoach = useCallback(
    (text: string) => {
      send({
        type: "conversation.item.create",
        item: { type: "message", role: "user", content: [{ type: "input_text", text: `[board] ${text}` }] },
      });
    },
    [send]
  );

  const addLine = useCallback((who: Line["who"], text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setLines((prev) => [...prev, { who, text: clean }].slice(-MAX_LINES));
  }, []);

  const runToolCall = useCallback(
    (name?: string, callId?: string, rawArgs?: string) => {
      if (!name || !callId || handledCalls.current.has(callId)) return;
      handledCalls.current.add(callId);
      toolsThisResponse.current = true;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(rawArgs || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      const { items: next, result } = runBoardTool(boardRef.current, name, args);
      commit(next);
      send({
        type: "conversation.item.create",
        item: { type: "function_call_output", call_id: callId, output: JSON.stringify(result) },
      });
    },
    [commit, send]
  );

  const handleEvent = useCallback(
    (ev: RealtimeEvent) => {
      switch (ev.type) {
        case "response.created":
          responseActive.current = true;
          toolsThisResponse.current = false;
          spokeThisResponse.current = false;
          answeredThisResponse.current = false;
          captionRef.current = "";
          setAct({ state: "thinking" });
          break;
        case "response.done": {
          responseActive.current = false;
          // Speak first, chalk second: if the coach only chalked (or only said a
          // preamble before chalking), ask it to answer now; if it already
          // answered, don't make it speak twice. A response the room interrupted
          // (status "cancelled") gets no follow-up — their speech is the next turn,
          // and asking for a response now would race the turn detector.
          const cancelled = ev.response?.status === "cancelled";
          const followUp = !cancelled && (responseQueued.current || (toolsThisResponse.current && !answeredThisResponse.current));
          responseQueued.current = false;
          toolsThisResponse.current = false;
          if (activityRef.current.state === "thinking") setAct({ state: "listening" });
          if (followUp) requestResponse();
          break;
        }
        case "response.output_item.added":
          if (ev.item?.type === "message" && ev.item.phase !== "commentary") answeredThisResponse.current = true;
          break;
        // The same tool call arrives twice — once as its arguments finish, once
        // as the completed output item (the only one whose `name` is in the
        // published schema). Whichever lands first runs it; the other is ignored.
        case "response.function_call_arguments.done":
          runToolCall(ev.name, ev.call_id, ev.arguments);
          break;
        case "response.output_item.done":
          if (ev.item?.type === "function_call") runToolCall(ev.item.name, ev.item.call_id, ev.item.arguments);
          if (ev.item?.type === "message" && ev.item.phase !== "commentary") answeredThisResponse.current = true;
          break;
        case "response.output_audio_transcript.delta":
          spokeThisResponse.current = true;
          captionRef.current += ev.delta ?? "";
          setAct({ caption: captionRef.current });
          break;
        case "response.output_audio_transcript.done":
          spokeThisResponse.current = true;
          if (ev.transcript) {
            addLine("coach", ev.transcript);
            setAct({ caption: ev.transcript });
          }
          break;
        case "output_audio_buffer.started":
          spokeThisResponse.current = true;
          setAct({ state: "speaking" });
          break;
        case "output_audio_buffer.stopped":
        case "output_audio_buffer.cleared":
          setAct({ state: "listening" });
          break;
        case "input_audio_buffer.speech_started":
          if (activityRef.current.state === "listening") setAct({ state: "hearing" });
          break;
        case "input_audio_buffer.speech_stopped":
          if (activityRef.current.state === "hearing") setAct({ state: "listening" });
          break;
        case "conversation.item.input_audio_transcription.completed":
          if (ev.transcript) addLine("room", ev.transcript);
          break;
        case "error":
          if (ev.error?.code === "conversation_already_has_active_response") {
            // The server started a response itself (turn detection) just as we asked
            // for one. Not a fault: it's busy, so ask again when it finishes.
            responseActive.current = true;
            responseQueued.current = true;
            break;
          }
          // A failed response never sends response.done; don't wait for one.
          responseActive.current = false;
          responseQueued.current = false;
          toolsThisResponse.current = false;
          setAct({ state: "listening" });
          setError(ev.error?.message ?? "The coach hit an error.");
          break;
      }
    },
    [addLine, requestResponse, runToolCall, setAct]
  );

  const stop = useCallback(
    (ended = true) => {
      dcRef.current?.close();
      dcRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
      micRef.current?.getTracks().forEach((t) => t.stop());
      micRef.current = null;
      if (audioRef.current) audioRef.current.srcObject = null;
      responseActive.current = false;
      responseQueued.current = false;
      toolsThisResponse.current = false;
      spokeThisResponse.current = false;
      answeredThisResponse.current = false;
      handledCalls.current.clear();
      setMuted(false);
      setAct({ state: "off" });
      if (ended) setStatus("ended");
    },
    [setAct]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stop(false);
    };
  }, [stop]);

  async function start() {
    setError(null);
    setStatus("connecting");
    try {
      const roster = names
        .split(/[,\n]/)
        .map((n) => n.trim())
        .filter(Boolean);
      const res = await fetch("/api/jam/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: roster }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message || "Couldn't start a session.");
      }
      const { clientSecret } = (await res.json()) as { clientSecret: string };
      if (!mountedRef.current) return;

      let mic: MediaStream;
      try {
        mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        throw new Error("The coach needs the room's microphone. Allow microphone access in the browser and try again.");
      }
      if (!mountedRef.current) {
        // Navigated away while the permission prompt was up — don't leave a hot mic.
        mic.getTracks().forEach((t) => t.stop());
        return;
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
        setAct({ state: "thinking", caption: "" });
        // Anything the room wrote before the coach joined (or before "Start again").
        if (boardRef.current.length > 0) {
          send({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "user",
              content: [
                { type: "input_text", text: `[board] Already on the board when you joined:\n${boardSummary(boardRef.current)}` },
              ],
            },
          });
        }
        responseActive.current = true;
        send({
          type: "response.create",
          response: {
            instructions:
              "Open the session in two or three short sentences: say hello to the room, then ask everyone for a quick one-liner — their first name and the change they most want to see for someone — and invite whoever wants to go first. Don't explain why you're asking for names.",
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
    const text = typed.trim().slice(0, MAX_TYPED);
    if (!text) return;
    send({
      type: "conversation.item.create",
      item: { type: "message", role: "user", content: [{ type: "input_text", text }] },
    });
    addLine("room", text);
    setTyped("");
    requestResponse();
  }

  // --- The room picks up the chalk --------------------------------------------

  const quote = (text: string) => `"${text}"`;

  function eraseByHand(id: string) {
    const item = boardRef.current.find((i) => i.id === id);
    if (!item) return;
    commit(applyBoardAction(boardRef.current, { type: "erase", id }));
    noteToCoach(`The room rubbed out ${id} ${quote(item.text)}.`);
  }

  function editByHand(id: string, text: string) {
    const item = boardRef.current.find((i) => i.id === id);
    if (!item) return;
    const next = applyBoardAction(boardRef.current, { type: "update", id, text });
    const updated = next.find((i) => i.id === id);
    if (!updated || updated.text === item.text) return;
    commit(next);
    noteToCoach(`The room rewrote ${id} from ${quote(item.text)} to ${quote(updated.text)}.`);
  }

  function addByHand(kind: BoardKind, text: string) {
    const next = applyBoardAction(boardRef.current, { type: "write", kind, text });
    if (next.length === boardRef.current.length) return;
    commit(next);
    const added = next[next.length - 1];
    noteToCoach(`The room wrote ${added.id} under "${KIND_LABEL[kind]}": ${quote(added.text)}.`);
  }

  function toggleStarByHand(id: string) {
    const item = boardRef.current.find((i) => i.id === id);
    if (!item) return;
    const starred = !item.starred;
    commit(applyBoardAction(boardRef.current, { type: "update", id, starred }));
    noteToCoach(starred ? `The room marked ${id} ${quote(item.text)} as chosen.` : `The room un-starred ${id} ${quote(item.text)}.`);
  }

  function wipeByHand() {
    if (boardRef.current.length === 0) return;
    commit([]);
    noteToCoach("The room wiped the board clean to start over.");
  }

  // --- Presenting ---------------------------------------------------------------

  useEffect(() => {
    const onChange = () => {
      const native = Boolean(document.fullscreenElement) && document.fullscreenElement === stageRef.current;
      setFullscreen(native);
      // If the native request settles after our timeout, don't run both modes at once.
      if (native) setPseudoFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!pseudoFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      // Escape inside an inline edit cancels the edit, not the presentation.
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;
      if (e.key === "Escape") setPseudoFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pseudoFullscreen]);

  const presenting = fullscreen || pseudoFullscreen;

  async function togglePresent() {
    if (fullscreen) {
      await document.exitFullscreen?.().catch(() => undefined);
      return;
    }
    if (pseudoFullscreen) {
      setPseudoFullscreen(false);
      return;
    }
    const el = stageRef.current;
    if (el?.requestFullscreen) {
      try {
        // Some embedded browsers never settle this promise; don't leave the room waiting.
        await Promise.race([
          el.requestFullscreen({ navigationUI: "hide" }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("fullscreen timed out")), 800)),
        ]);
        if (document.fullscreenElement === el) return;
      } catch {
        // Fall through to the CSS version (iOS Safari, embedded browsers).
      }
    }
    setPseudoFullscreen(true);
  }

  const live = status === "live";

  const handlers = { onErase: eraseByHand, onEdit: editByHand, onAdd: addByHand, onToggleStar: toggleStarByHand };

  const statusPill = (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${
        live ? "border-sooner/40 bg-sooner/10" : status === "error" ? "border-red-300 bg-red-50" : "border-ink/15 bg-ink/5"
      } ${presenting ? "border-chalk/20 bg-chalk/10 text-chalk" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${live ? "bg-sooner" : status === "connecting" ? "bg-happier" : presenting ? "bg-chalk/40" : "bg-ink/40"}`}
      />
      {status === "idle" && "Not started"}
      {status === "connecting" && "Connecting to the coach…"}
      {status === "live" && (muted ? "Live — room muted" : "Live — the coach is listening")}
      {status === "ended" && "Session ended — the board stays"}
      {status === "error" && "Couldn't connect"}
    </span>
  );

  const presentButton = (
    <button
      type="button"
      onClick={togglePresent}
      className={
        presenting
          ? "rounded-full border border-chalk/30 px-4 py-2 text-sm font-semibold text-chalk hover:bg-chalk/10"
          : "rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
      }
    >
      {presenting ? "Exit full screen" : "Present full screen"}
    </button>
  );

  const stage = (
    <div
      ref={stageRef}
      className={presenting ? "fixed inset-0 z-50 flex flex-col overflow-auto bg-ink" : ""}
    >
      <Chalkboard items={shown} activity={activity} large={presenting} fill={presenting} {...handlers} />
      {presenting && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-end gap-2 p-4 opacity-50 transition hover:opacity-100 focus-within:opacity-100">
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            {!live && (
              <button
                type="button"
                onClick={start}
                disabled={!configured || status === "connecting"}
                className="rounded-full bg-sooner px-4 py-2 text-sm font-semibold text-ink hover:bg-sooner/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "connecting" ? "Connecting…" : status === "ended" ? "Start again" : "Start the jam"}
              </button>
            )}
            {live && (
              <>
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-pressed={muted}
                  className="rounded-full border border-chalk/30 px-4 py-2 text-sm font-semibold text-chalk hover:bg-chalk/10"
                >
                  {muted ? "Unmute room" : "Mute room"}
                </button>
                <button
                  type="button"
                  onClick={() => stop()}
                  className="rounded-full border border-chalk/30 px-4 py-2 text-sm font-semibold text-chalk hover:bg-chalk/10"
                >
                  End session
                </button>
              </>
            )}
            {statusPill}
            {presentButton}
          </div>
        </div>
      )}
    </div>
  );

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
          <label className="min-w-[16rem] flex-1 text-sm">
            <span className="font-semibold">
              Who&rsquo;s in the room? <span className="font-normal text-ink-soft">(optional, first names)</span>
            </span>
            <input
              type="text"
              value={names}
              onChange={(e) => setNames(e.target.value)}
              disabled={live || status === "connecting"}
              placeholder="Priya, Tom, Adaeze…"
              className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2 disabled:bg-ink/5"
            />
            <span className="mt-1 block text-xs text-ink-soft">
              So the coach can bring quieter voices in by name. It hears one microphone and can&rsquo;t recognise
              voices, so it opens by asking everyone for a one-liner — name and the change they want — and uses
              what each person said to follow up with them later.
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
          {statusPill}
          {error && <span className="text-red-700">{error}</span>}
        </div>
      </div>

      {stage}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {presentButton}
          <CopyButton text={boardAsMarkdown(shown.filter((i) => !i.ghost))} label="Copy board as markdown" />
          <button
            type="button"
            onClick={wipeByHand}
            disabled={shown.length === 0}
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:bg-ink/5 disabled:opacity-40"
          >
            Wipe board
          </button>
        </div>
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
            maxLength={MAX_TYPED}
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
          <summary className="cursor-pointer font-semibold">
            What&rsquo;s been said (last {MAX_LINES} turns, this browser only)
          </summary>
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
