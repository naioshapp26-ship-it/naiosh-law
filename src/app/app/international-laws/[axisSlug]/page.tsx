"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { InternationalLawsAxisPage } from "@/components/international-laws-panel";
import { PageLoader } from "@/components/domain-page";
import { axisBySlug } from "@/data/international-laws-structure";
import { useSession } from "@/lib/session";
import { useParams } from "next/navigation";
import Link from "next/link";

function AxisContent() {
  const params = useParams();
  const slug = String(params.axisSlug ?? "");
  const axis = axisBySlug[slug];

  if (!axis) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</p>
        <h2 style={{ fontWeight: 800, marginBottom: "0.5rem" }}>المحور غير موجود</h2>
        <Link href="/app/international-laws" style={{ color: "#c3152a", fontWeight: 700 }}>
          العودة للتصنيف القانوني
        </Link>
      </div>
    );
  }

  return <InternationalLawsAxisPage axis={axis} />;
}

export default function InternationalLawsAxisRoute() {
  const { user, ready } = useSession(true);

  if (!ready || !user) return null;

  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <AxisContent />
      </Suspense>
    </AppShell>
  );
}
