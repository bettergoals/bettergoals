import { canvasFor, readCoaching } from "@/lib/coaching";
import { TAKEAWAY_FILENAME, takeawayText } from "@/lib/takeaway";
import { TAKEAWAY_PDF_FILENAME, takeawayPdf } from "@/lib/takeawayPdf";
import { readRun } from "@/lib/triage";

/*
 * The download — step 13's primary action. CARD 6, slide 16.
 *
 * A plain GET that returns a file. Not a client-side blob: the reader's own
 * words are already in the URL, and a real link with a real response means the
 * download works with JavaScript off, survives a long-press "save link as", and
 * lands in the browser's downloads where the reader expects to find it.
 *
 * Since idea #134 it is a PDF, because that is what people put in front of
 * other people. The markdown is still here on `?as=text` and still linked on
 * screen: it is the lossless copy, it is what "copy as text" copies, and an
 * untagged PDF is a poorer document for a screen reader than the text it was
 * rendered from. Both are built from the same words — see `lib/takeawayPdf.ts`.
 *
 * Nothing is stored. This handler is handed the whole run in the query string,
 * builds the file, and forgets it — there is no session, no id, no row, and
 * nothing to come back for. `no-store` says so to every cache between here and
 * the reader, which matters more than usual for a response that is made of
 * somebody's unfinished thinking about their own organisation.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const run = readRun(params);
  const coaching = readCoaching(params, run);

  // Nothing said, nothing to take. Back to the column rather than an empty file
  // or an error page — a hand-typed URL is not a fault, it just isn't a run.
  if (!coaching.centre) {
    return Response.redirect(new URL("/coach/entry", request.url), 303);
  }

  const canvas = canvasFor(coaching);
  const asText = new URL(request.url).searchParams.get("as") === "text";

  const body: BodyInit = asText ? takeawayText(run, canvas) : takeawayPdf(run, canvas);

  return new Response(body, {
    headers: {
      "Content-Type": asText ? "text/markdown; charset=utf-8" : "application/pdf",
      "Content-Disposition": `attachment; filename="${asText ? TAKEAWAY_FILENAME : TAKEAWAY_PDF_FILENAME}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
