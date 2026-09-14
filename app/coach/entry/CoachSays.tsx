"use client";

import { createContext, useContext, useMemo, useState } from "react";

/**
 * What the coach actually said, on its way to the printed column.
 *
 * The column prints every question as a turn, and those turns used to be the
 * only wording there was — the coach was handed each sentence and told to read
 * it out. The wording is the coach's now, so the printed line and the spoken
 * one would drift apart within a turn or two: you would hear one question and
 * read another, which is worse than either alone.
 *
 * So while the coach is talking, the live turn prints what the coach said. Only
 * the live one: an answered turn keeps the column's canonical question as the
 * record of what was asked, which is what the takeaway and the plain-document
 * reading are built on.
 *
 * Nothing here is stored. The caption lives in component state for as long as
 * the tab is open, exactly like the rest of the conversation, and the query
 * string remains the only place an *answer* ever lives.
 *
 * Two contexts, not one, on purpose: the value changes on every syllable the
 * coach speaks, and `TalkToMe` only ever writes. Keeping the setters in their
 * own context means the thing doing the writing never re-renders because of
 * what it wrote.
 */

type CoachSaysValue = {
  /** The coach's words this turn, as they arrive. Empty before it speaks. */
  caption: string;
  /** Whether a voice session is live. False means the column prints its own. */
  live: boolean;
};

type CoachSaysSetters = {
  setCaption: (text: string) => void;
  setLive: (live: boolean) => void;
};

const ValueCtx = createContext<CoachSaysValue | null>(null);
const SetterCtx = createContext<CoachSaysSetters | null>(null);

export function CoachSaysProvider({ children }: { children: React.ReactNode }) {
  const [caption, setCaption] = useState("");
  const [live, setLive] = useState(false);
  const value = useMemo(() => ({ caption, live }), [caption, live]);
  // `setCaption` and `setLive` are stable across renders, so this is built once.
  const setters = useMemo(() => ({ setCaption, setLive }), []);
  return (
    <SetterCtx.Provider value={setters}>
      <ValueCtx.Provider value={value}>{children}</ValueCtx.Provider>
    </SetterCtx.Provider>
  );
}

/** Null when the column is rendered without a voice session around it. */
export function useCoachSays(): CoachSaysValue | null {
  return useContext(ValueCtx);
}

/** Null outside the provider. Stable, so writing to it never causes a re-render. */
export function useCoachSaysSetters(): CoachSaysSetters | null {
  return useContext(SetterCtx);
}

/**
 * A turn the coach has taken. Greys once it has been answered; never removed.
 *
 * Greyed, not faded out: a spent turn is still the record of what was said, and
 * at step 04 it is the data line itself. It stays above 4.5:1 on chalk.
 *
 * While the coach is talking, the unspent turn shows the coach's own words
 * rather than the column's — see the note at the top of this file. Until it has
 * said anything, and whenever there is no voice session at all, the column's
 * wording stands, so the page reads correctly with JavaScript off and before a
 * word is spoken.
 */
export function Turn({ spent = false, children }: { spent?: boolean; children: React.ReactNode }) {
  const coach = useCoachSays();
  const spoken = !spent && coach?.live && coach.caption ? coach.caption : null;
  return (
    <div className={spent ? "text-ink-soft/70" : "text-ink"}>
      <div className="space-y-2 text-lg leading-relaxed sm:text-xl">
        {spoken ? <p>{spoken}</p> : children}
      </div>
    </div>
  );
}
