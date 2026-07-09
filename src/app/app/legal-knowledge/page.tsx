"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  PageHeader,
  PageStats,
  PageTabs,
  BtnPrimary,
  EmptyState,
  PageLoader,
  useSeedDemo,
} from "@/components/domain-page";
import { Modal } from "@/components/ui/modal";
import { useSession, canWriteRole } from "@/lib/session";
import type { FormField } from "@/data/module-configs";

type Branch = {
  id: string;
  name: string;
  description: string | null;
  specializations: {
    id: string;
    name: string;
    subjects: { subject: { id: string; name: string } }[];
    _count?: { cases: number };
  }[];
  _count?: { cases: number; consultations: number };
};

type Spec = { id: string; name: string; branch?: { name: string }; _count?: { cases: number } };
type Subject = { id: string; name: string; description?: string | null };

const branchFields: FormField[] = [
  { key: "name", label: "اسم الفرع القانوني", type: "text", required: true },
  { key: "description", label: "الوصف", type: "textarea" },
];

const specFields: FormField[] = [
  { key: "name", label: "اسم التخصص", type: "text", required: true },
  { key: "branchName", label: "الفرع", type: "select", required: true, options: [] },
  { key: "description", label: "الوصف", type: "textarea" },
];

const subjectFields: FormField[] = [
  { key: "name", label: "اسم المادة القانونية", type: "text", required: true },
  { key: "description", label: "الوصف", type: "textarea" },
];

export default function LegalKnowledgePage() {
  const { user, ready } = useSession(true);
  const [tab, setTab] = useState("branches");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [openBranch, setOpenBranch] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"branch" | "spec" | "subject">("branch");
  const [branchOptions, setBranchOptions] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, sRes, subRes] = await Promise.all([
        fetch("/api/legal-branches", { credentials: "include" }),
        fetch("/api/legal-specializations", { credentials: "include" }),
        fetch("/api/legal-subjects", { credentials: "include" }),
      ]);
      const [b, s, sub] = await Promise.all([bRes.json(), sRes.json(), subRes.json()]);
      setBranches(b);
      setSpecs(s);
      setSubjects(sub);
      setBranchOptions(b.map((br: Branch) => br.name));
    } finally {
      setLoading(false);
    }
  }, []);

  const { seed, seeding, Toast } = useSeedDemo(load);

  useEffect(() => {
    load();
  }, [load]);

  const canWrite = user ? canWriteRole(user.role) : false;

  const openAdd = (type: "branch" | "spec" | "subject") => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleSave = async (data: Record<string, unknown>) => {
    const endpoints = {
      branch: "/api/legal-branches",
      spec: "/api/legal-specializations",
      subject: "/api/legal-subjects",
    };
    const payload = { ...data };
    if (modalType === "spec" && data.branchName) {
      const branch = branches.find((b) => b.name === data.branchName);
      delete payload.branchName;
      if (branch) payload.branchId = branch.id;
    }
    const res = await fetch(endpoints[modalType], {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;
    setModalOpen(false);
    await load();
  };

  const totalSpecs = branches.reduce((n, b) => n + b.specializations.length, 0);
  const totalSubjects = subjects.length;
  const isEmpty = branches.length === 0 && specs.length === 0 && subjects.length === 0;

  const specFieldsWithOptions: FormField[] = specFields.map((f) =>
    f.key === "branchName" ? { ...f, options: branchOptions } : f
  );

  if (!ready || !user) return null;

  return (
    <AppShell role={user.role} name={user.name}>
      {Toast}
      <div style={{ maxWidth: 1140 }}>
        <PageHeader
          icon="📚"
          title="التصنيف القانوني"
          subtitle="شجرة الفروع والتخصصات والمواد القانونية — فلترة القضايا والاستشارات حسب التخصص"
          actions={
            <>
              <BtnPrimary onClick={() => openAdd(tab === "subjects" ? "subject" : tab === "specs" ? "spec" : "branch")} disabled={!canWrite}>
                ➕ إضافة {tab === "subjects" ? "مادة" : tab === "specs" ? "تخصص" : "فرع"}
              </BtnPrimary>
              {isEmpty && (
                <button
                  type="button"
                  onClick={seed}
                  disabled={seeding}
                  style={{
                    padding: "0.6rem 1.15rem",
                    borderRadius: "12px",
                    border: "1px solid #c3152a",
                    background: "rgba(195,21,42,0.06)",
                    color: "#c3152a",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "var(--font-cairo)",
                  }}
                >
                  {seeding ? "⏳ جاري التحميل..." : "📦 بيانات تجريبية"}
                </button>
              )}
            </>
          }
        />

        <PageStats
          stats={[
            { label: "الفروع القانونية", value: branches.length, icon: "🌳", color: "#c3152a" },
            { label: "التخصصات", value: totalSpecs || specs.length, icon: "🎯" },
            { label: "المواد القانونية", value: totalSubjects, icon: "📄" },
            { label: "القضايا المرتبطة", value: branches.reduce((n, b) => n + (b._count?.cases ?? 0), 0), icon: "⚖️" },
          ]}
        />

        <PageTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: "branches", label: "الفروع", count: branches.length },
            { key: "specs", label: "التخصصات", count: specs.length },
            { key: "subjects", label: "المواد", count: subjects.length },
          ]}
        />

        {loading ? (
          <PageLoader />
        ) : isEmpty ? (
          <EmptyState
            icon="📚"
            title="لا توجد بيانات تصنيف قانوني"
            description="ابدأ بتحميل البيانات التجريبية الجاهزة أو أضف فرعاً قانونياً جديداً يدوياً"
            onSeed={seed}
            onAdd={() => openAdd("branch")}
            seeding={seeding}
            canWrite={canWrite}
          />
        ) : tab === "branches" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {branches.map((branch) => (
              <div key={branch.id} className="card-white" style={{ padding: "1.25rem 1.35rem", borderRight: "4px solid #c3152a" }}>
                <button
                  type="button"
                  onClick={() => setOpenBranch(openBranch === branch.id ? null : branch.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-cairo)",
                    textAlign: "right",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0a0a12" }}>{branch.name}</span>
                    {branch.description && (
                      <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>{branch.description}</p>
                    )}
                  </div>
                  <span style={{ color: "#c3152a", fontSize: "0.82rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {branch.specializations.length} تخصص • {branch._count?.cases ?? 0} قضية {openBranch === branch.id ? "▲" : "▼"}
                  </span>
                </button>
                {openBranch === branch.id && (
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
                    {branch.specializations.length === 0 ? (
                      <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>لا توجد تخصصات تحت هذا الفرع</p>
                    ) : (
                      branch.specializations.map((spec) => (
                        <div key={spec.id} style={{ marginBottom: "0.85rem" }}>
                          <p style={{ fontWeight: 700, color: "#c3152a", fontSize: "0.9rem", marginBottom: "0.35rem" }}>
                            ▸ {spec.name}
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", paddingInlineStart: "1rem" }}>
                            {spec.subjects.map((s) => (
                              <span
                                key={s.subject.id}
                                style={{
                                  background: "linear-gradient(135deg, #f8f9fb 0%, #f1f5f9 100%)",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "10px",
                                  padding: "0.35rem 0.75rem",
                                  fontSize: "0.75rem",
                                  color: "#475569",
                                  fontWeight: 600,
                                }}
                              >
                                {s.subject.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : tab === "specs" ? (
          <div className="card-white" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "#f8f9fb", borderBottom: "2px solid #e2e8f0" }}>
                  {["التخصص", "الفرع", "القضايا"].map((h) => (
                    <th key={h} style={{ padding: "0.85rem 1rem", textAlign: "right", fontWeight: 800, color: "#475569" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specs.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#0a0a12" }}>{s.name}</td>
                    <td style={{ padding: "0.85rem 1rem", color: "#64748b" }}>{s.branch?.name ?? "—"}</td>
                    <td style={{ padding: "0.85rem 1rem", color: "#c3152a", fontWeight: 700 }}>{s._count?.cases ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.85rem" }}>
            {subjects.map((sub) => (
              <div key={sub.id} className="card-white" style={{ padding: "1.15rem" }}>
                <p style={{ fontWeight: 800, color: "#0a0a12", marginBottom: "0.35rem" }}>{sub.name}</p>
                {sub.description && <p style={{ fontSize: "0.8rem", color: "#64748b" }}>{sub.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={modalType === "branch" ? "إضافة فرع قانوني" : modalType === "spec" ? "إضافة تخصص" : "إضافة مادة قانونية"}
        fields={modalType === "branch" ? branchFields : modalType === "spec" ? specFieldsWithOptions : subjectFields}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
        saveLabel="حفظ"
      />
    </AppShell>
  );
}
