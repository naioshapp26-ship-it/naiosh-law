import { DashboardClient } from "@/app/app/dashboard/dashboard-client";
import { getServerSessionUser } from "@/lib/server-session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const initialUser = await getServerSessionUser();

  return <DashboardClient initialUser={initialUser} />;
}
