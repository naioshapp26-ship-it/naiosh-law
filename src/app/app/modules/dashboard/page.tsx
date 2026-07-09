import { redirect } from "next/navigation";

export default function DashboardModuleRedirect() {
  redirect("/app/dashboard");
}
