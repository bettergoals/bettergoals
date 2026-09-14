"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { BROUGHT_MAX, matchSpoken, wordCount, type TriageAnswer } from "@/lib/triage";

/**
 * The spoken half of the conversation (slides 4 and 5). CARD 2, extended by
 * idea #121.
 *
 * Originally this was "…or just say it": a button you pressed before anything
 * listened, under a coach that never made a sound. Choosing "◉ Talk to me"
 * bought you a microphone, not a conversation. So now, in speaking mode, the
 * coach reads its question out loud and the microphone opens the moment it
 * stops — the triage is a conversation from the first answer, which is the
 * point at which trust either starts or doesn't.
 *
 * Both halves are the browser's own, running locally: speech synthesis for the
 * coach's voice, speech recognition for yours. Nothing is uploaded, nothing is
 * stored, and the coach is not involved — a spoken answer goes exactly where
 * tapping the same answer would have gone. This changes no coach behaviour and
 * no scoring; CARD A holds.
 *
 * It is an enhancement and behaves like one. With JavaScript off, or in a
 * browser without speech recognition, the tapped answers underneath are the
 * whole interface — and a browser that can speak but not listen still gets read
 * to. The word "listening" only ever appears while the microphone is genuinely
 * open.
 *
 * Three rules the audio has to keep, from PRINCIPLES.md, "Accessible to
 * everyone" (WCAG 2.0 AA, 1.4.2 Audio Control):
 *  - nothing ever speaks on arrival. The coach's voice starts because you
 *    pressed "Talk to me", never because a page loaded.
 *  - while it is speaking there is a visible control that stops it — which is
 *    also how you interrupt, because talking over someone is how conversations
 *    work.
 *  - the run carries `voice=off`, so "stop reading it out" is a decision that
 *    sticks for the rest of the conversation rather than for one question.
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

/** The coach's voice, where the browser has one. Silence is a fine outcome. */
function synthesis(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return null;
  return window.speechSynthesis;
}

/**
 * Speech support never changes mid-page, so there is nothing to subscribe to.
 * The server can't know the answer, so it gets "unknown" and renders nothing —
 * which is also what a reader with JavaScript off is left with, correctly.
 */
const subscribeToNothing = () => () => {};
const hasRecognition = () => (recognitionCtor() !== null ? "yes" : "no");
const notOnTheServer = () => "unknown" as const;

/**
 * How long to wait for a voice that was asked to speak and hasn't. A browser
 * that refuses — no user gesture behind it, no voices installed — says nothing
 * and reports nothing, and a coach that is silently not speaking must not leave
 * the reader waiting for it. Long enough that a voice which is merely slow to
 * warm up is not cut off.
 */
const SILENCE_IS_AN_ANSWER = 1500;

type Phase = "idle" | "speaking" | "listening" | "going" | "missed" | "blocked";

export function SayIt({
  answers,
  hrefs,
  freeTextHref,
  invitation,
  max = BROUGHT_MAX,
  say,
  auto = false,
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
  /**
   * How much of what was said is carried, matching the typed field beside it —
   * a triage answer is a phrase, a coaching answer is a sentence. Same bound
   * either way you answer, so speaking is never the lesser route.
   */
  max?: number;
  /**
   * The coach's question, to be read out loud before the microphone opens. The
   * same string that is printed above — never a spoken-only rewording, so what
   * you heard is always there to re-read. Unset means the coach stays quiet.
   */
  say?: string;
  /**
   * Open the microphone without being asked. True whenever the reader chose to
   * talk: having chosen it once, they should not have to choose it again at
   * every turn.
   */
  auto?: boolean;
}) {
  const router = useRouter();
  /** Whether this browser can listen at all — only knowable once it's running. */
  const supported = useSyncExternalStore(subscribeToNothing, hasRecognition, notOnTheServer);
  const [phase, setPhaseState] = useState<Phase>("idle");
  const [heard, setHeard] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  /** The handlers fire outside React's world, so they read the phase from here. */
  const phaseRef = useRef<Phase>("idle");
  /** One second chance per question. Thinking before answering is not a miss. */
  const secondChance = useRef(true);

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  /** Stop the coach mid-sentence and mean it: no handler fires afterwards. */
  const hush = useCallback(() => {
    const speaking = utterance.current;
    if (speaking) {
      speaking.onstart = null;
      speaking.onend = null;
      speaking.onerror = null;
    }
    utterance.current = null;
    synthesis()?.cancel();
  }, []);

  /** Leaving the step mid-sentence closes the microphone and the coach's mouth. */
  useEffect(() => () => {
    recognition.current?.abort();
    hush();
  }, [hush]);

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
        router.push(freeTextHref.replace("__SAID__", encodeURIComponent(trimmed.slice(0, max))));
        return;
      }
      setPhase("missed");
    },
    [answers, hrefs, freeTextHref, max, router, setPhase]
  );

  /**
   * The handlers below outlive the render that made them, and `listen` is
   * rebuilt whenever its props change. They go through here so a microphone
   * that reopens is always the current one.
   */
  const listenRef = useRef<() => void>(() => {});

  const listen = useCallback(() => {
    hush();
    const Ctor = recognitionCtor();
    if (!Ctor) {
      setPhase("idle");
      return;
    }
    recognition.current?.abort();

    const rec = new Ctor();
    rec.lang = document.documentElement.lang || "en";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    /* Nothing said, and it wasn't the microphone's fault. Once — and only
       once — open it again rather than making the reader press something: a
       pause before answering a coaching question is thinking, not a failure. */
    const nothingHeard = () => {
      if (auto && secondChance.current) {
        secondChance.current = false;
        listenRef.current();
        return;
      }
      setPhase("missed");
    };

    let said = "";
    rec.onresult = (event) => {
      let running = "";
      for (let i = 0; i < event.results.length; i += 1) running += ` ${event.results[i][0].transcript}`;
      said = running.trim();
      setHeard(said);
    };
    /* A microphone that has been replaced still reports back — `abort()` and a
       failed `start()` both end the old one after the new one is open. Only the
       microphone currently on the page is allowed to say anything. */
    const current = () => recognition.current === rec;
    rec.onerror = (event) => {
      if (!current()) return;
      const denied = event.error === "not-allowed" || event.error === "service-not-allowed";
      if (denied) {
        setPhase("blocked");
        return;
      }
      setPhase("idle");
      nothingHeard();
    };
    rec.onend = () => {
      if (!current() || phaseRef.current !== "listening") return;
      if (said.trim()) decide(said);
      else {
        setPhase("idle");
        nothingHeard();
      }
    };

    recognition.current = rec;
    setHeard("");
    setPhase("listening");
    rec.start();
  }, [auto, decide, hush, setPhase]);

  useEffect(() => {
    listenRef.current = listen;
  });

  /**
   * The coach takes its turn: it says the question, then it listens. This is
   * the whole of idea #121 — everything else here is what has to be true for
   * it to be safe.
   *
   * It runs on arriving at a question, so every navigation is a new turn. It
   * never runs unless `auto` is set, which only speaking mode sets, which only
   * a press on "Talk to me" reaches.
   */
  useEffect(() => {
    if (!auto || supported === "unknown") return;
    const synth = say ? synthesis() : null;
    if (!synth || !say) {
      listenRef.current();
      return;
    }

    const line = new SpeechSynthesisUtterance(say);
    line.lang = document.documentElement.lang || "en";
    const thenListen = () => {
      utterance.current = null;
      listenRef.current();
    };
    /* The label follows the sound, not the intention: "Reading it out" appears
       when a voice actually starts, so a browser that quietly refuses to speak
       never puts a stop control on screen for audio nobody can hear. */
    line.onstart = () => setPhase("speaking");
    line.onend = thenListen;
    line.onerror = thenListen;
    utterance.current = line;

    /* No `cancel()` first: the turn before this one cancelled itself on the way
       out, and Chrome drops an utterance queued in the same tick as a cancel. */
    synth.speak(line);

    const waited = window.setTimeout(() => {
      if (utterance.current === line && !synth.speaking) thenListen();
    }, SILENCE_IS_AN_ANSWER);

    return () => {
      window.clearTimeout(waited);
      hush();
    };
  }, [auto, say, supported, hush, setPhase]);

  if (supported === "unknown") return null;

  /**
   * Some browsers have no speech recognition at all. Say so rather than leave
   * an invitation to talk that nothing is listening to — the tapped answers
   * above are the same conversation, and typing is a link away. The coach can
   * still read the question out in there, so the stop control comes too.
   */
  const instead = answers.length ? "Tap an answer" : "Type it instead";

  if (supported === "no") {
    return (
      <div className="space-y-2">
        {phase === "speaking" ? (
          <button
            type="button"
            onClick={() => {
              hush();
              setPhase("idle");
            }}
            className="rounded-full border border-ink/20 bg-white px-4 py-2 text-sm font-medium text-ink hover:border-ink/40 hover:bg-ink/[0.03]"
          >
            ◼ Stop reading it out
          </button>
        ) : null}
        <p className="text-sm text-ink-soft">
          This browser won&rsquo;t let me listen. {instead} — it&rsquo;s the same conversation either way.
        </p>
      </div>
    );
  }

  /* One control, three jobs, because in a conversation they are the same job:
     interrupt the coach, open the microphone, close it again. */
  const label =
    phase === "speaking"
      ? "◼ Reading it out — tap to jump in"
      : phase === "listening"
        ? "◉ Listening — tap when you're done"
        : `◉ ${invitation}`;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={phase === "listening" ? () => recognition.current?.stop() : listen}
        className="rounded-full border border-ink/20 bg-white px-4 py-2 text-sm font-medium text-ink hover:border-ink/40 hover:bg-ink/[0.03]"
      >
        {label}
      </button>
      <p aria-live="polite" className="min-h-5 text-sm text-ink-soft">
        {phase === "listening" ? (heard ? `“${heard}”` : "Go ahead.") : null}
        {phase === "going" ? "Got it." : null}
        {phase === "missed"
          ? heard
            ? `I heard “${heard}”, and I'm not sure which one you meant. ${instead} and we'll carry on.`
            : `I didn't catch that. Tap to talk when you're ready — or ${instead.toLowerCase()} and we'll carry on.`
          : null}
        {/* Since the microphone now opens on its own, "blocked" most often
            means the browser wants to be asked by hand first rather than that
            anyone said no. Both readings get the same honest sentence. */}
        {phase === "blocked"
          ? `Your browser won't open the microphone unless you ask it to. Tap to talk — or ${instead.toLowerCase()}, it's the same conversation either way.`
          : null}
      </p>
    </div>
  );
}
