"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Board, BoardColumnKey, Idea } from "@/lib/github";
import { COLUMN_ORDER } from "@/lib/github";
import { ENDORSE_THRESHOLD, NEW_IDEA_URL } from "@/lib/config";

const COLUMN_ACCENT: Record<BoardColumnKey, string> = {
  idea: "border-t-ink/30",
  discussing: "border-t-safer",
  doing: "border-t-happier",
  done: "border-t-sooner",
};

function IdeaCard({
  idea,
  column,
  onMove,
  canMove,
}: {
  idea: Idea;
  column: BoardColumnKey;
  onMove: (idea: Idea, from: BoardColumnKey, to: BoardColumnKey) => void;
  canMove: boolean;
}) {
  const endorsed = idea.votes >= ENDORSE_THRESHOLD;
  return (
    <div
      draggable={canMove}
      onDragStart={(e) => {
        if (!canMove) return;
        e.dataTransfer.setData("text/plain", JSON.stringify({ number: idea.number, from: column }));
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        canMove ? "cursor-grab active:cursor-grabbing" : ""
      } ${endorsed ? "border-sooner/60 ring-1 ring-sooner/30" : "border-ink/10"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <a href={idea.url} target="_blank" rel="noreferrer" className="text-sm font-semibold leading-snug hover:underline">
          {idea.title}
        </a>
        <a
          href={idea.url}
          target="_blank"
          rel="noreferrer"
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
            endorsed ? "bg-sooner/15 text-sooner" : "bg-ink/5 text-ink-soft hover:bg-ink/10"
          }`}
          title="Vote with a 👍 reaction on the GitHub issue"
        >
          👍 {idea.votes}
        </a>
      </div>
      {idea.excerpt && <p className="mt-2 text-xs leading-relaxed text-ink-soft">{idea.excerpt}</p>}
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
        {idea.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={idea.avatar} alt="" className="h-4 w-4 rounded-full" />
        ) : null}
        <span>@{idea.author}</span>
        <span>·</span>
        <a href={idea.url} target="_blank" rel="noreferrer" className="hover:underline">💬 {idea.comments}</a>
        {endorsed && <span className="font-semibold text-sooner">endorsed</span>}
        {canMove && (
          <select
            aria-label="Move to column"
            value={column}
            onChange={(e) => onMove(idea, column, e.target.value as BoardColumnKey)}
            className="ml-auto rounded-md border border-ink/15 bg-chalk px-1 py-0.5 text-[11px] text-ink-soft"
          >
            {COLUMN_ORDER.map((c) => (
              <option key={c.key} value={c.key}>
                {c.key === column ? "Move to…" : c.title}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

function UnlockBar({ onUnlocked }: { onUnlocked: () => void }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/board/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Unlock failed");
      }
      onUnlocked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-happier/40 bg-happier/10 px-4 py-3"
    >
      <span className="text-sm font-semibold">🛠️ Builder mode is locked</span>
      <input
        type="password"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        placeholder="Facilitator passcode"
        className="rounded-full border border-ink/15 bg-white px-4 py-1.5 text-sm"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={busy || !passcode}
        className="rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-chalk disabled:opacity-50"
      >
        Unlock
      </button>
      {error && <span className="text-sm font-medium text-red-600">{error}</span>}
    </form>
  );
}

export default function BoardView({
  initial,
  builder = false,
  initialUnlocked = false,
}: {
  initial: Board;
  builder?: boolean;
  initialUnlocked?: boolean;
}) {
  const [board, setBoard] = useState<Board>(initial);
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const canMove = builder && unlocked;
  const [dragOver, setDragOver] = useState<BoardColumnKey | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/board", { cache: "no-store" });
      if (res.ok) setBoard(await res.json());
    } catch {
      /* keep last good board */
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  const moveIdea = useCallback(
    async (idea: Idea, from: BoardColumnKey, to: BoardColumnKey) => {
      if (from === to) return;
      // optimistic update
      setBoard((prev) => {
        const columns = { ...prev.columns };
        columns[from] = columns[from].filter((i) => i.number !== idea.number);
        columns[to] = [...columns[to], { ...idea, labels: [to] }].sort((a, b) => b.votes - a.votes);
        return { ...prev, columns };
      });
      try {
        const res = await fetch("/api/board/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ number: idea.number, to }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? `Move failed (${res.status})`);
        }
        if (to === "doing") showToast(`🤖 “${idea.title}” moved to Doing — Claude Code will pick it up.`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Move failed — reverting.");
        refresh();
      }
    },
    [refresh, showToast]
  );

  const handleDrop = useCallback(
    (to: BoardColumnKey) => (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(null);
      try {
        const { number, from } = JSON.parse(e.dataTransfer.getData("text/plain")) as {
          number: number;
          from: BoardColumnKey;
        };
        const idea = board.columns[from]?.find((i) => i.number === number);
        if (idea) moveIdea(idea, from, to);
      } catch {
        /* not our payload */
      }
    },
    [board, moveIdea]
  );

  return (
    <div>
      {builder && !unlocked && <UnlockBar onUnlocked={() => setUnlocked(true)} />}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {board.source === "github" ? (
            <>
              Live from GitHub · {ENDORSE_THRESHOLD}+ 👍 = endorsed
              {canMove && <> · drag cards between columns</>}
            </>
          ) : (
            <span className="rounded-full bg-happier/15 px-3 py-1 font-medium text-happier">
              Demo data — connect the GitHub repo to go live
            </span>
          )}
        </p>
        <a
          href={NEW_IDEA_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-chalk hover:bg-ink-soft"
        >
          + Add an idea
        </a>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMN_ORDER.map(({ key, title, hint }) => (
          <section
            key={key}
            onDragOver={(e) => {
              if (!canMove) return;
              e.preventDefault();
              setDragOver(key);
            }}
            onDragLeave={() => setDragOver((d) => (d === key ? null : d))}
            onDrop={canMove ? handleDrop(key) : undefined}
            className={`rounded-2xl border border-t-4 bg-chalk p-3 transition ${COLUMN_ACCENT[key]} ${
              dragOver === key ? "border-ink/40 bg-ink/5" : "border-ink/10"
            }`}
          >
            <div className="mb-3 px-1">
              <h2 className="font-bold">
                {title} <span className="text-sm font-normal text-ink-soft">({board.columns[key].length})</span>
              </h2>
              <p className="text-xs text-ink-soft">{hint}</p>
            </div>
            <div className="flex min-h-16 flex-col gap-3">
              {board.columns[key].length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink/20 p-4 text-center text-xs text-ink-soft">
                  {canMove ? "Drop an idea here" : "Nothing here yet"}
                </p>
              ) : (
                board.columns[key].map((idea) => (
                  <IdeaCard key={idea.number} idea={idea} column={key} onMove={moveIdea} canMove={canMove} />
                ))
              )}
            </div>
          </section>
        ))}
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-chalk shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
