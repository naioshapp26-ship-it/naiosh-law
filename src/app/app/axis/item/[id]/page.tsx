"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
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
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-2xl p-8 text-white mb-6"
          style={{ background: `linear-gradient(135deg, ${axis?.color ?? "#c3152a"} 0%, #0a0a12 100%)` }}
        >
          <p className="text-sm opacity-80 mb-1">{item.axisTitle}</p>
          <h1 className="text-2xl font-black mb-3">{item.label}</h1>
          <p className="text-sm opacity-90 leading-relaxed">
            وحدة ضمن الهيكل السيادي الموحّد — منظومة نايوش 360
          </p>
        </div>

        <div className="card-white p-6 space-y-4">
          <p className="text-slate-600 text-sm leading-relaxed">
            هذا العنصر مرتبط بمحور <strong>{item.axisTitle}</strong>. يمكنك فتح الصفحة التشغيلية
            المرتبطة أو العودة لعرض المحور الكامل.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href={href}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors"
            >
              فتح الصفحة التشغيلية ←
            </Link>
            <Link
              href={`/app/axis/${item.axisSlug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-red-200 text-red-700 font-semibold text-sm hover:bg-red-50 transition-colors"
            >
              عرض المحور الكامل
            </Link>
            <Link
              href="/app/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-slate-500 font-medium text-sm hover:text-red-600"
            >
              لوحة التحكم
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
