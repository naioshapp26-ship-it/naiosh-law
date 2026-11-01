"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { PageLayout } from "@/components/page-layout";
import { findItemById } from "@/lib/empire-routes";
import { axisBySlug } from "@/data/empire-structure";
import { useSession } from "@/lib/session";

export default function AxisItemPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { user, ready } = useSession(true);
  const item = findItemById(id);
  const axis = item ? axisBySlug[item.axisSlug] : undefined;

  if (!ready || !user) return null;

  if (!item) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <h2 className="text-xl font-bold text-slate-800 mb-2">العنصر غير موجود</h2>
          <Link href="/app/dashboard" className="text-red-600 font-semibold hover:underline">
            العودة للوحة التحكم
          </Link>
        </div>
      </AppShell>
    );
  }

  const href = item.href ?? "/app/dashboard";

  return (
    <AppShell>
      <PageLayout className="law-page--axis-item" pageId={`axis-item-${id}`}>
        <PageHero
          icon={<span aria-hidden>{axis?.icon ?? "📌"}</span>}
          eyebrow={item.axisTitle}
          title={item.label}
          subtitle="وحدة ضمن الهيكل السيادي الموحّد — منظومة نايوش 360"
          actions={
            <>
              <Link
                href={href}
                className="btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.55rem 1.1rem",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  textDecoration: "none",
                }}
              >
                فتح الصفحة التشغيلية ←
              </Link>
              <Link
                href={`/app/axis/${item.axisSlug}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.55rem 1.1rem",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  textDecoration: "none",
                }}
              >
                عرض المحور الكامل
              </Link>
            </>
          }
        />

        <div className="card-white p-6 space-y-4">
          <p className="text-slate-600 text-sm leading-relaxed">
            هذا العنصر مرتبط بمحور <strong>{item.axisTitle}</strong>. يمكنك فتح الصفحة التشغيلية
            المرتبطة أو العودة لعرض المحور الكامل.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/app/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-slate-500 font-medium text-sm hover:text-[#B79A61]"
            >
              لوحة التحكم
            </Link>
          </div>
        </div>
      </PageLayout>
    </AppShell>
  );
}
