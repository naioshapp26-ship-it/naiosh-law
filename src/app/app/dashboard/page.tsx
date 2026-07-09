import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { readSessionToken, sessionCookieName } from "@/lib/session-shared";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const user = await readSessionToken(cookieStore.get(sessionCookieName)?.value);

  if (!user) {
    redirect("/login?next=/app/dashboard");
  }

  return <DashboardClient initialUser={user} />;
}
