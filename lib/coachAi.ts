/**
 * The AI Outcome Coach — the server-side bridge to the Vercel AI Gateway.
 *
 * `lib/outcomeCoach.ts` is the deterministic structural check: it reads words.
 * This module reads meaning. The model is handed the community's principles
 * (PRINCIPLES.md, verbatim) and asked to do what the "AI Outcome Coach design
 * principles" describe: score the draft against the outcome definition
 * principles, say honestly why, ask the questions the author most needs to
 * answer, and offer candidate rewrites that never invent a fact — anything the
 * author hasn't said is left as a «placeholder» for them to fill in.
 *
 * The conversation happens in two stages. On a first draft the coach is in the
 * "clarify" stage: it asks two or three questions about the context only the
 * author has — who they are in this, who it's for, what they hope changes — and
 * deliberately offers no candidate wording yet. Once there are answers (or the
 * author skips) it moves to "review" and helps them write it. Coaching before
 * ghost-writing: a rewrite built on guesses teaches nobody anything.
 *
 * The conversation is stateless on the server. Each request carries the draft
 * and every question-and-answer so far, and the reply is a complete review of
 * the draft *as clarified by the answers*. Nothing is stored — see /privacy.
 *
 * Zero data retention is set on every call, not assumed: see GATEWAY_PRIVACY
 * below. If the chosen model has no zero-retention provider, the gateway
 * refuses the request and the page falls back to the structural check — the
 * text is never quietly sent to a provider that would keep it.
 *
 * Configuration (server-only environment, never exposed to the browser):
 *   AI_GATEWAY_API_KEY   required — created in the Vercel dashboard (AI Gateway).
 *                        Unset = the page falls back to the structural check
 *                        and says so.
 *   AI_GATEWAY_MODEL     optional — gateway model slug; default below. Sonnet is
 *                        the default because a person is waiting on the page.
 *                        Must be a model some provider serves under ZDR, or
 *                        every call fails closed (see GATEWAY_PRIVACY).
 *   AI_GATEWAY_BASE_URL  optional — default https://ai-gateway.vercel.sh/v1
 *
 * No SDK: the gateway speaks the OpenAI chat-completions shape, so a fetch is
 * the whole dependency. The call streams and is accumulated here — a
 * non-streaming request sits byte-silent for the whole generation and is what
 * idle timeouts kill.
 */

import {
  CONTEXT_RULES,
  type OrgContext,
  contextHandoffBlock,
  contextPromptBlock,
  sanitiseContext,
} from "./orgContext";
import { type Band, type Check, type CheckStatus, bandFor } from "./outcomeCoach";

const BASE_URL = () => process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1";
const MODEL = () => process.env.AI_GATEWAY_MODEL || "anthropic/claude-sonnet-5";

/**
 * The data-protection terms every call is sent under, set per request so the
 * promise on /privacy lives in this repository rather than in a dashboard
 * someone might toggle.
 *
 *   zeroDataRetention      — route only to providers with a verified zero
 *                            data retention agreement: they process the text
 *                            to generate the reply and keep nothing after.
 *   disallowPromptTraining — and never train on it.
 *
 * The gateway treats these as filters, not preferences: if no provider for the
 * model qualifies, it returns `no_providers_available` and we show the
 * structural check instead. Failing closed is the point.
 * https://vercel.com/docs/ai-gateway/security-and-compliance/zdr
 */
export const GATEWAY_PRIVACY = { zeroDataRetention: true, disallowPromptTraining: true } as const;

/** Output budget. Generous: on some models this caps thinking and answer together. */
const MAX_TOKENS = 8000;
/** How long we'll wait on the gateway before giving up and showing the structural check. */
const TIMEOUT_MS = 90_000;

export const MAX_TURNS = 6;
export const MAX_ANSWER_LENGTH = 1500;

/** Whether the AI coach can run at all on this deployment. */
export function coachAiEnabled(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY);
}

export class CoachAiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** One question the coach asked and what the author said back. */
export type CoachTurn = { question: string; answer: string };

/**
 * Where the conversation is up to. `clarify` = asking for the context it needs
 * before it will offer wording; `review` = coaching the draft as clarified.
 */
export type CoachStage = "clarify" | "review";

export type CoachCandidate = {
  text: string;
  /** Why this phrasing, and which «placeholders» the author still owes. */
  note: string;
};

export type CoachReview = {
  source: "ai";
  model: string;
  /** Which stage this reply is: `clarify` asks first and offers no candidates. */
  stage: CoachStage;
  /** The draft as reviewed. */
  text: string;
  verdict: "outcome" | "output" | "hybrid";
  /** One or two honest sentences. The first thing the author reads. */
  headline: string;
  score: number;
  max: number;
  band: Band;
  checks: Check[];
  strengths: Check[];
  gaps: Check[];
  /** 1–3 questions, most important first. Empty when `done`. */
  questions: string[];
  /** 0–3 candidate rewrites. Never contain facts the author didn't give, and
   *  always empty in the `clarify` stage — questions come before wording. */
  candidates: CoachCandidate[];
  /** Set when the draft or answers contained personal information that was set aside. */
  personalInfo: string | null;
  /** "Better, not perfect": the thinking has moved enough to stop coaching. */
  done: boolean;
  /** Ready-to-paste prompt for carrying on with a human or an AI holding a skill. */
  handoffPrompt: string;
};

/**
 * The seven checks, fixed. The model fills them in; it doesn't get to invent
 * new ones or drop inconvenient ones, so a score always means the same thing
 * and matches the structural check's rubric one for one.
 */
export const CHECK_DEFS: ReadonlyArray<Pick<Check, "id" | "title" | "principle">> = [
  { id: "customer", title: "Customer and problem", principle: "Start with customer and problem" },
  { id: "outcome", title: "An outcome, not an output", principle: "Outcomes over outputs" },
  { id: "measures", title: "Measures of movement and impact", principle: "Measure movement and impact" },
  { id: "baseline", title: "Baseline, target and timeframe", principle: "Measure movement and impact" },
  { id: "hypothesis", title: "A bet you can test", principle: "Outcomes are hypotheses" },
  { id: "sowhat", title: "The “so what”", principle: "Connect to strategy and value" },
  { id: "plain", title: "Anyone can understand it", principle: "Written so anyone can understand it" },
];

const STATUS_POINTS: Record<CheckStatus, number> = { strong: 2, partial: 1, missing: 0 };

/* ------------------------------------------------------------------------ */
/* The prompt                                                                */
/* ------------------------------------------------------------------------ */

const OUTCOME_PRINCIPLES = `### Start with customer and problem
Be clear about who we are creating value for, what problem or opportunity we are addressing, and why it matters now.

### Outcomes over outputs
Define the change or impact we want to achieve, not the project, activity, deliverable or solution we intend to produce. If you can complete a goal without anything getting better for anyone, it isn't a goal, it's a task list.

### Outcomes are hypotheses
Treat the outcome as a bet, not a certainty. Make the underlying insight or belief explicit, and leave room to experiment, learn and adapt how the outcome is achieved. Prefer bets you can test in weeks over ambitions you can only judge at year-end — the point of a goal is to create a feedback loop, not a verdict.

### Measure movement and impact
Define quantifiable measures of success: leading indicators that show whether we're on the right track, and a lagging indicator of the impact achieved. Where possible, establish the baseline, the target and the timeframe.

### Connect to strategy and value
Make the "so what?" clear. The outcome should create identifiable customer or organisational value and connect to the broader strategic direction and Golden Thread.

### Better value, sooner, safer, happier
Every goal should be able to answer four questions: What value? How will we see it sooner? What makes this safe — to attempt, to challenge, and to miss? Who ends up happier?

### Fewer, bigger, bolder
A dozen goals is a to-do list wearing a strategy's clothes. Set few enough outcomes that everyone can name them, and make each one worth the focus it demands.

### Written so anyone can understand it
Say it in plain language, without internal jargon, acronyms or project names. If someone who joined last week can't tell what would be different in the world if this outcome were achieved, it isn't clear enough yet.`;

const COACH_PRINCIPLES = `### Coach, don't dictate
Guide through questions, challenge and reflection rather than simply providing the answer. A leader should leave the conversation owning their goal, not holding a goal the AI wrote for them.

### Improve thinking, not just wording
Help leaders clarify the problem, the value and the intended outcome — not just produce a better-written goal. A beautifully phrased output goal is still an output goal.

### Challenge assumptions, don't invent them
Probe unclear assumptions, evidence, baselines and targets. Ask rather than make things up. A plausible-sounding number the coach invented is worse than an honest gap.

### Create clarity, preserve autonomy
Create clarity on the outcome and the measures of success without prescribing the solution or how it should be achieved. The "what" and the "why" are the coach's business; the "how" belongs to the team.

### Human judgement stays in the loop
AI can challenge, suggest and reframe; the leader remains accountable for the final outcome and the decisions that follow from it.

### Safe to share
Coaching conversations touch strategy, performance and people. Ask for the least detail needed to be useful, work happily with anonymised or redacted examples, and never require confidential material to give a good answer. Personal information is refused, not merely handled: if it arrives anyway, name it, swap it for a role, and carry on without it.

### Better, not perfect
A goal that is meaningfully clearer today beats a perfect one next quarter. Know when the thinking has moved enough, say so, and hand back a sharper goal and a next step rather than coaching on indefinitely.`;

const SYSTEM_PROMPT = `You are the Outcome Coach on bettergoals.ai, a community site from the Sooner Safer Happier executive community. A leader has pasted a goal — a rough thought, an objective, a whole OKR — and wants coaching: an honest score, the reasons, the questions they most need to answer, and help writing a better outcome. You coach to the community's principles, reproduced here.

## Outcome definition principles (the standard you score against)

${OUTCOME_PRINCIPLES}

## AI Outcome Coach design principles (how you behave)

${COACH_PRINCIPLES}

## What you return

Return ONLY a JSON object — no prose before or after, no markdown fences — with exactly this shape:

{
  "verdict": "outcome" | "output" | "hybrid",
  "headline": string,
  "checks": [
    { "id": "customer",   "status": "strong"|"partial"|"missing", "finding": string, "question": string, "nextStep": string },
    { "id": "outcome",    "status": "strong"|"partial"|"missing", "finding": string, "question": string, "nextStep": string },
    { "id": "measures",   "status": "strong"|"partial"|"missing", "finding": string, "question": string, "nextStep": string },
    { "id": "baseline",   "status": "strong"|"partial"|"missing", "finding": string, "question": string, "nextStep": string },
    { "id": "hypothesis", "status": "strong"|"partial"|"missing", "finding": string, "question": string, "nextStep": string },
    { "id": "sowhat",     "status": "strong"|"partial"|"missing", "finding": string, "question": string, "nextStep": string },
    { "id": "plain",      "status": "strong"|"partial"|"missing", "finding": string, "question": string, "nextStep": string }
  ],
  "questions": string[],
  "candidates": [ { "text": string, "note": string } ],
  "personalInfo": string | null,
  "done": boolean
}

The checks, and how to score them (2 for strong, 1 for partial, 0 for missing — the page adds them up out of 14):
- customer: names who gets a better experience (a customer, colleague or role) and what problem or opportunity this addresses, and ideally why now.
- outcome: describes a change in the world — behaviour, experience, results — rather than a project, deliverable, activity or solution. "Deliver", "build", "launch", "migrate", "implement" are the tell. A goal you could complete with nothing getting better for anyone is an output.
- measures: names how movement and impact would be seen — a leading indicator (early signal) and a lagging indicator (impact). One primary measure beats seven.
- baseline: gives the baseline, the target and the timeframe for the measure(s). All three present = strong; some = partial; none = missing.
- hypothesis: makes the underlying belief explicit ("we believe…", "because…") and leaves room to test it — a bet with an early signal in weeks, not a verdict at year-end.
- sowhat: says what value this creates and how it connects to the wider strategic direction. A goal whose achievement you could not explain to the board as mattering is missing this.
- plain: someone who joined last week could say what would be different if this were achieved. Jargon, unexplained acronyms, project code names and 40-word sentences count against it.

Rules for the checks:
- "finding": one to three sentences. Quote the author's own words where you can ("you wrote 'go live by year end'…") and say why that reads as it does. Be specific and kind. Most goals people paste are outputs — say so plainly.
- "question": the single question the author should sit with for this check. Coaching, not correction.
- "nextStep": one concrete, small thing to do next. Never a rewrite.
- A "strong" check still needs a finding (what's good and why). Its question and nextStep may then be about ambition or truth rather than structure.

Rules for "questions" (the coaching):
- 1 to 3 questions, most important first, that would move the thinking furthest. Prefer questions about the customer, the problem, the value and the outcome over questions about wording.
- Never repeat a question the author has already answered in the conversation, and never ask for a fact you could derive from what they said.
- Ask for the least detail needed. Anonymised, rounded and approximate answers are fine and you should say so when you ask for a number.
- Empty when "done" is true.

Rules for "candidates" (helping them write a better outcome):
- 0 to 3 candidate phrasings of the outcome, one or two sentences each, outcome-shaped, in plain language. Offer them so the author can pick and refine — you are a sparring partner, not a ghost-writer.
- NEVER invent a baseline, target, date, customer, cause or fact the author did not give you. Where a candidate needs one, write a placeholder in guillemets: «baseline», «target», «by when», «who». The "note" says why this phrasing and which placeholders the author still owes.
- Prefer one primary measure plus at most one guardrail. Do not add metrics.
- Offer none when the draft is too thin to rephrase honestly (the questions come first then), and none when "done" is true and the author's own wording is already the strong version.

Rules for "headline": one or two sentences of honest, direct feedback a busy leader reads first. Name the verdict in words and the one thing that would most change it.

Rules for "personalInfo": if the draft or an answer names an identifiable person, or carries contact details, individual performance, health or other personal data, set this to one sentence saying you have set it aside and are working with the role instead (e.g. "the new starter in support"). Do not repeat the personal information itself anywhere in your reply, including in findings and candidates. Otherwise null.

Rules for "done": true when the thinking has moved enough — every check strong, or the remaining gaps are about ambition and truth rather than structure — so the author should stop refining and take it to their team. When done, say so in the headline and hand back a next step, not more coaching.

Conversation: you may be given previous questions and the author's answers. Review the draft AS CLARIFIED BY THE ANSWERS — an answer that supplies the baseline counts as the baseline being known, even if the draft text hasn't been updated yet — and let the candidates carry those answers into the wording. Where an answer is "don't know" or "not relevant", treat that as settled and do not ask again in another form; suggest how they might find out in a nextStep instead.

Style: British English. Plain words. Warm and direct. No flattery, no hedging, no lecturing. Keep the whole reply well under 900 words.`;

/**
 * What changes between the two stages. Appended to the system prompt so the
 * shared rules above stay in one place and only the turn's job differs.
 */
const STAGE_PROMPT: Record<CoachStage, string> = {
  clarify: `## This turn: ask before you write

This is the author's first draft and they have told you nothing else yet. Do not write their outcome for them this turn. Ask first — the context you are missing is context only they have, and a phrasing built on your guesses teaches them nothing.

- "candidates" MUST be an empty array this turn. No exceptions, however obvious the rewrite looks.
- "questions": exactly two or three, most important first — the ones whose answers would most change how this outcome should be written. Choose from the context the draft has not given you: who the author is in this and what they can actually influence; who the outcome is for and what would be different for them; what impact or value they are hoping for and how they would see it; by when it needs to have moved. Never ask about something the draft already answers, and ask each thing once.
- Ask for nothing commercially confidential and nothing personal. No revenue or cost figures, customer or supplier names, contract terms, headcount, pricing, roadmap secrets, individual performance or anything under an NDA. Frame every question so it can be answered with a role, a direction, a rough percentage or a range — and say so in the question itself when you ask about a number ("a rough percentage is plenty").
- Still fill in all seven checks honestly, and still score the draft as it stands: the author should see where they are before they answer.
- "headline": one or two sentences saying how the draft reads today, and that you will help them phrase it once you know these couple of things.
- "done": true only if the draft genuinely needs nothing — every check strong. Otherwise false.`,

  review: `## This turn: coach the draft as clarified

The author has answered your questions, or asked you to get on with it. Review the draft as clarified by whatever they gave you, and now help them write it — the "candidates" rules above are in force. Carry their answers into the wording, keep asking only for what is still genuinely missing, and leave a «placeholder» wherever you would otherwise be guessing.`,
};

/**
 * The rules for using the author's context are only worth sending when there
 * is context to use — a call from someone who never filled it in is exactly
 * the same call it always was.
 */
const systemPrompt = (stage: CoachStage, hasAuthorContext: boolean): string =>
  [
    SYSTEM_PROMPT,
    STAGE_PROMPT[stage],
    hasAuthorContext ? `## Where the author works\n\n${CONTEXT_RULES}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

/* ------------------------------------------------------------------------ */
/* The call                                                                   */
/* ------------------------------------------------------------------------ */

type GatewayMessage = { role: "system" | "user" | "assistant"; content: string };

type GatewayStreamEvent = {
  choices?: { delta?: { content?: string | null }; finish_reason?: string | null }[];
  error?: { message?: string };
};

async function chat(messages: GatewayMessage[]): Promise<string> {
  const key = process.env.AI_GATEWAY_API_KEY;
  if (!key) throw new CoachAiError(503, "The AI coach is not configured (AI_GATEWAY_API_KEY is not set)");

  let res: Response;
  try {
    res = await fetch(`${BASE_URL()}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL(),
        max_tokens: MAX_TOKENS,
        stream: true,
        messages,
        providerOptions: { gateway: GATEWAY_PRIVACY },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err instanceof Error && err.name === "TimeoutError" ? "timed out" : "could not be reached";
    throw new CoachAiError(504, `The AI gateway ${reason}`);
  }

  if (!res.ok) {
    // The body goes to the server log, not the page: it can carry account
    // detail that has no business in front of a visitor.
    const body = await res.text();
    console.error(`[coach] AI gateway ${res.status}: ${body.slice(0, 500)}`);
    // The one refusal worth naming: no provider would take the request under
    // zero data retention, so nothing was sent. Say that, don't hide it behind
    // a status code — it's the promise working, not a fault.
    if (/no_providers_available|No ZDR/i.test(body)) {
      throw new CoachAiError(
        502,
        "No zero-data-retention provider was available for this model, so your draft wasn't sent anywhere"
      );
    }
    throw new CoachAiError(502, `The AI gateway refused the request (${res.status})`);
  }
  if (!res.body) throw new CoachAiError(502, "AI gateway returned no body");

  let content = "";
  let finish: string | undefined;
  let buffer = "";
  const decoder = new TextDecoder();
  for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let event: GatewayStreamEvent;
      try {
        event = JSON.parse(payload) as GatewayStreamEvent;
      } catch {
        continue; // a keep-alive or comment line, not ours to fail on
      }
      if (event.error) {
        console.error(`[coach] AI gateway stream error: ${String(event.error.message ?? "unknown").slice(0, 500)}`);
        throw new CoachAiError(502, "The AI gateway reported an error mid-reply");
      }
      const choice = event.choices?.[0];
      if (choice?.delta?.content) content += choice.delta.content;
      if (choice?.finish_reason) finish = choice.finish_reason;
    }
  }

  if (!content) throw new CoachAiError(502, "AI gateway returned no content");
  if (finish === "length") throw new CoachAiError(502, "The coach's reply was cut off at the output limit");
  return content;
}

/* ------------------------------------------------------------------------ */
/* Parsing and validation — the model proposes, this module decides           */
/* ------------------------------------------------------------------------ */

type RawCheck = { id?: unknown; status?: unknown; finding?: unknown; question?: unknown; nextStep?: unknown };
type RawReply = {
  verdict?: unknown;
  headline?: unknown;
  checks?: unknown;
  questions?: unknown;
  candidates?: unknown;
  personalInfo?: unknown;
  done?: unknown;
};

function parseJson(text: string): RawReply {
  // Strip a fence if the model added one despite instructions.
  const unfenced = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start < 0 || end <= start) throw new CoachAiError(502, "The coach's reply was not JSON");
  try {
    return JSON.parse(unfenced.slice(start, end + 1)) as RawReply;
  } catch {
    throw new CoachAiError(502, "The coach's reply was not valid JSON");
  }
}

const str = (v: unknown, max = 1200): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isStatus = (v: unknown): v is CheckStatus => v === "strong" || v === "partial" || v === "missing";

function normaliseChecks(raw: unknown): Check[] {
  const byId = new Map<string, RawCheck>();
  if (Array.isArray(raw)) {
    for (const c of raw as RawCheck[]) if (c && typeof c.id === "string") byId.set(c.id, c);
  }
  return CHECK_DEFS.map((def) => {
    const c = byId.get(def.id);
    if (!c || !isStatus(c.status)) {
      // Honest about the gap in the reply rather than pretending to a reading.
      return {
        ...def,
        status: "partial" as CheckStatus,
        finding: "The coach didn't return a reading for this check. Treat it as partly there and ask again.",
        question: "What would someone need to see in the draft to be sure of this?",
        nextStep: "Check again, or run the structural check for a reading that never varies.",
      };
    }
    return {
      ...def,
      status: c.status,
      finding: str(c.finding) || "No finding given.",
      question: str(c.question, 400) || "What would make this check strong?",
      nextStep: str(c.nextStep, 400) || "Revisit this after the questions above.",
    };
  });
}

function buildHandoffPrompt(
  text: string,
  turns: CoachTurn[],
  gaps: Check[],
  questions: string[],
  context: OrgContext | null
): string {
  const answered = turns.length
    ? ["What I've already clarified:", ...turns.map((t) => `- Q: ${t.question}\n  A: ${t.answer}`), ""]
    : [];
  const open = [...gaps.map((g) => `- ${g.title}: ${g.question}`), ...questions.map((q) => `- ${q}`)];
  return [
    "I'm working on a goal and I want coaching, not a rewrite.",
    "",
    ...contextHandoffBlock(context),
    "My draft:",
    '"""',
    text,
    '"""',
    "",
    ...answered,
    open.length ? "Still open:" : "Nothing structural is open. Push me on whether this is bold enough, and whether the measure is the right one.",
    ...open,
    "",
    "Coach me using the bettergoals.ai outcome principles: start with customer and problem;",
    "outcomes over outputs; treat the outcome as a hypothesis; measure movement and impact",
    "with a baseline, target and timeframe; connect it to strategy and value; and write it so",
    "anyone can understand it.",
    "",
    "Ask me one question at a time. Don't invent baselines, targets or facts I haven't given",
    "you — if something is missing, ask. I want to leave owning the goal, not holding one you wrote.",
  ].join("\n");
}

/* ------------------------------------------------------------------------ */
/* Public entry point                                                          */
/* ------------------------------------------------------------------------ */

function userMessage(draft: string, turns: CoachTurn[], stage: CoachStage, context: OrgContext | null): string {
  const parts = ["The author's draft:", '"""', draft, '"""'];
  const contextBlock = contextPromptBlock(context);
  if (contextBlock) parts.push("", contextBlock);
  if (turns.length) {
    parts.push("", "Questions you asked earlier, and the author's answers (review the draft as clarified by these):");
    turns.forEach((t, i) => {
      parts.push(`${i + 1}. Q: ${t.question}`, `   A: ${t.answer}`);
    });
  } else if (stage === "clarify") {
    parts.push("", "This is the clarifying round — no questions have been asked yet, and no candidate wording this turn.");
  } else {
    parts.push("", "The author skipped the clarifying round: they want your reading of the draft as it stands.");
  }
  parts.push("", "Return the JSON object now.");
  return parts.join("\n");
}

/**
 * Coach one draft, as clarified by any answers so far.
 *
 * `stage` is what the caller is asking for: "clarify" for a first draft (ask
 * the important questions, no wording yet) or "review" once there are answers
 * or the author has skipped ahead. The stage on the reply is the one that was
 * honoured — a draft the model finds already strong is never held back for
 * questions.
 *
 * `context` is what the author told the site about where they work (see
 * lib/orgContext.ts). It frames the coaching — their language, their cadence,
 * questions pitched at their role — and is never treated as a fact about the
 * goal. Omitted, the call is exactly the one it always was.
 *
 * Throws `CoachAiError` when the gateway isn't configured or fails; the caller
 * decides what to show instead (the structural check).
 */
export async function coachOutcome(
  draft: string,
  turns: CoachTurn[],
  stage: CoachStage = "review",
  context: OrgContext | null = null,
): Promise<CoachReview> {
  const text = draft.trim();
  const safeTurns = turns.slice(-MAX_TURNS * 3).map((t) => ({
    question: str(t.question, 500),
    answer: str(t.answer, MAX_ANSWER_LENGTH),
  }));
  const asked: CoachStage = safeTurns.length ? "review" : stage;
  // Clamped here as well as at the form's edge: this is the last point before
  // the author's words leave the building.
  const safeContext = context ? sanitiseContext(context) : null;

  const reply = await chat([
    { role: "system", content: systemPrompt(asked, Boolean(contextPromptBlock(safeContext))) },
    { role: "user", content: userMessage(text, safeTurns, asked, safeContext) },
  ]);
  const raw = parseJson(reply);

  const checks = normaliseChecks(raw.checks);
  const score = checks.reduce((total, c) => total + STATUS_POINTS[c.status], 0);
  const order: Record<CheckStatus, number> = { missing: 0, partial: 1, strong: 2 };
  const gaps = checks.filter((c) => c.status !== "strong").sort((a, b) => order[a.status] - order[b.status]);

  const verdict = raw.verdict === "outcome" || raw.verdict === "output" || raw.verdict === "hybrid" ? raw.verdict : "hybrid";
  const done = raw.done === true;

  // A draft with nothing left to fix isn't held back for questions.
  const stageOut: CoachStage = asked === "clarify" && !done ? "clarify" : "review";

  const questions = done
    ? []
    : (Array.isArray(raw.questions) ? raw.questions : []).map((q) => str(q, 500)).filter(Boolean).slice(0, 3);
  // The clarifying round exists to ask something: if the model returned no
  // questions, fall back to the ones the checks already produced.
  if (stageOut === "clarify" && !questions.length) {
    questions.push(...gaps.slice(0, 2).map((g) => g.question));
  }

  // The stage decides, not the model: no wording until it has asked.
  const candidates =
    stageOut === "clarify"
      ? []
      : (Array.isArray(raw.candidates) ? raw.candidates : [])
          .map((c) => {
            const cand = c as { text?: unknown; note?: unknown };
            return { text: str(cand?.text, 800), note: str(cand?.note, 500) };
          })
          .filter((c) => c.text)
          .slice(0, 3);

  return {
    source: "ai",
    model: MODEL(),
    stage: stageOut,
    text,
    verdict,
    headline: str(raw.headline, 600) || "Here is how the draft reads against the outcome principles.",
    score,
    max: checks.length * 2,
    band: bandFor(score),
    checks,
    strengths: checks.filter((c) => c.status === "strong"),
    gaps,
    questions,
    candidates,
    personalInfo: str(raw.personalInfo, 400) || null,
    done,
    handoffPrompt: buildHandoffPrompt(text, safeTurns, gaps.slice(0, 4), questions, safeContext),
  };
}
