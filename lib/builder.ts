import { timingSafeEqual } from "node:crypto";

export const BUILDER_COOKIE = "bg_builder";

/** The builder experience lives on build.* (plus localhost and Vercel previews for development). */
export function isBuilderHost(host: string | null): boolean {
  if (!host) return false;
  const h = host.toLowerCase().split(":")[0];
  return h.startsWith("build.") || h === "localhost" || h.endsWith(".vercel.app");
}

/** Constant-time passcode check against the server's BOARD_PASSCODE. */
export function passcodeValid(candidate: string | undefined | null): boolean {
  const expected = process.env.BOARD_PASSCODE;
  if (!expected || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
