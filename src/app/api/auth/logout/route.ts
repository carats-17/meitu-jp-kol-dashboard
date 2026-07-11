import { NextResponse } from "next/server";
import { AUTH_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return res;
}
