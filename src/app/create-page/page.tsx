"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LAW_SPECIALTY_OPTIONS } from "@/data/erp-nav-pages";

type LinkRow = { label: string; url: string };

const emptyForm = {
  name: "",
  username: "",
  bio: "",
  phone: "",
  email: "",
  whatsapp: "",
  facebook: "",
  instagram: "",
  youtube: "",
  snapchat: "",
  tiktok: "",
  specialty: LAW_SPECIALTY_OPTIONS[0],
  city: "",
};

export default function CreatePage() {
  const [form, setForm] = useState(emptyForm);
  const [customLinks, setCustomLinks] = useState<LinkRow[]>([{ label: "حجز استشارة", url: "/login" }]);
  const [usernameStatus, setUsernameStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        const user = data?.user;
        setLoggedIn(!!user);
        if (user) {
          setForm((f) => ({
            ...f,
            name: f.name || user.name || "",
            email: f.email || user.email || "",
          }));
        }
      })
      .catch(() => setLoggedIn(false));

    fetch("/api/creator-pages/me", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        const page = data?.page;
        if (!page) return;
        setForm({
          name: page.name || "",
          username: page.username || "",
          bio: page.bio || "",
          phone: page.phone || "",
          email: page.pageEmail || page.email || "",
          whatsapp: page.whatsapp || "",
          facebook: page.facebook || "",
          instagram: page.instagram || "",
          youtube: page.youtube || "",
          snapchat: page.snapchat || "",
          tiktok: page.tiktok || "",
          specialty: page.specialty || LAW_SPECIALTY_OPTIONS[0],
          city: page.city || "",
        });
        setCustomLinks(Array.isArray(data.customLinks) && data.customLinks.length ? data.customLinks : [{ label: "", url: "" }]);
        setUsernameAvailable(true);
        setUsernameStatus({ ok: true, text: "اسم المستخدم الحالي محفوظ" });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const value = form.username.trim().toLowerCase();
    if (!value) {
      setUsernameStatus(null);
      setUsernameAvailable(false);
      return;
    }
    if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(value)) {
      setUsernameAvailable(false);
      setUsernameStatus({ ok: false, text: "اسم المستخدم يجب أن يبدأ بحرف/رقم، وطوله 3-30 (a-z, 0-9, _ -)" });
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/creator-pages/check-username?username=${encodeURIComponent(value)}`)
        .then((r) => r.json())
        .then((data) => {
          setUsernameAvailable(!!data.available);
          setUsernameStatus({
            ok: !!data.available,
            text: data.available ? "اسم المستخدم متاح" : "اسم المستخدم مستخدم بالفعل",
          });
        })
        .catch(() => undefined);
    }, 300);
    return () => clearTimeout(t);
  }, [form.username]);

  const previewSocials = useMemo(() => {
    const rows: { label: string; url: string }[] = [];
    if (form.whatsapp) rows.push({ label: "WhatsApp", url: form.whatsapp });
    if (form.facebook) rows.push({ label: "Facebook", url: form.facebook });
    if (form.instagram) rows.push({ label: "Instagram", url: form.instagram });
    if (form.youtube) rows.push({ label: "YouTube", url: form.youtube });
    if (form.snapchat) rows.push({ label: "Snapchat", url: form.snapchat });
    if (form.tiktok) rows.push({ label: "TikTok", url: form.tiktok });
    customLinks.filter((l) => l.label && l.url).forEach((l) => rows.push(l));
    return rows;
  }, [form, customLinks]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!loggedIn) {
      setSaveStatus("يمكنك تعبئة الصفحة الآن، لكن الحفظ يتطلب تسجيل الدخول.");
      return;
    }
    if (!usernameAvailable) {
      setSaveStatus("يرجى اختيار اسم مستخدم متاح.");
      return;
    }
    setSaving(true);
    setSaveStatus("جاري الحفظ...");
    try {
      const res = await fetch("/api/creator-pages/me", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, customLinks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحفظ");
      setSaveStatus("تم حفظ الصفحة بنجاح.");
    } catch (err) {
      setSaveStatus(`فشل الحفظ: ${err instanceof Error ? err.message : "خطأ"}`);
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof typeof emptyForm) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="cp-page">
      <div className="cp-container">
        <div className="cp-top">
          <div>
            <div style={{ marginBottom: 10 }}>
              <BrandLogo size={48} showText variant="light" subtitle="منظومة نايوش القانونية 360" />
            </div>
            <h1>أنشئ صفحتك</h1>
            <p className="cp-muted">صفحتك القانونية الشخصية القابلة للمشاركة داخل المنصة</p>
          </div>
          <div className="cp-top-actions">
            <Link href="/my-page-analytics" className="cp-btn cp-btn-dark">
              إحصائيات صفحتي
            </Link>
            <Link
              href={form.username ? `/u/${encodeURIComponent(form.username.trim().toLowerCase())}` : "/my-page"}
              className="cp-btn cp-btn-primary"
            >
              فتح صفحتي
            </Link>
            <Link href="/" className="cp-btn cp-btn-dark">
              رجوع للواجهة
            </Link>
          </div>
        </div>

        <div className="cp-grid">
          <form className="cp-card" onSubmit={onSave}>
            <h2>بيانات الصفحة</h2>
            <div className="cp-field">
              <label>الاسم</label>
              <input value={form.name} onChange={set("name")} required placeholder="أ. محمد العتيبي" />
            </div>
            <div className="cp-field">
              <label>اسم المستخدم (slug)</label>
              <input value={form.username} onChange={set("username")} required placeholder="m-otaibi" />
              {usernameStatus ? (
                <p className={`cp-status ${usernameStatus.ok ? "ok" : "bad"}`}>{usernameStatus.text}</p>
              ) : null}
            </div>
            <div className="cp-cols">
              <div className="cp-field">
                <label>التخصص القانوني</label>
                <select value={form.specialty} onChange={set("specialty")}>
                  {LAW_SPECIALTY_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cp-field">
                <label>المدينة</label>
                <input value={form.city} onChange={set("city")} placeholder="الرياض" />
              </div>
            </div>
            <div className="cp-field">
              <label>نبذة / وصف</label>
              <textarea
                value={form.bio}
                onChange={set("bio")}
                placeholder="محامٍ معتمد متخصص في القضايا التجارية والتحكيم..."
              />
            </div>
            <div className="cp-cols">
              <div className="cp-field">
                <label>الهاتف (اختياري)</label>
                <input value={form.phone} onChange={set("phone")} placeholder="05xxxxxxxx" />
              </div>
              <div className="cp-field">
                <label>البريد الإلكتروني (اختياري)</label>
                <input type="email" value={form.email} onChange={set("email")} placeholder="law@office.com" />
              </div>
            </div>

            <h3>روابط التواصل</h3>
            <div className="cp-cols">
              {(["whatsapp", "facebook", "instagram", "youtube", "snapchat", "tiktok"] as const).map((key) => (
                <div className="cp-field" key={key}>
                  <label>{key[0].toUpperCase() + key.slice(1)}</label>
                  <input value={form[key]} onChange={set(key)} placeholder={`رابط ${key}`} />
                </div>
              ))}
            </div>

            <h3>روابط مخصصة</h3>
            {customLinks.map((row, i) => (
              <div className="cp-custom" key={i}>
                <input
                  placeholder="عنوان الرابط"
                  value={row.label}
                  onChange={(e) => {
                    const next = [...customLinks];
                    next[i] = { ...next[i], label: e.target.value };
                    setCustomLinks(next);
                  }}
                />
                <input
                  placeholder="https://"
                  value={row.url}
                  onChange={(e) => {
                    const next = [...customLinks];
                    next[i] = { ...next[i], url: e.target.value };
                    setCustomLinks(next);
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              className="cp-btn cp-btn-dark"
              onClick={() => setCustomLinks((rows) => [...rows, { label: "", url: "" }])}
            >
              إضافة رابط مخصص
            </button>

            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button type="submit" className="cp-btn cp-btn-primary" disabled={saving}>
                {saving ? "جاري الحفظ..." : "حفظ الصفحة"}
              </button>
              {!loggedIn ? (
                <Link href="/login" style={{ color: "#ffb4b4", fontWeight: 700, textDecoration: "underline" }}>
                  تسجيل الدخول للحفظ
                </Link>
              ) : null}
            </div>
            {saveStatus ? <p className="cp-muted" style={{ marginTop: 10 }}>{saveStatus}</p> : null}
          </form>

          <aside className="cp-preview-wrap">
            <div className="cp-card">
              <h2>معاينة مباشرة</h2>
              <div className="cp-preview">
                <div className="cp-cover" />
                <div className="cp-avatar" />
                <div className="cp-preview-body">
                  <h3>{form.name || "الاسم"}</h3>
                  <p className="cp-muted">{form.specialty}{form.city ? ` — ${form.city}` : ""}</p>
                  <p className="cp-muted" style={{ marginTop: 8 }}>
                    {form.bio || "نبذة المختصر تظهر هنا للموكلين والزوار."}
                  </p>
                  <div className="cp-socials">
                    {previewSocials.length === 0 ? (
                      <span className="cp-muted">أضف روابط التواصل لتظهر هنا</span>
                    ) : (
                      previewSocials.map((s) => (
                        <a key={`${s.label}-${s.url}`} href={s.url} target="_blank" rel="noreferrer">
                          {s.label}
                        </a>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .cp-page { min-height:100vh; font-family:var(--font); background: radial-gradient(circle at 20% 10%, #2b0b12 0%, #090b10 40%, #06070a 100%); color:#f8f9fb; }
        .cp-container { width:min(1200px, calc(100% - 32px)); margin:20px auto 40px; }
        .cp-top { display:flex; gap:12px; flex-wrap:wrap; align-items:flex-start; justify-content:space-between; }
        .cp-top h1 { margin:0 0 6px; font-size:1.8rem; font-weight:900; }
        .cp-top-actions { display:flex; gap:8px; flex-wrap:wrap; }
        .cp-btn { text-decoration:none; border:none; cursor:pointer; border-radius:14px; padding:10px 16px; font-weight:800; display:inline-flex; align-items:center; gap:8px; font-family:var(--font); font-size:.85rem; }
        .cp-btn-primary { color:#fff; background:linear-gradient(135deg, #d70000, #6a0009); }
        .cp-btn-dark { color:#fff; background:#1b1f29; border:1px solid #2f3544; }
        .cp-grid { margin-top:16px; display:grid; grid-template-columns:1.1fr .9fr; gap:16px; }
        .cp-card { background:linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.01)); border:1px solid #2b2f3a; border-radius:20px; padding:18px; backdrop-filter:blur(6px); }
        .cp-card h2, .cp-card h3 { margin:0 0 12px; }
        .cp-card h3 { margin-top:1rem; font-size:1rem; }
        .cp-field { margin-bottom:12px; }
        .cp-field label { display:block; font-size:13px; margin-bottom:6px; color:#d8def0; font-weight:700; }
        .cp-field input, .cp-field textarea, .cp-field select, .cp-custom input { width:100%; border-radius:12px; border:1px solid #323848; background:#11141c; color:#fff; padding:10px 12px; font-family:inherit; }
        .cp-field textarea { min-height:88px; resize:vertical; }
        .cp-cols { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .cp-muted { color:#a6afc3; font-size:13px; margin:0; }
        .cp-status { font-size:12px; margin-top:6px; font-weight:700; }
        .cp-status.ok { color:#6cf4ad; } .cp-status.bad { color:#ff7d7d; }
        .cp-custom { border:1px solid #303646; border-radius:12px; padding:10px; margin-bottom:8px; background:#0f131b; display:grid; gap:8px; }
        .cp-preview-wrap { position:sticky; top:14px; align-self:start; }
        .cp-preview { overflow:hidden; border-radius:20px; border:1px solid #343a4a; background:#0b0e13; margin-top:8px; }
        .cp-cover { height:140px; background:linear-gradient(135deg,#7f1d1d,#1a0505); }
        .cp-avatar { width:92px; height:92px; border-radius:50%; border:3px solid #fff; margin:-46px auto 10px; background:linear-gradient(135deg,#c3152a,#450a0a); }
        .cp-preview-body { padding:0 14px 14px; text-align:center; }
        .cp-socials { display:grid; gap:8px; margin-top:12px; }
        .cp-socials a { text-decoration:none; color:#fff; border-radius:10px; padding:10px; font-weight:800; background:linear-gradient(135deg,#1c2230,#151924); border:1px solid #2d3443; }
        @media (max-width: 900px) { .cp-grid, .cp-cols { grid-template-columns:1fr; } .cp-preview-wrap { position:static; } }
      `}</style>
    </div>
  );
}
