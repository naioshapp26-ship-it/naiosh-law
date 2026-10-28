"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DataAnalysisPublicShell } from "@/components/data-analysis/public-shell";
import { DataAnalysisWorkspace } from "@/components/data-analysis/workspace";

/**
 * Actual legal analysis — requires an authenticated staff Law session.
 * Guests are sent to login with return URL; clients stay on the portal.
 */
export default function PublicDataAnalysisWorkspacePage() {
  const [state, setState] = useState<"loading" | "ok" | "guest" | "client">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const role = data?.user?.role ? String(data.user.role) : null;
        if (!role) setState("guest");
        else if (role === "client") setState("client");
        else setState("ok");
      })
      .catch(() => {
        if (!cancelled) setState("guest");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state !== "guest") return;
    const next = encodeURIComponent("/data-analysis/workspace");
    window.location.assign(`/login?next=${next}`);
  }, [state]);

  return (
    <DataAnalysisPublicShell>
      {state === "loading" || state === "guest" ? (
        <div className="da-law-section">
          <p className="lead" style={{ margin: 0 }}>
            جاري التحقق من جلسة NAIOSH LAW…
          </p>
        </div>
      ) : null}
      {state === "client" ? (
        <div className="da-law-section">
          <h2 style={{ marginTop: 0 }}>صلاحية غير كافية لهذا التحليل</h2>
          <p className="lead">
            مساحة التحليل القانوني مخصّصة لفريق المكتب. حساب العميل يستخدم بوابة العميل.
          </p>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            <Link href="/portal" className="da-law-btn primary">
              بوابة العميل
            </Link>
            <Link href="/data-analysis" className="da-law-btn ghost">
              الصفحة التعريفية
            </Link>
          </div>
        </div>
      ) : null}
      {state === "ok" ? <DataAnalysisWorkspace /> : null}
    </DataAnalysisPublicShell>
  );
}
