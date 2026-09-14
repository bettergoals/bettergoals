"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { BROUGHT_MAX, matchSpoken, wordCount, type TriageAnswer } from "@/lib/triage";

/**
 * "…or just say it" — the spoken way to answer a triage question (slides 4 and
 * 5). CARD 2.
 *
 * The browser does the listening, locally, with the speech recognition it
 * already has. Nothing is uploaded, nothing is stored, and the coach is not
 * involved: a spoken answer goes exactly where tapping the same answer would
 * have gone. This changes no coach behaviour and no scoring — CARD A holds.
 *
 * It is an enhancement and behaves like one. With JavaScript off, or in a
 * browser without speech recognition, this renders nothing at all and the
 * tapped answers underneath are the whole interface. The word "listening"
 * only ever appears while the microphone is genuinely open.
 */

type SpeechAlternative = { transcript: string };
type SpeechResult = { 0: SpeechAlternative; isFinal: boolean };
type SpeechEvent = { results: { length: number } & Record<number, SpeechResult> };
type SpeechErrorEvent = { error: string };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Speech support never changes mid-page, so there is nothing to subscribe to.
 * The server can't know the answer, so it gets "unknown" and renders nothing —
 * which is also what a reader with JavaScript off is left with, correctly.
 */
const subscribeToNothing = () => () => {};
const hasRecognition = () => (recognitionCtor() !== null ? "yes" : "no");
const notOnTheServer = () => "unknown" as const;

type Phase = "idle" | "listening" | "going" | "missed" | "blocked";

export function SayIt({
  answers,
  hrefs,
  freeTextHref,
  invitation,
}: {
  /** The same answers that are on screen as buttons. */
  answers: readonly TriageAnswer[];
  /** Where each answer's value goes — built on the server, same as the buttons. */
  hrefs: Record<string, string>;
  /**
   * Where words that aren't one of the answers go, with `__SAID__` standing in
   * for them. Only the "tell me in your own words" step has one; without it, a
   * miss is a miss and the reader taps instead.
   */
  freeTextHref?: string;
  /** The coach's own invitation to speak, in this step's words. */
  invitation: string;
}) {
  const router = useRouter();
  /** Whether this browser can listen at all — only knowable once it's running. */
  const supported = useSyncExternalStore(subscribeToNothing, hasRecognition, notOnTheServer);
  const [phase, setPhaseState] = useState<Phase>("idle");
  const [heard, setHeard] = useState("");
  const recognition = useRef<Recognition | null>(null);
  /** The handlers fire outside React's world, so they read the phase from here. */
  const phaseRef = useRef<Phase>("idle");

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  /** Leaving the step mid-sentence closes the microphone. */
  useEffect(() => () => recognition.current?.abort(), []);

  /** A short answer picks the answer it names; anything longer stays in the leader's own words. */
  const decide = useCallback(
    (said: string) => {
      const trimmed = said.trim();
      const matched = matchSpoken(trimmed, answers);
      if (matched && hrefs[matched] && (!freeTextHref || wordCount(trimmed) <= 5)) {
        setPhase("going");
        router.push(hrefs[matched]);
        return;
      }
      if (freeTextHref) {
        setPhase("going");
        router.push(freeTextHref.replace("__SAID__", encodeURIComponent(trimmed.slice(0, BROUGHT_MAX))));
        return;
      }
      setPhase("missed");
    },
    [answers, hrefs, freeTextHref, router, setPhase]
  );

  const listen = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    recognition.current?.abort();

    const rec = new Ctor();
    rec.lang = document.documentElement.lang || "en";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let said = "";
    rec.onresult = (event) => {
      let running = "";
      for (let i = 0; i < event.results.length; i += 1) running += ` ${event.results[i][0].transcript}`;
      said = running.trim();
      setHeard(said);
    };
    rec.onerror = (event) => {
      const denied = event.error === "not-allowed" || event.error === "service-not-allowed";
      setPhase(denied ? "blocked" : "missed");
    };
    rec.onend = () => {
      if (phaseRef.current !== "listening") return;
      if (said.trim()) decide(said);
      else setPhase("missed");
    };

    recognition.current = rec;
    setHeard("");
    setPhase("listening");
    rec.start();
  }, [decide, setPhase]);

  const stop = useCallback(() => recognition.current?.stop(), []);

  if (supported === "unknown") return null;

  /**
   * Some browsers have no speech recognition at all. Say so rather than leave
   * an invitation to talk that nothing is listening to — the tapped answers
   * above are the same conversation, and typing is a link away.
   */
  if (supported === "no") {
    return (
      <p className="text-sm text-ink-soft">
        This browser won&rsquo;t let me listen. Tap an answer — it&rsquo;s the same conversation either
        way.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={phase === "listening" ? stop : listen}
        className="rounded-full border border-ink/20 bg-white px-4 py-2 text-sm font-medium text-ink hover:border-ink/40 hover:bg-ink/[0.03]"
      >
        {phase === "listening" ? "◉ Listening — tap when you're done" : `◉ ${invitation}`}
      </button>
      <p aria-live="polite" className="min-h-5 text-sm text-ink-soft">
        {phase === "listening" ? (heard ? `“${heard}”` : "Go ahead.") : null}
        {phase === "going" ? "Got it." : null}
        {phase === "missed"
          ? heard
            ? `I heard “${heard}”, and I'm not sure which one you meant. Tap an answer and we'll carry on.`
            : "I didn't catch that. Tap an answer and we'll carry on."
          : null}
        {phase === "blocked"
          ? "Your browser is keeping the microphone to itself. Tap an answer instead — it's the same conversation either way."
          : null}
      </p>
    </div>
  );
}
