"use server";

import {
  type CoachStage,
  type CoachTurn,
  CoachAiError,
  MAX_ANSWER_LENGTH,
  MAX_TURNS,
  coachAiEnabled,
  coachOutcome,
} from "@/lib/coachAi";
import { MAX_INPUT_LENGTH, evaluateOutcome } from "@/lib/outcomeCoach";
import { INITIAL_STATE, type CoachState } from "./state";

function field(data: FormData, name: string, max: number): string {
  const v = data.get(name);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function readTurns(data: FormData): CoachTurn[] {
  const raw = data.get("turns");
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((t) => {
        const turn = t as { question?: unknown; answer?: unknown };
        return {
          question: typeof turn?.question === "string" ? turn.question.trim().slice(0, 500) : "",
          answer: typeof turn?.answer === "string" ? turn.answer.trim().slice(0, MAX_ANSWER_LENGTH) : "",
        };
      })
      .filter((t) => t.question && t.answer)
      .slice(-MAX_TURNS * 3);
  } catch {
    return [];
  }
}

/** The questions the last review asked, paired with whatever the author typed under each. */
function readAnswers(data: FormData): CoachTurn[] {
  const turns: CoachTurn[] = [];
  for (let i = 0; i < 3; i++) {
    const question = field(data, `q${i}`, 500);
    const answer = field(data, `a${i}`, MAX_ANSWER_LENGTH);
    if (question && answer) turns.push({ question, answer });
  }
  return turns;
}

export async function coachAction(prev: CoachState, data: FormData): Promise<CoachState> {
  const seq = prev.seq + 1;

  // "Start again": throw the whole conversation away and hand back a blank
  // form. It goes through the action rather than a link because the draft, the
  // review and the turns all live in this form's state — navigating to /coach
  // leaves that state exactly where it was, which is why the old link looked
  // like it did nothing.
  if (data.get("restart")) return { ...INITIAL_STATE, cleared: true, seq };

  const draft = field(data, "outcome", MAX_INPUT_LENGTH);
  const priorTurns = readTurns(data);
  // "Skip the questions" is a submit button; the page carries the answer to it
  // forward in a hidden field so a later pass doesn't ask all over again.
  const skipped = field(data, "skipped", 4) === "1" || field(data, "skip", 4) === "1";

  // "Use this as my draft" without JavaScript: swap the draft in and hand the
  // page back for the author to fill in the «placeholders» before checking.
  const adopt = field(data, "adopt", 2000);
  if (adopt) {
    return {
      ...prev,
      draft: adopt,
      turns: priorTurns,
      skipped,
      notice: "Your draft has been replaced with the candidate. Fill in anything in «guillemets», then check it again.",
      tooShort: false,
      cleared: false,
      seq,
    };
  }

  const base: CoachState = {
    draft,
    turns: [...priorTurns, ...readAnswers(data)],
    skipped,
    review: null,
    fallback: null,
    fallbackReason: null,
    notice: null,
    tooShort: false,
    cleared: false,
    seq,
  };

  // The structural check is the honest floor: too thin to score is too thin to coach.
  const structural = evaluateOutcome(draft);
  if (!structural) return { ...base, tooShort: true };

  if (!coachAiEnabled()) {
    return {
      ...base,
      fallback: structural,
      fallbackReason:
        "The AI coach isn't switched on for this deployment, so this is the structural check: it reads words, not meaning, and it can't ask you questions.",
    };
  }

  // A first draft gets the clarifying round: the questions come before any
  // wording. Answers, or an explicit skip, move it on to the full review.
  const stage: CoachStage = base.turns.length === 0 && !skipped ? "clarify" : "review";

  try {
    const review = await coachOutcome(draft, base.turns, stage);
    return { ...base, review };
  } catch (err) {
    const message = err instanceof CoachAiError ? err.message : "The AI coach hit an unexpected error";
    return {
      ...base,
      fallback: structural,
      fallbackReason: `${message}. Here is the structural check instead — try the coach again in a moment.`,
    };
  }
}
