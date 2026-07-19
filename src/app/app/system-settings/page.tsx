"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/session";
import { useSiteTheme } from "@/components/theme-provider";
import {
  DEFAULT_SITE_THEME,
  getHeroBannerSrc,
  getLogoSrc,
  type SiteTheme,
} from "@/lib/site-settings";
import { isHeroVideoSrc } from "@/lib/hero-media";

type HeroMediaItem = {
  id: string;
  type: string;
  url: string;
  title: string | null;
  caption: string | null;
  isActive: boolean;
  orderIndex: number;
};

type HomepageSectionItem = {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  iconClass: string;
  iconUrl: string | null;
  orderIndex: number;
};

type ToastState = { type: "success" | "error"; message: string } | null;

const FA_CSS = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
const FA_LINK_ID = "fa-cdn-system-settings";

const PAGE_STYLE = `
  .ss-page { font-family: var(--font-cairo), 'Cairo', sans-serif; background-color: #f1f5f9; min-height: 100vh; direction: rtl; }
  .ss-page ::-webkit-scrollbar { width: 6px; }
  .ss-page ::-webkit-scrollbar-track { background: #f1f5f9; }
  .ss-page ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

  .section-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,.07), 0 4px 12px rgba(0,0,0,.04);
    border: 1px solid #e2e8f0;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .section-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: .55rem;
  }

  .section-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: .8rem;
    flex-shrink: 0;
  }

  #toast {
    position: fixed;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%) translateY(80px);
    background: #1e293b;
    color: #fff;
    padding: .6rem 1.4rem;
    border-radius: 100px;
    font-size: .875rem;
    font-weight: 600;
    z-index: 9999;
    transition: transform .3s ease;
    pointer-events: none;
  }
  #toast.show { transform: translateX(-50%) translateY(0); }
  #toast.success { background: #059669; }
  #toast.error   { background: #dc2626; }

  .range-value {
    display: inline-block;
    background: #1e293b;
    color: #fff;
    font-size: .72rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 100px;
    margin-right: .4rem;
  }

  .hero-media-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 10px 12px;
    box-shadow: 0 1px 4px rgba(0,0,0,.05);
    transition: box-shadow .2s;
  }
  .hero-media-card:hover { box-shadow: 0 3px 10px rgba(0,0,0,.09); }
  .hero-media-thumb {
    width: 72px; height: 52px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid #e2e8f0;
    flex-shrink: 0;
    background: #f1f5f9;
  }
  .hero-media-thumb-video {
    width: 72px; height: 52px;
    border-radius: 8px;
    background: linear-gradient(135deg, #ede9fe, #ddd6fe);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    border: 1px solid #ddd6fe;
  }
  .badge { display:inline-flex; align-items:center; gap:4px; font-size:.7rem; font-weight:700; padding:2px 8px; border-radius:100px; }
  .badge-img  { background:#dbeafe; color:#1d4ed8; }
  .badge-vid  { background:#ede9fe; color:#6d28d9; }
  .badge-on   { background:#dcfce7; color:#15803d; }
  .badge-off  { background:#fee2e2; color:#b91c1c; }
  .media-btn {
    width:32px; height:32px; border-radius:8px; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center; font-size:.8rem;
    transition: background .15s, color .15s;
    text-decoration: none;
  }
  .media-btn:disabled { opacity:.3; cursor:default; }
  .media-btn-mute   { background:#f1f5f9; color:#64748b; }
  .media-btn-mute:hover:not(:disabled) { background:#e2e8f0; color:#334155; }
  .media-btn-green  { background:#dcfce7; color:#15803d; }
  .media-btn-green:hover { background:#bbf7d0; }
  .media-btn-red    { background:#fee2e2; color:#b91c1c; }
  .media-btn-red:hover { background:#fecaca; }

  .upload-zone {
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    padding: 1.2rem;
    transition: border-color .2s, background .2s;
  }
  .upload-zone:focus-within, .upload-zone:hover { border-color:#93c5fd; background:#f8faff; }
  .upload-zone-video { border-color:#c4b5fd; }
  .upload-zone-video:focus-within, .upload-zone-video:hover { border-color:#a78bfa; background:#faf5ff; }

  .spinner {
    display: inline-block;
    width: 1em; height: 1em;
    border: 2px solid rgba(255,255,255,.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: ss-spin .7s linear infinite;
    vertical-align: middle;
  }
  @keyframes ss-spin { to { transform: rotate(360deg); } }

  .ss-input {
    width: 100%;
    padding: 0.625rem;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
    background: #fff;
    font-size: 0.875rem;
    font-family: inherit;
    color: #0f172a;
  }
  .ss-input:focus { outline: none; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(147,197,253,.35); }
  .ss-color {
    width: 100%;
    height: 2.75rem;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    padding: 0.125rem;
    background: #fff;
  }
  .ss-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #475569;
    margin-bottom: 0.375rem;
  }
  .ss-label-xs {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #475569;
    margin-bottom: 0.375rem;
  }
`;

function themeFromApi(data: Partial<SiteTheme>): SiteTheme {
  return {
    ...DEFAULT_SITE_THEME,
    ...data,
    logoData: data.logoData ?? null,
    heroBannerPath: data.heroBannerPath ?? null,
    heroBannerData: data.heroBannerData ?? null,
    heroMediaKind: data.heroMediaKind ?? null,
    heroImageMode: data.heroImageMode === "center" ? "center" : "cover",
    heroActiveType: data.heroActiveType === "video" ? "video" : "image",
    heroOverlayStrength: Number.isFinite(Number(data.heroOverlayStrength))
      ? Math.min(70, Math.max(50, Math.round(Number(data.heroOverlayStrength))))
      : DEFAULT_SITE_THEME.heroOverlayStrength,
    heroAutoplaySlider: data.heroAutoplaySlider !== false,
    heroActiveImageCaption: data.heroActiveImageCaption || "",
    heroActiveVideoCaption: data.heroActiveVideoCaption || "",
    heroActiveVideoDescription: data.heroActiveVideoDescription || "",
  };
}

export default function SystemSettingsPage() {
  const { user, ready } = useSession(true);
  const { updateLocal, refresh } = useSiteTheme();

  const [form, setForm] = useState<SiteTheme>(DEFAULT_SITE_THEME);
  const [heroMedia, setHeroMedia] = useState<HeroMediaItem[]>([]);
  const [sections, setSections] = useState<HomepageSectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHeroImg, setUploadingHeroImg] = useState(false);
  const [uploadingHeroVid, setUploadingHeroVid] = useState(false);
  const [sectionBusyId, setSectionBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const logoFileRef = useRef<HTMLInputElement>(null);
  const heroImgFileRef = useRef<HTMLInputElement>(null);
  const heroVidFileRef = useRef<HTMLInputElement>(null);
  const heroImgCaptionRef = useRef<HTMLInputElement>(null);
  const heroVidCaptionRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    if (document.getElementById(FA_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FA_LINK_ID;
    link.rel = "stylesheet";
    link.href = FA_CSS;
    document.head.appendChild(link);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, mediaRes, sectionsRes] = await Promise.all([
        fetch("/api/site-settings", { credentials: "include", cache: "no-store" }),
        fetch("/api/homepage-hero-media", { credentials: "include", cache: "no-store" }),
        fetch("/api/homepage-sections", { credentials: "include", cache: "no-store" }),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        const next = themeFromApi(data);
        setForm(next);
        updateLocal(next);
      }

      if (mediaRes.ok) {
        const data = await mediaRes.json();
        setHeroMedia(Array.isArray(data.items) ? data.items : []);
      }

      if (sectionsRes.ok) {
        const data = await sectionsRes.json();
        setSections(Array.isArray(data.items) ? data.items : []);
      }
    } catch {
      showToast("error", "تعذر تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  }, [showToast, updateLocal]);

  useEffect(() => {
    if (!ready || !user || user.role !== "admin" || loadedRef.current) return;
    loadedRef.current = true;
    void loadAll();
  }, [ready, user, loadAll]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const patch = (key: keyof SiteTheme, value: SiteTheme[keyof SiteTheme]) => {
    setForm((prev) => {
      const next: SiteTheme = { ...prev, [key]: value };
      if (key === "buttonColor" && typeof value === "string" && value) {
        next.primaryDark = value;
      }
      updateLocal(next);
      return next;
    });
  };

  const uploadLogo = async () => {
    const file = logoFileRef.current?.files?.[0];
    if (!file) {
      showToast("error", "يرجى اختيار ملف الشعار أولاً");
      return;
    }
    setUploadingLogo(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/site-settings/logo", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل رفع الشعار");
      const next = { ...form, logoPath: data.logoPath ?? form.logoPath, logoData: null };
      setForm(next);
      updateLocal(next);
      await refresh();
      if (logoFileRef.current) logoFileRef.current.value = "";
      showToast("success", data.message ?? "تم رفع الشعار");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "فشل رفع الشعار");
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    setUploadingLogo(true);
    try {
      const res = await fetch("/api/site-settings/logo", {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إزالة الشعار");
      const next = { ...form, logoPath: "", logoData: null };
      setForm(next);
      updateLocal(next);
      await refresh();
      showToast("success", data.message ?? "تم إزالة الشعار");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "فشل إزالة الشعار");
    } finally {
      setUploadingLogo(false);
    }
  };

  const uploadHeroMedia = async (kind: "image" | "video") => {
    const fileRef = kind === "image" ? heroImgFileRef : heroVidFileRef;
    const captionRef = kind === "image" ? heroImgCaptionRef : heroVidCaptionRef;
    const file = fileRef.current?.files?.[0];
    if (!file) {
      showToast("error", kind === "image" ? "يرجى اختيار صورة أولاً" : "يرجى اختيار فيديو أولاً");
      return;
    }
    if (kind === "image") setUploadingHeroImg(true);
    else setUploadingHeroVid(true);

    try {
      const body = new FormData();
      body.append("file", file);
      const caption = captionRef.current?.value?.trim() || "";
      if (caption) body.append("caption", caption);

      const res = await fetch("/api/homepage-hero-media", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الرفع");

      if (Array.isArray(data.items)) setHeroMedia(data.items);
      await refresh();
      if (fileRef.current) fileRef.current.value = "";
      if (captionRef.current) captionRef.current.value = "";
      showToast("success", data.message ?? (kind === "image" ? "تم رفع الصورة" : "تم رفع الفيديو"));
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "فشل رفع الوسائط");
    } finally {
      if (kind === "image") setUploadingHeroImg(false);
      else setUploadingHeroVid(false);
    }
  };

  const reloadHeroMedia = async () => {
    try {
      const res = await fetch("/api/homepage-hero-media", { credentials: "include", cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التحديث");
      setHeroMedia(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "فشل تحديث القائمة");
    }
  };

  const patchHeroMedia = async (id: string, action: "toggle" | "move", direction?: "up" | "down") => {
    try {
      const res = await fetch("/api/homepage-hero-media", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, direction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التحديث");
      if (Array.isArray(data.items)) setHeroMedia(data.items);
      await refresh();
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "فشل تحديث الوسائط");
    }
  };

  const deleteHeroMedia = async (id: string) => {
    if (!confirm("حذف هذه الوسائط؟")) return;
    try {
      const res = await fetch(`/api/homepage-hero-media?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحذف");
      if (Array.isArray(data.items)) setHeroMedia(data.items);
      await refresh();
      showToast("success", data.message ?? "تم الحذف");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "فشل الحذف");
    }
  };

  const addSection = async () => {
    try {
      const res = await fetch("/api/homepage-sections", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "قسم جديد", iconClass: "fas fa-square" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الإضافة");
      if (Array.isArray(data.items)) setSections(data.items);
      showToast("success", data.message ?? "تمت إضافة القسم");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "فشل إضافة القسم");
    }
  };

  const updateSectionField = (id: string, patchFields: Partial<HomepageSectionItem>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patchFields } : s)));
  };

  const saveSection = async (section: HomepageSectionItem) => {
    setSectionBusyId(section.id);
    try {
      const res = await fetch("/api/homepage-sections", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: section.id,
          title: section.title,
          description: section.description,
          link: section.link,
          iconClass: section.iconClass,
          orderIndex: section.orderIndex,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحفظ");
      if (Array.isArray(data.items)) setSections(data.items);
      showToast("success", data.message ?? "تم تحديث القسم");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "فشل تحديث القسم");
    } finally {
      setSectionBusyId(null);
    }
  };

  const deleteSection = async (id: string) => {
    if (!confirm("حذف هذا القسم؟")) return;
    setSectionBusyId(id);
    try {
      const res = await fetch(`/api/homepage-sections?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحذف");
      if (Array.isArray(data.items)) setSections(data.items);
      showToast("success", data.message ?? "تم حذف القسم");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "فشل حذف القسم");
    } finally {
      setSectionBusyId(null);
    }
  };

  const uploadSectionIcon = async (id: string, file: File | null) => {
    if (!file) return;
    setSectionBusyId(id);
    try {
      const body = new FormData();
      body.append("id", id);
      body.append("file", file);
      const res = await fetch("/api/homepage-sections", {
        method: "PATCH",
        credentials: "include",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل رفع الأيقونة");
      if (Array.isArray(data.items)) setSections(data.items);
      showToast("success", data.message ?? "تم رفع الأيقونة");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "فشل رفع الأيقونة");
    } finally {
      setSectionBusyId(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        primaryColor: form.primaryColor,
        primaryDark: form.primaryDark || form.buttonColor,
        accentColor: form.accentColor,
        sidebarFrom: form.sidebarFrom,
        sidebarVia: form.sidebarVia,
        sidebarTo: form.sidebarTo,
        backgroundColor: form.backgroundColor,
        textColor: form.textColor,
        brandName: form.brandName,
        brandNameAr: form.brandNameAr,
        tagline: form.tagline,
        borderRadius: form.borderRadius,
        secondaryColor: form.secondaryColor,
        buttonColor: form.buttonColor,
        headerBgColor: form.headerBgColor,
        headingColor: form.headingColor,
        paragraphColor: form.paragraphColor,
        linkColor: form.linkColor,
        heroImageMode: form.heroImageMode,
        heroActiveType: form.heroActiveType,
        heroOverlayStrength: form.heroOverlayStrength,
        heroAutoplaySlider: form.heroAutoplaySlider,
        heroActiveImageCaption: form.heroActiveImageCaption,
        heroActiveVideoCaption: form.heroActiveVideoCaption,
        heroActiveVideoDescription: form.heroActiveVideoDescription,
      };
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحفظ");
      const next = themeFromApi(data);
      setForm(next);
      updateLocal(next);
      await refresh();
      showToast("success", data.message ?? "تم حفظ الإعدادات");
    } catch (e) {
      showToast("error", e instanceof Error ? e.message : "فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <div className="ss-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
        <p style={{ color: "#64748b", fontWeight: 600 }}>جاري التحميل...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="ss-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />
        <div className="section-card" style={{ maxWidth: 420, textAlign: "center", marginBottom: 0 }}>
          <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔒</p>
          <h2 style={{ fontWeight: 800, fontSize: "1.15rem", color: "#0f172a", marginBottom: "0.5rem" }}>
            صلاحية المدير فقط
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
            إعدادات الصفحة الرئيسية متاحة لمدير النظام فقط
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/login"
              style={{
                background: "#c3152a",
                color: "#fff",
                padding: "0.55rem 1.1rem",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/app/dashboard"
              style={{
                border: "1px solid #e2e8f0",
                color: "#475569",
                padding: "0.55rem 1.1rem",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              لوحة التحكم
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const logoPreview = getLogoSrc(form);
  const heroPreview = getHeroBannerSrc(form);
  const heroIsVideo = isHeroVideoSrc(heroPreview, form.heroMediaKind);
  const orderedMedia = [...heroMedia].sort((a, b) => a.orderIndex - b.orderIndex);
  const orderedSections = [...sections].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="ss-page">
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLE }} />

      <div
        id="toast"
        className={`${toast ? `show ${toast.type}` : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast?.message}
      </div>

      <header
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 2px rgba(0,0,0,.04)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "64rem",
            margin: "0 auto",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                background: "#c3152a",
                color: "#fff",
                width: 36,
                height: 36,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 16px rgba(195,21,42,.25)",
              }}
            >
              <i className="fas fa-palette" style={{ fontSize: "0.85rem" }} />
            </div>
            <div>
              <h1 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", lineHeight: 1.25, margin: 0 }}>
                إعدادات الصفحة الرئيسية
              </h1>
              <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>
                تحكم في مظهر وهوية الصفحة الرئيسية (إعدادات الهوية)
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "0.375rem 0.75rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              <i className="fas fa-eye" /> معاينة الصفحة
            </a>
            <Link
              href="/app/dashboard"
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "0.375rem 0.75rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              <i className="fas fa-arrow-right" /> لوحة التحكم
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "64rem", margin: "0 auto", padding: "2rem 1rem 6rem" }}>
        {loading ? (
          <div className="section-card" style={{ textAlign: "center", color: "#64748b" }}>
            <i className="fas fa-circle-notch fa-spin" style={{ marginLeft: 8 }} />
            جاري تحميل الإعدادات...
          </div>
        ) : (
          <>
            {/* A. Theme colors */}
            <div className="section-card">
              <h2 className="section-title">
                <span className="section-icon" style={{ background: "#fee2e2", color: "#dc2626" }}>
                  <i className="fas fa-swatchbook" />
                </span>
                ألوان الثيم
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "1rem",
                }}
              >
                {(
                  [
                    ["primaryColor", "Primary Color"],
                    ["secondaryColor", "Secondary Color"],
                    ["buttonColor", "Button Color"],
                    ["headerBgColor", "Header Background"],
                    ["textColor", "Text Color"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} style={{ display: "block" }}>
                    <span className="ss-label">{label}</span>
                    <input
                      type="color"
                      className="ss-color"
                      value={form[key] || "#000000"}
                      onChange={(e) => patch(key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* B. Typography colors */}
            <div className="section-card">
              <h2 className="section-title">
                <span className="section-icon" style={{ background: "#e0e7ff", color: "#4f46e5" }}>
                  <i className="fas fa-font" />
                </span>
                ألوان الخطوط
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "1rem",
                }}
              >
                {(
                  [
                    ["headingColor", "Heading Color"],
                    ["paragraphColor", "Paragraph Color"],
                    ["linkColor", "Link Color"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} style={{ display: "block" }}>
                    <span className="ss-label">{label}</span>
                    <input
                      type="color"
                      className="ss-color"
                      value={form[key] || "#000000"}
                      onChange={(e) => patch(key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* C. Logo */}
            <div className="section-card">
              <h2 className="section-title">
                <span className="section-icon" style={{ background: "#d1fae5", color: "#059669" }}>
                  <i className="fas fa-image" />
                </span>
                شعار المنصة
              </h2>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: "1 1 240px" }}>
                  <label className="ss-label">رفع / استبدال الشعار (PNG / SVG / WEBP)</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <input
                      ref={logoFileRef}
                      type="file"
                      accept="image/*"
                      className="ss-input"
                      style={{ flex: 1, minWidth: 180, background: "#f8fafc" }}
                    />
                    <button
                      type="button"
                      onClick={() => void uploadLogo()}
                      disabled={uploadingLogo}
                      style={{
                        background: "#059669",
                        color: "#fff",
                        padding: "0.625rem 1rem",
                        borderRadius: 8,
                        border: "none",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        cursor: uploadingLogo ? "wait" : "pointer",
                        whiteSpace: "nowrap",
                        fontFamily: "inherit",
                      }}
                    >
                      {uploadingLogo ? <span className="spinner" /> : <i className="fas fa-upload" style={{ marginLeft: 4 }} />}{" "}
                      رفع
                    </button>
                    {(form.logoPath || form.logoData) && (
                      <button
                        type="button"
                        onClick={() => void removeLogo()}
                        disabled={uploadingLogo}
                        style={{
                          background: "#fee2e2",
                          color: "#b91c1c",
                          padding: "0.625rem 1rem",
                          borderRadius: 8,
                          border: "none",
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        <i className="fas fa-trash" style={{ marginLeft: 4 }} /> إزالة
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.375rem" }}>الشعار الحالي</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoPreview || "/naiosh-logo.png"}
                    alt="الشعار"
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      objectFit: "contain",
                      background: "#f8fafc",
                      padding: 8,
                      boxShadow: "0 1px 3px rgba(0,0,0,.06)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* D + E + F. Hero */}
            <div className="section-card" id="hero-section">
              <h2 className="section-title">
                <span className="section-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
                  <i className="fas fa-panorama" />
                </span>
                خلفية Hero الرئيسية
              </h2>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "1.25rem" }}>
                ارفع صورة أو فيديو يُعرض كخلفية كاملة للـ Hero. يُحفظ تلقائياً في التخزين المحلي على السيرفر وقاعدة البيانات.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div className="upload-zone">
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "#1e40af",
                      marginBottom: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        background: "#dbeafe",
                        color: "#2563eb",
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                      }}
                    >
                      <i className="fas fa-image" />
                    </span>
                    رفع صورة Hero
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <input
                      ref={heroImgFileRef}
                      type="file"
                      accept="image/*"
                      className="ss-input"
                    />
                    <input
                      ref={heroImgCaptionRef}
                      type="text"
                      maxLength={200}
                      placeholder="عنوان / وصف (اختياري)"
                      className="ss-input"
                    />
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.375rem 0 0.75rem" }}>
                    PNG / JPG / WEBP
                  </p>
                  <button
                    type="button"
                    onClick={() => void uploadHeroMedia("image")}
                    disabled={uploadingHeroImg}
                    style={{
                      width: "100%",
                      background: "#2563eb",
                      color: "#fff",
                      padding: "0.625rem",
                      borderRadius: 12,
                      border: "none",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      cursor: uploadingHeroImg ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      fontFamily: "inherit",
                    }}
                  >
                    {uploadingHeroImg ? <span className="spinner" /> : <i className="fas fa-cloud-arrow-up" />}
                    رفع الصورة
                  </button>
                </div>

                <div className="upload-zone upload-zone-video">
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "#5b21b6",
                      marginBottom: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        background: "#ede9fe",
                        color: "#7c3aed",
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                      }}
                    >
                      <i className="fas fa-video" />
                    </span>
                    رفع فيديو Hero
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <input
                      ref={heroVidFileRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                      className="ss-input"
                    />
                    <input
                      ref={heroVidCaptionRef}
                      type="text"
                      maxLength={200}
                      placeholder="عنوان / وصف (اختياري)"
                      className="ss-input"
                    />
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.375rem 0 0.75rem" }}>
                    MP4 / WEBM / MOV — قد يستغرق دقيقة للملفات الكبيرة
                  </p>
                  <button
                    type="button"
                    onClick={() => void uploadHeroMedia("video")}
                    disabled={uploadingHeroVid}
                    style={{
                      width: "100%",
                      background: "#7c3aed",
                      color: "#fff",
                      padding: "0.625rem",
                      borderRadius: 12,
                      border: "none",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      cursor: uploadingHeroVid ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      fontFamily: "inherit",
                    }}
                  >
                    {uploadingHeroVid ? <span className="spinner" /> : <i className="fas fa-cloud-arrow-up" />}
                    رفع الفيديو
                  </button>
                </div>
              </div>

              {/* E. Saved media */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1.25rem", marginBottom: "0.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "#334155",
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <i className="fas fa-layer-group" style={{ color: "#94a3b8" }} />
                    الوسائط المحفوظة
                  </h3>
                  <button
                    type="button"
                    onClick={() => void reloadHeroMedia()}
                    style={{
                      fontSize: "0.75rem",
                      color: "#2563eb",
                      border: "1px solid #bfdbfe",
                      borderRadius: 8,
                      padding: "0.375rem 0.625rem",
                      background: "#fff",
                      cursor: "pointer",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontFamily: "inherit",
                    }}
                  >
                    <i className="fas fa-rotate-right" /> تحديث
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minHeight: 56 }}>
                  {orderedMedia.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.875rem", padding: "1.25rem 0" }}>
                      لا توجد وسائط محفوظة بعد
                    </p>
                  ) : (
                    orderedMedia.map((item, idx) => {
                      const isVideo = item.type === "video" || isHeroVideoSrc(item.url, item.type);
                      const shortTitle =
                        item.title || item.caption || item.url.split("/").pop()?.slice(0, 40) || item.id;
                      return (
                        <div key={item.id} className="hero-media-card">
                          {isVideo ? (
                            <div className="hero-media-thumb-video">
                              <i className="fas fa-play" style={{ color: "#7c3aed" }} />
                            </div>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.url} alt="" className="hero-media-thumb" />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.375rem",
                                flexWrap: "wrap",
                                marginBottom: 4,
                              }}
                            >
                              <span className={`badge ${isVideo ? "badge-vid" : "badge-img"}`}>
                                {isVideo ? "فيديو" : "صورة"}
                              </span>
                              <span className={`badge ${item.isActive ? "badge-on" : "badge-off"}`}>
                                {item.isActive ? "ظاهر" : "مخفي"}
                              </span>
                            </div>
                            <p
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                color: "#334155",
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={item.url}
                            >
                              {shortTitle}
                            </p>
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "#94a3b8",
                                margin: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.url}
                            </p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                            <button
                              type="button"
                              className="media-btn media-btn-mute"
                              title="رفع"
                              disabled={idx === 0}
                              onClick={() => void patchHeroMedia(item.id, "move", "up")}
                            >
                              <i className="fas fa-arrow-up" style={{ fontSize: "0.7rem" }} />
                            </button>
                            <button
                              type="button"
                              className="media-btn media-btn-mute"
                              title="تحريك لأسفل"
                              disabled={idx === orderedMedia.length - 1}
                              onClick={() => void patchHeroMedia(item.id, "move", "down")}
                            >
                              <i className="fas fa-arrow-down" style={{ fontSize: "0.7rem" }} />
                            </button>
                            <button
                              type="button"
                              className={`media-btn ${item.isActive ? "media-btn-green" : "media-btn-mute"}`}
                              title={item.isActive ? "إخفاء" : "إظهار"}
                              onClick={() => void patchHeroMedia(item.id, "toggle")}
                            >
                              <i className={`fas ${item.isActive ? "fa-eye" : "fa-eye-slash"}`} style={{ fontSize: "0.7rem" }} />
                            </button>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="media-btn media-btn-mute"
                              title="فتح"
                            >
                              <i className="fas fa-external-link-alt" style={{ fontSize: "0.7rem" }} />
                            </a>
                            <button
                              type="button"
                              className="media-btn media-btn-red"
                              title="حذف"
                              onClick={() => void deleteHeroMedia(item.id)}
                            >
                              <i className="fas fa-trash" style={{ fontSize: "0.7rem" }} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* F. Background settings */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1.25rem", marginTop: "0.5rem" }}>
                <h3
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "#334155",
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <i className="fas fa-sliders" style={{ color: "#94a3b8" }} /> إعدادات الخلفية
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <label style={{ display: "block" }}>
                    <span className="ss-label-xs">وضع الصورة</span>
                    <select
                      className="ss-input"
                      value={form.heroImageMode}
                      onChange={(e) => patch("heroImageMode", e.target.value === "center" ? "center" : "cover")}
                    >
                      <option value="cover">Cover (ملء كامل)</option>
                      <option value="center">Center (توسيط)</option>
                    </select>
                  </label>
                  <label style={{ display: "block" }}>
                    <span className="ss-label-xs">الخلفية النشطة</span>
                    <select
                      className="ss-input"
                      value={form.heroActiveType}
                      onChange={(e) => patch("heroActiveType", e.target.value === "video" ? "video" : "image")}
                    >
                      <option value="image">صورة</option>
                      <option value="video">فيديو</option>
                    </select>
                  </label>
                  <label style={{ display: "block" }}>
                    <span className="ss-label-xs">
                      قوة التراكب الداكن:{" "}
                      <span className="range-value">{form.heroOverlayStrength}%</span>
                    </span>
                    <input
                      type="range"
                      min={50}
                      max={70}
                      step={1}
                      value={form.heroOverlayStrength}
                      onChange={(e) => patch("heroOverlayStrength", Number(e.target.value))}
                      style={{ width: "100%", marginTop: 4 }}
                    />
                  </label>
                </div>

                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "1rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.heroAutoplaySlider}
                    onChange={(e) => patch("heroAutoplaySlider", e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <span>تشغيل السلايدر التلقائي (كل 6 ثوانٍ)</span>
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "1rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <label style={{ display: "block" }}>
                    <span className="ss-label-xs">وصف الصورة النشطة</span>
                    <input
                      type="text"
                      maxLength={200}
                      className="ss-input"
                      value={form.heroActiveImageCaption}
                      onChange={(e) => patch("heroActiveImageCaption", e.target.value)}
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <span className="ss-label-xs">وصف الفيديو النشط</span>
                    <input
                      type="text"
                      maxLength={200}
                      className="ss-input"
                      value={form.heroActiveVideoCaption}
                      onChange={(e) => patch("heroActiveVideoCaption", e.target.value)}
                    />
                  </label>
                </div>

                <label style={{ display: "block", marginTop: "1rem" }}>
                  <span className="ss-label-xs">وصف إضافي للفيديو</span>
                  <textarea
                    maxLength={300}
                    rows={2}
                    className="ss-input"
                    value={form.heroActiveVideoDescription}
                    onChange={(e) => patch("heroActiveVideoDescription", e.target.value)}
                  />
                </label>

                {heroPreview && (
                  <div style={{ marginTop: "1rem" }}>
                    <p className="ss-label-xs">معاينة الصورة الحالية</p>
                    {heroIsVideo ? (
                      <video
                        src={heroPreview}
                        muted
                        playsInline
                        controls
                        style={{
                          width: "100%",
                          height: 144,
                          borderRadius: 12,
                          border: "1px solid #e2e8f0",
                          objectFit: "cover",
                          background: "#0f172a",
                        }}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={heroPreview}
                        alt="معاينة Hero"
                        style={{
                          width: "100%",
                          height: 144,
                          borderRadius: 12,
                          border: "1px solid #e2e8f0",
                          objectFit: form.heroImageMode === "center" ? "contain" : "cover",
                          background: "#f1f5f9",
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* G. Dynamic sections */}
            <div className="section-card">
              <h2 className="section-title">
                <span className="section-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>
                  <i className="fas fa-table-cells-large" />
                </span>
                الأقسام الرئيسية (Dynamic)
              </h2>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "1rem" }}>
                إضافة وتعديل وحذف وترتيب بطاقات الأقسام الرئيسية التي تظهر في الصفحة الرئيسية.
              </p>
              <div style={{ marginBottom: "1rem" }}>
                <button
                  type="button"
                  onClick={() => void addSection()}
                  style={{
                    background: "#7c3aed",
                    color: "#fff",
                    padding: "0.625rem 1rem",
                    borderRadius: 8,
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: "0 4px 12px rgba(124,58,237,.25)",
                  }}
                >
                  <i className="fas fa-plus" style={{ marginLeft: 4 }} /> إضافة قسم
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {orderedSections.length === 0 ? (
                  <div
                    style={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      padding: "1rem",
                      fontSize: "0.875rem",
                      color: "#64748b",
                    }}
                  >
                    لا توجد أقسام حالياً
                  </div>
                ) : (
                  orderedSections.map((section) => {
                    const busy = sectionBusyId === section.id;
                    const iconPreview =
                      section.iconUrl && !section.iconUrl.startsWith("fa:") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={section.iconUrl} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
                      ) : (
                        <i className={section.iconClass || "fas fa-square"} style={{ color: "#c3152a" }} />
                      );
                    return (
                      <div
                        key={section.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 12,
                          padding: "1rem",
                          background: "#f8fafc",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "0.75rem",
                            gap: "0.5rem",
                          }}
                        >
                          <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#334155", margin: 0 }}>
                            قسم #{section.id.slice(-6)}
                          </p>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void deleteSection(section.id)}
                            style={{
                              color: "#dc2626",
                              background: "transparent",
                              border: "none",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            <i className="fas fa-trash" style={{ marginLeft: 4 }} /> حذف
                          </button>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "0.75rem",
                          }}
                        >
                          <label style={{ display: "block" }}>
                            <span className="ss-label-xs">العنوان</span>
                            <input
                              type="text"
                              maxLength={120}
                              className="ss-input"
                              value={section.title}
                              onChange={(e) => updateSectionField(section.id, { title: e.target.value })}
                            />
                          </label>
                          <label style={{ display: "block" }}>
                            <span className="ss-label-xs">الرابط (اختياري)</span>
                            <input
                              type="text"
                              className="ss-input"
                              value={section.link || ""}
                              onChange={(e) => updateSectionField(section.id, { link: e.target.value || null })}
                            />
                          </label>
                          <label style={{ display: "block", gridColumn: "1 / -1" }}>
                            <span className="ss-label-xs">الوصف</span>
                            <textarea
                              maxLength={500}
                              rows={2}
                              className="ss-input"
                              value={section.description || ""}
                              onChange={(e) =>
                                updateSectionField(section.id, { description: e.target.value || null })
                              }
                            />
                          </label>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                            gap: "0.75rem",
                            marginTop: "0.75rem",
                          }}
                        >
                          <label style={{ display: "block" }}>
                            <span className="ss-label-xs">أيقونة (Font Awesome class)</span>
                            <input
                              type="text"
                              className="ss-input"
                              value={section.iconClass}
                              onChange={(e) => updateSectionField(section.id, { iconClass: e.target.value })}
                            />
                          </label>
                          <label style={{ display: "block" }}>
                            <span className="ss-label-xs">الترتيب</span>
                            <input
                              type="number"
                              min={0}
                              max={9999}
                              className="ss-input"
                              value={section.orderIndex}
                              onChange={(e) =>
                                updateSectionField(section.id, { orderIndex: Number(e.target.value) || 0 })
                              }
                            />
                          </label>
                          <div>
                            <span className="ss-label-xs">معاينة الأيقونة</span>
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                border: "1px solid #e2e8f0",
                                background: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {iconPreview}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginTop: "0.75rem",
                          }}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            className="ss-input"
                            style={{ flex: 1, minWidth: 180 }}
                            disabled={busy}
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              void uploadSectionIcon(section.id, file);
                              e.target.value = "";
                            }}
                          />
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void saveSection(section)}
                            style={{
                              background: "#2563eb",
                              color: "#fff",
                              padding: "0.625rem 1rem",
                              borderRadius: 8,
                              border: "none",
                              fontWeight: 700,
                              fontSize: "0.875rem",
                              cursor: busy ? "wait" : "pointer",
                              fontFamily: "inherit",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {busy ? <span className="spinner" /> : <i className="fas fa-save" style={{ marginLeft: 4 }} />}{" "}
                            حفظ القسم
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Sticky footer save bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          insetInline: 0,
          zIndex: 40,
          background: "#fff",
          borderTop: "1px solid #e2e8f0",
          boxShadow: "0 -4px 16px rgba(0,0,0,.06)",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "0.875rem", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
          <i className="fas fa-circle-info" style={{ color: "#c3152a" }} />
          اضغط &quot;حفظ&quot; لتطبيق جميع التغييرات دفعة واحدة
        </span>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || loading}
          style={{
            background: "#c3152a",
            color: "#fff",
            padding: "0.625rem 1.5rem",
            borderRadius: 12,
            border: "none",
            fontWeight: 700,
            fontSize: "0.875rem",
            cursor: saving ? "wait" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "0 8px 20px rgba(195,21,42,.3)",
            fontFamily: "inherit",
          }}
        >
          {saving ? <span className="spinner" /> : <i className="fas fa-save" />}
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}
