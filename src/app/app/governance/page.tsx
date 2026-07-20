"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  PageHeader,
  BtnPrimary,
  BtnSecondary,
  EmptyState,
  PageLoader,
  useSeedDemo,
  useToast,
} from "@/components/domain-page";
import { Modal } from "@/components/ui/modal";
import { useSession, canWriteRole } from "@/lib/session";
import { formatNumber } from "@/lib/format";
import type { FormField } from "@/data/module-configs";

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
  status: string;
  statusRaw: string;
  signedAt: string;
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

const tabs: { key: Tab; label: string; addLabel?: string }[] = [
  { key: "approvals", label: "طلبات الاعتماد", addLabel: "إضافة طلب اعتماد" },
  { key: "policies", label: "سياسات الحوكمة", addLabel: "إضافة سياسة" },
  { key: "signatures", label: "التوقيع الإلكتروني", addLabel: "إضافة طلب توقيع" },
  { key: "audit", label: "سجل التدقيق" },
];

const APPROVAL_TYPE_MAP: Record<string, string> = {
  "فتح قضية": "case_opening",
  "إعفاء رسوم": "fee_waiver",
  "إصدار مستند": "document_release",
  "صلاحية مستخدم": "user_access",
  "توقيع عقد": "contract_signing",
  أخرى: "other",
};

const approvalFields: FormField[] = [
  { key: "title", label: "عنوان الطلب", type: "text", required: true },
  {
    key: "type",
    label: "النوع",
    type: "select",
    required: true,
    options: ["فتح قضية", "إعفاء رسوم", "إصدار مستند", "صلاحية مستخدم", "توقيع عقد", "أخرى"],
  },
  { key: "priority", label: "الأولوية", type: "select", options: ["عاجل", "عالٍ", "متوسط", "منخفض"] },
  { key: "description", label: "الوصف", type: "textarea" },
];

const policyFields: FormField[] = [
  { key: "title", label: "عنوان السياسة", type: "text", required: true },
  { key: "category", label: "التصنيف", type: "text", required: true, placeholder: "عام / أمن / مالي" },
  { key: "description", label: "الوصف", type: "textarea", required: true },
  { key: "version", label: "الإصدار", type: "text", placeholder: "1.0" },
  { key: "status", label: "الحالة", type: "select", options: ["ساري", "مسودة", "موقوف"] },
  { key: "effectiveDate", label: "تاريخ السريان", type: "date" },
];

const signatureFields: FormField[] = [
  { key: "documentTitle", label: "عنوان المستند", type: "text", required: true },
  { key: "documentRef", label: "مرجع المستند", type: "text" },
  { key: "signerName", label: "اسم الموقّع", type: "text", required: true },
  { key: "signerEmail", label: "بريد الموقّع", type: "email" },
  { key: "signerRole", label: "صفة الموقّع", type: "text" },
  { key: "expiresAt", label: "ينتهي في", type: "date" },
];

const thStyle: React.CSSProperties = {
  textAlign: "right",
  padding: "0.65rem 0.75rem",
  fontSize: "0.78rem",
  color: "#64748b",
  fontWeight: 700,
  borderBottom: "1px solid #e2e8f0",
};

const tdStyle: React.CSSProperties = {
  padding: "0.75rem",
  fontSize: "0.82rem",
  color: "#0a0a12",
  borderBottom: "1px solid #f1f5f9",
};

export default function GovernancePage() {
  const { user, ready } = useSession(true);
  const [tab, setTab] = useState<Tab>("approvals");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const { show, Toast: ActionToast } = useToast();

  const canApprove = user?.role === "admin" || user?.role === "industrial_agent";

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/approval-requests", { credentials: "include" }).then((r) => r.json() as Promise<Approval[]>),
      fetch("/api/governance-policies", { credentials: "include" }).then((r) => r.json() as Promise<Policy[]>),
      fetch("/api/e-signatures", { credentials: "include" }).then((r) => r.json() as Promise<Signature[]>),
      canApprove
        ? fetch("/api/audit-logs", { credentials: "include" }).then((r) => r.json() as Promise<AuditEntry[]>)
        : Promise.resolve([] as AuditEntry[]),
    ])
      .then(([a, p, s, aud]) => {
        setApprovals(Array.isArray(a) ? a : []);
        setPolicies(Array.isArray(p) ? p : []);
        setSignatures(Array.isArray(s) ? s : []);
        setAudit(Array.isArray(aud) ? aud : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (ready && user) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.role]);

  const { seed, seeding, Toast } = useSeedDemo(loadAll);

  const resolveApproval = async (id: string, status: "approved" | "rejected") => {
    const res = await fetch(`/api/approval-requests/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setActionMsg(status === "approved" ? "تم الاعتماد" : "تم الرفض");
      loadAll();
    } else {
      show("error", "فشل تحديث طلب الاعتماد");
    }
  };

  const signDocument = async (id: string, action: "sign" | "reject") => {
    const res = await fetch(`/api/e-signatures/${id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setActionMsg((data as { message?: string }).message ?? (action === "sign" ? "تم التوقيع" : "تم الرفض"));
      loadAll();
    } else {
      show("error", "فشل إجراء التوقيع");
    }
  };

  const activeTab = tabs.find((t) => t.key === tab)!;
  const canAdd = Boolean(activeTab.addLabel);
  const formFields =
    tab === "approvals" ? approvalFields : tab === "policies" ? policyFields : signatureFields;

  const handleAdd = async (data: Record<string, unknown>) => {
    const endpoint =
      tab === "approvals"
        ? "/api/approval-requests"
        : tab === "policies"
          ? "/api/governance-policies"
          : "/api/e-signatures";

    const payload =
      tab === "approvals"
        ? {
            ...data,
            type: APPROVAL_TYPE_MAP[String(data.type)] ?? "other",
            priority: data.priority || "متوسط",
          }
        : tab === "policies"
          ? {
              ...data,
              version: data.version || "1.0",
              status: data.status || "ساري",
            }
          : data;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        show("error", (err as { error?: string }).error || "فشل الإضافة");
        return;
      }
      show("success", `✅ تمت ${activeTab.addLabel} بنجاح`);
      setAddOpen(false);
      loadAll();
    } catch {
      show("error", "تعذر الاتصال بالخادم");
    }
  };

  if (!ready || !user) return null;

  const pendingApprovals = approvals.filter((a) => a.statusRaw === "pending").length;
  const pendingSignatures = signatures.filter((s) => s.statusRaw === "pending").length;
  const canWrite = canWriteRole(user.role);
  const isEmpty = !loading && approvals.length === 0 && policies.length === 0 && signatures.length === 0;

  return (
    <AppShell>
      {Toast}
      {ActionToast}
      <div className="erp-page" style={{ width: "100%" }}>
        <PageHeader
          icon="⚙️"
          title="الحوكمة والتوقيع الإلكتروني"
          subtitle="اعتمادات الوكيل الصناعي، سياسات الحوكمة، التوقيع الإلكتروني، وسجل التدقيق"
          actions={
            <>
              {canWrite && canAdd && (
                <BtnPrimary onClick={() => setAddOpen(true)}>＋ {activeTab.addLabel}</BtnPrimary>
              )}
              {canWrite && <BtnSecondary onClick={seed}>{seeding ? "⏳ ..." : "📦 بيانات تجريبية"}</BtnSecondary>}
            </>
          }
        />

        {actionMsg && (
          <p
            style={{
              background: "rgba(34,197,94,0.1)",
              color: "#16a34a",
              padding: "0.65rem 1rem",
              borderRadius: "10px",
              marginBottom: "1rem",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            {actionMsg}
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "0.75rem",
            marginBottom: "1.25rem",
          }}
        >
          {[
            { label: "طلبات معلقة", value: pendingApprovals, color: "#f59e0b" },
            { label: "توقيعات معلقة", value: pendingSignatures, color: "#c3152a" },
            { label: "سياسات سارية", value: policies.filter((p) => p.status === "ساري").length, color: "#22c55e" },
            { label: "سجلات تدقيق", value: audit.length, color: "#0a0a12" },
          ].map((s) => (
            <div key={s.label} className="card-white" style={{ padding: "1rem 1.1rem" }}>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>{s.label}</p>
              <p
                style={{
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  color: s.color,
                  fontVariantNumeric: "tabular-nums",
                  direction: "ltr",
                  unicodeBidi: "isolate",
                }}
              >
                {formatNumber(s.value, { maximumFractionDigits: 0 })}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "1.25rem" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setActionMsg(null);
              }}
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
          <PageLoader />
        ) : isEmpty ? (
          <EmptyState
            icon="⚙️"
            title="لا توجد بيانات حوكمة"
            description="أضف طلب اعتماد أو سياسة، أو حمّل البيانات التجريبية"
            onSeed={seed}
            onAdd={canWrite && canAdd ? () => setAddOpen(true) : undefined}
            seeding={seeding}
            canWrite={canWrite}
          />
        ) : (
          <>
            {tab === "approvals" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["المرجع", "النوع", "العنوان", "مقدم الطلب", "الأولوية", "الحالة", canApprove ? "إجراء" : ""]
                        .filter(Boolean)
                        .map((h) => (
                          <th key={h} style={thStyle}>
                            {h}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {approvals.map((a) => (
                      <tr key={a.id}>
                        <td style={tdStyle}>{a.refNo}</td>
                        <td style={tdStyle}>{a.type}</td>
                        <td style={tdStyle}>{a.title}</td>
                        <td style={tdStyle}>{a.requester}</td>
                        <td style={tdStyle}>{a.priority}</td>
                        <td
                          style={{
                            ...tdStyle,
                            color:
                              a.statusRaw === "pending"
                                ? "#f59e0b"
                                : a.statusRaw === "approved"
                                  ? "#22c55e"
                                  : "#c3152a",
                            fontWeight: 600,
                          }}
                        >
                          {a.status}
                        </td>
                        {canApprove && (
                          <td style={tdStyle}>
                            {a.statusRaw === "pending" && (
                              <div style={{ display: "flex", gap: "0.35rem" }}>
                                <button type="button" onClick={() => resolveApproval(a.id, "approved")} style={btnSmall("#22c55e")}>
                                  اعتماد
                                </button>
                                <button type="button" onClick={() => resolveApproval(a.id, "rejected")} style={btnSmall("#c3152a")}>
                                  رفض
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {approvals.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                          لا توجد طلبات —{" "}
                          {canWrite && (
                            <button type="button" onClick={() => setAddOpen(true)} style={{ color: "#c3152a", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                              ＋ إضافة طلب
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "policies" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                {policies.map((p) => (
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
                {policies.length === 0 && (
                  <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#64748b", padding: "2rem" }}>
                    لا توجد سياسات{" "}
                    {canWrite && (
                      <button type="button" onClick={() => setAddOpen(true)} className="btn-primary" style={{ marginInlineStart: 8, padding: "0.45rem 1rem", fontSize: "0.8rem" }}>
                        ＋ إضافة سياسة
                      </button>
                    )}
                  </p>
                )}
              </div>
            )}

            {tab === "signatures" && (
              <div className="card-white" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["المرجع", "المستند", "الموقّع", "الحالة", "التاريخ", "إجراء"].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {signatures.map((s) => (
                      <tr key={s.id}>
                        <td style={tdStyle}>{s.refNo}</td>
                        <td style={tdStyle}>{s.documentTitle}</td>
                        <td style={tdStyle}>{s.signer}</td>
                        <td
                          style={{
                            ...tdStyle,
                            color:
                              s.statusRaw === "signed" ? "#22c55e" : s.statusRaw === "pending" ? "#f59e0b" : "#94a3b8",
                          }}
                        >
                          {s.status}
                        </td>
                        <td style={tdStyle}>{s.signedAt}</td>
                        <td style={tdStyle}>
                          {s.statusRaw === "pending" && (
                            <div style={{ display: "flex", gap: "0.35rem" }}>
                              <button type="button" onClick={() => signDocument(s.id, "sign")} style={btnSmall("#c3152a")}>
                                توقيع
                              </button>
                              <button type="button" onClick={() => signDocument(s.id, "reject")} style={btnSmall("#94a3b8")}>
                                رفض
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {signatures.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#64748b" }}>
                          لا توجد طلبات توقيع —{" "}
                          {canWrite && (
                            <button type="button" onClick={() => setAddOpen(true)} style={{ color: "#c3152a", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                              ＋ إضافة طلب توقيع
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "audit" &&
              (canApprove ? (
                <div className="card-white" style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["المستخدم", "الإجراء", "الكيان", "التفاصيل", "الخطورة", "الوقت"].map((h) => (
                          <th key={h} style={thStyle}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {audit.map((l) => (
                        <tr key={l.id}>
                          <td style={tdStyle}>{l.user}</td>
                          <td style={tdStyle}>{l.action}</td>
                          <td style={tdStyle}>{l.entity}</td>
                          <td
                            style={{
                              ...tdStyle,
                              maxWidth: 220,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {l.details}
                          </td>
                          <td
                            style={{
                              ...tdStyle,
                              color: l.severity === "critical" ? "#c3152a" : l.severity === "warning" ? "#f59e0b" : "#64748b",
                            }}
                          >
                            {l.severity}
                          </td>
                          <td style={tdStyle}>{l.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>
                  سجل التدقيق متاح للمدير والوكيل الصناعي فقط
                </p>
              ))}
          </>
        )}
      </div>

      {canAdd && (
        <Modal
          open={addOpen}
          title={activeTab.addLabel || "إضافة"}
          fields={formFields}
          onSave={handleAdd}
          onClose={() => setAddOpen(false)}
          saveLabel="إضافة"
          enableParties={false}
          enableFiles={false}
        />
      )}
    </AppShell>
  );
}

function btnSmall(color: string): React.CSSProperties {
  return {
    padding: "0.3rem 0.55rem",
    borderRadius: "7px",
    border: "none",
    background: color,
    color: "#fff",
    fontSize: "0.72rem",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "var(--font-cairo)",
  };
}
