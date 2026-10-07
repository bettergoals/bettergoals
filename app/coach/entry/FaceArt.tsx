import type { Ref } from "react";

/**
 * The drawing of the coach's face, on its own so the same face can sit in two
 * places: animated in the Talk to me panel (`CoachFace`), and still on the
 * "Talk to me" answer that opens it (idea #182). No hooks and no "use client",
 * so a server component can draw it too.
 *
 * Idea #182: the voice is a woman's, so the face is too — shoulder-length hair
 * framing it, a side-swept fringe, finer arched brows and a flick of lashes.
 * Still plainly a drawing, and the skin is still a tint of the site's blue
 * rather than any human skin tone, for the reasons `CoachFace` gives.
 */

/** Mouth heights in viewBox units: shut, and wide open. */
export const MOUTH_SHUT = 0.8;
export const MOUTH_OPEN = 7;

export function FaceArt({
  mouthRef,
  eyesRef,
  className = "h-full w-full",
}: {
  mouthRef?: Ref<SVGEllipseElement>;
  eyesRef?: Ref<SVGGElement>;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {/* Hair, behind: falls to the shoulders either side of the face */}
      <path
        d="M10.5 23c0-10.5 5.8-16 13.5-16s13.5 5.5 13.5 16v8.5c0 2.2-1.6 3.8-3.8 3.8H14.3c-2.2 0-3.8-1.6-3.8-3.8z"
        className="fill-ink"
      />
      {/* Shoulders */}
      <path d="M8 48c2-8.5 8.5-12.5 16-12.5S38 39.5 40 48z" className="fill-ink-soft" />
      {/* Neck */}
      <rect x="20.5" y="29" width="7" height="8" rx="3" className="fill-sooner/30" />
      {/* Head */}
      <ellipse cx="24" cy="21.5" rx="10.5" ry="12.5" className="fill-[#dbe8fd]" />
      {/* Fringe, swept to one side */}
      <path d="M13.5 20c0-7.5 4.5-12 10.5-12s10.5 4.5 10.5 12c-3.5-.8-7.5-3.2-10-7C22 16.5 18 19.2 13.5 20z" className="fill-ink" />
      {/* Brows */}
      <path d="M17.8 17.6q2.3-1.8 4.6-.4M25.6 17.2q2.3-1.4 4.6.4" className="stroke-ink" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* Eyes, with a flick of lashes at the outer corners */}
      <g ref={eyesRef} style={{ transformOrigin: "24px 21px", transformBox: "view-box" }}>
        <ellipse cx="20" cy="21" rx="1.4" ry="1.7" className="fill-ink" />
        <ellipse cx="28" cy="21" rx="1.4" ry="1.7" className="fill-ink" />
        <path d="M18.7 20.1l-1.2-.9M29.3 20.1l1.2-.9" className="stroke-ink" strokeWidth="0.7" strokeLinecap="round" />
      </g>
      {/* Mouth */}
      <ellipse ref={mouthRef} cx="24" cy="28" rx="3.2" ry={MOUTH_SHUT} className="fill-ink-soft" />
    </svg>
  );
}
