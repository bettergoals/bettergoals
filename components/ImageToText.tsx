"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Read a goal off a photo or a screenshot and drop the words into the coach's
 * textarea.
 *
 * Recognition happens in your own browser — the picture is never uploaded, which
 * is the only way to offer this and keep the promise on /privacy that nothing
 * about you is stored server-side. Photos of whiteboards and slides pick up
 * faces, names and handwriting that nobody meant to publish; the safest place
 * for an image is one it never left.
 *
 * Progressive enhancement only. Without JavaScript this renders nothing and the
 * textarea works exactly as it always did.
 */

type Phase = "idle" | "reading" | "done" | "error";

/** Bigger than a phone photo needs to be, small enough to fail fast. */
const MAX_FILE_BYTES = 12 * 1024 * 1024;

/** Recognition slows down quadratically; 12MP photos add minutes, not accuracy. */
const MAX_EDGE = 2000;

async function downscale(file: File): Promise<Blob> {
  if (typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= MAX_EDGE) {
      bitmap.close();
      return file;
    }
    const scale = MAX_EDGE / longest;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    return blob ?? file;
  } catch {
    return file;
  }
}

/** OCR returns one line per line of the image. Keep paragraphs, lose the ragged edges. */
function tidy(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** True once hydrated, false on the server — the gate that keeps this a pure enhancement. */
const subscribeToNothing = () => () => {};

export function ImageToText({ textareaId, maxLength }: { textareaId: string; maxLength: number }) {
  const hydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const runningRef = useRef(false);

  const showPreview = useCallback((file: File | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = file ? URL.createObjectURL(file) : null;
    setPreviewUrl(previewRef.current);
  }, []);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  /** Append to whatever is already in the box, so two photos of one whiteboard both land. */
  const insert = useCallback(
    (text: string) => {
      const el = document.getElementById(textareaId);
      if (!(el instanceof HTMLTextAreaElement)) return 0;
      const existing = el.value.trim();
      const next = (existing ? `${existing}\n\n${text}` : text).slice(0, maxLength);
      const added = next.length - existing.length;
      el.value = next;
      el.focus();
      el.setSelectionRange(next.length, next.length);
      el.scrollIntoView({ block: "nearest" });
      return added;
    },
    [maxLength, textareaId],
  );

  const read = useCallback(
    async (file: File) => {
      // One image at a time — a second worker would fight the first for the same textarea.
      if (runningRef.current) return;
      if (!file.type.startsWith("image/")) {
        showPreview(null);
        setPhase("error");
        setMessage("That isn’t an image. Try a JPEG, PNG, WebP or a screenshot.");
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        showPreview(null);
        setPhase("error");
        setMessage("That image is over 12MB. A screenshot or a normal phone photo is plenty.");
        return;
      }

      runningRef.current = true;
      showPreview(file);
      setPhase("reading");
      setProgress(0);
      setMessage("");

      try {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng", undefined, {
          logger: (m) => {
            if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
          },
        });
        try {
          const { data } = await worker.recognize(await downscale(file));
          const text = tidy(data.text);
          if (!text) {
            setPhase("error");
            setMessage(
              "No text found in that image. Handwriting, low light and photos taken at an angle are the usual culprits — try a straighter, brighter shot, or type it instead.",
            );
            return;
          }
          const added = insert(text);
          setPhase("done");
          setMessage(
            added > 0
              ? `Read ${added.toLocaleString()} characters into the box above. Check them — recognition misreads handwriting, and you own every word before it is scored.`
              : "The box above is already full, so there was nothing left to add. Shorten it and try again.",
          );
        } finally {
          await worker.terminate();
        }
      } catch {
        setPhase("error");
        setMessage(
          "Couldn’t read that image. The recognition engine downloads on first use, so a blocked or offline connection will stop it — type or paste your goal instead.",
        );
      } finally {
        runningRef.current = false;
      }
    },
    [insert, showPreview],
  );

  // Screenshots are the common case, and a screenshot lives on the clipboard.
  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const file = Array.from(event.clipboardData?.files ?? []).find((f) =>
        f.type.startsWith("image/"),
      );
      if (!file) return;
      event.preventDefault();
      void read(file);
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [read]);

  if (!hydrated) return null;

  const busy = phase === "reading";

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-ink/25 bg-white/60 p-5">
      <p className="font-semibold">Or read it off a picture</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
        A whiteboard, a sticky note, a slide, the strategy on the wall. The words go into the box
        above for you to edit before anything is checked. The picture is read on your device and{" "}
        <strong className="font-semibold text-ink">never uploaded</strong> — so faces and names in
        the shot stay with you.
      </p>

      <div className="mt-4">
        <label htmlFor="outcome-image" className="sr-only">
          Choose a photo or screenshot to read your goal from
        </label>
        <input
          id="outcome-image"
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Clear it so the same image can be chosen twice in a row.
            event.target.value = "";
            if (file) void read(file);
          }}
          className="block w-full text-sm text-ink-soft file:mr-3 file:cursor-pointer file:rounded-full file:border file:border-ink/15 file:bg-white file:px-5 file:py-2.5 file:text-sm file:font-semibold file:text-ink hover:file:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-60"
        />
        <p className="mt-2 text-sm text-ink-soft">
          Or paste a screenshot anywhere on this page.
        </p>
      </div>

      {busy && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
            <div
              className="h-full rounded-full bg-ink transition-[width] duration-300"
              style={{ width: `${Math.max(progress, 4)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            Reading the image on your device — {progress}%. The first run downloads the recognition
            engine, so it takes a little longer.
          </p>
        </div>
      )}

      <p
        aria-live="polite"
        className={`text-sm leading-relaxed ${message && !busy ? "mt-4" : ""} ${
          phase === "error" ? "text-ink" : "text-ink-soft"
        }`}
      >
        {!busy && message}
      </p>

      {previewUrl && !busy && (
        <div className="mt-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL, never uploaded and never optimised by the server */}
          <img
            src={previewUrl}
            alt="The image you chose, shown so you can check it is the right one."
            className="h-16 w-16 rounded-lg border border-ink/10 object-cover"
          />
          <button
            type="button"
            onClick={() => {
              showPreview(null);
              setPhase("idle");
              setMessage("");
            }}
            className="text-sm font-semibold underline underline-offset-2"
          >
            Forget the image
          </button>
        </div>
      )}
    </div>
  );
}
