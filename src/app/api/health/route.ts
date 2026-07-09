import { NextResponse } from "next/server";
import { prisma, checkDatabaseConnection } from "@/lib/prisma";

export async function GET() {
  const dbUrl = Boolean(process.env.DATABASE_URL);
  const jwt = Boolean(process.env.JWT_SECRET);

  if (!dbUrl) {
    return NextResponse.json(
      { status: "error", database: false, message: "DATABASE_URL غير مضبوط على Railway" },
      { status: 503 }
    );
  }

  try {
    const connection = await checkDatabaseConnection();
    if (!connection.ok) {
      return NextResponse.json(
        { status: "error", database: false, message: connection.error },
        { status: 503 }
      );
    }

    const users = await prisma.user.count();
    return NextResponse.json({
      status: "ok",
      database: true,
      jwtConfigured: jwt,
      users,
      needsSeed: users === 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ status: "error", database: false, message }, { status: 503 });
  }
}
