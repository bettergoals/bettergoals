"use client";

import { Caveat } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { BOARD_KINDS, KIND_LABEL, MAX_TEXT, type BoardItem, type BoardKind } from "@/lib/jamBoard";

const chalk = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

/** What the coach is doing right now, shown in chalk at the foot of the board. */
export type Activity = {
  state: "off" | "listening" | "hearing" | "thinking" | "speaking";
  /** The coach's words as they're spoken — live captions. */
  caption: string;
};

/** A board item, plus the moment it's being rubbed out. */
export type ShownItem = BoardItem & { ghost?: boolean };

const HEADING_COLOR: Record<BoardKind, string> = {
  candidate: "text-chalk",
  who: "text-sooner",
  better: "text-safer",
  signal: "text-happier",
  guardrail: "text-chalk/80",
  question: "text-chalk/80",
  note: "text-chalk/60",
};

const ACTIVITY: Record<Activity["state"], { label: string; dot: string }> = {
  off: { label: "Coach not connected", dot: "bg-chalk/30" },
  listening: { label: "Listening", dot: "bg-sooner chalk-pulse" },
  hearing: { label: "Hearing you…", dot: "bg-safer" },
  thinking: { label: "Thinking…", dot: "bg-happier chalk-pulse" },
  speaking: { label: "Coach speaking", dot: "bg-chalk" },
};

/** A little hand-drawn unevenness, stable per item. */
const TILT = ["-rotate-1", "rotate-0", "rotate-1", "rotate-0", "-rotate-[0.5deg]", "rotate-[0.5deg]"];
function tilt(id: string): string {
  const n = Number.parseInt(id.slice(1), 10) || 0;
  return TILT[n % TILT.length];
}

type Handlers = {
  onErase?: (id: string) => void;
  onEdit?: (id: string, text: string) => void;
  onAdd?: (kind: BoardKind, text: string) => void;
  onToggleStar?: (id: string) => void;
};

const INPUT_CLASS =
  "w-full rounded-md border border-chalk/30 bg-chalk/5 px-2 py-0.5 text-chalk placeholder:text-chalk/30 focus:border-chalk/70 focus:outline-none";

function ChalkInput({
  initial,
  placeholder,
  className,
  onCommit,
  onCancel,
}: {
  initial: string;
  placeholder?: string;
  className: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const commit = () => {
    const text = draft.trim();
    if (text && text !== initial) onCommit(text);
    else onCancel();
  };
  return (
    <input
      ref={ref}
      type="text"
      value={draft}
      maxLength={MAX_TEXT}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      className={`${INPUT_CLASS} ${className}`}
      aria-label={placeholder ?? "Edit chalk"}
    />
  );
}

function Chalk({
  item,
  size,
  editable,
  onErase,
  onEdit,
  onToggleStar,
}: { item: ShownItem; size: "lg" | "md"; editable: boolean } & Handlers) {
  const [editing, setEditing] = useState(false);
  const sizeClass = size === "lg" ? "text-2xl sm:text-3xl" : "text-xl";
  const canEdit = editable && !item.ghost;

  return (
    <li className={`group relative flex items-start gap-2 ${tilt(item.id)} ${sizeClass} leading-snug ${item.ghost ? "chalk-out" : ""}`}>
      {item.kind === "candidate" &&
        (canEdit && onToggleStar ? (
          <button
            type="button"
            onClick={() => onToggleStar(item.id)}
            aria-pressed={Boolean(item.starred)}
            aria-label={item.starred ? "Un-star this goal" : "Star this goal as chosen by the group"}
            className={`shrink-0 rounded px-1 hover:bg-chalk/10 focus-visible:outline-2 focus-visible:outline-chalk ${
              item.starred ? "text-happier" : "text-chalk/30"
            }`}
          >
            {item.starred ? "★" : "☆"}
          </button>
        ) : (
          item.starred && (
            <span aria-label="chosen by the group" className="shrink-0 text-happier">
              ★
            </span>
          )
        ))}

      {editing && onEdit ? (
        <ChalkInput
          initial={item.text}
          className={sizeClass}
          onCommit={(text) => {
            setEditing(false);
            onEdit(item.id, text);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : canEdit && onEdit ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Click to rewrite"
          className={`min-w-0 text-left hover:bg-chalk/5 focus-visible:outline-2 focus-visible:outline-chalk ${
            item.starred ? "text-happier" : ""
          }`}
        >
          <span key={item.text} className="chalk-in">
            {item.text}
          </span>
        </button>
      ) : (
        <span className={`min-w-0 ${item.starred ? "text-happier" : ""}`}>
          <span key={item.text} className="chalk-in">
            {item.text}
          </span>
        </span>
      )}

      {canEdit && onErase && !editing && (
        <button
          type="button"
          onClick={() => onErase(item.id)}
          aria-label={`Rub out “${item.text}”`}
          className="ml-auto shrink-0 self-center rounded-full px-2 py-0.5 font-sans text-xs text-chalk/40 opacity-0 transition hover:bg-chalk/10 hover:text-chalk focus-visible:opacity-100 group-hover:opacity-100"
        >
          rub out
        </button>
      )}
    </li>
  );
}

function AddChalk({ kind, onAdd, size }: { kind: BoardKind; onAdd: (kind: BoardKind, text: string) => void; size: "lg" | "md" }) {
  const [open, setOpen] = useState(false);
  const sizeClass = size === "lg" ? "text-2xl" : "text-lg";
  if (open) {
    return (
      <li className={sizeClass}>
        <ChalkInput
          initial=""
          placeholder={kind === "candidate" ? "For [who], [what gets better], seen by [signal]…" : "Write here…"}
          className={sizeClass}
          onCommit={(text) => {
            setOpen(false);
            onAdd(kind, text);
          }}
          onCancel={() => setOpen(false)}
        />
      </li>
    );
  }
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded px-1 font-sans text-xs text-chalk/30 opacity-60 transition hover:bg-chalk/10 hover:text-chalk hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-chalk"
      >
        + pick up the chalk
      </button>
    </li>
  );
}

export function Chalkboard({
  items,
  activity,
  large = false,
  fill = false,
  onErase,
  onEdit,
  onAdd,
  onToggleStar,
}: {
  items: ShownItem[];
  activity?: Activity;
  /** Bigger type — the second screen or full-screen presenting. */
  large?: boolean;
  /** Fill the container (full-screen stage) instead of a card. */
  fill?: boolean;
} & Handlers) {
  const editable = Boolean(onErase || onEdit || onAdd || onToggleStar);
  const candidates = items.filter((i) => i.kind === "candidate");
  const columns = BOARD_KINDS.filter((k) => k !== "candidate").map((kind) => ({
    kind,
    items: items.filter((i) => i.kind === kind),
  }));
  const showColumns = columns.filter((c) => c.items.length > 0 || (editable && items.length > 0));
  const act = activity ? ACTIVITY[activity.state] : null;

  return (
    <section
      aria-label="Shared chalkboard"
      aria-live="polite"
      className={`${chalk.className} relative flex flex-col overflow-hidden bg-ink text-chalk ${
        fill
          ? "min-h-full flex-1 p-6 sm:p-10"
          : `rounded-3xl border-[10px] border-[#7a5a3a] shadow-2xl ${large ? "min-h-[70vh] p-8 sm:p-12" : "min-h-[24rem] p-6 sm:p-8"}`
      }`}
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 20% 10%, rgba(247,248,245,0.06), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(247,248,245,0.05), transparent 50%)",
      }}
    >
      <div className="flex-1">
        {items.length === 0 ? (
          <div>
            <p className={`${large ? "text-4xl" : "text-3xl"} text-chalk/50`}>
              The board is blank. Start talking — the coach will chalk up what matters.
            </p>
            {onAdd && (
              <ul className="mt-4">
                <AddChalk kind="candidate" onAdd={onAdd} size="lg" />
              </ul>
            )}
          </div>
        ) : (
          <>
            <h2 className={`font-sans text-sm font-bold uppercase tracking-widest ${HEADING_COLOR.candidate} opacity-60`}>
              {KIND_LABEL.candidate}
            </h2>
            <ul className="mt-3 space-y-3">
              {candidates.map((item) => (
                <Chalk
                  key={item.id}
                  item={item}
                  size="lg"
                  editable={editable}
                  onErase={onErase}
                  onEdit={onEdit}
                  onToggleStar={onToggleStar}
                />
              ))}
              {candidates.length === 0 && <li className="text-2xl text-chalk/40">No full goal yet — keep going.</li>}
              {onAdd && <AddChalk kind="candidate" onAdd={onAdd} size="lg" />}
            </ul>

            {showColumns.length > 0 && (
              <div className="mt-8 grid gap-6 border-t border-dashed border-chalk/20 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                {showColumns.map((c) => (
                  <div key={c.kind}>
                    <h3 className={`font-sans text-xs font-bold uppercase tracking-widest ${HEADING_COLOR[c.kind]}`}>
                      {KIND_LABEL[c.kind]}
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {c.items.map((item) => (
                        <Chalk key={item.id} item={item} size="md" editable={editable} onErase={onErase} onEdit={onEdit} />
                      ))}
                      {onAdd && <AddChalk kind={c.kind} onAdd={onAdd} size="md" />}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {act && (
        <footer className="mt-6 flex min-w-0 items-center gap-3 border-t border-dashed border-chalk/15 pt-3">
          <span className="flex shrink-0 items-center gap-2 font-sans text-xs font-semibold uppercase tracking-widest text-chalk/50">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${act.dot}`} />
            {act.label}
          </span>
          {activity?.caption && (
            <p className={`min-w-0 truncate ${large ? "text-2xl" : "text-lg"} text-chalk/70`} aria-label="Coach, live">
              “{activity.caption}”
            </p>
          )}
        </footer>
      )}
    </section>
  );
}
