import { SITE } from "./config";

export type Idea = {
  number: number;
  title: string;
  excerpt: string;
  url: string;
  votes: number;
  comments: number;
  author: string;
  avatar: string;
  labels: string[];
  state: "open" | "closed";
  updatedAt: string;
};

export type BoardColumnKey = "idea" | "discussing" | "doing" | "done";

export type Board = {
  columns: Record<BoardColumnKey, Idea[]>;
  source: "github" | "demo";
  fetchedAt: string;
};

export const COLUMN_ORDER: { key: BoardColumnKey; title: string; hint: string }[] = [
  { key: "idea", title: "Ideas", hint: "Anything goes — add yours" },
  { key: "discussing", title: "Discussing", hint: "Being shaped by the group" },
  { key: "doing", title: "Doing", hint: "Claude is building these" },
  { key: "done", title: "Done", hint: "Live on the site" },
];

type GitHubIssue = {
  number: number;
  title: string;
  body?: string | null;
  html_url: string;
  state: "open" | "closed";
  comments: number;
  updated_at: string;
  pull_request?: unknown;
  user?: { login?: string; avatar_url?: string } | null;
  labels: ({ name?: string } | string)[];
  reactions?: { "+1"?: number };
};

function labelNames(issue: GitHubIssue): string[] {
  return issue.labels
    .map((l) => (typeof l === "string" ? l : l.name ?? ""))
    .filter(Boolean)
    .map((l) => l.toLowerCase());
}

function toIdea(issue: GitHubIssue): Idea {
  const body = (issue.body ?? "").replace(/[#>*_`\[\]]/g, "").replace(/\s+/g, " ").trim();
  return {
    number: issue.number,
    title: issue.title,
    excerpt: body.length > 180 ? body.slice(0, 177) + "…" : body,
    url: issue.html_url,
    votes: issue.reactions?.["+1"] ?? 0,
    comments: issue.comments,
    author: issue.user?.login ?? "someone",
    avatar: issue.user?.avatar_url ?? "",
    labels: labelNames(issue),
    state: issue.state,
    updatedAt: issue.updated_at,
  };
}

function columnFor(idea: Idea): BoardColumnKey {
  // Most-advanced label wins so an idea only appears in one column.
  if (idea.labels.includes("done")) return "done";
  if (idea.labels.includes("doing")) return "doing";
  if (idea.labels.includes("discussing")) return "discussing";
  return "idea";
}

const DEMO_IDEAS: Partial<Record<BoardColumnKey, Partial<Idea>[]>> = {
  idea: [
    { number: 101, title: "Goal anti-patterns gallery", excerpt: "A wall of real (anonymised) bad goals and what makes them bad — output-fixation, vanity metrics, 47 KPIs per team.", votes: 2, author: "demo" },
    { number: 102, title: "ElevenLabs goal coach with live chalkboard", excerpt: "A voice agent that coaches you on writing better goals while sketching ideas in chalk on a shared blackboard for group jam sessions.", votes: 4, author: "demo" },
  ],
  discussing: [
    { number: 103, title: "Outcome vs output checker", excerpt: "Paste a goal, get instant feedback: is this an outcome or an output? Does it name a customer? Can you measure it sooner than year-end?", votes: 5, author: "demo" },
  ],
  doing: [
    { number: 104, title: "Better goals starter templates", excerpt: "Downloadable templates for OKRs and outcome hypotheses aligned to better value sooner safer happier.", votes: 6, author: "demo" },
  ],
  done: [
    { number: 105, title: "The bettergoals.ai site itself", excerpt: "This site — built live with the community, one endorsed idea at a time.", votes: 7, author: "demo" },
  ],
};

function demoBoard(): Board {
  const columns = { idea: [], discussing: [], doing: [], done: [] } as Board["columns"];
  for (const { key } of COLUMN_ORDER) {
    columns[key] = (DEMO_IDEAS[key] ?? []).map((d) => ({
      number: d.number ?? 0,
      title: d.title ?? "",
      excerpt: d.excerpt ?? "",
      url: `https://github.com/${SITE.repo}/issues`,
      votes: d.votes ?? 0,
      comments: 0,
      author: d.author ?? "demo",
      avatar: "",
      labels: [key],
      state: "open",
      updatedAt: new Date().toISOString(),
    }));
  }
  return { columns, source: "demo", fetchedAt: new Date().toISOString() };
}

export async function fetchBoard(): Promise<Board> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${SITE.repo}/issues?state=all&per_page=100&sort=updated`,
      { headers, next: { revalidate: 15 } }
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const issues = (await res.json()) as GitHubIssue[];

    const columns = { idea: [], discussing: [], doing: [], done: [] } as Board["columns"];
    for (const raw of issues) {
      if (raw.pull_request) continue;
      const idea = toIdea(raw);
      // closed issues only show if explicitly done
      if (idea.state === "closed" && !idea.labels.includes("done")) continue;
      columns[columnFor(idea)].push(idea);
    }
    for (const { key } of COLUMN_ORDER) columns[key].sort((a, b) => b.votes - a.votes);
    return { columns, source: "github", fetchedAt: new Date().toISOString() };
  } catch {
    return demoBoard();
  }
}
