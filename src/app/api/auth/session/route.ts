import { NextResponse } from "next/server";
import { readSessionCookie } from "@/lib/session-cookie";

export async function GET() {
  const user = await readSessionCookie();

  return NextResponse.json({
    ok: true,
    user,
  });
}
