"use client";

import { FormEvent, Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalEmptyState, PortalErrorCard, PortalLoadingCard } from "@/components/portal/portal-empty";
import { portalJson } from "@/lib/portal-fetch";
import { SERVICE_REQUEST_TYPES, type PortalRequest } from "@/lib/client-portal";

export default function PortalRequestsPage() {
  const [requests, setRequests] = useState<PortalRequest[]>([]);
  const [demo, setDemo] = useState(false);
  const [type, setType] = useState<(typeof SERVICE_REQUEST_TYPES)[number]>(SERVICE_REQUEST_TYPES[0]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("الكل");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [r, p] = await Promise.all([
      portalJson<{ requests?: PortalRequest[] }>("/api/portal/requests"),
      portalJson<{ profile?: { isDemo?: boolean } }>("/api/portal/profile"),
    ]);
    if (!r.ok) {
      setError(r.error);
      setRequests([]);
      setLoading(false);
      return;
    }
    setRequests(r.data.requests || []);
    setDemo(Boolean(p.ok && p.data.profile?.isDemo));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return requests.filter((r) => {
      if (status !== "الكل" && r.status !== status) return false;
      if (!needle) return true;
      return [r.refNo, r.type, r.title, r.status, r.assignee || ""].join(" ").toLowerCase().includes(needle);
    });
  }, [requests, q, status]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setSaving(true);
    const res = await portalJson<{ request?: PortalRequest }>("/api/portal/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, notes }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMsg(`تم إنشاء الطلب — المرجع ${res.data.request?.refNo || ""}`);
    setTitle("");
    setNotes("");
    await load();
  };

  return (
    <PortalShell title="طلباتي وخدماتي" demoBanner={demo}>
      {error ? <PortalErrorCard message={error} onRetry={load} /> : null}

      <form className="portal-card portal-form" onSubmit={onSubmit}>
        <h2>طلب خدمة قانونية</h2>
        <div className="portal-grid" style={{ gridTemplateColumns: "1fr 1.4fr" }}>
          <label>
            نوع الطلب
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)} disabled={demo}>
              {SERVICE_REQUEST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            العنوان
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={demo}
              placeholder="مثال: مراجعة عقد توريد"
            />
          </label>
        </div>
        <label>
          تفاصيل إضافية
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={demo} />
        </label>
        <button className="portal-btn primary" type="submit" disabled={demo || saving}>
          {demo ? "الإرسال غير متاح للتجريبي" : saving ? "جاري الإرسال…" : "إرسال الطلب"}
        </button>
        {msg ? <p style={{ color: "#166534", fontWeight: 700 }}>{msg}</p> : null}
      </form>

      <section className="portal-card">
        <h2>سجل الطلبات</h2>
        <div className="portal-grid" style={{ gridTemplateColumns: "1.4fr 0.8fr" }}>
          <label>
            بحث
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="مرجع أو عنوان…" />
          </label>
          <label>
            الحالة
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>الكل</option>
              <option>جديد</option>
              <option>قيد المعالجة</option>
              <option>مكتمل</option>
              <option>مرفوض</option>
              <option>مغلق</option>
            </select>
          </label>
        </div>

        {loading ? <PortalLoadingCard /> : null}
        {!loading && filtered.length === 0 ? (
          <PortalEmptyState
            title={requests.length ? "لا نتائج" : "لا طلبات بعد"}
            description="أنشئ طلباً جديداً من النموذج أعلاه لمتابعة حالته هنا."
          />
        ) : null}

        {!loading && filtered.length > 0 ? (
          <table className="portal-table">
            <thead>
              <tr>
                <th>المرجع</th>
                <th>النوع</th>
                <th>العنوان</th>
                <th>الحالة</th>
                <th>المسؤول</th>
                <th>آخر تحديث</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <Fragment key={r.id}>
                  <tr>
                    <td>{r.refNo}</td>
                    <td>{r.type}</td>
                    <td>{r.title}</td>
                    <td>
                      <span className="portal-badge gold">{r.status}</span>
                    </td>
                    <td>{r.assignee || "—"}</td>
                    <td>{r.lastUpdate || r.createdAt}</td>
                    <td>
                      <button type="button" className="portal-btn ghost" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
                        تفاصيل
                      </button>
                    </td>
                  </tr>
                  {openId === r.id ? (
                    <tr>
                      <td colSpan={7}>
                        <div style={{ padding: "0.5rem 0", color: "#526071", fontWeight: 600 }}>
                          ملاحظات: {r.notes || "—"}
                          {r.timeline?.length ? (
                            <ul style={{ margin: "0.5rem 0 0", paddingInlineStart: "1.1rem" }}>
                              {r.timeline.map((t, i) => (
                                <li key={`${r.id}-t-${i}`}>
                                  {t.date}: {t.text}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </PortalShell>
  );
}
