"use client";

import { AppShell } from "@/components/app-shell";
import { AxisHubPage } from "@/components/axis-hub";
import { axisBySlug } from "@/data/empire-structure";
import { useSession } from "@/lib/session";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function AxisPage() {
  const params = useParams();
  const slug = String(params.slug ?? "");
  const { user, ready } = useSession(true);
  const axis = axisBySlug[slug];

  if (!ready || !user) return null;

  if (!axis) {
    return (
      <AppShell role={user.role} name={user.name}>
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</p>
          <h2 style={{ fontWeight: 800, marginBottom: "0.5rem" }}>المحور غير موجود</h2>
          <Link href="/app/dashboard" style={{ color: "#c3152a", fontWeight: 700 }}>
            العودة للوحة التحكم
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role={user.role} name={user.name}>
      <AxisHubPage axis={axis} userName={user.name} />
    </AppShell>
  );
}
