"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import type { PortalProfile } from "@/lib/client-portal";

function ProfileInner() {
  const params = useSearchParams();
  const onboarding = params.get("onboarding") === "1";
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/portal/profile", { credentials: "include" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "فشل التحميل");
        setProfile(json.profile);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "خطأ"));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const res = await fetch("/api/portal/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "تعذر الحفظ");
      setMsg(json.profileComplete ? "تم حفظ الملف بنجاح" : "تم الحفظ — أكمل البيانات الناقصة");
      setProfile((p) => (p ? { ...p, profileComplete: Boolean(json.profileComplete) } : p));
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalShell title="ملفي الشخصي" demoBanner={Boolean(profile?.isDemo)}>
      {onboarding ? (
        <div className="portal-card" style={{ borderColor: "rgba(183,154,97,.5)" }}>
          أكمل بياناتك الأساسية للانتقال بسلاسة إلى خدماتك القانونية.
        </div>
      ) : null}
      {error ? <div className="portal-card">{error}</div> : null}
      {msg ? <div className="portal-card" style={{ color: "#166534" }}>{msg}</div> : null}
      {!profile ? (
        <div className="portal-card">جاري التحميل…</div>
      ) : (
        <form className="portal-card portal-form" onSubmit={onSubmit}>
          <h2>الصورة الشخصية</h2>
          <div className="portal-grid" style={{ gridTemplateColumns: "auto 1fr", alignItems: "center", gap: "1rem" }}>
            <div
              aria-hidden
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid rgba(183,154,97,.55)",
                background: "#101D32",
                display: "grid",
                placeItems: "center",
                color: "#F5F1E8",
                fontWeight: 800,
              }}
            >
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                (profile.name || "?").slice(0, 1)
              )}
            </div>
            <label>
              رفع صورة شخصية
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1_500_000) {
                    setError("حجم الصورة يجب ألا يتجاوز 1.5 ميجابايت");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = typeof reader.result === "string" ? reader.result : "";
                    setProfile({ ...profile, avatarUrl: dataUrl });
                    setMsg("تم تجهيز الصورة — اضغط حفظ التعديلات لتثبيتها");
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>

          <h2>البيانات الأساسية</h2>
          <div className="portal-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <label>
              الاسم الكامل
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
            </label>
            <label>
              البريد الإلكتروني
              <input value={profile.email} disabled />
            </label>
            <label>
              رقم الهاتف
              <input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </label>
            <label>
              نوع العميل
              <select value={profile.type} onChange={(e) => setProfile({ ...profile, type: e.target.value })}>
                <option value="فرد">فرد</option>
                <option value="شركة">شركة</option>
              </select>
            </label>
            <label>
              الدولة
              <input value={profile.country || ""} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
            </label>
            <label>
              المدينة
              <input value={profile.city || ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              العنوان
              <input value={profile.address || ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
            </label>
            <label>
              اللغة المفضلة
              <select
                value={profile.preferredLanguage}
                onChange={(e) => setProfile({ ...profile, preferredLanguage: e.target.value })}
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </label>
            <label>
              رقم العميل الداخلي
              <input value={profile.internalNo || ""} disabled />
            </label>
          </div>

          <h2>بيانات قانونية</h2>
          <div className="portal-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <label>
              اسم الشركة (إن وجد)
              <input
                value={profile.companyName || ""}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              />
            </label>
            <label>
              المفوض بالتعامل
              <input
                value={profile.authorizedPerson || ""}
                onChange={(e) => setProfile({ ...profile, authorizedPerson: e.target.value })}
              />
            </label>
            <label>
              جوال المفوض
              <input
                value={profile.authorizedPhone || ""}
                onChange={(e) => setProfile({ ...profile, authorizedPhone: e.target.value })}
              />
            </label>
            <label>
              المكتب المرتبط
              <input value={profile.linkedOffice || ""} disabled />
            </label>
            <label>
              المحامي المسؤول
              <input value={profile.lawyerName || ""} disabled />
            </label>
          </div>

          <div className="portal-actions">
            <button className="portal-btn primary" type="submit" disabled={saving}>
              {saving ? "جاري الحفظ…" : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      )}
    </PortalShell>
  );
}

export default function PortalProfilePage() {
  return (
    <Suspense fallback={<div className="portal-loading">جاري التحميل…</div>}>
      <ProfileInner />
    </Suspense>
  );
}
