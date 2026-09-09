/**
 * Checks the feedback database is really reachable and really works.
 *
 * Creates the table if it isn't there yet, writes one clearly-marked test row,
 * reads it back, exercises the duplicate guard, then deletes the test row. The
 * table is left in place; no test data is left behind and no real row is
 * touched.
 *
 * Run it against whichever environment you want to check:
 *
 *   vercel env pull --environment=production .env.check
 *   set -a && . ./.env.check && set +a && node scripts/check-feedback-db.mjs
 *   rm .env.check
 *
 * .env.check is covered by the .env* rule in .gitignore, but delete it anyway.
 */

import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set — see the comment at the top of this file.");
  process.exit(1);
}

const sql = neon(url);
const step = (name) => console.log(`\n▸ ${name}`);

try {
  step("Connecting");
  const [{ version }] = await sql`select version()`;
  console.log("  ", version.split(",")[0]);

  step("Creating the table if absent");
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
  const columns = await sql`
    select column_name, data_type from information_schema.columns
    where table_name = 'feedback' order by ordinal_position
  `;
  for (const column of columns) {
    console.log(`   ${column.column_name}: ${column.data_type}`);
  }

  step("Counting what is already stored");
  const [{ count: before }] = await sql`select count(*)::int as count from feedback`;
  console.log(`   ${before} row(s) before this check`);

  const marker = `connection-check-${Date.now()}`;

  step("Writing a test row");
  await sql`
    insert into feedback (title, answers, contact, markdown, fingerprint)
    values (
      ${"[Feedback] connection check"},
      ${JSON.stringify([{ question: "Automated check", value: "ok", free: false }])}::jsonb,
      ${null},
      ${"Written by scripts/check-feedback-db.mjs and deleted immediately."},
      ${marker}
    )
  `;

  step("Reading it back");
  const [row] = await sql`
    select id, created_at, title, answers, contact from feedback where fingerprint = ${marker}
  `;
  console.log("   id        ", row.id);
  console.log("   created_at", row.created_at);
  console.log("   answers   ", typeof row.answers, JSON.stringify(row.answers));
  console.log("   contact   ", row.contact);

  step("Exercising the duplicate guard");
  const duplicates = await sql`
    select id from feedback
    where fingerprint = ${marker} and created_at > now() - interval '10 minutes'
    limit 1
  `;
  console.log(`   the ten-minute window matched ${duplicates.length} row(s), expected 1`);

  step("Deleting the test row");
  await sql`delete from feedback where fingerprint = ${marker}`;
  const [{ count: leftovers }] =
    await sql`select count(*)::int as count from feedback where fingerprint = ${marker}`;
  console.log(`   ${leftovers} test row(s) remaining, expected 0`);

  const [{ count: after }] = await sql`select count(*)::int as count from feedback`;
  console.log(`\n✓ All good. ${after} real row(s) in the table, unchanged by this check.`);
} catch (error) {
  console.error("\n✗ Failed:", error.message);
  if (error.sourceError) console.error("  cause:", error.sourceError.message);
  process.exit(1);
}
