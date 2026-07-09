"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LoadingScreen } from "@/components/loading-screen";
import { useSession } from "@/lib/session";

export default function ModuleNotFound() {
  const { user, ready } = useSession(true);

  if (!ready || !user) {
    return <LoadingScreen />;
  }

  return (
    <AppShell role={user.role} name={user.name}>
      <section className="card-white" style={{ maxWidth: 520, padding: "2rem", textAlign: "center", margin: "4rem auto" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.5rem" }}>
          الوحدة غير موجودة
        </h1>
        <p style={{ color: "#64748b", lineHeight: 1.8, marginBottom: "1.5rem" }}>
          الرابط المطلوب غير معرّف ضمن وحدات النظام. يمكنك الرجوع إلى لوحة التحكم واختيار وحدة متاحة.
        </p>
        <Link href="/app/dashboard" className="btn-primary">
          العودة إلى لوحة التحكم
        </Link>
      </section>
    </AppShell>
  );
}
