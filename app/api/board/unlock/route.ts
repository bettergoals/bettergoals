import { NextResponse } from "next/server";
import { BUILDER_COOKIE, passcodeValid } from "@/lib/builder";

/** Exchanges the facilitator passcode for an httpOnly cookie that authorises board moves. */
export async function POST(req: Request) {
  let body: { passcode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!process.env.BOARD_PASSCODE) {
    return NextResponse.json(
      { error: "No BOARD_PASSCODE configured on the server — moves are disabled." },
      { status: 501 }
    );
  }
  if (!passcodeValid(body.passcode)) {
    return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(BUILDER_COOKIE, body.passcode!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return res;
}
