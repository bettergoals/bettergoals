"use client";

import { useEffect, useRef } from "react";

/**
 * The coach's face. Idea #179: "could the voice coach also have a human-like
 * AI avatar?"
 *
 * A drawn face, not a photo-real one, and that is on purpose:
 *
 *  - it is plainly a drawing, so nobody mistakes the coach for a person on a
 *    video call. The coach is an AI and the face says so.
 *  - it is made here, in SVG, from the coach's own audio. No avatar service, no
 *    video stream, no new dependency, and nothing about the reader or the
 *    conversation goes anywhere it wasn't already going (PRINCIPLES.md, "Refuses
 *    personal information").
 *  - the skin is a tint of the site's blue rather than any human skin tone, so
 *    the face doesn't belong to one kind of person more than another.
 *
 * The mouth follows the real loudness of the coach's voice, read from the
 * incoming WebRTC stream with an AnalyserNode, so it moves when the coach
 * speaks and stops when the coach stops. If the browser won't run the audio
 * graph, the `speaking` flag from the Realtime events moves it instead.
 *
 * It is decoration: `aria-hidden`, because the status line next to it already
 * says, in words, who is talking. It only moves while the coach is speaking,
 * which the reader can stop at any time. With reduced motion asked for, the
 * mouth just sits open while the coach talks and the eyes never blink.
 */

export type FaceState = "connecting" | "speaking" | "listening" | "idle" | "error";

/** Mouth heights in viewBox units: shut, and wide open. */
const MOUTH_SHUT = 0.8;
const MOUTH_OPEN = 7;

export function CoachFace({ stream, state }: { stream: MediaStream | null; state: FaceState }) {
  const mouthRef = useRef<SVGEllipseElement | null>(null);
  const eyesRef = useRef<SVGGElement | null>(null);
  const speakingRef = useRef(state === "speaking");

  useEffect(() => {
    speakingRef.current = state === "speaking";
  }, [state]);

  useEffect(() => {
    const mouth = mouthRef.current;
    const eyes = eyesRef.current;
    if (!mouth || !eyes) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let samples: Uint8Array<ArrayBuffer> | null = null;
    if (stream && !still && stream.getAudioTracks().length > 0) {
      try {
        ctx = new AudioContext();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.5;
        // Read-only tap: the source goes to the analyser and nowhere else, so
        // this never plays the coach a second time. The <audio> element does that.
        ctx.createMediaStreamSource(stream).connect(analyser);
        samples = new Uint8Array(new ArrayBuffer(analyser.fftSize));
        void ctx.resume().catch(() => {});
      } catch {
        ctx = null;
        analyser = null;
      }
    }

    let frame = 0;
    let open = 0;
    let nextBlink = performance.now() + 2500;
    let blinkUntil = 0;

    const draw = (now: number) => {
      const speaking = speakingRef.current;
      let target = 0;

      if (still) {
        target = speaking ? 0.5 : 0;
      } else if (analyser && samples && ctx?.state === "running") {
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (let i = 0; i < samples.length; i++) {
          const v = (samples[i] - 128) / 128;
          sum += v * v;
        }
        // Speech RMS sits around 0.02–0.2; stretch that across shut-to-open.
        target = Math.min(1, Math.sqrt(sum / samples.length) * 6);
      } else if (speaking) {
        // No audio graph to read: an easy syllable-ish rhythm while speaking.
        target = 0.35 + 0.3 * Math.abs(Math.sin(now / 110)) * Math.abs(Math.sin(now / 270));
      }

      // Opens quickly, closes a touch slower — reads as speech, not flicker.
      open += (target - open) * (target > open ? 0.6 : 0.3);
      mouth.setAttribute("ry", (MOUTH_SHUT + open * (MOUTH_OPEN - MOUTH_SHUT)).toFixed(2));

      // An occasional blink, only while the coach is talking: a face that never
      // blinks reads as a mask, and one that blinks forever is motion nobody
      // can switch off.
      if (!still && speaking && now > nextBlink) {
        blinkUntil = now + 140;
        nextBlink = now + 2800 + Math.random() * 2800;
      }
      eyes.style.transform = now < blinkUntil ? "scaleY(0.1)" : "";

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      void ctx?.close().catch(() => {});
    };
  }, [stream]);

  const ring =
    state === "speaking"
      ? "ring-sooner"
      : state === "listening"
        ? "ring-happier"
        : state === "error"
          ? "ring-red-500"
          : "ring-ink/20";

  return (
    <span
      aria-hidden
      className={`inline-block h-12 w-12 shrink-0 overflow-hidden rounded-full bg-chalk ring-2 ring-offset-2 ring-offset-white transition-shadow ${ring} ${
        state === "connecting" || state === "idle" || state === "error" ? "opacity-70" : ""
      }`}
    >
      <svg viewBox="0 0 48 48" className="h-full w-full">
        {/* Shoulders */}
        <path d="M6 48c2-9 9-13 18-13s16 4 18 13z" className="fill-ink-soft" />
        {/* Neck */}
        <rect x="20" y="29" width="8" height="8" rx="3" className="fill-sooner/30" />
        {/* Head */}
        <ellipse cx="24" cy="21" rx="11" ry="12.5" className="fill-[#dbe8fd]" />
        {/* Hair */}
        <path d="M13 19c0-8 5-11.5 11-11.5S35 11 35 19c-2-3-5-5.5-11-5.5S15 16 13 19z" className="fill-ink" />
        {/* Brows */}
        <path d="M17.5 17.2q2.5-1.4 5 0M25.5 17.2q2.5-1.4 5 0" className="stroke-ink" strokeWidth="1" fill="none" strokeLinecap="round" />
        {/* Eyes */}
        <g ref={eyesRef} style={{ transformOrigin: "24px 20.5px", transformBox: "view-box" }}>
          <ellipse cx="20" cy="20.5" rx="1.4" ry="1.7" className="fill-ink" />
          <ellipse cx="28" cy="20.5" rx="1.4" ry="1.7" className="fill-ink" />
        </g>
        {/* Mouth */}
        <ellipse ref={mouthRef} cx="24" cy="27.5" rx="3.6" ry={MOUTH_SHUT} className="fill-ink-soft" />
      </svg>
    </span>
  );
}
