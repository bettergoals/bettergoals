/**
 * The can't-share off-ramp — CARD 3.
 *
 * Step 04 has two answers and both of them lead somewhere. "Yes" continues down
 * the column into the seam; "no" leaves the spine for the handover that already
 * exists on this site: the skill, where to install it, and the prompt to carry
 * back. Slide 7 of `docs/reference/voice-coach-deck.md` names those three in
 * that order and explicitly does not redraw them — pack one already designed
 * them, and `/skills` is where they live here.
 *
 * So this file is wiring, not a new screen. It turns the run into a link to
 * `/skills`, and builds the one piece of that screen the shelf could not have
 * on its own: a prompt that already knows what you brought.
 *
 * Three things it deliberately does not do:
 *  - it does not coach. The prompt is instructions for the leader's own
 *    assistant, inside their own walls. Nothing here changes how our coach
 *    behaves or what the quality signal does — CARD A, rule 10.
 *  - it does not invent a canvas order. The five boxes and their sequence come
 *    from `lib/canvas.ts`, the shared constant — rule 11.
 *  - it does not persist. What you brought travels in the query string and
 *    nowhere else; close the tab and it is gone.
 */

import { CANVAS_ORDER } from "./canvas";
import { BROUGHT_ANSWERS, BROUGHT_MAX, type Run, type Who } from "./triage";

/**
 * The skill the off-ramp hands over. The deck calls it `better-goals.skill`;
 * on this site that is `writing-better-goals`, the coach's own material.
 *
 * A room of you gets the facilitator skill named alongside it, because a room
 * that can't share still has a room to run. That is the same call the column
 * makes at step 02, not a new one.
 */
export const HANDOVER_SKILL = { file: "writing-better-goals.md", name: "writing-better-goals" } as const;
export const ROOM_SKILL = { file: "goal-jam-facilitator.md", name: "goal-jam-facilitator" } as const;

export function skillFor(who: Who | null) {
  return who === "room" ? ROOM_SKILL : HANDOVER_SKILL;
}

/** What you brought, in the words the chip above the fold already uses. */
export function broughtInWords(brought: string): string {
  return BROUGHT_ANSWERS.find((a) => a.value === brought)?.chip ?? brought;
}

/**
 * The link out. It carries only the two answers the handover actually uses —
 * what you brought and whether there's a room of you — because the point of
 * this path is that less of you travels, not more.
 *
 * `carry=1` is what tells `/skills` it is being arrived at rather than browsed,
 * so the shelf stays exactly as it was for everyone else.
 */
export function handoverHref(run: Run): string {
  const q = new URLSearchParams({ carry: "1" });
  if (run.brought) q.set("brought", run.brought);
  if (run.who) q.set("who", run.who);
  return `/skills?${q.toString()}#carry-back`;
}

export type CarryBack = { brought: string | null; who: Who | null };

/** Read the arrival back off the query string. Null means nobody arrived. */
export function readCarryBack(params: Record<string, string | string[] | undefined>): CarryBack | null {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
  if (one(params.carry) !== "1") return null;
  const brought = one(params.brought)?.trim().slice(0, BROUGHT_MAX) || null;
  const who = one(params.who);
  return { brought, who: who === "me" || who === "room" ? who : null };
}

/**
 * How we'd like someone else's assistant to run this conversation.
 *
 * These are this product's own rules, restated for somewhere we can't reach:
 * one question at a time, the gap in words and never scored, "I don't know"
 * written down as an open question rather than treated as a blank, and nothing
 * asked about an identifiable person. They are not new behaviour and they are
 * not this file's opinion — they are PRINCIPLES.md and CARD A's contract 1, in
 * the second person.
 *
 * Shared, because both ways out of this column hand over a prompt: the
 * can't-share off-ramp below (CARD 3) and the takeaway at step 13
 * (`lib/takeaway.ts`, CARD 6). The two prompts differ in what they carry — one
 * has a canvas in it and the other deliberately doesn't — but they must never
 * differ in how they ask for the coaching to be done.
 */
export const COACHING_RULES: readonly string[] = [
  `- Ask me one question at a time and wait for the answer. Don't fill the boxes in for me.`,
  `- Where an answer is thin, say what's thin and why, in words. No score, no total, no percentage, no grade.`,
  `- Where I genuinely don't know, write it down as an open question for me to take back to my team. That's a real answer, not a gap to fill.`,
  `- Deviate from the order where the conversation calls for it, then come back to it.`,
  /* Idea #140. The golden thread on bettergoals.ai/okrs, carried into the
     conversation someone has elsewhere: an outcome sits at one of three
     horizons, and the early signal is relative to whichever one it is. */
  `- Settle early whether this is a multi-year, an annual or a quarterly outcome, and hold me to it. The golden thread nests quarterly outcomes inside annual ones and annual inside multi-year. Leading indicators are whatever tells us we're on track long before that horizon is up — weeks for a quarter, months for a year.`,
  `- Don't ask me for anything about an identifiable person. Work with the role instead.`,
];

/**
 * The prompt to carry back — the third thing on screen D.
 *
 * It asks the leader's own assistant to run the conversation our coach would
 * have run: the five boxes in the shared order, one question at a time, the gap
 * spoken in words and never scored, and "I don't know" written down as an open
 * question rather than treated as a blank. Those are this product's rules,
 * restated for somewhere we can't reach — not new behaviour.
 */
export function carryBackPrompt({ brought, who }: CarryBack): string {
  const skill = skillFor(who);
  const room = who === "room";
  const boxes = CANVAS_ORDER.map((b) => `${b.numeral} ${b.label}`).join("\n");

  return [
    `I'm working on a goal that stays inside our organisation, so I'm doing this here with you rather than on bettergoals.ai.`,
    ``,
    brought ? `What I've brought: ${broughtInWords(brought)}.` : `I haven't written anything down yet.`,
    room ? `There's a room of us, so you're helping me facilitate, not just me think.` : `It's just me.`,
    ``,
    `Use the "${skill.name}" skill. Coach me through the SSH Outcome Canvas, working the five boxes in this order:`,
    ``,
    boxes,
    ``,
    `How I'd like you to do it:`,
    ...COACHING_RULES,
    ``,
    `Finish with the goal in the Sooner Safer Happier pattern: an objective written as an outcome hypothesis at its horizon, with leading indicators that tell us we're on track long before that and one lagging indicator that would convince a sceptic. Show me the filled-in canvas, open questions and all.`,
  ].join("\n");
}
