"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PageHeader,
  PageStats,
  BtnPrimary,
  BtnSecondary,
  EmptyState,
  PageLoader,
  useToast,
} from "@/components/domain-page";
import { Modal } from "@/components/ui/modal";
import { formatDateTime } from "@/lib/format";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RowActions, standardRowActions } from "@/components/ui/row-actions";
import { useSession, canWriteRole } from "@/lib/session";
import type { FormField } from "@/data/module-configs";
import {
  internationalLawAxes,
  axisBySlug,
  type LawAxis,
  topicBySlug,
  TOTAL_TOPICS,
  NAIOSH_360_INTRO,
  IMPERIAL_IDENTITY,
  PRIMARY_TOPIC_CATALOG,
  PRIMARY_TOPICS,
  topicPageHref,
} from "@/data/international-laws-structure";
import { sendRecordToArchive } from "@/lib/archive-client";
import { RecordSupplementModal } from "@/components/record-supplement-modal";
import { fetchRecordSupplements, saveRecordSupplement } from "@/lib/record-supplement-client";
import { extractAttachments, stripAttachments } from "@/lib/form-attachments";
import type { FileAttachment } from "@/lib/file-upload";
import {
  ADD_AXIS_FORM_FIELDS,
  appendCustomLegalAxis,
  createCustomLegalAxis,
  loadCustomLegalAxes,
  type CustomLegalAxis,
} from "@/lib/custom-legal-axes";

export type LawEntry = {
  id: string;
  refNo: string;
  axisSlug: string;
  topicSlug: string;
  topicName: string;
  title: string;
  jurisdiction: string;
  country: string;
  category: string;
  status: string;
  client: string;
  effectiveDate: string;
  source: string;
  description: string;
  notes: string;
  attachments: FileAttachment[];
  firstParty: string;
  firstPartyPhone: string;
  secondParty: string;
  secondPartyPhone: string;
};

const entryFields: FormField[] = [
  { key: "title", label: "عنوان السجل", type: "text", required: true },
  { key: "topicSlug", label: "الموضوع", type: "select", required: true, options: [] },
  { key: "jurisdiction", label: "الاختصاص", type: "text" },
  { key: "country", label: "الدولة", type: "text" },
  { key: "category", label: "التصنيف", type: "text" },
  { key: "status", label: "الحالة", type: "select", options: ["نشط", "قيد المراجعة", "مكتمل", "مؤرشف"] },
  { key: "client", label: "الموكل / الجهة", type: "text" },
  { key: "effectiveDate", label: "تاريخ السريان", type: "text" },
  { key: "source", label: "المصدر", type: "text" },
  { key: "firstParty", label: "طرف أول", type: "text", required: true, placeholder: "اسم الطرف الأول" },
  { key: "firstPartyPhone", label: "رقم جوال الطرف الأول", type: "tel", required: true, placeholder: "05xxxxxxxx" },
  { key: "secondParty", label: "طرف ثاني", type: "text", required: true, placeholder: "اسم الطرف الثاني" },
  { key: "secondPartyPhone", label: "رقم جوال الطرف الثاني", type: "tel", required: true, placeholder: "05xxxxxxxx" },
  { key: "description", label: "الوصف", type: "textarea" },
  { key: "notes", label: "ملاحظات", type: "textarea" },
];

const th: React.CSSProperties = {
  textAlign: "right",
  padding: "0.75rem 1rem",
  fontSize: "0.78rem",
  color: "#64748b",
  fontWeight: 700,
  borderBottom: "2px solid #e2e8f0",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "0.75rem 1rem",
  fontSize: "0.82rem",
  color: "#0a0a12",
  borderBottom: "1px solid #f1f5f9",
};

/* ── Hub page ── */
export function InternationalLawsHub() {
  const { user, ready } = useSession(true);
  const [entries, setEntries] = useState<LawEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [customAxes, setCustomAxes] = useState<CustomLegalAxis[]>([]);
  const [addAxisOpen, setAddAxisOpen] = useState(false);
  const { show, Toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/legal-classification", { credentials: "include" });
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCustomAxes(loadCustomLegalAxes());
  }, []);

  const seed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/legal-classification/seed", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error();
      show("success", data.message ?? "تم التحميل");
      await load();
    } catch {
      show("error", "فشل تحميل البيانات");
    } finally {
      setSeeding(false);
    }
  };

  if (!ready || !user) return null;

  const canWrite = canWriteRole(user.role);
  const intlCustom = customAxes.filter((a) => a.source === "international" || a.source === "both");
  const axisCounts = [
    ...internationalLawAxes.map((a) => ({
      ...a,
      count: entries.filter((e) => e.axisSlug === a.slug).length,
      topicsCount: a.topics.length,
      isCustom: false as const,
    })),
    ...intlCustom.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      subtitle: a.subtitle,
      icon: a.icon,
      color: a.color,
      description: a.description,
      topics: [] as LawAxis["topics"],
      count: entries.filter((e) => e.axisSlug === a.slug).length,
      topicsCount: 0,
      isCustom: true as const,
    })),
  ];

  const handleAddAxis = (data: Record<string, unknown>) => {
    const axis = createCustomLegalAxis(data, "both");
    setCustomAxes(appendCustomLegalAxis(axis));
    setAddAxisOpen(false);
    show("success", `تمت إضافة المحور «${axis.title}»`);
  };

  return (
    <div className="erp-page" style={{ width: "100%" }}>
      {Toast}

      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #0ea5e9 0%, #0a0a12 70%)",
          borderRadius: "20px",
          padding: "2rem 2.25rem",
          marginBottom: "1.75rem",
          color: "#fff",
        }}
      >
        <p style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: "0.35rem" }}>منظومة نايوش 360</p>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: "0.75rem" }}>التصنيف القانوني الدولي والمحلي</h1>
        <p style={{ fontSize: "0.9rem", opacity: 0.9, maxWidth: 720, lineHeight: 1.8 }}>{NAIOSH_360_INTRO}</p>
      </div>

      <PageHeader
        icon="📚"
        title="المحاور القانونية"
        subtitle={`${TOTAL_TOPICS} موضوع قانوني عبر ${axisCounts.length} محور — ${PRIMARY_TOPIC_CATALOG.length} موضوع في القائمة الأولية`}
        actions={
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {canWrite && (
              <BtnPrimary onClick={() => setAddAxisOpen(true)}>＋ إضافة محور</BtnPrimary>
            )}
            {canWrite && (
              <BtnSecondary onClick={seed} disabled={seeding}>
                {seeding ? "⏳ جاري التحميل..." : "📦 بيانات تجريبية"}
              </BtnSecondary>
            )}
          </div>
        }
      />

      <PageStats
        stats={[
          { label: "المحاور", value: axisCounts.length, icon: "🌐", color: "#0ea5e9" },
          { label: "الموضوعات", value: TOTAL_TOPICS, icon: "📋" },
          { label: "السجلات", value: entries.length, icon: "📁", color: "#c3152a" },
          { label: "القائمة الأولية", value: PRIMARY_TOPIC_CATALOG.length, icon: "📖" },
        ]}
      />

      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            {axisCounts.map((axis) => (
              <Link
                key={axis.slug}
                href={axis.isCustom ? "/app/international-laws" : `/app/international-laws/${axis.slug}`}
                className="card-white"
                style={{
                  display: "block",
                  padding: "1.35rem",
                  textDecoration: "none",
                  borderRight: `4px solid ${axis.color}`,
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "1.5rem" }}>{axis.icon}</span>
                  <div>
                    <p style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>{axis.subtitle}</p>
                    <p style={{ fontWeight: 800, color: "#0a0a12", fontSize: "0.92rem", lineHeight: 1.4 }}>{axis.title}</p>
                  </div>
                </div>
                <p style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.6, marginBottom: "0.75rem" }}>
                  {(axis.description || "").slice(0, 100)}
                  {(axis.description || "").length > 100 ? "..." : ""}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: axis.color, fontWeight: 700 }}>
                    {axis.isCustom ? "محور مخصص" : `${axis.topicsCount} موضوع`}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#c3152a", fontWeight: 700 }}>
                    {axis.count} سجل • ادخل ←
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Primary catalog — كل موضوع صفحة منفصلة */}
          <div className="card-white" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "0.4rem", color: "#0a0a12" }}>
              القائمة الأولية — موضوعات المنظومة الشاملة
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1rem", lineHeight: 1.6 }}>
              اضغط على أي موضوع للدخول إلى صفحته الخاصة وإدارة سجلاته بشكل منفصل.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
              {PRIMARY_TOPICS.map((t) => (
                <Link
                  key={`${t.catalogName}-${t.slug}`}
                  href={t.href}
                  style={{
                    background: "linear-gradient(135deg, #f8f9fb 0%, #f1f5f9 100%)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "0.4rem 0.85rem",
                    fontSize: "0.72rem",
                    color: "#334155",
                    fontWeight: 700,
                    textDecoration: "none",
                    transition: "all 0.18s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)";
                    e.currentTarget.style.borderColor = "#fecaca";
                    e.currentTarget.style.color = "#c3152a";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, #f8f9fb 0%, #f1f5f9 100%)";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.color = "#334155";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  {t.catalogName}
                  <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>←</span>
                </Link>
              ))}
            </div>
          </div>

          <p style={{ textAlign: "center", color: "#64748b", fontSize: "0.85rem", lineHeight: 1.7, padding: "1rem" }}>
            {IMPERIAL_IDENTITY}
          </p>
        </>
      )}

      <Modal
        open={addAxisOpen}
        title="إضافة محور قانوني"
        fields={ADD_AXIS_FORM_FIELDS}
        onSave={handleAddAxis}
        onClose={() => setAddAxisOpen(false)}
        saveLabel="إضافة المحور"
        enableParties={false}
        filesLabel="شواهد وملفات المحور (مستند · صورة · فيديو)"
      />
    </div>
  );
}

/* ── Axis detail page ── */
type AxisPageProps = {
  axis: LawAxis;
  /** عند التمرير: صفحة موضوع منفصلة (تُقفل على موضوع واحد) */
  lockedTopicSlug?: string;
};

export function InternationalLawsAxisPage({ axis, lockedTopicSlug }: AxisPageProps) {
  const searchParams = useSearchParams();
  const initialTopic = lockedTopicSlug ?? searchParams.get("topic") ?? "all";
  const { user, ready } = useSession(true);
  const [entries, setEntries] = useState<LawEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [topicFilter, setTopicFilter] = useState<string>(initialTopic);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<LawEntry | null>(null);
  const [editTarget, setEditTarget] = useState<LawEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LawEntry | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<LawEntry | null>(null);
  const [supplementTarget, setSupplementTarget] = useState<LawEntry | null>(null);
  const [viewSupplements, setViewSupplements] = useState<
    { id: string; notes: string; attachments: FileAttachment[]; addedBy: string; createdAt: string }[]
  >([]);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const { show, Toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = lockedTopicSlug
        ? `topicSlug=${encodeURIComponent(lockedTopicSlug)}`
        : `axisSlug=${encodeURIComponent(axis.slug)}`;
      const res = await fetch(`/api/legal-classification?${qs}`, { credentials: "include" });
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [axis.slug, lockedTopicSlug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (lockedTopicSlug) {
      setTopicFilter(lockedTopicSlug);
      return;
    }
    const t = searchParams.get("topic");
    if (t) setTopicFilter(t);
  }, [searchParams, lockedTopicSlug]);

  const seed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/legal-classification/seed", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error();
      show("success", data.message ?? "تم التحميل");
      await load();
    } catch {
      show("error", "فشل تحميل البيانات");
    } finally {
      setSeeding(false);
    }
  };

  const topicOptions = useMemo(
    () => (lockedTopicSlug
      ? axis.topics.filter((t) => t.slug === lockedTopicSlug).map((t) => t.name)
      : axis.topics.map((t) => t.name)),
    [axis.topics, lockedTopicSlug]
  );

  const activeTopic = useMemo(() => {
    if (topicFilter === "all") return null;
    return axis.topics.find((t) => t.slug === topicFilter) ?? topicBySlug[topicFilter] ?? null;
  }, [topicFilter, axis.topics]);

  const resolveTopic = (topicName: string) => {
    if (lockedTopicSlug) {
      return axis.topics.find((t) => t.slug === lockedTopicSlug) ?? topicBySlug[lockedTopicSlug] ?? axis.topics[0];
    }
    return axis.topics.find((t) => t.name === topicName) ?? activeTopic ?? axis.topics[0];
  };

  const fieldsWithTopics: FormField[] = entryFields.map((f) =>
    f.key === "topicSlug"
      ? {
          ...f,
          key: "topicName",
          label: "الموضوع",
          options: topicOptions,
        }
      : f
  );

  const filtered = topicFilter === "all" ? entries : entries.filter((e) => e.topicSlug === topicFilter);
  const filteredEmpty = !loading && entries.length > 0 && filtered.length === 0;

  const openAdd = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (entry: LawEntry) => {
    setEditTarget(entry);
    setModalOpen(true);
  };

  const handleSave = async (data: Record<string, unknown>) => {
    const attachments = extractAttachments(data);
    const payload = stripAttachments(data);
    const topicName = String(payload.topicName ?? "");
    const topic = resolveTopic(topicName);

    if (editTarget) {
      const res = await fetch(`/api/legal-classification/${editTarget.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, topicName: topic?.name, topicSlug: topic?.slug, attachments }),
      });
      if (!res.ok) {
        show("error", "فشل التعديل");
        return;
      }
      show("success", "✅ تم التعديل بنجاح");
      if (topic?.slug) setTopicFilter(topic.slug);
    } else {
      const res = await fetch("/api/legal-classification", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          axisSlug: axis.slug,
          topicSlug: topic?.slug,
          topicName: topic?.name,
          attachments,
        }),
      });
      if (!res.ok) {
        show("error", "فشل الإضافة");
        return;
      }
      show("success", "✅ تمت الإضافة بنجاح");
      if (topic?.slug) setTopicFilter(topic.slug);
    }
    setModalOpen(false);
    setEditTarget(null);
    await load();
  };

  const handleSupplementSave = async (data: {
    notes: string;
    attachments: FileAttachment[];
    firstParty: string;
    firstPartyPhone: string;
    secondParty: string;
    secondPartyPhone: string;
  }) => {
    if (!supplementTarget) return;
    const result = await saveRecordSupplement({
      sourceModule: "legal-classification",
      sourceId: supplementTarget.id,
      sourceRef: supplementTarget.refNo,
      title: supplementTarget.title,
      notes: data.notes,
      attachments: data.attachments,
    });
    if (!result.ok) {
      show("error", result.message);
      return;
    }
    // Also update main record party fields when adding from row action
    await fetch(`/api/legal-classification/${supplementTarget.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstParty: data.firstParty,
        firstPartyPhone: data.firstPartyPhone,
        secondParty: data.secondParty,
        secondPartyPhone: data.secondPartyPhone,
      }),
    });
    show("success", result.message);
    setSupplementTarget(null);
    await load();
  };

  const openView = async (entry: LawEntry) => {
    setViewTarget(entry);
    const supplements = await fetchRecordSupplements("legal-classification", entry.id);
    setViewSupplements(supplements);
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      const result = await sendRecordToArchive({
        sourceModule: "legal-classification",
        sourceModuleLabel: "القوانين الدولية والتصنيف",
        sourceId: archiveTarget.id,
        title: archiveTarget.title,
        sourceRef: archiveTarget.refNo,
        recordData: archiveTarget as unknown as Record<string, unknown>,
        category: archiveTarget.topicName,
      });
      if (!result.ok) {
        show("error", result.message);
      } else {
        show("success", result.message);
        setArchiveTarget(null);
        await load();
      }
    } catch {
      show("error", "فشل أرشفة السجل");
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/legal-classification/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      show("success", "🗑️ تم الحذف بنجاح");
      setDeleteTarget(null);
      await load();
    } catch {
      show("error", "فشل الحذف");
    } finally {
      setDeleting(false);
    }
  };

  if (!ready || !user) return null;

  const canWrite = canWriteRole(user.role);
  const isEmpty = !loading && entries.length === 0;
  const lockedTopic = lockedTopicSlug
    ? axis.topics.find((t) => t.slug === lockedTopicSlug) ?? topicBySlug[lockedTopicSlug] ?? null
    : null;

  return (
    <div className="erp-page" style={{ width: "100%" }}>
      {Toast}

      <div
        style={{
          background: `linear-gradient(135deg, ${axis.color} 0%, #0a0a12 100%)`,
          borderRadius: "20px",
          padding: "1.75rem 2rem",
          marginBottom: "1.5rem",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
          <Link href="/app/international-laws" style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>
            ← التصنيف القانوني
          </Link>
          {lockedTopic && (
            <>
              <span style={{ opacity: 0.45 }}>•</span>
              <Link
                href={`/app/international-laws/${axis.slug}`}
                style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}
              >
                {axis.subtitle}
              </Link>
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
          <span style={{ fontSize: "2rem" }}>{axis.icon}</span>
          <div>
            <p style={{ fontSize: "0.75rem", opacity: 0.8 }}>
              {lockedTopic ? `${axis.subtitle} — موضوع مستقل` : axis.subtitle}
            </p>
            <h1 style={{ fontSize: "1.45rem", fontWeight: 900 }}>
              {lockedTopic ? lockedTopic.name : axis.title}
            </h1>
          </div>
        </div>
        <p style={{ fontSize: "0.88rem", opacity: 0.9, marginTop: "0.75rem", maxWidth: 680, lineHeight: 1.8 }}>
          {lockedTopic
            ? `صفحة مخصصة لموضوع «${lockedTopic.name}» ضمن ${axis.title}. أدر السجلات والمراجع والاطراف بشكل منفصل عن باقي موضوعات المحور.`
            : axis.description}
        </p>
      </div>

      <PageHeader
        icon={axis.icon}
        title={lockedTopic ? `سجلات ${lockedTopic.name}` : `سجلات ${axis.title}`}
        subtitle={
          lockedTopic
            ? `صفحة الموضوع المنفصلة — ${axis.title}`
            : `${axis.topics.length} موضوع قانوني — إدارة السجلات والمراجع`
        }
        actions={
          <>
            {canWrite && <BtnPrimary onClick={openAdd}>➕ إضافة سجل</BtnPrimary>}
            {isEmpty && canWrite && (
              <BtnSecondary onClick={seed} disabled={seeding}>
                {seeding ? "⏳ جاري التحميل..." : "📦 بيانات تجريبية"}
              </BtnSecondary>
            )}
          </>
        }
      />

      <PageStats
        stats={[
          {
            label: lockedTopic ? "الموضوع" : "الموضوعات",
            value: lockedTopic ? 1 : axis.topics.length,
            icon: "📋",
            color: axis.color,
          },
          { label: "السجلات", value: entries.length, icon: "📁", color: "#c3152a" },
          { label: "نشط", value: entries.filter((e) => e.status === "نشط").length, icon: "✅" },
          { label: "قيد المراجعة", value: entries.filter((e) => e.status === "قيد المراجعة").length, icon: "⏳" },
        ]}
      />

      {/* Topics chips — روابط لصفحات الموضوعات المنفصلة */}
      {!lockedTopic && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "1.25rem" }}>
          <button
            type="button"
            onClick={() => setTopicFilter("all")}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "10px",
              border: topicFilter === "all" ? `2px solid ${axis.color}` : "1px solid #e2e8f0",
              background: topicFilter === "all" ? `${axis.color}15` : "#fff",
              color: topicFilter === "all" ? axis.color : "#475569",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-cairo)",
              fontSize: "0.78rem",
            }}
          >
            الكل ({entries.length})
          </button>
          {axis.topics.map((t) => {
            const count = entries.filter((e) => e.topicSlug === t.slug).length;
            return (
              <Link
                key={t.slug}
                href={topicPageHref(t.slug)}
                style={{
                  padding: "0.45rem 0.9rem",
                  borderRadius: "10px",
                  border: topicFilter === t.slug ? `2px solid ${axis.color}` : "1px solid #e2e8f0",
                  background: topicFilter === t.slug ? `${axis.color}15` : "#fff",
                  color: topicFilter === t.slug ? axis.color : "#475569",
                  fontWeight: 600,
                  fontFamily: "var(--font-cairo)",
                  fontSize: "0.75rem",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                {t.name} {count > 0 && `(${count})`}
                <span style={{ fontSize: "0.65rem", opacity: 0.65 }}>←</span>
              </Link>
            );
          })}
        </div>
      )}

      {lockedTopic && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.55rem",
            marginBottom: "1.25rem",
            alignItems: "center",
          }}
        >
          <span
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "10px",
              border: `2px solid ${axis.color}`,
              background: `${axis.color}15`,
              color: axis.color,
              fontWeight: 800,
              fontSize: "0.78rem",
            }}
          >
            {lockedTopic.name}
          </span>
          <Link
            href={`/app/international-laws/${axis.slug}`}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#64748b",
              fontWeight: 700,
              fontSize: "0.75rem",
              textDecoration: "none",
            }}
          >
            عرض كل موضوعات المحور
          </Link>
        </div>
      )}

      {loading ? (
        <PageLoader />
      ) : isEmpty ? (
        <EmptyState
          icon={axis.icon}
          title={lockedTopic ? `لا توجد سجلات في «${lockedTopic.name}»` : "لا توجد سجلات في هذا المحور"}
          description={
            lockedTopic
              ? "أضف أول سجل قانوني لهذا الموضوع من الصفحة المنفصلة"
              : "حمّل البيانات التجريبية أو أضف سجلاً قانونياً جديداً"
          }
          onSeed={seed}
          onAdd={openAdd}
          seeding={seeding}
          canWrite={canWrite}
        />
      ) : filteredEmpty ? (
        <div className="card-white" style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📭</p>
          <h3 style={{ fontWeight: 800, marginBottom: "0.5rem", color: "#0a0a12" }}>
            لا توجد سجلات في «{activeTopic?.name ?? "هذا الموضوع"}»
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "1.25rem", lineHeight: 1.7 }}>
            يوجد {entries.length} سجل في المحور — أضف سجلاً جديداً وسيُحفظ تلقائياً تحت الموضوع المحدد
          </p>
          {canWrite && <BtnPrimary onClick={openAdd}>➕ إضافة سجل لهذا الموضوع</BtnPrimary>}
        </div>
      ) : (
        <div className="card-white" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                {["المرجع", "العنوان", "الموضوع", "طرف أول", "طرف ثاني", "الحالة", "الموكل", "إجراءات"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...td, textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                    لا توجد سجلات لعرضها
                  </td>
                </tr>
              ) : (
              filtered.map((e) => (
                <tr key={e.id}>
                  <td style={{ ...td, fontWeight: 700, color: axis.color }}>{e.refNo}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{e.title}</td>
                  <td style={td}>{e.topicName}</td>
                  <td style={td}>
                    <div style={{ fontWeight: 700 }}>{e.firstParty || "—"}</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{e.firstPartyPhone || ""}</div>
                  </td>
                  <td style={td}>
                    <div style={{ fontWeight: 700 }}>{e.secondParty || "—"}</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{e.secondPartyPhone || ""}</div>
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        background: e.status === "نشط" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
                        color: e.status === "نشط" ? "#16a34a" : "#d97706",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "8px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                      }}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td style={td}>{e.client}</td>
                  <td style={td}>
                    <RowActions
                      actions={standardRowActions({
                        onView: () => void openView(e),
                        onEdit: canWrite ? () => openEdit(e) : undefined,
                        onAdd: canWrite ? () => setSupplementTarget(e) : undefined,
                        onArchive: canWrite ? () => setArchiveTarget(e) : undefined,
                        onDelete: canWrite ? () => setDeleteTarget(e) : undefined,
                      })}
                    />
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        key={editTarget?.id ?? `add-${topicFilter}-${modalOpen}`}
        open={modalOpen}
        title={editTarget ? "تعديل السجل القانوني" : activeTopic ? `إضافة سجل — ${activeTopic.name}` : "إضافة سجل قانوني"}
        fields={fieldsWithTopics}
        initial={
          editTarget
            ? {
                title: editTarget.title,
                topicName: editTarget.topicName,
                jurisdiction: editTarget.jurisdiction === "—" ? "" : editTarget.jurisdiction,
                country: editTarget.country === "—" ? "" : editTarget.country,
                category: editTarget.category === "—" ? "" : editTarget.category,
                status: editTarget.status,
                client: editTarget.client === "—" ? "" : editTarget.client,
                effectiveDate: editTarget.effectiveDate === "—" ? "" : editTarget.effectiveDate,
                source: editTarget.source === "—" ? "" : editTarget.source,
                description: editTarget.description,
                notes: editTarget.notes,
                attachments: editTarget.attachments ?? [],
                firstParty: editTarget.firstParty ?? "",
                firstPartyPhone: editTarget.firstPartyPhone ?? "",
                secondParty: editTarget.secondParty ?? "",
                secondPartyPhone: editTarget.secondPartyPhone ?? "",
              }
            : { status: "نشط", topicName: activeTopic?.name ?? axis.topics[0]?.name ?? "" }
        }
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        saveLabel={editTarget ? "حفظ التعديلات" : "إضافة"}
      />

      <RecordSupplementModal
        open={!!supplementTarget}
        recordRef={supplementTarget?.refNo ?? ""}
        recordTitle={supplementTarget?.title ?? ""}
        onSave={handleSupplementSave}
        onClose={() => setSupplementTarget(null)}
      />

      {/* View Modal */}
      {viewTarget && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 900,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(10,10,18,0.55)", backdropFilter: "blur(5px)", padding: "1rem",
          }}
          onClick={() => { setViewTarget(null); setViewSupplements([]); }}
        >
          <div
            className="card-white"
            style={{ padding: "2rem", maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <h2 style={{ fontWeight: 900, fontSize: "1.1rem" }}>عرض السجل</h2>
              <button type="button" onClick={() => { setViewTarget(null); setViewSupplements([]); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>
            {[
              ["المرجع", viewTarget.refNo],
              ["العنوان", viewTarget.title],
              ["المحور", axis.title],
              ["الموضوع", viewTarget.topicName],
              ["الاختصاص", viewTarget.jurisdiction],
              ["الدولة", viewTarget.country],
              ["التصنيف", viewTarget.category],
              ["الحالة", viewTarget.status],
              ["الموكل", viewTarget.client],
              ["طرف أول", viewTarget.firstParty || "—"],
              ["جوال الطرف الأول", viewTarget.firstPartyPhone || "—"],
              ["طرف ثاني", viewTarget.secondParty || "—"],
              ["جوال الطرف الثاني", viewTarget.secondPartyPhone || "—"],
              ["تاريخ السريان", viewTarget.effectiveDate],
              ["المصدر", viewTarget.source],
            ].map(([label, val]) => (
              <div key={label} style={{ marginBottom: "0.65rem", display: "flex", gap: "0.5rem" }}>
                <span style={{ fontWeight: 700, color: "#64748b", minWidth: 110, fontSize: "0.82rem" }}>{label}:</span>
                <span style={{ color: "#0a0a12", fontSize: "0.85rem" }}>{val}</span>
              </div>
            ))}
            {viewTarget.description && (
              <div style={{ marginTop: "1rem", padding: "1rem", background: "#f8f9fb", borderRadius: "12px" }}>
                <p style={{ fontWeight: 700, fontSize: "0.8rem", color: "#64748b", marginBottom: "0.35rem" }}>الوصف</p>
                <p style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>{viewTarget.description}</p>
              </div>
            )}
            {viewTarget.notes && (
              <div style={{ marginTop: "0.75rem", padding: "1rem", background: "#fff7ed", borderRadius: "12px" }}>
                <p style={{ fontWeight: 700, fontSize: "0.8rem", color: "#d97706", marginBottom: "0.35rem" }}>ملاحظات</p>
                <p style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>{viewTarget.notes}</p>
              </div>
            )}
            {viewTarget.attachments && viewTarget.attachments.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <p style={{ fontWeight: 700, fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>مرفقات السجل</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {viewTarget.attachments.map((a, i) => (
                    <a key={`entry-${i}`} href={a.fileData} download={a.name} style={{ fontSize: "0.78rem", color: "#c3152a", fontWeight: 600, textDecoration: "none" }}>
                      📎 {a.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {viewSupplements.length > 0 && (
              <div style={{ marginTop: "1rem", padding: "1rem", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                <p style={{ fontWeight: 800, fontSize: "0.85rem", color: "#16a34a", marginBottom: "0.75rem" }}>
                  معلومات إضافية ({viewSupplements.length})
                </p>
                {viewSupplements.map((s) => (
                  <div key={s.id} style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid #dcfce7" }}>
                    {s.notes && <p style={{ fontSize: "0.82rem", lineHeight: 1.7, marginBottom: "0.35rem" }}>{s.notes}</p>}
                    <p style={{ fontSize: "0.72rem", color: "#64748b" }}>
                      {s.addedBy} — {formatDateTime(s.createdAt)}
                    </p>
                    {s.attachments.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.5rem" }}>
                        {s.attachments.map((a, i) => (
                          <a
                            key={`${s.id}-${i}`}
                            href={a.fileData}
                            download={a.name}
                            style={{ fontSize: "0.78rem", color: "#c3152a", fontWeight: 600, textDecoration: "none" }}
                          >
                            📎 {a.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {canWrite && (
              <div style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: "0.55rem 1.2rem", fontSize: "0.82rem" }}
                  onClick={() => { setViewTarget(null); setSupplementTarget(viewTarget); }}
                >
                  ➕ إضافة معلومات لهذا المرجع
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!archiveTarget}
        title="تأكيد الأرشفة"
        message={`هل تريد نقل السجل "${archiveTarget?.title}" إلى الأرشيف؟ سيظهر في صفحة الأرشيف المركزي.`}
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
        loading={archiving}
        confirmLabel="أرشفة"
        confirmColor="#475569"
        icon="📦"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف السجل "${deleteTarget?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}

/* ── Topic redirect helper ── */
export function getAxisForTopicSlug(topicSlug: string) {
  const info = topicBySlug[topicSlug];
  if (!info) return null;
  return axisBySlug[info.axisSlug] ?? null;
}
