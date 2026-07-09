import { NextResponse } from "next/server";
import { AUTH_COOKIE, getSessionFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-helpers";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { email: true, name: true, role: true, active: true },
    });
    if (!user?.active) {
      const response = NextResponse.json({ error: "غير مصرح" }, { status: 401 });
      response.cookies.delete(AUTH_COOKIE);
      return response;
    }

    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return handleApiError(error, "Get current user");
  }
}
