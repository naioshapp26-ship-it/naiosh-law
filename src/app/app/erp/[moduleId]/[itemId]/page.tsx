"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ErpWorkspacePage } from "@/components/erp-module-workspace";
import { getErpPageConfig } from "@/data/erp-page-catalog";
import { getErpModuleById } from "@/data/erp-sidebar-modules";
import { useSession } from "@/lib/session";

export default function ErpModuleItemPage() {
  const params = useParams();
  const moduleId = String(params.moduleId ?? "");
  const itemId = String(params.itemId ?? "");
  const { user, ready } = useSession(true);
  const parent = getErpModuleById(moduleId);
  const item = parent?.subItems?.find((s) => s.id === itemId);
  const config = getErpPageConfig(itemId);

  if (!ready || !user) return null;

  if (!parent || !item || !config) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <h2 className="text-xl font-bold text-slate-800 mb-2">الصفحة الفرعية غير موجودة</h2>
          <Link href="/app/dashboard" className="text-red-600 font-semibold hover:underline">
            العودة للوحة التحكم
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ErpWorkspacePage pageId={itemId} config={config} parent={parent} />
    </AppShell>
  );
}
