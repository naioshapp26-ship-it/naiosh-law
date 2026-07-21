"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ErpWorkspacePage } from "@/components/erp-module-workspace";
import { ErpStudioStandalone } from "@/components/erp-studio-standalone";
import { getErpPageConfig } from "@/data/erp-page-catalog";
import { getErpModuleById } from "@/data/erp-sidebar-modules";
import { useSession } from "@/lib/session";

export default function ErpModulePage() {
  const params = useParams();
  const moduleId = String(params.moduleId ?? "");
  const { user, ready } = useSession(true);
  const mod = getErpModuleById(moduleId);
  const config = getErpPageConfig(moduleId);

  if (!ready || !user) return null;

  if (!config || (!mod && config.kind !== "studio")) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <h2 className="text-xl font-bold text-slate-800 mb-2">الوحدة غير موجودة</h2>
          <Link href="/app/dashboard" className="text-red-600 font-semibold hover:underline">
            العودة للوحة التحكم
          </Link>
        </div>
      </AppShell>
    );
  }

  // ERP studios are standalone full pages (no HQ sidebar) — match that chrome.
  if (config.kind === "studio") {
    return <ErpStudioStandalone config={config} />;
  }

  return (
    <AppShell>
      <ErpWorkspacePage pageId={moduleId} config={config} module={mod} />
    </AppShell>
  );
}
