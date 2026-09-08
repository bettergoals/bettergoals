/**
 * The goal jam chalkboard — shared between the voice coach's tool definitions
 * (server, `app/api/jam/session`) and the board the room sees (client,
 * `app/coach/jam`). Nothing here touches the network or a secret.
 *
 * The coach speaks; the board is the artefact. The model never writes prose
 * onto it — it calls `chalk_*` tools with short phrases, and the browser
 * applies them with `applyBoardAction`. Ids are short (`g1`, `g2`…) so the
 * model can refer back to them reliably in a spoken conversation.
 */

export const BOARD_KINDS = ["candidate", "who", "better", "signal", "guardrail", "question", "note"] as const;
export type BoardKind = (typeof BOARD_KINDS)[number];

export type BoardItem = {
  id: string;
  kind: BoardKind;
  text: string;
  /** A candidate the group has converged on. */
  starred?: boolean;
};

export const KIND_LABEL: Record<BoardKind, string> = {
  candidate: "Candidate goals",
  who: "Who it's for",
  better: "What gets better",
  signal: "Early signal (weeks, not quarters)",
  guardrail: "Guardrails",
  question: "Open questions",
  note: "Notes",
};

export type BoardAction =
  | { type: "write"; kind: BoardKind; text: string; id?: string }
  | { type: "update"; id: string; text?: string; starred?: boolean }
  | { type: "erase"; id: string }
  | { type: "clear" };

export const MAX_ITEMS = 40;
export const MAX_TEXT = 140;

function nextId(items: BoardItem[]): string {
  const n = items.reduce((max, item) => Math.max(max, Number.parseInt(item.id.slice(1), 10) || 0), 0);
  return `g${n + 1}`;
}

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);
}

/** Pure: returns the next board. Unknown ids and empty text are ignored. */
export function applyBoardAction(items: BoardItem[], action: BoardAction): BoardItem[] {
  switch (action.type) {
    case "write": {
      const text = clean(action.text);
      if (!text || !BOARD_KINDS.includes(action.kind)) return items;
      if (items.length >= MAX_ITEMS) return items;
      return [...items, { id: action.id ?? nextId(items), kind: action.kind, text }];
    }
    case "update":
      return items.map((item) =>
        item.id === action.id
          ? {
              ...item,
              text: action.text !== undefined && clean(action.text) ? clean(action.text) : item.text,
              starred: action.starred ?? item.starred,
            }
          : item
      );
    case "erase":
      return items.filter((item) => item.id !== action.id);
    case "clear":
      return [];
  }
}

/** What the model gets back after a tool call, so it always knows the ids. */
export function boardSummary(items: BoardItem[]): string {
  if (items.length === 0) return "(board is blank)";
  return items.map((i) => `${i.id} [${i.kind}${i.starred ? ", chosen" : ""}] ${i.text}`).join("\n");
}

/** For the copy button — the board as markdown the team can paste anywhere. */
export function boardAsMarkdown(items: BoardItem[]): string {
  const lines: string[] = ["# Goal jam board", ""];
  for (const kind of BOARD_KINDS) {
    const group = items.filter((i) => i.kind === kind);
    if (group.length === 0) continue;
    lines.push(`## ${KIND_LABEL[kind]}`);
    for (const item of group) lines.push(`- ${item.starred ? "★ " : ""}${item.text}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}

// --- What the coach can do to the board ------------------------------------

const KIND_DESCRIPTION =
  "candidate = a full goal in the form 'For [who], [what gets better], seen by [early signal]'. " +
  "who = a person or group who benefits. better = what measurably improves for them. " +
  "signal = evidence the group could see within weeks. guardrail = a measure that must not get worse. " +
  "question = something the group still has to answer. note = anything else worth keeping.";

/** OpenAI Realtime function tools. Kept in sync with `applyBoardAction`. */
export const JAM_TOOLS = [
  {
    type: "function",
    name: "chalk_write",
    description:
      "Write one short phrase (under 12 words) onto the room's shared chalkboard. Use it every time the group says something worth keeping. Returns the new item's id and the whole board. " +
      KIND_DESCRIPTION,
    parameters: {
      type: "object",
      properties: {
        kind: { type: "string", enum: [...BOARD_KINDS] },
        text: { type: "string", description: "The phrase to chalk up. Short, in the group's own words." },
      },
      required: ["kind", "text"],
    },
  },
  {
    type: "function",
    name: "chalk_update",
    description:
      "Rewrite an item on the board as the thinking sharpens, and/or mark a candidate goal as chosen by the group (starred). The board should show current best thinking, not history.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "The item id, e.g. g3." },
        text: { type: "string", description: "New wording. Omit to keep the wording." },
        starred: { type: "boolean", description: "true when the group has converged on this candidate." },
      },
      required: ["id"],
    },
  },
  {
    type: "function",
    name: "chalk_erase",
    description: "Rub one item off the board — it was answered, merged into another, or dropped by the group.",
    parameters: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    type: "function",
    name: "chalk_clear",
    description: "Wipe the whole board. Only when the group explicitly asks to start over.",
    parameters: { type: "object", properties: {} },
  },
] as const;

/** Runs a tool call from the model against the board. */
export function runBoardTool(
  items: BoardItem[],
  name: string,
  args: Record<string, unknown>
): { items: BoardItem[]; result: Record<string, unknown> } {
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  let action: BoardAction | null = null;
  switch (name) {
    case "chalk_write": {
      const kind = str(args.kind) as BoardKind | undefined;
      const text = str(args.text);
      if (!kind || !BOARD_KINDS.includes(kind) || !text) {
        return { items, result: { ok: false, error: "chalk_write needs a valid kind and text", board: boardSummary(items) } };
      }
      const id = nextId(items);
      action = { type: "write", kind, text, id };
      const next = applyBoardAction(items, action);
      const written = next.length > items.length;
      return {
        items: next,
        result: written
          ? { ok: true, id, board: boardSummary(next) }
          : { ok: false, error: `board is full (${MAX_ITEMS} items) — erase or merge first`, board: boardSummary(next) },
      };
    }
    case "chalk_update": {
      const id = str(args.id);
      if (!id) return { items, result: { ok: false, error: "chalk_update needs an id", board: boardSummary(items) } };
      if (!items.some((i) => i.id === id)) return { items, result: { ok: false, error: `no item ${id}`, board: boardSummary(items) } };
      action = { type: "update", id, text: str(args.text), starred: typeof args.starred === "boolean" ? args.starred : undefined };
      break;
    }
    case "chalk_erase": {
      const id = str(args.id);
      if (!id) return { items, result: { ok: false, error: "chalk_erase needs an id", board: boardSummary(items) } };
      action = { type: "erase", id };
      break;
    }
    case "chalk_clear":
      action = { type: "clear" };
      break;
    default:
      return { items, result: { ok: false, error: `unknown tool ${name}` } };
  }
  const next = applyBoardAction(items, action);
  return { items: next, result: { ok: true, board: boardSummary(next) } };
}

// --- Who the coach is --------------------------------------------------------

export function coachInstructions(names: string[]): string {
  const roster =
    names.length > 0
      ? `People in the room: ${names.join(", ")}. Use their names. Notice who hasn't spoken for a while and ask them directly — "Priya, what do you see that we don't?" — one person at a time.`
      : `You don't know who is in the room yet. Early on, ask for first names so you can bring quieter voices in by name.`;

  return `You are the bettergoals.ai voice coach, running a live "goal jam" with a leadership team who are together in a room, talking to you through one microphone. You are a sparring partner, not an auditor: direct, warm, curious, brief.

You are grounded in Sooner Safer Happier. A better goal describes a change in the world for a customer, colleague or citizen — not a list of things to build. Every goal should answer four questions: what value, and for whom? how could we see evidence sooner — in weeks, not quarters? what makes it safe to attempt, to challenge and to miss? who ends up happier, including the people doing the work?

THE BOARD. The room can see a shared chalkboard that only you can write on. It is the artefact of the session. Whenever the group says something worth keeping — a candidate goal, who it's for, what gets better for them, an early signal, a guardrail, an open question — chalk it up with chalk_write in their own words, under 12 words. As the thinking sharpens, chalk_update the existing item rather than adding a near-duplicate; erase what has been answered or dropped. The board should always show the group's current best thinking, not a transcript. Never read the board out in full — they can see it. Never invent numbers, baselines or facts; if something is unknown, put it on the board as a question.

HOW YOU RUN IT. Speak in short turns — one or two sentences, one question at a time, under 30 words. Open by asking what change they are hoping to see and for whom. Don't accept a solution ("launch the app", "finish the migration") as the goal — ask what it is in service of. When you hear an output dressed as an outcome, say so kindly and ask: could you hit this and have nothing improve for anyone? Ask what they would see in four weeks. Ask what would make it safe to miss. Invite disagreement: "Who in the room sees this differently?" Aim to converge on one to three goals, each in the form "For [who], [what gets better], seen by [early signal]", each with one primary measure and one guardrail. When the group agrees on a phrasing, chalk it as a candidate and mark it chosen with chalk_update starred=true.

${roster}

If several people talk at once or you can't tell who spoke, don't guess — ask. If the room goes quiet, offer one prompt, then wait. Keep the energy up and the goals small enough to learn from.`;
}
