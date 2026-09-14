import { redirect } from "next/navigation";
import { COLUMN_PATH } from "@/lib/config";

/**
 * The column moved to the front door.
 *
 * It was built here, and links to `/coach/entry` are in the wild — on the
 * Outcome Coach page, in the cards that built it, in anyone's history. They
 * still work: this carries the whole run across, because the query string *is*
 * the conversation, and landing at `/` without it would silently throw away
 * everything the reader had said.
 */
export default async function EntryRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") q.set(key, value);
    else if (Array.isArray(value) && value[0]) q.set(key, value[0]);
  }
  const s = q.toString();
  redirect(`${COLUMN_PATH}${s ? `?${s}` : ""}`);
}
