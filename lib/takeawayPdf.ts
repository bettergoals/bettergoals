/**
 * The takeaway as a PDF — idea #134.
 *
 * "For the Download can we make that a PDF." The file people leave with is
 * something they put in front of a team, print, or attach to a message, and a
 * `.md` file is none of those things to most of the world.
 *
 * It is deliberately a *rendering* and not a second document: the words are
 * `takeawayText()`'s, unchanged, so what you download, what you copy and what
 * is on the screen stay the same words — which is the promise CARD 6 made when
 * the takeaway was built. This module only decides what the markdown looks like
 * on a page.
 *
 * The plain-text file is still there beside it (`?as=text`), because markdown
 * is the lossless copy: an untagged PDF is a poorer document for a screen
 * reader than the text it was made from, and PRINCIPLES.md does not let us take
 * that away from anyone. See `app/coach/entry/takeaway/route.ts`.
 */

import type { CanvasState } from "./coaching";
import { textPdf, type PdfBlock } from "./pdf";
import { takeawayText } from "./takeaway";
import type { Run } from "./triage";

/** What the download is called. The markdown keeps its own name. */
export const TAKEAWAY_PDF_FILENAME = "better-goal.pdf";

/** Space a blank line in the markdown buys. */
const BLANK_LINE = 6;

/** Markdown's inline marks, off. There is no italic face here to spend them on. */
function plain(text: string): string {
  return text
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

/**
 * The markdown, as blocks on a page.
 *
 * Line by line rather than paragraph by paragraph, on purpose: the third
 * artefact is a prompt whose line breaks and indentation are the canvas, and
 * joining its lines into paragraphs would destroy it. Every line in the file is
 * already short enough to sit on one line of A4, so the result reads as
 * paragraphs anyway — and anything long the reader said gets wrapped.
 */
function blocksFrom(markdown: string): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  let gap = 0;

  const push = (block: PdfBlock) => {
    blocks.push({ ...block, gapBefore: (block.gapBefore ?? 0) + gap });
    gap = 0;
  };

  for (const raw of markdown.split("\n")) {
    if (!raw.trim()) {
      gap = Math.max(gap, BLANK_LINE);
      continue;
    }
    const line = raw.trim();
    if (line.startsWith("# ")) push({ text: plain(line.slice(2)), size: 19, bold: true, leading: 25 });
    else if (line.startsWith("## ")) push({ text: plain(line.slice(3)), size: 14, bold: true, gapBefore: 12 });
    else if (line.startsWith("### ")) push({ text: plain(line.slice(4)), size: 11.5, bold: true, gapBefore: 6 });
    else if (line.startsWith("> ")) push({ text: plain(line.slice(2)), indent: 18 });
    else if (line.startsWith("- ")) push({ text: `•  ${plain(line.slice(2))}`, indent: 6, hang: 11 });
    else {
      /* A whole line wrapped in ** is a heading the markdown writes as bold —
         "Objective — an outcome hypothesis". Leading spaces are the prompt's
         own indentation, kept as an inset so the canvas still looks like one. */
      push({
        text: plain(line),
        bold: /^\*\*.+\*\*$/.test(line),
        indent: (raw.length - raw.trimStart().length) * 3,
      });
    }
  }

  return blocks;
}

export function takeawayPdf(run: Run, state: CanvasState): Uint8Array<ArrayBuffer> {
  const markdown = takeawayText(run, state);
  /* The document's title is the file's own first heading, so there is nowhere
     for the two to disagree. */
  const heading = markdown.split("\n").find((line) => line.startsWith("# "));
  return textPdf({
    title: heading ? heading.slice(2) : "Your goal and your canvas",
    blocks: blocksFrom(markdown),
  });
}
