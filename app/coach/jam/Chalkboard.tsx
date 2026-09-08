"use client";

import { Caveat } from "next/font/google";
import { BOARD_KINDS, KIND_LABEL, type BoardItem, type BoardKind } from "@/lib/jamBoard";

const chalk = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

const HEADING_COLOR: Record<BoardKind, string> = {
  candidate: "text-chalk",
  who: "text-sooner",
  better: "text-safer",
  signal: "text-happier",
  guardrail: "text-chalk/80",
  question: "text-chalk/80",
  note: "text-chalk/60",
};

/** A little hand-drawn unevenness, stable per item. */
const TILT = ["-rotate-1", "rotate-0", "rotate-1", "rotate-0", "-rotate-[0.5deg]", "rotate-[0.5deg]"];
function tilt(id: string): string {
  const n = Number.parseInt(id.slice(1), 10) || 0;
  return TILT[n % TILT.length];
}

function Chalk({ item, onErase, size }: { item: BoardItem; onErase?: (id: string) => void; size: "lg" | "md" }) {
  return (
    <li className={`group relative ${tilt(item.id)} ${size === "lg" ? "text-2xl sm:text-3xl" : "text-xl"} leading-snug`}>
      <span className={item.starred ? "text-happier" : ""}>
        {item.starred && <span aria-label="chosen by the group">★ </span>}
        {item.text}
      </span>
      {onErase && (
        <button
          type="button"
          onClick={() => onErase(item.id)}
          aria-label={`Rub out “${item.text}”`}
          className="ml-2 rounded-full px-2 font-sans text-xs text-chalk/40 opacity-0 transition hover:bg-chalk/10 hover:text-chalk focus-visible:opacity-100 group-hover:opacity-100"
        >
          rub out
        </button>
      )}
    </li>
  );
}

export function Chalkboard({
  items,
  onErase,
  large = false,
}: {
  items: BoardItem[];
  onErase?: (id: string) => void;
  /** The second-screen view: bigger type, nothing else on the page. */
  large?: boolean;
}) {
  const candidates = items.filter((i) => i.kind === "candidate");
  const columns = BOARD_KINDS.filter((k) => k !== "candidate").map((kind) => ({
    kind,
    items: items.filter((i) => i.kind === kind),
  }));
  const anyColumn = columns.some((c) => c.items.length > 0);

  return (
    <section
      aria-label="Shared chalkboard"
      aria-live="polite"
      className={`${chalk.className} relative overflow-hidden rounded-3xl border-[10px] border-[#7a5a3a] bg-ink text-chalk shadow-2xl ${
        large ? "min-h-[70vh] p-8 sm:p-12" : "min-h-[24rem] p-6 sm:p-8"
      }`}
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 20% 10%, rgba(247,248,245,0.06), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(247,248,245,0.05), transparent 50%)",
      }}
    >
      {items.length === 0 ? (
        <p className={`${large ? "text-4xl" : "text-3xl"} text-chalk/50`}>
          The board is blank. Start talking — the coach will chalk up what matters.
        </p>
      ) : (
        <>
          <h2 className={`text-sm font-bold uppercase tracking-widest ${HEADING_COLOR.candidate} opacity-60 font-sans`}>
            {KIND_LABEL.candidate}
          </h2>
          {candidates.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {candidates.map((item) => (
                <Chalk key={item.id} item={item} onErase={onErase} size="lg" />
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-2xl text-chalk/40">No full goal yet — keep going.</p>
          )}

          {anyColumn && (
            <div className={`mt-8 grid gap-6 border-t border-dashed border-chalk/20 pt-6 sm:grid-cols-2 ${large ? "lg:grid-cols-3" : "lg:grid-cols-3"}`}>
              {columns
                .filter((c) => c.items.length > 0)
                .map((c) => (
                  <div key={c.kind}>
                    <h3 className={`font-sans text-xs font-bold uppercase tracking-widest ${HEADING_COLOR[c.kind]}`}>
                      {KIND_LABEL[c.kind]}
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {c.items.map((item) => (
                        <Chalk key={item.id} item={item} onErase={onErase} size="md" />
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
