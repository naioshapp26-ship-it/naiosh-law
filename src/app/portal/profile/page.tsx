"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalErrorCard, PortalLoadingCard } from "@/components/portal/portal-empty";
import { portalJson } from "@/lib/portal-fetch";
import type { PortalProfile } from "@/lib/client-portal";

function ProfileInner() {
  const params = useSearchParams();
  const onboarding = params.get("onboarding") === "1";
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await portalJson<{ profile: PortalProfile }>("/api/portal/profile");
    if (!res.ok) {
      setError(res.error);
      setProfile(null);
      setLoading(false);
      return;
    }
    setProfile(res.data.profile);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMsg("");
    setError("");
    const res = await portalJson<{ profileComplete?: boolean; error?: string }>("/api/portal/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      setError(res.error);
      setSaving(false);
      return;
    }
    setMsg(res.data.profileComplete ? "تم حفظ الملف بنجاح" : "تم الحفظ — أكمل البيانات الناقصة");
    setProfile((p) => (p ? { ...p, profileComplete: Boolean(res.data.profileComplete) } : p));
    setSaving(false);
  };

  return (
    <PortalShell title="ملفي الشخصي" demoBanner={Boolean(profile?.isDemo)}>
      {onboarding ? (
        <div className="portal-card" style={{ borderColor: "rgba(183,154,97,.5)" }}>
          أكمل بياناتك الأساسية للانتقال بسلاسة إلى خدماتك القانونية.
        </div>
      ) : null}
      {msg ? <div className="portal-card" style={{ color: "#166534" }}>{msg}</div> : null}
      {error ? <PortalErrorCard message={error} onRetry={load} /> : null}
      {loading && !error ? <PortalLoadingCard /> : null}
      {!loading && profile ? (
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
                disabled={profile.isDemo}
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
              <input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
                disabled={profile.isDemo}
              />
            </label>
            <label>
              البريد الإلكتروني
              <input value={profile.email} disabled />
            </label>
            <label>
              مفتاح الدولة
              <select
                value={profile.phoneDialCode || ""}
                onChange={(e) => setProfile({ ...profile, phoneDialCode: e.target.value })}
                disabled={profile.isDemo}
              >
                <option value="">اختر...</option>
                <option value="+20">+20 (مصر)</option>
                <option value="+966">+966 (السعودية)</option>
                <option value="+971">+971 (الإمارات)</option>
                <option value="+965">+965 (الكويت)</option>
                <option value="+974">+974 (قطر)</option>
                <option value="+973">+973 (البحرين)</option>
                <option value="+968">+968 (عُمان)</option>
                <option value="+962">+962 (الأردن)</option>
                <option value="+961">+961 (لبنان)</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
              </select>
            </label>
            <label>
              رقم الجوال
              <input
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                disabled={profile.isDemo}
                placeholder="5XXXXXXXX"
              />
            </label>
            <label>
              نوع العميل
              <select
                value={profile.type}
                onChange={(e) => setProfile({ ...profile, type: e.target.value })}
                disabled={profile.isDemo}
              >
                <option value="فرد">فرد</option>
                <option value="شركة">شركة</option>
              </select>
            </label>
            <label>
              الدولة
              <select
                value={profile.country || ""}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                disabled={profile.isDemo}
              >
                <option value="">اختر...</option>
                <option value="مصر">مصر</option>
                <option value="السعودية">السعودية</option>
                <option value="الإمارات">الإمارات</option>
                <option value="الكويت">الكويت</option>
                <option value="قطر">قطر</option>
                <option value="البحرين">البحرين</option>
                <option value="عُمان">عُمان</option>
                <option value="الأردن">الأردن</option>
                <option value="أخرى">أخرى</option>
              </select>
            </label>
            <label>
              المدينة
              <input
                value={profile.city || ""}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                disabled={profile.isDemo}
              />
            </label>
            <label>
              مفتاح الجوال الإضافي
              <select
                value={profile.phoneSecondaryDialCode || ""}
                onChange={(e) => setProfile({ ...profile, phoneSecondaryDialCode: e.target.value })}
                disabled={profile.isDemo}
              >
                <option value="">اختياري...</option>
                <option value="+20">+20 (مصر)</option>
                <option value="+966">+966 (السعودية)</option>
                <option value="+971">+971 (الإمارات)</option>
                <option value="+962">+962 (الأردن)</option>
              </select>
            </label>
            <label>
              رقم جوال إضافي
              <input
                value={profile.phoneSecondary || ""}
                onChange={(e) => setProfile({ ...profile, phoneSecondary: e.target.value })}
                disabled={profile.isDemo}
                placeholder="اختياري"
              />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              العنوان
              <input
                value={profile.address || ""}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                disabled={profile.isDemo}
              />
            </label>
            <label>
              اللغة المفضلة
              <select
                value={profile.preferredLanguage}
                onChange={(e) => setProfile({ ...profile, preferredLanguage: e.target.value })}
                disabled={profile.isDemo}
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
                disabled={profile.isDemo}
              />
            </label>
            <label>
              المفوض بالتعامل
              <input
                value={profile.authorizedPerson || ""}
                onChange={(e) => setProfile({ ...profile, authorizedPerson: e.target.value })}
                disabled={profile.isDemo}
              />
            </label>
            <label>
              جوال المفوض
              <input
                value={profile.authorizedPhone || ""}
                onChange={(e) => setProfile({ ...profile, authorizedPhone: e.target.value })}
                disabled={profile.isDemo}
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
            <button className="portal-btn primary" type="submit" disabled={saving || profile.isDemo}>
              {profile.isDemo ? "عرض فقط (تجريبي)" : saving ? "جاري الحفظ…" : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      ) : null}
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
