"use client";

import { FormEvent, useEffect, useState } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import { SERVICE_REQUEST_TYPES, type PortalRequest } from "@/lib/client-portal";

export default function PortalRequestsPage() {
  const [requests, setRequests] = useState<PortalRequest[]>([]);
  const [demo, setDemo] = useState(false);
  const [type, setType] = useState<(typeof SERVICE_REQUEST_TYPES)[number]>(SERVICE_REQUEST_TYPES[0]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    Promise.all([
      fetch("/api/portal/requests", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/portal/profile", { credentials: "include" }).then((r) => r.json()),
    ]).then(([r, p]) => {
      setRequests(r.requests || []);
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
    const res = await fetch("/api/portal/requests", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, notes }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "تعذر الإرسال");
      return;
    }
    setMsg(`تم إنشاء الطلب — المرجع ${json.request.refNo}`);
    setTitle("");
    setNotes("");
    load();
  };

  return (
    <PortalShell title="طلباتي وخدماتي" demoBanner={demo}>
      <form className="portal-card portal-form" onSubmit={onSubmit}>
        <h2>طلب خدمة قانونية</h2>
        <div className="portal-grid" style={{ gridTemplateColumns: "1fr 1.4fr" }}>
          <label>
            نوع الطلب
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              {SERVICE_REQUEST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            العنوان
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="مثال: مراجعة عقد توريد" />
          </label>
        </div>
        <label>
          تفاصيل إضافية
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </label>
        <button className="portal-btn primary" type="submit">
          إرسال الطلب
        </button>
        {msg ? <p style={{ color: "#166534", fontWeight: 700 }}>{msg}</p> : null}
        {error ? <p style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</p> : null}
      </form>

      <section className="portal-card">
        <h2>سجل الطلبات</h2>
        {requests.length === 0 ? (
          <div className="portal-empty">لا طلبات بعد.</div>
        ) : (
          <table className="portal-table">
            <thead>
              <tr>
                <th>المرجع</th>
                <th>النوع</th>
                <th>العنوان</th>
                <th>الحالة</th>
                <th>المسؤول</th>
                <th>آخر تحديث</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.refNo}</td>
                  <td>{r.type}</td>
                  <td>{r.title}</td>
                  <td>
                    <span className="portal-badge gold">{r.status}</span>
                  </td>
                  <td>{r.assignee || "—"}</td>
                  <td>{r.lastUpdate || r.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </PortalShell>
  );
}
