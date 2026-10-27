"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalEmptyState, PortalErrorCard, PortalLoadingCard } from "@/components/portal/portal-empty";
import { portalFetch, portalJson } from "@/lib/portal-fetch";
import type { PortalCase, PortalDocument } from "@/lib/client-portal";

export default function PortalDocumentsPage() {
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [cases, setCases] = useState<PortalCase[]>([]);
  const [demo, setDemo] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("عام");
  const [caseId, setCaseId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("الكل");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [d, p, c] = await Promise.all([
      portalJson<{ documents?: PortalDocument[] }>("/api/portal/documents"),
      portalJson<{ profile?: { isDemo?: boolean } }>("/api/portal/profile"),
      portalJson<{ cases?: PortalCase[] }>("/api/portal/cases"),
    ]);
    if (!d.ok) {
      setError(d.error);
      setDocuments([]);
      setLoading(false);
      return;
    }
    setDocuments(d.data.documents || []);
    setDemo(Boolean(p.ok && p.data.profile?.isDemo));
    setCases(c.ok ? c.data.cases || [] : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return documents.filter((d) => {
      if (catFilter !== "الكل" && d.category !== catFilter) return false;
      if (!needle) return true;
      return [d.title, d.category, d.fileName || "", d.status].join(" ").toLowerCase().includes(needle);
    });
  }, [documents, q, catFilter]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");
    if (!file) {
      setError("اختر ملفاً للرفع");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.set("title", title);
      form.set("category", category);
      if (caseId) form.set("caseId", caseId);
      form.set("file", file);
      const res = await portalFetch("/api/portal/documents", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "تعذر الرفع");
        setUploading(false);
        return;
      }
      setMsg("تم رفع المستند — بانتظار المراجعة");
      setTitle("");
      setFile(null);
      setCaseId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر الرفع");
    } finally {
      setUploading(false);
    }
  };

  const download = async (id: string, name: string | null) => {
    setError("");
    try {
      const res = await portalFetch(`/api/portal/documents/${id}?download=1`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError((json as { error?: string }).error || "تعذر التنزيل");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر التنزيل");
    }
  };

  return (
    <PortalShell title="مستنداتي" demoBanner={demo}>
      {error ? <PortalErrorCard message={error} onRetry={load} /> : null}

      <form className="portal-card portal-form" onSubmit={onSubmit}>
        <h2>رفع مستند مصرح</h2>
        <p style={{ margin: 0, color: "#526071", fontWeight: 600 }}>
          الأنواع المسموحة: PDF / JPEG / PNG / WEBP — بحد أقصى 10MB. الوصول محصور بمستنداتك فقط.
        </p>
        <div className="portal-grid" style={{ gridTemplateColumns: "1.2fr 0.8fr 1fr" }}>
          <label>
            العنوان
            <input value={title} onChange={(e) => setTitle(e.target.value)} required disabled={demo} />
          </label>
          <label>
            التصنيف
            <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={demo}>
              <option>عام</option>
              <option>عقود</option>
              <option>مذكرات</option>
              <option>هوية</option>
              <option>أحكام</option>
            </select>
          </label>
          <label>
            ربط بقضية (اختياري)
            <select value={caseId} onChange={(e) => setCaseId(e.target.value)} disabled={demo}>
              <option value="">—</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNo}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          الملف
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            disabled={demo}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required={!demo}
          />
        </label>
        <div className="portal-actions">
          <button className="portal-btn primary" type="submit" disabled={demo || uploading}>
            {demo ? "رفع غير متاح للتجريبي" : uploading ? "جاري الرفع…" : "رفع المستند"}
          </button>
          <Link className="portal-btn ghost" href="/portal/requests">
            طلب مستند من المكتب
          </Link>
        </div>
        {msg ? <p style={{ color: "#166534", fontWeight: 700 }}>{msg}</p> : null}
      </form>

      <section className="portal-card">
        <h2>المستندات المتاحة لك</h2>
        <div className="portal-grid" style={{ gridTemplateColumns: "1.4fr 0.8fr" }}>
          <label>
            بحث
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="عنوان أو اسم ملف…" />
          </label>
          <label>
            التصنيف
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option>الكل</option>
              <option>عام</option>
              <option>عقود</option>
              <option>مذكرات</option>
              <option>هوية</option>
              <option>أحكام</option>
            </select>
          </label>
        </div>

        {loading ? <PortalLoadingCard /> : null}
        {!loading && filtered.length === 0 ? (
          <PortalEmptyState
            title={documents.length ? "لا نتائج" : "لا مستندات بعد"}
            description="ارفع مستنداً مصرحاً أو انتظر مستندات يشاركها المكتب معك."
            actionLabel={demo ? undefined : "التمرير لنموذج الرفع"}
            actionHref={demo ? undefined : "#"}
          />
        ) : null}

        {!loading && filtered.length > 0 ? (
          <table className="portal-table">
            <thead>
              <tr>
                <th>العنوان</th>
                <th>التصنيف</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.title}
                    {d.isDemo ? " (تجريبي)" : ""}
                    {d.fileName ? (
                      <span style={{ display: "block", color: "#526071", fontSize: "0.8rem" }}>{d.fileName}</span>
                    ) : null}
                  </td>
                  <td>{d.category}</td>
                  <td>
                    <span className="portal-badge">{d.status}</span>
                  </td>
                  <td>{d.createdAt}</td>
                  <td>
                    {d.fileUrl || (!d.isDemo && d.fileName) ? (
                      <button type="button" className="portal-btn ghost" onClick={() => void download(d.id, d.fileName)}>
                        تنزيل
                      </button>
                    ) : d.isDemo ? (
                      <span style={{ color: "#526071", fontWeight: 600 }}>عرض فقط</span>
                    ) : (
                      <span style={{ color: "#526071" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </PortalShell>
  );
}
