"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import type { PortalDocument } from "@/lib/client-portal";

export default function PortalDocumentsPage() {
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [demo, setDemo] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("عام");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    Promise.all([
      fetch("/api/portal/documents", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/portal/profile", { credentials: "include" }).then((r) => r.json()),
    ]).then(([d, p]) => {
      setDocuments(d.documents || []);
      setDemo(Boolean(p.profile?.isDemo));
    });
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");
    const res = await fetch("/api/portal/documents", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        fileName: `${title || "document"}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: 120000,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "تعذر الرفع");
      return;
    }
    setMsg("تم تسجيل المستند — بانتظار المراجعة");
    setTitle("");
    load();
  };

  return (
    <PortalShell title="مستنداتي" demoBanner={demo}>
      <form className="portal-card portal-form" onSubmit={onSubmit}>
        <h2>رفع مستند مصرح</h2>
        <p style={{ margin: 0, color: "#526071", fontWeight: 600 }}>
          الأنواع المسموحة: PDF / JPEG / PNG / WEBP — بحد أقصى 10MB. الوصول محصور بمستنداتك فقط.
        </p>
        <div className="portal-grid" style={{ gridTemplateColumns: "1.4fr 1fr auto", alignItems: "end" }}>
          <label>
            العنوان
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            التصنيف
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>عام</option>
              <option>عقود</option>
              <option>مذكرات</option>
              <option>هوية</option>
              <option>أحكام</option>
            </select>
          </label>
          <button className="portal-btn primary" type="submit">
            رفع
          </button>
        </div>
        {msg ? <p style={{ color: "#166534", fontWeight: 700 }}>{msg}</p> : null}
        {error ? <p style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</p> : null}
      </form>

      <section className="portal-card">
        <h2>المستندات المتاحة لك</h2>
        {documents.length === 0 ? (
          <div className="portal-empty">لا مستندات بعد.</div>
        ) : (
          <table className="portal-table">
            <thead>
              <tr>
                <th>العنوان</th>
                <th>التصنيف</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.title}
                    {d.isDemo ? " (تجريبي)" : ""}
                  </td>
                  <td>{d.category}</td>
                  <td>
                    <span className="portal-badge">{d.status}</span>
                  </td>
                  <td>{d.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </PortalShell>
  );
}
