import BoardView from "@/components/BoardView";
import { fetchBoard } from "@/lib/github";

export const metadata = { title: "Ideas Board" };
export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const board = await fetchBoard();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Ideas board</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Every card is a GitHub issue. Open one to vote with a 👍 or join the
        discussion. Endorsed ideas move to <strong>Doing</strong> — where Claude
        Code builds them into this site for the community to review.
      </p>
      <div className="mt-8">
        <BoardView initial={board} />
      </div>
    </div>
  );
}
