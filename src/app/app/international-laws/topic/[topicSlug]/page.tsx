"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { InternationalLawsAxisPage } from "@/components/international-laws-panel";
import { PageLoader } from "@/components/domain-page";
import { axisBySlug, topicBySlug } from "@/data/international-laws-structure";
import { useSession } from "@/lib/session";

function TopicContent() {
  const params = useParams();
  const slug = String(params.topicSlug ?? "");
  const topic = topicBySlug[slug];
  const axis = topic ? axisBySlug[topic.axisSlug] : undefined;

  if (!topic || !axis) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</p>
        <h2 style={{ fontWeight: 800, marginBottom: "0.5rem" }}>الموضوع غير موجود</h2>
        <p style={{ color: "#64748b", marginBottom: "1rem", fontSize: "0.9rem" }}>
          لم يتم العثور على صفحة لهذا الموضوع في منظومة التصنيف القانوني.
        </p>
        <Link href="/app/international-laws" style={{ color: "#c3152a", fontWeight: 700 }}>
          العودة للتصنيف القانوني
        </Link>
      </div>
    );
  }

  return <InternationalLawsAxisPage axis={axis} lockedTopicSlug={topic.slug} />;
}

export default function InternationalLawsTopicRoute() {
  const { user, ready } = useSession(true);

  if (!ready || !user) return null;

  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <TopicContent />
      </Suspense>
    </AppShell>
  );
}
