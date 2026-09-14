"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { columnHref, type Coaching } from "@/lib/coaching";
import type { Run } from "@/lib/triage";
import { columnNote, landAnswer, turnFor } from "@/lib/voiceColumn";
import { useCoachSaysSetters } from "./CoachSays";

/**
 * "◉ Talk to me" — the coach itself, on the phone. Idea #124.
 *
 * Until now, pressing it bought you the browser's own voice reading the printed
 * question out and the browser's own ears listening for one answer back
 * (`SayIt`). Nothing was coaching: the run went exactly where tapping would
 * have sent it. The goal jam, meanwhile, has had a real voice coach all along.
 * This is that same coach, moved to the front door — and here the canvas is the
 * board, so there is no second artefact to keep in step.
 *
 * How it hangs together, and why it is this way round:
 *
 *  - the browser talks to the OpenAI Realtime API directly over WebRTC, using a
 *    short-lived client secret from `/api/jam/session` with `flow: "column"`.
 *    The real key never leaves the server. Audio goes both ways on the peer
 *    connection; the coach's answers arrive as function calls on the data
 *    channel.
 *  - the column is still the source of truth. The coach does not hold the
 *    conversation in its head and write it out at the end: every answer is an
 *    `answer` tool call that becomes the same link a tap would have followed,
 *    and the server re-renders the column from the query string exactly as
 *    before. The canvas fills itself because it already did.
 *  - so answering by hand keeps working, at any moment, mid-sentence. When the
 *    reader taps or types, the props change under this component and the coach
 *    is told where the column went.
 *  - and nothing is stored. No transcript, no recording, no board — the run is
 *    in the address bar and closing the tab ends it.
 *
 * It only ever mounts inside speaking mode with the session configured, which
 * only a press on "◉ Talk to me" can reach — so nothing here can make a sound
 * on arrival (PRINCIPLES.md, "Accessible to everyone"; WCAG 2.0 AA 1.4.2).
 * There are two visible ways to stop it — the control below and the run's own
 * `voice=off` switch — and the coach will do it if asked out loud.
 */

type Status = "connecting" | "live" | "ended" | "error";

type RealtimeEvent = {
  type: string;
  name?: string;
  call_id?: string;
  arguments?: string;
  transcript?: string;
  delta?: string;
  item?: { type?: string; name?: string; call_id?: string; arguments?: string; phase?: string };
  response?: { status?: string };
  error?: { code?: string; message?: string };
};

/** How long the coach gets to finish its last sentence before the mic closes. */
const LAST_WORD_MS = 3500;

/** The same quiet switch the column's own mode and voice controls wear. */
const SWITCH = "rounded-full border border-ink/15 px-3 py-1.5 text-sm text-ink-soft hover:bg-ink/5";

export function TalkToMe({ run, coaching }: { run: Run; coaching: Coaching }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [hearing, setHearing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  /** The coach's last line, in print. What it says is always also readable. */
  const [caption, setCaption] = useState("");
  /**
   * The same line, handed up to the live turn at the top of the column. The
   * wording is the coach's now, so the printed question has to be the coach's
   * too — otherwise you hear one question and read another. See `CoachSays`.
   */
  const coachSays = useCoachSaysSetters();

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mountedRef = useRef(true);
  const responseActive = useRef(false);
  const responseQueued = useRef(false);
  const toolsThisResponse = useRef(false);
  const answeredThisResponse = useRef(false);
  const captionRef = useRef("");
  const handledCalls = useRef(new Set<string>());
  /** Asked to hand back to the page, once the coach has finished its sentence. */
  const leavingRef = useRef(false);

  /** The run, as of the last render — the handlers below outlive the render. */
  const stateRef = useRef({ run, coaching });
  useEffect(() => {
    stateRef.current = { run, coaching };
  });

  /** Where the column stands, as one string. Changes when anything is answered. */
  const signature = columnHref(run, coaching, {}, "");
  /** The last state the coach was told about, and the last move it made itself. */
  const toldRef = useRef<string | null>(null);
  const ownMoveRef = useRef<string | null>(null);

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

  const tell = useCallback(
    (text: string) => {
      send({
        type: "conversation.item.create",
        item: { type: "message", role: "user", content: [{ type: "input_text", text }] },
      });
    },
    [send],
  );

  const stop = useCallback((next: Status = "ended") => {
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
    toldRef.current = null;
    setMuted(false);
    setHearing(false);
    if (mountedRef.current) setStatus(next);
  }, []);

  /** Hand the column back. Everything said stays exactly where it is. */
  const handOver = useCallback(() => {
    if (!leavingRef.current) return;
    leavingRef.current = false;
    const { run: r, coaching: c } = stateRef.current;
    stop();
    router.push(columnHref(r, c, { voice: "off" }));
  }, [router, stop]);

  const runToolCall = useCallback(
    (name?: string, callId?: string, rawArgs?: string) => {
      if (!name || !callId || handledCalls.current.has(callId)) return;
      handledCalls.current.add(callId);
      toolsThisResponse.current = true;

      const reply = (result: Record<string, unknown>) =>
        send({
          type: "conversation.item.create",
          item: { type: "function_call_output", call_id: callId, output: JSON.stringify(result) },
        });

      if (name === "hand_over") {
        leavingRef.current = true;
        reply({ ok: true, note: "The column is yours again. Say goodbye in one sentence and stop." });
        window.setTimeout(handOver, LAST_WORD_MS);
        return;
      }
      if (name !== "answer") {
        reply({ ok: false, error: `unknown tool ${name}` });
        return;
      }

      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(rawArgs || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }
      const field = typeof args.field === "string" ? args.field : "";
      const value = typeof args.value === "string" ? args.value : "";
      const { run: r, coaching: c } = stateRef.current;
      const landed = landAnswer(r, c, field, value);
      /* Either way the coach has something to say next — the question it should
         have asked, or the one the column has just moved on to. It is mid-turn
         as this arrives, so this queues rather than interrupts, and a reader who
         talked over it cancels the turn and gets the next word instead. */
      requestResponse();
      if (!landed.ok) {
        reply({ ok: false, error: landed.error, next: columnNote(r, c) });
        return;
      }

      /* The column is about to move because the coach moved it. Remember that,
         so the note that would otherwise follow the navigation isn't sent
         twice — the answer's own result already carries the next question,
         which is what keeps the conversation from stalling for a round trip. */
      const moved = columnHref(landed.run, landed.coaching, {}, "");
      ownMoveRef.current = moved;
      toldRef.current = moved;
      reply({ ok: true, next: columnNote(landed.run, landed.coaching) });
      router.push(landed.href);
    },
    [handOver, requestResponse, router, send],
  );

  const handleEvent = useCallback(
    (ev: RealtimeEvent) => {
      switch (ev.type) {
        case "response.created":
          responseActive.current = true;
          toolsThisResponse.current = false;
          answeredThisResponse.current = false;
          captionRef.current = "";
          break;
        case "response.done": {
          responseActive.current = false;
          // Speak first, then move the column: if the coach only moved it — or
          // only said a preamble before doing so — ask it to say the next
          // question now. A response the reader talked over gets no follow-up;
          // their answer is the next turn.
          const cancelled = ev.response?.status === "cancelled";
          const followUp =
            !cancelled && (responseQueued.current || (toolsThisResponse.current && !answeredThisResponse.current));
          responseQueued.current = false;
          toolsThisResponse.current = false;
          if (followUp && !leavingRef.current) requestResponse();
          break;
        }
        case "response.output_item.added":
          if (ev.item?.type === "message" && ev.item.phase !== "commentary") answeredThisResponse.current = true;
          break;
        // The same call arrives twice — as its arguments finish, and as the
        // completed output item. Whichever lands first runs it.
        case "response.function_call_arguments.done":
          runToolCall(ev.name, ev.call_id, ev.arguments);
          break;
        case "response.output_item.done":
          if (ev.item?.type === "function_call") runToolCall(ev.item.name, ev.item.call_id, ev.item.arguments);
          if (ev.item?.type === "message" && ev.item.phase !== "commentary") answeredThisResponse.current = true;
          break;
        case "response.output_audio_transcript.delta":
          captionRef.current += ev.delta ?? "";
          setCaption(captionRef.current);
          break;
        case "response.output_audio_transcript.done":
          if (ev.transcript) setCaption(ev.transcript);
          break;
        case "output_audio_buffer.stopped":
        case "output_audio_buffer.cleared":
          if (leavingRef.current) handOver();
          break;
        case "input_audio_buffer.speech_started":
          setHearing(true);
          break;
        case "input_audio_buffer.speech_stopped":
          setHearing(false);
          break;
        case "error":
          if (ev.error?.code === "conversation_already_has_active_response") {
            // The server started a response itself just as we asked for one.
            responseActive.current = true;
            responseQueued.current = true;
            break;
          }
          // A failed response never sends response.done; don't wait for one.
          responseActive.current = false;
          responseQueued.current = false;
          toolsThisResponse.current = false;
          setError(ev.error?.message ?? "The coach hit an error.");
          break;
      }
    },
    [handOver, requestResponse, runToolCall],
  );

  const start = useCallback(async () => {
    try {
      const res = await fetch("/api/jam/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow: "column" }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message || "Couldn't reach the coach.");
      }
      const { clientSecret } = (await res.json()) as { clientSecret: string };
      if (!mountedRef.current) return;

      let mic: MediaStream;
      try {
        mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        throw new Error(
          "I need your microphone to hear you. Allow it in the browser and try again — or type your answers instead, it's the same conversation.",
        );
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
        const el = audioRef.current;
        if (!el) return;
        el.srcObject = e.streams[0];
        // A browser that won't play audio it wasn't asked for by hand gets a
        // button rather than a coach nobody can hear.
        el.play().catch(() => setBlocked(true));
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          setError("The connection to the coach dropped.");
          stop("error");
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
        const { run: r, coaching: c } = stateRef.current;
        toldRef.current = columnHref(r, c, {}, "");
        tell(columnNote(r, c));
        responseActive.current = true;
        /* Only the first hello is a hello. Typing an answer reloads the page,
           and stopping and starting again is allowed at any point — neither is
           a new conversation, and being greeted twice would say it was. */
        const opening = r.who
          ? "You're picking a conversation back up that was already under way — they've answered some of this already, and it's all still on screen. Don't greet them again and don't recap. Ask the question the [column] note gives you, in its words, and nothing else."
          : "They have just asked you to talk. Say hello in one short sentence — you help turn a goal into an outcome worth chasing — and then ask the question the [column] note gives you, in its words. Nothing else: no preamble about how this works, no list of what you're going to do.";
        send({ type: "response.create", response: { instructions: opening } });
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
      stop("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [handleEvent, send, stop, tell]);

  /** Trying again by hand, after the coach was stopped or couldn't be reached. */
  const restart = useCallback(() => {
    setError(null);
    setBlocked(false);
    setCaption("");
    setStatus("connecting");
    void start();
  }, [start]);

  /**
   * The press on "◉ Talk to me" is what starts this, and it happened one
   * navigation ago — so connecting on arrival here is that press being
   * honoured, not a page that makes a noise by itself. It runs once; `start`
   * and `stop` are the only things this depends on and neither changes.
   *
   * The call is kicked off out of band rather than from the effect body: the
   * connection is an external system, and everything it eventually puts on
   * screen belongs to the socket rather than to this render.
   */
  useEffect(() => {
    mountedRef.current = true;
    const kickoff = window.setTimeout(() => void start(), 0);
    return () => {
      window.clearTimeout(kickoff);
      mountedRef.current = false;
      leavingRef.current = false;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * The reader answered by hand — tapped an answer, typed one, or took a link
   * back. The column has already moved; tell the coach where it went and let it
   * pick the conversation up from there, rather than re-asking a question that
   * has an answer sitting above it.
   */
  useEffect(() => {
    if (status !== "live") return;
    if (toldRef.current === signature) return;
    toldRef.current = signature;
    if (ownMoveRef.current === signature) return;
    const { run: r, coaching: c } = stateRef.current;
    tell(`They answered on the page rather than out loud.\n\n${columnNote(r, c)}`);
    requestResponse();
  }, [signature, status, requestResponse, tell]);

  function toggleMute() {
    const next = !muted;
    micRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  }

  const turn = turnFor(run, coaching);
  const live = status === "live";

  /* Hand the coach's words up to the live turn, so what you read is what you
     just heard. `coachSays` is the stable setter context, so writing here never
     re-renders this component. On the way out the live turn goes back to the
     column's own wording — the conversation is over, the record stands. */
  useEffect(() => {
    coachSays?.setCaption(caption);
  }, [caption, coachSays]);
  useEffect(() => {
    coachSays?.setLive(live);
    return () => coachSays?.setLive(false);
  }, [live, coachSays]);

  return (
    <div className="rounded-2xl border border-dashed border-ink/25 bg-white/60 px-5 py-4">
      <audio ref={audioRef} autoPlay hidden />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${
              live ? (hearing ? "bg-happier" : "bg-sooner") : status === "error" ? "bg-red-500" : "bg-ink/40"
            }`}
          />
          {status === "connecting" && "Connecting to the coach…"}
          {live && (muted ? "Muted — I can't hear you" : hearing ? "I'm listening…" : "We're talking. Just answer.")}
          {status === "ended" && "We've stopped talking. The column is still here."}
          {status === "error" && "I couldn't get my voice working"}
        </span>

        {live ? (
          <>
            <button type="button" onClick={toggleMute} aria-pressed={muted} className={SWITCH}>
              {muted ? "◉ unmute" : "◼ mute"}
            </button>
            <button type="button" onClick={() => stop()} className={SWITCH}>
              ◼ stop talking
            </button>
          </>
        ) : (
          <button type="button" onClick={restart} className={SWITCH}>
            ◉ {status === "connecting" ? "connecting…" : "talk to me again"}
          </button>
        )}
      </div>

      {/* Whatever the coach says is in print, in the live turn above — it is
          the coach's own wording now, so that is where it belongs rather than
          repeated down here as a caption. What is left for this line is the
          thing the live turn cannot say: that the voice itself went wrong. */}
      <p aria-live="polite" className="mt-2 min-h-6 text-sm text-ink-soft">
        {error}
      </p>

      {blocked ? (
        <button
          type="button"
          onClick={() => {
            void audioRef.current?.play().then(() => setBlocked(false));
          }}
          className="mt-1 rounded-full border border-ink/20 bg-white px-4 py-2 text-sm font-medium hover:border-ink/40"
        >
          ♪ Let me speak — your browser is holding the sound back
        </button>
      ) : null}

      <p className="mt-2 text-sm text-ink-soft/75">
        {live && turn.kind === "ask" ? (
          <>Answer out loud, or tap and type below — it&rsquo;s the same conversation either way. </>
        ) : null}
        {status === "error" || status === "ended" ? (
          <>
            <Link href={columnHref(run, coaching, { voice: "off" })} className="underline underline-offset-2">
              Carry on without me talking
            </Link>{" "}
            and the questions below still work exactly as they are.{" "}
          </>
        ) : null}
        Your voice goes to OpenAI for as long as we&rsquo;re talking and nothing is kept here — no recording, no
        transcript. <Link href="/privacy" className="underline underline-offset-2">Privacy</Link>.
      </p>
    </div>
  );
}
