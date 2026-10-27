"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { DarkModeToggle } from "@/components/color-mode";
import { BrandLogo } from "@/components/brand-logo";
import { PageDynamicSections } from "@/components/page-settings/page-dynamic-sections";
import type { CustomFieldDef, PageSectionDef } from "@/lib/page-settings/custom-field-types";
import type { SectionDataMap } from "@/components/page-settings/page-dynamic-sections";
import { forcePortalLogin, portalJson } from "@/lib/portal-fetch";

type PortalUser = { name: string; email: string; role: string };

const NAV = [
  { href: "/portal", label: "الرئيسية", icon: "fa-house", flag: null },
  { href: "/portal/profile", label: "ملفي الشخصي", icon: "fa-user", flag: "allowProfileEdit" as const },
  { href: "/portal/cases", label: "قضاياي", icon: "fa-scale-balanced", flag: "showCases" as const },
  { href: "/portal/sessions", label: "جلساتي", icon: "fa-calendar-days", flag: "showSessions" as const },
  { href: "/portal/documents", label: "مستنداتي", icon: "fa-folder-open", flag: "showDocuments" as const },
  { href: "/portal/requests", label: "طلباتي", icon: "fa-clipboard-list", flag: "showRequests" as const },
  { href: "/portal/finance", label: "المالية", icon: "fa-file-invoice-dollar", flag: "showFinance" as const },
  { href: "/portal/messages", label: "الرسائل", icon: "fa-envelope", flag: "showMessages" as const },
  { href: "/portal/notifications", label: "الإشعارات", icon: "fa-bell", flag: null },
  { href: "/portal/settings", label: "الإعدادات", icon: "fa-gear", flag: null },
];

type PortalFlags = {
  showCases?: boolean;
  showSessions?: boolean;
  showDocuments?: boolean;
  showFinance?: boolean;
  showRequests?: boolean;
  showMessages?: boolean;
  allowProfileEdit?: boolean;
};

type PortalPageSettings = {
  display?: { title?: string; subtitle?: string };
  specialized?: PortalFlags;
  sections?: PageSectionDef[];
  sectionData?: SectionDataMap;
  customFields?: CustomFieldDef[];
};

export function PortalShell({
  title,
  children,
  demoBanner,
}: {
  title: string;
  children: ReactNode;
  demoBanner?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<PortalUser | null>(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [open, setOpen] = useState(false);
  const [flags, setFlags] = useState<PortalFlags>({});
  const [portalSettings, setPortalSettings] = useState<PortalPageSettings>({});

  useEffect(() => {
    if (!document.querySelector('link[data-portal-css]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "/newhome/portal.css?v=portal-360-20261028";
      css.setAttribute("data-portal-css", "1");
      document.head.appendChild(css);
    }
    if (!document.querySelector('link[data-portal-fa]')) {
      const fa = document.createElement("link");
      fa.rel = "stylesheet";
      fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
      fa.setAttribute("data-portal-fa", "1");
      document.head.appendChild(fa);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await portalJson<{ user?: PortalUser }>("/api/auth/me");
      if (cancelled) return;
      if (!me.ok || !me.data?.user) {
        const errMsg = !me.ok ? me.error : "انتهت صلاحية الجلسة";
        setAuthError(errMsg);
        setReady(true);
        forcePortalLogin(errMsg);
        return;
      }
      const u = me.data.user;
      setUser(u);
      if (u.role !== "client") {
        setReady(true);
        router.replace("/app/dashboard");
        return;
      }
      try {
        const sRes = await portalJson<{ resolved?: { values?: PortalPageSettings } }>(
          "/api/page-settings/client-portal"
        );
        if (sRes.ok) {
          const values = (sRes.data.resolved?.values ?? {}) as PortalPageSettings;
          const specialized = (values.specialized ?? {}) as PortalFlags;
          if (!cancelled) {
            setFlags(specialized);
            setPortalSettings(values);
          }
        }
      } catch {
        /* defaults: all visible */
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const visibleNav = NAV.filter((item) => {
    if (!item.flag) return true;
    if (item.flag === "allowProfileEdit") return true;
    const v = flags[item.flag];
    return v !== false;
  });

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.assign("/login");
  };

  if (!ready) {
    return (
      <div className="portal-loading" dir="rtl">
        جاري تحميل بوابة العميل…
      </div>
    );
  }

  if (authError || !user || user.role !== "client") {
    return (
      <div className="portal-loading" dir="rtl" style={{ display: "grid", gap: "0.75rem", placeItems: "center" }}>
        <p style={{ margin: 0, fontWeight: 700 }}>{authError || "جارٍ التوجيه لتسجيل الدخول…"}</p>
        <a className="portal-btn primary" href="/login">
          تسجيل الدخول
        </a>
      </div>
    );
  }

  return (
    <div className="portal-root" dir="rtl">
      <aside className={`portal-sidebar${open ? " is-open" : ""}`}>
        <div className="portal-brand">
          <BrandLogo href="/portal" size={44} showText={false} variant="light" />
          <div>
            <strong>بوابة العميل</strong>
            <span>Client Portal 360</span>
          </div>
        </div>
        <nav aria-label="قائمة بوابة العميل">
          {visibleNav.map((item) => {
            const active = pathname === item.href || (item.href !== "/portal" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : undefined} onClick={() => setOpen(false)}>
                <i className={`fas ${item.icon}`} aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button type="button" className="portal-logout" onClick={logout}>
          <i className="fas fa-right-from-bracket" aria-hidden />
          تسجيل الخروج
        </button>
      </aside>

      <div className="portal-main">
        <header className="portal-top">
          <button type="button" className="portal-menu-btn" aria-label="القائمة" onClick={() => setOpen((v) => !v)}>
            <i className={`fas ${open ? "fa-xmark" : "fa-bars"}`} />
          </button>
          <div>
            <h1 data-portal-title="1">{portalSettings.display?.title?.trim() || title}</h1>
            <p>مرحباً، {user.name}</p>
            {portalSettings.display?.subtitle?.trim() ? (
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                {portalSettings.display.subtitle}
              </p>
            ) : null}
          </div>
          <div className="portal-top-actions">
            <DarkModeToggle />
            <Link href="/portal/notifications" className="portal-icon-btn" aria-label="الإشعارات">
              <i className="fas fa-bell" />
            </Link>
          </div>
        </header>

        {demoBanner ? (
          <div className="portal-demo-banner" role="status">
            حساب تجريبي معزول — البيانات وهمية ومعلّمة بوضوح ولا تمس بيانات الإنتاج.
          </div>
        ) : null}

        <div className="portal-content">
          <PageDynamicSections
            pageKey="client-portal"
            sections={portalSettings.sections}
            customFields={portalSettings.customFields}
            sectionData={portalSettings.sectionData}
            canWrite={false}
            includeBuiltins={false}
          />
          {children}
        </div>
      </div>

      {open ? <button type="button" className="portal-backdrop" aria-label="إغلاق" onClick={() => setOpen(false)} /> : null}
    </div>
  );
}
