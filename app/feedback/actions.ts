"use server";

/**
 * Sending feedback to us directly, rather than to GitHub.
 *
 * A plain form post to a server action, so it works with JavaScript switched
 * off: the browser posts, we write one row, and the person lands on a
 * confirmation page. Nothing about the visit is recorded beyond the answers
 * they read and pressed send on — see lib/feedbackStore.ts.
 *
 * Every failure path returns them to the form with their answers intact and
 * the GitHub and copy routes still there, because the worst outcome is
 * somebody losing the sentence they just wrote.
 */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { fieldsToQuery, paramsFromFormData, readFeedback, readFields } from "@/lib/feedback";
import { isDatabaseReady, saveFeedback } from "@/lib/feedbackStore";

/**
 * A brake on someone scripting the form: counted in memory, per serverless
 * instance, and reset by a cold start. The address is used for the count and
 * then dropped — it is never written to the database or logged here.
 */
const WINDOW_MS = 10 * 60_000;
const PER_CLIENT = 8;
const seen = new Map<string, number[]>();

async function overLimit(now: number): Promise<boolean> {
  const head = await headers();
  const client =
    head.get("x-forwarded-for")?.split(",")[0]?.trim() || head.get("x-real-ip") || "unknown";
  const mine = (seen.get(client) ?? []).filter((t) => now - t < WINDOW_MS);
  if (mine.length >= PER_CLIENT) return true;
  mine.push(now);
  seen.set(client, mine);
  // Keep the map from growing without bound on a long-lived instance.
  if (seen.size > 500) {
    for (const [key, stamps] of seen) {
      if (stamps.every((t) => now - t >= WINDOW_MS)) seen.delete(key);
    }
  }
  return false;
}

export async function sendFeedback(form: FormData): Promise<void> {
  const params = paramsFromFormData(form);
  const fields = readFields(params);
  const feedback = readFeedback(params);
  const back = (problem: string) => {
    const query = fieldsToQuery(fields);
    return `/feedback?${query}${query ? "&" : ""}review=1&problem=${problem}#ready-heading`;
  };

  if (!feedback) redirect("/feedback?review=1");
  if (!isDatabaseReady()) redirect(back("off"));
  if (await overLimit(Date.now())) redirect(back("busy"));

  try {
    await saveFeedback(feedback);
  } catch (error) {
    console.error("feedback: could not save", error);
    redirect(back("failed"));
  }

  redirect("/feedback/sent");
}
