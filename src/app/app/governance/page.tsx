"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { AppShell } from "@/components/app-shell";
import { canApproveRole, useSession } from "@/lib/session";

type Tab = "approvals" | "policies" | "signatures" | "audit";

type Approval = {
  id: string;
  refNo: string;
  type: string;
  title: string;
  requester: string;
  approver: string;
  priority: string;
  status: string;
  statusRaw: string;
  requestedAt: string;
};

type Policy = {
  id: string;
  title: string;
  category: string;
  description: string;
  version: string;
  status: string;
  effectiveDate: string;
};

type Signature = {
  id: string;
  refNo: string;
  documentTitle: string;
  documentRef: string;
  signer: string;
  signerEmail: string;
  canAct: boolean;
  status: string;
  statusRaw: string;
  signedAt: string;
  expiresAt: string;
};

type AuditEntry = {
  id: string;
  user: string;
  action: string;
  entity: string;
  details: string;
  severity: string;
  time: string;
};

const tabs: { key: Tab; label: string }[] = [
  { key: "approvals", label: "طلبات الاعتماد" },
  { key: "policies", label: "سياسات الحوكمة" },
  { key: "signatures", label: "التوقيع الإلكتروني" },
  { key: "audit", label: "سجل التدقيق" },
];

type ActionMsg = { type: "success" | "error"; text: string };

const thStyle: CSSProperties = {
  textAlign: "right",
  padding: "0.65rem 0.75rem",
  fontSize: "0.78rem",
  color: "#64748b",
  fontWeight: 700,
  borderBottom: "1px solid #e2e8f0",
};

const tdStyle: CSSProperties = {
  padding: "0.75rem",
  fontSize: "0.82rem",
  color: "#0a0a12",
  borderBottom: "1px solid #f1f5f9",
};

async function fetchJsonArray<T>(url: string, signal?: AbortSignal): Promise<T[]> {
  const res = await fetch(url, { credentials: "include", signal });
  if (!res.ok) {
    const message = await readErrorMessage(res);
    throw new Error(message);
  }
  const data = await res.json();
  return Array.isArray(data) ? (data as T[]) : [];
}

async function readErrorMessage(res: Response) {
  try {
    const data = await res.json();
    if (data && typeof data === "object" && "error" in data) {
      return String((data as { error: unknown }).error);
    }
  } catch {
    // Fall through to a generic localized message.
  }
  return `تعذر تنفيذ الطلب (${res.status})`;
}

export default function GovernancePage() {
  const { user, ready } = useSession(true);
  const [tab, setTab] = useState<Tab>("approvals");
  const [loading, setLoading] = useState(true);

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [actionMsg, setActionMsg] = useState<ActionMsg | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const canApprove = user ? canApproveRole(user.role) : false;

  const loadAll = useCallback(
    async ({ signal, showLoading = true }: { signal?: AbortSignal; showLoading?: boolean } = {}) => {
      if (showLoading) setLoading(true);
      try {
        const [a, p, s, aud] = await Promise.all([
          fetchJsonArray<Approval>("/api/approval-requests", signal),
          fetchJsonArray<Policy>("/api/governance-policies", signal),
          fetchJsonArray<Signature>("/api/e-signatures", signal),
          canApprove ? fetchJsonArray<AuditEntry>("/api/audit-logs", signal) : Promise.resolve([]),
        ]);
        setApprovals(a);
        setPolicies(p);
        setSignatures(s);
        setAudit(aud);
      } catch (error) {
        if (!signal?.aborted) {
          setApprovals([]);
          setPolicies([]);
          setSignatures([]);
          setAudit([]);
          setActionMsg({
            type: "error",
            text: error instanceof Error ? error.message : "تعذر تحميل بيانات الحوكمة",
          });
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [canApprove]
  );

  useEffect(() => {
    if (!ready || !user) return;
    const controller = new AbortController();
    void Promise.resolve().then(() => loadAll({ signal: controller.signal }));
    return () => controller.abort();
  }, [loadAll, ready, user]);

  const resolveApproval = async (id: string, status: "approved" | "rejected") => {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/approval-requests/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      setActionMsg({ type: "success", text: status === "approved" ? "تم الاعتماد" : "تم الرفض" });
      await loadAll({ showLoading: false });
    } catch (error) {
      setActionMsg({
        type: "error",
        text: error instanceof Error ? error.message : "فشل تحديث طلب الاعتماد",
      });
    } finally {
      setBusyId(null);
    }
  };

  const signDocument = async (id: string, action: "sign" | "reject") => {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/e-signatures/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      const data = await res.json().catch(() => ({}));
      setActionMsg({
        type: "success",
        text: typeof data.message === "string" ? data.message : action === "sign" ? "تم التوقيع" : "تم الرفض",
      });
      await loadAll({ showLoading: false });
    } catch (error) {
      setActionMsg({
        type: "error",
        text: error instanceof Error ? error.message : "فشل تحديث طلب التوقيع",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (!ready || !user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#c3152a", animation: "spin-slow 0.9s linear infinite", margin: "0 auto 1rem" }} />
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const pendingApprovals = approvals.filter((a) => a.statusRaw === "pending").length;
  const pendingSignatures = signatures.filter((s) => s.statusRaw === "pending").length;

  return (
    <AppShell role={user.role} name={user.name}>
      <div style={{ maxWidth: 1200 }}>
        <h1 style={{ fontSize: "1.55rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.35rem" }}>
          ⚙️ الحوكمة والتوقيع الإلكتروني
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
          اعتمادات الوكيل الصناعي، سياسات الحوكمة، التوقيع الإلكتروني، وسجل التدقيق
        </p>

        {actionMsg && (
          <p style={{ background: actionMsg.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(195,21,42,0.09)", color: actionMsg.type === "success" ? "#16a34a" : "#c3152a", padding: "0.65rem 1rem", borderRadius: "10px", marginBottom: "1rem", fontWeight: 600, fontSize: "0.85rem" }}>
            {actionMsg.text}
          </p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {[
            { label: "طلبات معلقة", value: pendingApprovals, color: "#f59e0b" },
            { label: "توقيعات معلقة", value: pendingSignatures, color: "#c3152a" },
            { label: "سياسات سارية", value: policies.filter((p) => p.status === "ساري").length, color: "#22c55e" },
            { label: "سجلات تدقيق", value: canApprove ? audit.length : "غير متاح", color: "#0a0a12" },
          ].map((s) => (
            <div key={s.label} className="card-white" style={{ padding: "1rem 1.1rem" }}>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>{s.label}</p>
              <p style={{ fontWeight: 800, fontSize: "1.05rem", color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "1.25rem" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => { setTab(t.key); setActionMsg(null); }}
              style={{
                padding: "0.5rem 0.95rem",
                borderRadius: "10px",
                border: tab === t.key ? "1px solid #c3152a" : "1px solid #e2e8f0",
                background: tab === t.key ? "rgba(195,21,42,0.08)" : "#fff",
                color: tab === t.key ? "#c3152a" : "#475569",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-cairo)",
                fontSize: "0.82rem",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: "#64748b" }}>جاري التحميل...</p>
        ) : (
          <>
            {tab === "approvals" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["المرجع", "النوع", "العنوان", "مقدم الطلب", "الأولوية", "الحالة", canApprove ? "إجراء" : ""].filter(Boolean).map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {approvals.length === 0 ? (
                      <tr>
                        <td colSpan={canApprove ? 7 : 6} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                          لا توجد طلبات اعتماد
                        </td>
                      </tr>
                    ) : approvals.map((a) => (
                      <tr key={a.id}>
                        <td style={tdStyle}>{a.refNo}</td>
                        <td style={tdStyle}>{a.type}</td>
                        <td style={tdStyle}>{a.title}</td>
                        <td style={tdStyle}>{a.requester}</td>
                        <td style={tdStyle}>{a.priority}</td>
                        <td style={{ ...tdStyle, color: a.statusRaw === "pending" ? "#f59e0b" : a.statusRaw === "approved" ? "#22c55e" : "#c3152a", fontWeight: 600 }}>
                          {a.status}
                        </td>
                        {canApprove && (
                          <td style={tdStyle}>
                            {a.statusRaw === "pending" && (
                              <div style={{ display: "flex", gap: "0.35rem" }}>
                                <button type="button" disabled={busyId === a.id} onClick={() => resolveApproval(a.id, "approved")} style={btnSmall("#22c55e", busyId === a.id)}>اعتماد</button>
                                <button type="button" disabled={busyId === a.id} onClick={() => resolveApproval(a.id, "rejected")} style={btnSmall("#c3152a", busyId === a.id)}>رفض</button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "policies" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                {policies.length === 0 ? (
                  <div className="card-white" style={{ padding: "1.25rem", color: "#64748b", textAlign: "center" }}>
                    لا توجد سياسات حوكمة
                  </div>
                ) : policies.map((p) => (
                  <div key={p.id} className="card-white" style={{ padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "#c3152a", fontWeight: 700 }}>{p.category}</span>
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>v{p.version}</span>
                    </div>
                    <h3 style={{ fontWeight: 800, color: "#0a0a12", marginBottom: "0.4rem", fontSize: "0.95rem" }}>{p.title}</h3>
                    <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6 }}>{p.description}</p>
                    <p style={{ fontSize: "0.75rem", color: "#22c55e", marginTop: "0.5rem", fontWeight: 600 }}>
                      {p.status} • من {p.effectiveDate}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {tab === "signatures" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["المرجع", "المستند", "الموقّع", "الحالة", "التاريخ", "إجراء"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {signatures.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                          لا توجد طلبات توقيع
                        </td>
                      </tr>
                    ) : signatures.map((s) => (
                      <tr key={s.id}>
                        <td style={tdStyle}>{s.refNo}</td>
                        <td style={tdStyle}>{s.documentTitle}</td>
                        <td style={tdStyle}>{s.signer}</td>
                        <td style={{ ...tdStyle, color: s.statusRaw === "signed" ? "#22c55e" : s.statusRaw === "pending" ? "#f59e0b" : "#94a3b8" }}>
                          {s.status}
                        </td>
                        <td style={tdStyle}>{s.signedAt}</td>
                        <td style={tdStyle}>
                          {s.statusRaw === "pending" && s.canAct && (
                            <div style={{ display: "flex", gap: "0.35rem" }}>
                              <button type="button" disabled={busyId === s.id} onClick={() => signDocument(s.id, "sign")} style={btnSmall("#c3152a", busyId === s.id)}>توقيع</button>
                              <button type="button" disabled={busyId === s.id} onClick={() => signDocument(s.id, "reject")} style={btnSmall("#94a3b8", busyId === s.id)}>رفض</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "audit" && (
              canApprove ? (
                <div className="card-white" style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["المستخدم", "الإجراء", "الكيان", "التفاصيل", "الخطورة", "الوقت"].map((h) => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {audit.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                            لا توجد سجلات تدقيق
                          </td>
                        </tr>
                      ) : audit.map((l) => (
                        <tr key={l.id}>
                          <td style={tdStyle}>{l.user}</td>
                          <td style={tdStyle}>{l.action}</td>
                          <td style={tdStyle}>{l.entity}</td>
                          <td style={{ ...tdStyle, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.details}</td>
                          <td style={{ ...tdStyle, color: l.severity === "critical" ? "#c3152a" : l.severity === "warning" ? "#f59e0b" : "#64748b" }}>{labelSeverity(l.severity)}</td>
                          <td style={tdStyle}>{l.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>سجل التدقيق متاح للمدير والوكيل الصناعي فقط</p>
              )
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function btnSmall(color: string, disabled = false): CSSProperties {
  return {
    padding: "0.55rem 0.8rem",
    borderRadius: "7px",
    border: "none",
    background: color,
    color: "#fff",
    fontSize: "0.76rem",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "var(--font-cairo)",
    minHeight: 36,
    opacity: disabled ? 0.65 : 1,
  };
}

function labelSeverity(severity: string) {
  const labels: Record<string, string> = {
    info: "معلومة",
    warning: "تحذير",
    critical: "حرج",
  };
  return labels[severity] ?? severity;
}
