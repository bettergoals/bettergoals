/**
 * Where sent feedback is kept.
 *
 * This is the site's only server-side write, and it is deliberately narrow.
 * One row is created when somebody reads the summary of their own answers and
 * presses send. Nothing else about the visit is recorded: no IP address, no
 * user agent, no cookie, no page views, no identifier that would let two
 * submissions be tied to the same person. The contact field is stored only
 * because they typed it in and asked to be contacted.
 *
 * The GitHub route in `lib/feedback.ts` still exists and still works. This is
 * the option for the many people who have no GitHub account and would rather
 * not create one to tell us the text is too small.
 *
 * Configuration: DATABASE_URL — see lib/db.ts. Unset = the page offers the
 * GitHub and copy routes only, exactly as it did before this module existed.
 */

import { createHash } from "node:crypto";
import { db, isDatabaseReady } from "@/lib/db";
import type { Feedback } from "@/lib/feedback";

export type StoredFeedback = {
  id: number;
  createdAt: string;
  title: string;
  answers: Feedback["answers"];
  contact: string | null;
  markdown: string;
};

/**
 * Create the table on first use and remember that we did.
 *
 * There is no migration tool here on purpose: one table, created if absent, is
 * the whole schema. If this ever grows a second table, that is the moment to
 * add real migrations rather than keep bolting statements on here.
 */
let schema: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schema) {
    schema = (async () => {
      const sql = db();
      await sql`
        create table if not exists feedback (
          id bigserial primary key,
          created_at timestamptz not null default now(),
          title text not null,
          answers jsonb not null,
          contact text,
          markdown text not null,
          fingerprint text not null
        )
      `;
      await sql`create index if not exists feedback_created_at_idx on feedback (created_at desc)`;
      await sql`create index if not exists feedback_fingerprint_idx on feedback (fingerprint)`;
    })().catch((error) => {
      // Don't cache a failure: a cold Neon branch that timed out once should be
      // retried on the next submission rather than poisoning the instance.
      schema = null;
      throw error;
    });
  }
  return schema;
}

/**
 * A content hash used only to spot a double submission — a second press of the
 * button, a refreshed POST. Not an identifier: it is derived from the answers
 * themselves, so two people who answer identically hash identically, which is
 * why it is only ever compared inside a short window.
 */
function fingerprintOf(feedback: Feedback): string {
  return createHash("sha256")
    .update(`${feedback.markdown}\n${feedback.contact ?? ""}`)
    .digest("hex");
}

export type SaveResult = "saved" | "duplicate";

/**
 * Store one piece of feedback. Returns "duplicate" when the identical text was
 * already stored minutes ago, so a double press is quietly ignored rather than
 * counted twice. Throws if the database is unreachable — the caller decides
 * what to show.
 */
export async function saveFeedback(feedback: Feedback): Promise<SaveResult> {
  await ensureSchema();
  const sql = db();
  const fingerprint = fingerprintOf(feedback);

  // The window is written inline: a tagged-template interpolation becomes a
  // bound parameter, and Postgres will not accept one inside an interval
  // literal.
  const existing = await sql`
    select id from feedback
    where fingerprint = ${fingerprint}
      and created_at > now() - interval '10 minutes'
    limit 1
  `;
  if (existing.length > 0) return "duplicate";

  await sql`
    insert into feedback (title, answers, contact, markdown, fingerprint)
    values (
      ${feedback.title},
      ${JSON.stringify(feedback.answers)}::jsonb,
      ${feedback.contact},
      ${feedback.markdown},
      ${fingerprint}
    )
  `;
  return "saved";
}

/** Everything stored, newest first. For the export route only. */
export async function listFeedback(limit = 500): Promise<StoredFeedback[]> {
  await ensureSchema();
  const sql = db();
  const rows = await sql`
    select id, created_at, title, answers, contact, markdown
    from feedback
    order by created_at desc
    limit ${limit}
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    createdAt: new Date(row.created_at as string).toISOString(),
    title: row.title as string,
    // jsonb normally arrives parsed; accept a string in case a driver or
    // connection setting hands it back raw.
    answers:
      typeof row.answers === "string"
        ? (JSON.parse(row.answers) as Feedback["answers"])
        : (row.answers as Feedback["answers"]),
    contact: (row.contact as string | null) ?? null,
    markdown: row.markdown as string,
  }));
}

export { isDatabaseReady };
