import { NextResponse } from "next/server";
import { SITE } from "@/lib/config";
import type { BoardColumnKey } from "@/lib/github";

const STAGE_LABELS: BoardColumnKey[] = ["idea", "discussing", "doing", "done"];

/**
 * Moves an idea between board columns by swapping its stage label on GitHub.
 * Requires GITHUB_TOKEN with issues:write on the repo; without it the board is read-only.
 */
export async function POST(req: Request) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Board is read-only: no GITHUB_TOKEN configured on the server." },
      { status: 501 }
    );
  }

  let body: { number?: number; to?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const number = Number(body.number);
  const to = String(body.to ?? "") as BoardColumnKey;
  if (!Number.isInteger(number) || number <= 0 || !STAGE_LABELS.includes(to)) {
    return NextResponse.json({ error: "Expected { number, to: idea|discussing|doing|done }" }, { status: 400 });
  }

  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const base = `https://api.github.com/repos/${SITE.repo}/issues/${number}`;

  const issueRes = await fetch(base, { headers, cache: "no-store" });
  if (!issueRes.ok) {
    return NextResponse.json({ error: `GitHub: ${issueRes.status}` }, { status: 502 });
  }
  const issue = (await issueRes.json()) as { labels: ({ name?: string } | string)[] };
  const current = issue.labels
    .map((l) => (typeof l === "string" ? l : l.name ?? ""))
    .filter(Boolean);

  const next = [...current.filter((l) => !STAGE_LABELS.includes(l.toLowerCase() as BoardColumnKey)), to];

  const patch = await fetch(base, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ labels: next }),
  });
  if (!patch.ok) {
    return NextResponse.json({ error: `GitHub: ${patch.status}` }, { status: 502 });
  }
  return NextResponse.json({ ok: true, number, to });
}
