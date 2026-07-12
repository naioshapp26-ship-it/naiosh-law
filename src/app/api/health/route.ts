import { NextResponse } from "next/server";
import { prisma, checkDatabaseConnection, getDatabaseEnvStatus } from "@/lib/prisma";

export async function GET() {
  const env = getDatabaseEnvStatus();
  const jwt = Boolean(process.env.JWT_SECRET?.trim());

  if (!env.resolved) {
    return NextResponse.json(
      {
        status: "error",
        database: false,
        message: "DATABASE_URL غير مضبوط على Railway",
        env,
        hint: "احذفي DATABASE_URL الفارغ وأضيفي Reference من Postgres، أو افتحي > 8 variables added by Railway",
      },
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
      env,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ status: "error", database: false, message }, { status: 503 });
  }
}
