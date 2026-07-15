"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, BtnPrimary, BtnSecondary, PageLoader, useToast } from "@/components/domain-page";
import { useSession } from "@/lib/session";
import { useSiteTheme } from "@/components/theme-provider";
import { DEFAULT_SITE_THEME, getHeroBannerSrc, getLogoSrc, type SiteTheme } from "@/lib/site-settings";
import { BrandLogo } from "@/components/brand-logo";

type ColorField = { key: keyof SiteTheme; label: string; hint?: string };

const COLOR_GROUPS: { title: string; fields: ColorField[] }[] = [
  {
    title: "الألوان الرئيسية",
    fields: [
      { key: "primaryColor", label: "اللون الأساسي", hint: "الأزرار والعناوين والروابط" },
      { key: "primaryDark", label: "اللون الأساسي الداكن", hint: "عند التمرير والتدرجات" },
      { key: "accentColor", label: "لون التمييز", hint: "العناصر الثانوية والإحصائيات" },
    ],
  },
  {
    title: "الشريط الجانبي",
    fields: [
      { key: "sidebarFrom", label: "أعلى الشريط" },
      { key: "sidebarVia", label: "وسط الشريط" },
      { key: "sidebarTo", label: "أسفل الشريط" },
    ],
  },
  {
    title: "المظهر العام",
    fields: [
      { key: "backgroundColor", label: "خلفية الصفحات" },
      { key: "textColor", label: "لون النص الرئيسي" },
    ],
  },
];

const PRESETS = [
  { name: "نايوش الأحمر", primary: "#c3152a", dark: "#a00f20", accent: "#0ea5e9", from: "#450a0a", via: "#7f1d1d", to: "#450a0a" },
  { name: "أزرق ملكي", primary: "#1d4ed8", dark: "#1e3a8a", accent: "#06b6d4", from: "#0c1a3d", via: "#1e3a8a", to: "#0c1a3d" },
  { name: "أخضر سيادي", primary: "#059669", dark: "#047857", accent: "#f59e0b", from: "#052e1c", via: "#065f46", to: "#052e1c" },
  { name: "بنفسجي إمبراطوري", primary: "#7c3aed", dark: "#5b21b6", accent: "#ec4899", from: "#2e1065", via: "#4c1d95", to: "#2e1065" },
  { name: "ذهبي فاخر", primary: "#b45309", dark: "#92400e", accent: "#d97706", from: "#3b2206", via: "#78350f", to: "#3b2206" },
];

function ColorInput({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.35rem", color: "#0a0a12" }}>
        {label}
      </label>
      {hint && <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginBottom: "0.4rem" }}>{hint}</p>}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 44, height: 44, border: "none", borderRadius: 10, cursor: "pointer", padding: 0 }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field"
          style={{ flex: 1, fontFamily: "monospace", fontSize: "0.85rem" }}
          dir="ltr"
        />
      </div>
    </div>
  );
}

export default function SystemSettingsPage() {
  const { user, ready } = useSession(true);
  const { theme, updateLocal, refresh } = useSiteTheme();
  const [form, setForm] = useState<SiteTheme>(DEFAULT_SITE_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);
  const { show, Toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/site-settings", { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setForm({
          primaryColor: data.primaryColor,
          primaryDark: data.primaryDark,
          accentColor: data.accentColor,
          sidebarFrom: data.sidebarFrom,
          sidebarVia: data.sidebarVia,
          sidebarTo: data.sidebarTo,
          backgroundColor: data.backgroundColor,
          textColor: data.textColor,
          brandName: data.brandName,
          brandNameAr: data.brandNameAr,
          tagline: data.tagline,
          logoPath: data.logoPath,
          logoData: data.logoData,
          heroBannerPath: data.heroBannerPath ?? null,
          heroBannerData: data.heroBannerData ?? null,
          borderRadius: data.borderRadius,
        });
      }
    } catch {
      /* keep defaults */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || !user || user.role !== "admin" || loadedRef.current) return;
    loadedRef.current = true;
    load();
  }, [ready, user, load]);

  const patch = (key: keyof SiteTheme, value: string | null) => {
    const next = { ...form, [key]: value };
    setForm(next);
    updateLocal(next);
  };

  const applyPreset = (p: (typeof PRESETS)[0]) => {
    const next = {
      ...form,
      primaryColor: p.primary,
      primaryDark: p.dark,
      accentColor: p.accent,
      sidebarFrom: p.from,
      sidebarVia: p.via,
      sidebarTo: p.to,
    };
    setForm(next);
    updateLocal(next);
  };

  const handleLogoFile = (file: File | null) => {
    if (!file) return;
    if (file.size > 800_000) {
      show("error", "حجم الشعار كبير جداً — الحد الأقصى 800 كيلوبايت");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      patch("logoData", dataUrl);
      show("success", "تم تحميل الشعار — اضغط حفظ لتطبيقه");
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      show("error", "الملف يجب أن يكون صورة");
      return;
    }
    if (file.size > 2_500_000) {
      show("error", "حجم بنر الهيرو كبير جداً — الحد الأقصى 2.5 ميجابايت");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const next = { ...form, heroBannerData: dataUrl };
      setForm(next);
      updateLocal(next);
      show("success", "تم تحميل بنر الهيرو — اضغط حفظ لتطبيقه على الصفحة الرئيسية");
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      show("success", data.message ?? "تم الحفظ");
      await refresh();
    } catch {
      show("error", "فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    if (!confirm("استعادة جميع الإعدادات للوضع الافتراضي؟")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/site-settings", { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setForm({
        ...DEFAULT_SITE_THEME,
        logoData: null,
        heroBannerData: null,
        heroBannerPath: null,
      });
      await refresh();
      show("success", data.message ?? "تمت الاستعادة");
    } catch {
      show("error", "فشل الاستعادة");
    } finally {
      setResetting(false);
    }
  };

  if (!ready || !user) return null;

  if (user.role !== "admin") {
    return (
      <AppShell>
        <div style={{ textAlign: "center", padding: "4rem" }}>
          <p style={{ fontSize: "3rem" }}>🔒</p>
          <h2 style={{ fontWeight: 800 }}>صلاحية المدير فقط</h2>
          <p style={{ color: "#64748b", marginTop: "0.5rem" }}>إعدادات النظام متاحة لمدير النظام فقط</p>
        </div>
      </AppShell>
    );
  }

  const logoPreview = getLogoSrc(form);
  const bannerPreview = getHeroBannerSrc(form);

  return (
    <AppShell>
      {Toast}
      <div style={{ maxWidth: 1100 }}>
        <PageHeader
          icon="🎨"
          title="إعدادات النظام"
          subtitle="تحكم كامل في ألوان الموقع، الشعار، بنر الهيرو، والعلامة التجارية — يظهر لجميع المستخدمين فور الحفظ"
          actions={
            <>
              <BtnSecondary onClick={resetDefaults} disabled={resetting || saving}>
                {resetting ? "⏳..." : "↩️ استعادة الافتراضي"}
              </BtnSecondary>
              <BtnPrimary onClick={save} disabled={saving}>
                {saving ? "⏳ جاري الحفظ..." : "💾 حفظ الإعدادات"}
              </BtnPrimary>
            </>
          }
        />

        {loading ? (
          <PageLoader />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "1.25rem", alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Presets */}
              <div className="card-white" style={{ padding: "1.35rem" }}>
                <h2 style={{ fontWeight: 800, marginBottom: "1rem", fontSize: "1rem" }}>🎭 قوالب ألوان جاهزة</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyPreset(p)}
                      style={{
                        padding: "0.5rem 0.9rem",
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        background: `linear-gradient(135deg, ${p.primary}, ${p.dark})`,
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        fontFamily: "var(--font-cairo)",
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              {COLOR_GROUPS.map((group) => (
                <div key={group.title} className="card-white" style={{ padding: "1.35rem" }}>
                  <h2 style={{ fontWeight: 800, marginBottom: "1rem", fontSize: "1rem" }}>{group.title}</h2>
                  {group.fields.map((f) => (
                    <ColorInput
                      key={f.key}
                      label={f.label}
                      hint={f.hint}
                      value={String(form[f.key] ?? "")}
                      onChange={(v) => patch(f.key, v)}
                    />
                  ))}
                </div>
              ))}

              {/* Branding */}
              <div className="card-white" style={{ padding: "1.35rem" }}>
                <h2 style={{ fontWeight: 800, marginBottom: "1rem", fontSize: "1rem" }}>🏷️ العلامة التجارية والشعار</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label className="input-label">اسم العلامة (إنجليزي)</label>
                    <input className="input-field" value={form.brandName} onChange={(e) => patch("brandName", e.target.value)} />
                  </div>
                  <div>
                    <label className="input-label">اسم العلامة (عربي)</label>
                    <input className="input-field" value={form.brandNameAr} onChange={(e) => patch("brandNameAr", e.target.value)} />
                  </div>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label className="input-label">الشعار الفرعي</label>
                  <input className="input-field" value={form.tagline} onChange={(e) => patch("tagline", e.target.value)} />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <label className="input-label">مسار الشعار (URL أو مسار محلي)</label>
                  <input
                    className="input-field"
                    value={form.logoPath}
                    onChange={(e) => patch("logoPath", e.target.value)}
                    dir="ltr"
                    placeholder="/naiosh-logo.png"
                  />
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="input-label">رفع شعار جديد (PNG / JPG / SVG)</label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => handleLogoFile(e.target.files?.[0] ?? null)}
                  />
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <BtnPrimary onClick={() => fileRef.current?.click()}>📤 رفع شعار</BtnPrimary>
                    {form.logoData && (
                      <BtnSecondary onClick={() => patch("logoData", null)}>🗑 إزالة الشعار المرفوع</BtnSecondary>
                    )}
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.4rem" }}>
                    الشعار المرفوع يُخزَّن في قاعدة البيانات ويُطبَّق على كل الصفحات
                  </p>
                </div>
                <div>
                  <label className="input-label">انحناء الحواف (px)</label>
                  <input
                    className="input-field"
                    type="number"
                    min={4}
                    max={32}
                    value={form.borderRadius}
                    onChange={(e) => patch("borderRadius", e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                </div>
              </div>

              {/* Hero banner */}
              <div className="card-white" style={{ padding: "1.35rem" }}>
                <h2 style={{ fontWeight: 800, marginBottom: "0.4rem", fontSize: "1rem" }}>🖼️ بنر واجهة الهيرو</h2>
                <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "1rem", lineHeight: 1.7 }}>
                  ارفع صورة بنر عادية تظهر كخلفية لقسم الهيرو في الصفحة الرئيسية. يُفضَّل أبعاد عريضة (مثلاً 1920×800).
                </p>
                <div style={{ marginBottom: "1rem" }}>
                  <label className="input-label">مسار البنر (اختياري — رابط أو مسار محلي)</label>
                  <input
                    className="input-field"
                    value={form.heroBannerPath ?? ""}
                    onChange={(e) => patch("heroBannerPath", e.target.value || null)}
                    dir="ltr"
                    placeholder="/hero-banner.jpg أو https://..."
                  />
                </div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label className="input-label">رفع صورة البنر (PNG / JPG / WebP)</label>
                  <input
                    ref={bannerFileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => handleBannerFile(e.target.files?.[0] ?? null)}
                  />
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <BtnPrimary onClick={() => bannerFileRef.current?.click()}>📤 رفع بنر الهيرو</BtnPrimary>
                    {(form.heroBannerData || form.heroBannerPath) && (
                      <BtnSecondary
                        onClick={() => {
                          const next = { ...form, heroBannerData: null, heroBannerPath: null };
                          setForm(next);
                          updateLocal(next);
                        }}
                      >
                        🗑 إزالة البنر
                      </BtnSecondary>
                    )}
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.4rem" }}>
                    بعد الرفع اضغط «حفظ الإعدادات» — الصورة تظهر مباشرة في واجهة الهيرو
                  </p>
                </div>
                {bannerPreview ? (
                  <div
                    style={{
                      borderRadius: 14,
                      overflow: "hidden",
                      border: "1px solid #e2e8f0",
                      position: "relative",
                      aspectRatio: "21 / 9",
                      background: "#0a0a12",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bannerPreview}
                      alt="معاينة بنر الهيرو"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(90deg, rgba(10,10,18,0.15) 0%, rgba(10,10,18,0.55) 100%)",
                        display: "flex",
                        alignItems: "flex-end",
                        padding: "0.85rem 1rem",
                      }}
                    >
                      <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.78rem" }}>معاينة البنر على الهيرو</span>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      borderRadius: 14,
                      border: "1px dashed #cbd5e1",
                      padding: "1.5rem",
                      textAlign: "center",
                      color: "#94a3b8",
                      fontSize: "0.8rem",
                      background: "#f8fafc",
                    }}
                  >
                    لا يوجد بنر حالياً — الهيرو يظهر بالتصميم الافتراضي
                  </div>
                )}
              </div>
            </div>

            {/* Live preview */}
            <div style={{ position: "sticky", top: "1rem" }}>
              <div className="card-white" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
                <h3 style={{ fontWeight: 800, marginBottom: "1rem", fontSize: "0.9rem" }}>👁️ معاينة مباشرة</h3>

                <div
                  style={{
                    borderRadius: 16,
                    padding: "1rem",
                    marginBottom: "1rem",
                    background: `linear-gradient(to bottom, ${form.sidebarFrom}, ${form.sidebarVia}, ${form.sidebarTo})`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoPreview} alt="logo" style={{ width: 40, height: 48, objectFit: "contain" }} />
                    <div>
                      <p style={{ color: "#fff", fontWeight: 900, fontSize: "0.85rem" }}>{form.brandName}</p>
                      <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.65rem" }}>{form.tagline}</p>
                    </div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 10, padding: "0.5rem 0.75rem", marginBottom: 6 }}>
                    <span style={{ color: form.primaryColor, fontWeight: 700, fontSize: "0.75rem" }}>عنصر نشط</span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.72rem", padding: "0.35rem 0.5rem" }}>عنصر عادي</div>
                </div>

                <div style={{ background: form.backgroundColor, borderRadius: 12, padding: "1rem", border: "1px solid #e2e8f0" }}>
                  <p style={{ color: form.textColor, fontWeight: 800, marginBottom: 8, fontSize: "0.85rem" }}>محتوى الصفحة</p>
                  <button
                    type="button"
                    style={{
                      background: `linear-gradient(135deg, ${form.primaryColor}, ${form.primaryDark})`,
                      color: "#fff",
                      border: "none",
                      borderRadius: `${form.borderRadius}px`,
                      padding: "0.5rem 1rem",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "default",
                      fontFamily: "var(--font-cairo)",
                    }}
                  >
                    زر أساسي
                  </button>
                  <span
                    style={{
                      display: "inline-block",
                      marginInlineStart: 8,
                      color: form.accentColor,
                      fontWeight: 700,
                      fontSize: "0.8rem",
                    }}
                  >
                    تمييز
                  </span>
                </div>
              </div>

              <div className="card-white" style={{ padding: "1rem" }}>
                <p style={{ fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.5rem" }}>الشعار الحالي في النظام</p>
                <BrandLogo size={64} showText subtitle={form.tagline} variant="dark" />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
