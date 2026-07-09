import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

/** Temporary diagnostic — remove after login is stable */
export async function GET() {
  try {
    const user = await getPrisma().user.findUnique({
      where: { email: "admin@naioshlaw.com" },
    });
    if (!user) {
      return NextResponse.json({ step: "findUnique", found: false });
    }

    const valid = await bcrypt.compare("Admin@123", user.password);
    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      step: "ok",
      found: true,
      valid,
      role: user.role,
      tokenLength: token.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ step: "error", message, stack }, { status: 500 });
  }
}
