"use client";

import { useEffect, useRef } from "react";
import { FaceArt, MOUTH_OPEN, MOUTH_SHUT } from "./FaceArt";

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
 *  - it is a woman's face, because the voice is a woman's (idea #182). The
 *    drawing lives in `FaceArt`, so the "Talk to me" answer can wear it too.
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
      <FaceArt mouthRef={mouthRef} eyesRef={eyesRef} />
    </span>
  );
}
