/**
 * A very small PDF writer — one document, laid out as lines of text.
 *
 * Idea #134 asked for the takeaway to leave as a PDF rather than a markdown
 * file, because a PDF is what people put in front of other people. This is the
 * whole of that capability: no dependency, no headless browser, no service.
 * CLAUDE.md guardrail 4 says prefer no new dependencies, and a PDF of plain
 * text is a couple of hundred lines of a format that has not changed since
 * 1993 — the alternative was pulling a rendering engine into a site that has
 * one page of text to print.
 *
 * What it can do: paragraphs, headings, quotes and bullets, in Helvetica and
 * Helvetica-Bold, wrapped to the page and flowed onto as many pages as it
 * takes. What it deliberately cannot do: images, tables, colour, links,
 * anything positioned. If a future card needs those, this is the wrong tool and
 * should be replaced rather than grown.
 *
 * Two things it is careful about, because they are the difference between a
 * file that opens and one that doesn't:
 *
 *  - **widths.** Wrapping needs to know how wide the text will be, so the
 *    widths of the two base-14 fonts are below, from their AFM metrics. Nothing
 *    here measures anything at runtime.
 *  - **offsets.** A PDF ends with a table of byte offsets into itself. Every
 *    character this module emits is one byte (the content is WinAnsi-encoded on
 *    the way in), so the file is assembled as a string of byte values and the
 *    offsets are string lengths.
 *
 * It is not a tagged PDF: there is no structure tree, so a screen reader gets
 * the text in reading order and nothing more. That is why the plain-text file
 * is still offered beside it — see `app/coach/entry/takeaway/route.ts`.
 */

/** One run of text, and how to draw it. Everything is optional but the words. */
export type PdfBlock = {
  text: string;
  /** Point size. 10.5 is this document's body. */
  size?: number;
  bold?: boolean;
  /** Baseline-to-baseline distance. Defaults to a comfortable multiple of size. */
  leading?: number;
  /** Space above the block, in points. */
  gapBefore?: number;
  /** Left inset for the whole block. */
  indent?: number;
  /** Extra inset for every line after the first — a hanging bullet. */
  hang?: number;
};

/** A4, in points, with the margin the whole document is laid out inside. */
const PAGE = { width: 595.28, height: 841.89, margin: 56 } as const;

/** Helvetica advance widths, characters 32–126, in 1/1000 em (Adobe AFM). */
const HELVETICA = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
] as const;

/** Helvetica-Bold, the same range, from the same source. */
const HELVETICA_BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
] as const;

/**
 * The characters above ASCII this document actually contains — curly quotes,
 * dashes, the ellipsis, the middle dot — as the byte a WinAnsi-encoded font
 * draws them with, and their width in each face.
 *
 * Latin-1 letters need no entry: WinAnsi is Latin-1 from 0xA0 up, so "é" is
 * already a byte, and its width is taken from the letter underneath the accent.
 */
type Glyph = { byte: number; width: number; bold: number };

const ABOVE_ASCII: Record<string, Glyph> = {
  "‘": { byte: 0x91, width: 222, bold: 278 },
  "’": { byte: 0x92, width: 222, bold: 278 },
  "“": { byte: 0x93, width: 333, bold: 500 },
  "”": { byte: 0x94, width: 333, bold: 500 },
  "•": { byte: 0x95, width: 350, bold: 350 },
  "–": { byte: 0x96, width: 556, bold: 556 },
  "—": { byte: 0x97, width: 1000, bold: 1000 },
  "…": { byte: 0x85, width: 1000, bold: 1000 },
  "·": { byte: 0xb7, width: 278, bold: 278 },
};

/**
 * The same table, keyed by the byte — because once a string is on its way into
 * the file it is bytes, and the wrapping still has to be able to measure it.
 * Derived rather than written twice, so the two cannot disagree.
 */
const BY_BYTE = new Map<number, Glyph>(Object.values(ABOVE_ASCII).map((g) => [g.byte, g]));

/**
 * Characters with no glyph in these fonts at all, said in ASCII instead. The
 * canvas numerals are the ones that matter: they are the boxes' names, so they
 * have to survive leaving the site.
 */
const SPELT_OUT: Record<string, string> = {
  "→": "->",
  "←": "<-",
  "①": "(1)",
  "②": "(2)",
  "③": "(3)",
  "④": "(4)",
  "⑤": "(5)",
};

function asciiWidth(code: number, bold: boolean): number | null {
  if (code < 32 || code > 126) return null;
  return (bold ? HELVETICA_BOLD : HELVETICA)[code - 32];
}

/**
 * The text as bytes a WinAnsi-encoded font will draw, one character per byte —
 * which is what the rest of this module means by "drawable".
 *
 * ASCII goes straight through. Latin-1 goes straight through too, because
 * WinAnsi is Latin-1 from 0xA0 up, so an accented name survives. The
 * typographic handful becomes its WinAnsi byte. Anything left is either spelt
 * out in ASCII, or stripped back to the letter under its accent, or dropped —
 * nothing is ever replaced by a box or a question mark. A glyph this cannot
 * draw is better absent than shown as damage, and the plain-text file beside
 * the PDF is the lossless copy.
 */
function drawable(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 32 && code <= 126) {
      out += ch;
      continue;
    }
    const above = ABOVE_ASCII[ch];
    if (above) {
      out += String.fromCharCode(above.byte);
      continue;
    }
    if (code >= 0xa0 && code <= 0xff) {
      out += ch;
      continue;
    }
    if (SPELT_OUT[ch]) {
      out += SPELT_OUT[ch];
      continue;
    }
    const base = ch.normalize("NFD").charAt(0);
    const baseCode = base.charCodeAt(0);
    if (baseCode >= 32 && baseCode <= 126) out += base;
    else if (/\s/.test(ch)) out += " ";
  }
  return out;
}

/** How wide a drawable string is, in points. */
function widthOf(text: string, size: number, bold: boolean): number {
  let units = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    const direct = asciiWidth(code, bold);
    if (direct !== null) {
      units += direct;
      continue;
    }
    const glyph = BY_BYTE.get(code);
    if (glyph) {
      units += bold ? glyph.bold : glyph.width;
      continue;
    }
    // An accented Latin-1 letter: the letter underneath it, near enough.
    const base = asciiWidth(ch.normalize("NFD").charCodeAt(0), bold);
    units += base ?? (bold ? 611 : 556);
  }
  return (units * size) / 1000;
}

/**
 * Greedy wrapping. A word too long for the measure even on its own line is cut
 * where it stops fitting rather than allowed to run off the page — somebody's
 * pasted URL, or a word they invented, should not leave the paper.
 */
function wrap(text: string, size: number, bold: boolean, measure: number): string[] {
  const lines: string[] = [];
  let line = "";
  const flush = () => {
    if (line) lines.push(line);
    line = "";
  };

  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (widthOf(candidate, size, bold) <= measure) {
      line = candidate;
      continue;
    }
    flush();
    if (widthOf(word, size, bold) <= measure) {
      line = word;
      continue;
    }
    let piece = "";
    for (const ch of word) {
      if (piece && widthOf(piece + ch, size, bold) > measure) {
        lines.push(piece);
        piece = "";
      }
      piece += ch;
    }
    line = piece;
  }

  flush();
  return lines;
}

/** Numbers, short. PDF does not want exponents or fifteen decimal places. */
function num(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}

/** Inside a string literal, these three are the only characters that matter. */
function escape(text: string): string {
  return text.replace(/[\\()]/g, (c) => `\\${c}`);
}

/** The whole document as content streams, one per page. */
function flow(blocks: PdfBlock[]): string[] {
  const top = PAGE.height - PAGE.margin;
  const floor = PAGE.margin;
  const measure = PAGE.width - PAGE.margin * 2;

  const pages: string[][] = [];
  let page: string[] = [];
  let y = top;

  for (const block of blocks) {
    const size = block.size ?? 10.5;
    const bold = block.bold ?? false;
    const leading = block.leading ?? size * 1.45;
    const indent = block.indent ?? 0;
    const hang = block.hang ?? 0;

    y -= block.gapBefore ?? 0;

    const lines = wrap(drawable(block.text), size, bold, measure - indent - hang);
    lines.forEach((line, i) => {
      if (y - leading < floor) {
        pages.push(page);
        page = [];
        y = top;
      }
      y -= leading;
      const x = PAGE.margin + indent + (i > 0 ? hang : 0);
      page.push(
        `BT /${bold ? "F2" : "F1"} ${num(size)} Tf 1 0 0 1 ${num(x)} ${num(y)} Tm (${escape(line)}) Tj ET`,
      );
    });
  }
  // The last page only if there is something on it — a document that ended
  // exactly on a page break would otherwise carry a blank sheet.
  if (page.length > 0 || pages.length === 0) pages.push(page);
  return pages.map((commands) => commands.join("\n"));
}

/**
 * The document, as bytes.
 *
 * Structure: a catalog, a page tree, the two fonts, the document information,
 * then a content stream and a page object per page — followed by the
 * cross-reference table of where each of those starts.
 */
export function textPdf({
  title,
  blocks,
}: {
  title: string;
  blocks: PdfBlock[];
}): Uint8Array<ArrayBuffer> {
  const streams = flow(blocks);

  /* Object ids are fixed so the references below can be written by hand:
     1 catalog · 2 page tree · 3 Helvetica · 4 Helvetica-Bold · 5 information,
     then two objects per page. */
  const contentId = (i: number) => 6 + i * 2;
  const pageId = (i: number) => 7 + i * 2;
  const kids = streams.map((_, i) => `${pageId(i)} 0 R`).join(" ");

  const objects: string[] = [
    `<< /Type /Catalog /Pages 2 0 R /Lang (en-GB) >>`,
    `<< /Type /Pages /Kids [${kids}] /Count ${streams.length} >>`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`,
    `<< /Title (${escape(drawable(title))}) /Creator (bettergoals.ai) /Producer (bettergoals.ai) >>`,
  ];

  streams.forEach((stream, i) => {
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(PAGE.width)} ${num(PAGE.height)}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId(i)} 0 R >>`,
    );
  });

  // %PDF, then four high bytes so every tool treats what follows as binary.
  let file = "%PDF-1.4\n%âãÏÓ\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(file.length);
    file += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const startxref = file.length;
  file += `xref\n0 ${objects.length + 1}\n0000000000 65535 f\r\n`;
  for (const offset of offsets) file += `${offset.toString().padStart(10, "0")} 00000 n\r\n`;
  file += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  const bytes = new Uint8Array(file.length);
  for (let i = 0; i < file.length; i += 1) bytes[i] = file.charCodeAt(i) & 0xff;
  return bytes;
}
