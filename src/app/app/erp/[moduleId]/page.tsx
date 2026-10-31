"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ErpWorkspacePage } from "@/components/erp-module-workspace";
import { ErpStudioStandalone } from "@/components/erp-studio-standalone";
import SystemSettingsPage from "@/components/system-settings-page";
import { PageHero } from "@/components/page-hero";
import { getErpPageConfig } from "@/data/erp-page-catalog";
import { findErpNavEntry, getErpModuleById } from "@/data/erp-sidebar-modules";
import { useSession } from "@/lib/session";

/** ERP sidebar entries that should open the real homepage identity settings UI. */
const HOMEPAGE_SETTINGS_IDS = new Set(["settings", "identity-settings"]);

export default function ErpModulePage() {
  const params = useParams();
  const moduleId = String(params.moduleId ?? "");
  const { user, ready } = useSession(true);
  const mod = getErpModuleById(moduleId);
  const nav = findErpNavEntry(moduleId);
  const config = getErpPageConfig(moduleId);

  if (!ready || !user) return null;

  // Match ERP «إعدادات الصفحة الرئيسية» → full identity settings page (not KPI stub).
  if (HOMEPAGE_SETTINGS_IDS.has(moduleId)) {
    return <SystemSettingsPage />;
  }

  // Catalog pages are reachable even when the id is a nested sidebar leaf
  // (flat /app/erp/{childId} aliases — same chrome as nested parent/child routes).
  if (!config) {
    return (
      <AppShell>
        <PageHero
          icon={<span aria-hidden>🔍</span>}
          title="الوحدة غير موجودة"
          subtitle={`المعرّف «${moduleId}» غير معرّف في كتالوج ERP.`}
          actions={
            <Link href="/app/dashboard" className="btn-primary" style={{ textDecoration: "none", padding: "0.55rem 1.1rem", borderRadius: 12, fontWeight: 700 }}>
              العودة للوحة التحكم
            </Link>
          }
        />
      </AppShell>
    );
  }

  // ERP studios are standalone full pages (no HQ sidebar) — match that chrome.
  if (config.kind === "studio") {
    return <ErpStudioStandalone config={config} />;
  }

  const parent = nav?.parent ?? null;
  const moduleForHub = mod ?? (nav && !nav.parent ? nav.module : null);

  return (
    <AppShell>
      <ErpWorkspacePage
        pageId={moduleId}
        config={config}
        module={moduleForHub}
        parent={parent}
      />
    </AppShell>
  );
}
