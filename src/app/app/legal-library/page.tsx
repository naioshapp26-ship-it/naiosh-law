"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
import { extractAttachments, persistFormAttachments, stripAttachments } from "@/lib/form-attachments";
import { extractPartyFields, stripPartyFields } from "@/lib/party-fields";
import { upsertRecordParties } from "@/lib/record-parties-client";

type Tab = "documents" | "articles" | "circulars";

type Document = {
  id: string;
  title: string;
  type: string;
  category: string;
  branch: string;
  specialization: string;
  summary: string;
  tags: string;
  status: string;
  publishedAt: string;
};

type Article = {
  id: string;
  title: string;
  author: string;
  branch: string;
  specialization: string;
  summary: string;
  tags: string;
  readMinutes: number;
  status: string;
  publishedAt: string;
};

type Circular = {
  id: string;
  circularNo: string;
  title: string;
  issuer: string;
  branch: string;
  issueDate: string;
  effectiveDate: string;
  summary: string;
  status: string;
  tags: string;
};

const tabs: { key: Tab; label: string; addLabel: string }[] = [
  { key: "documents", label: "المستندات", addLabel: "إضافة قانون / مستند" },
  { key: "articles", label: "المقالات", addLabel: "إضافة مقالة" },
  { key: "circulars", label: "التعليمات الدائرية", addLabel: "إضافة تعليمة" },
];

const DOC_TYPE_MAP: Record<string, string> = {
  قانون: "law",
  "لائحة / نظام": "regulation",
  "قالب عقد": "contract_template",
  "نموذج محكمة": "court_form",
  "قالب مذكرة": "memo_template",
  أخرى: "other",
};

const documentFields: FormField[] = [
  { key: "title", label: "العنوان", type: "text", required: true },
  {
    key: "type",
    label: "النوع",
    type: "select",
    required: true,
    options: ["قانون", "لائحة / نظام", "قالب عقد", "نموذج محكمة", "قالب مذكرة", "أخرى"],
  },
  { key: "category", label: "التصنيف", type: "text", placeholder: "مثلاً: مدني، تجاري" },
  { key: "summary", label: "الملخص", type: "textarea", required: true },
  { key: "tags", label: "الوسوم", type: "text", placeholder: "مفصولة بفاصلة" },
  { key: "status", label: "الحالة", type: "select", options: ["منشور", "مسودة", "مؤرشف"] },
  { key: "publishedAt", label: "تاريخ النشر", type: "date" },
];

const articleFields: FormField[] = [
  { key: "title", label: "عنوان المقالة", type: "text", required: true },
  { key: "author", label: "الكاتب", type: "text" },
  { key: "summary", label: "الملخص", type: "textarea", required: true },
  { key: "readMinutes", label: "دقائق القراءة", type: "number", placeholder: "5" },
  { key: "tags", label: "الوسوم", type: "text" },
  { key: "status", label: "الحالة", type: "select", options: ["منشور", "مسودة"] },
  { key: "publishedAt", label: "تاريخ النشر", type: "date" },
];

const circularFields: FormField[] = [
  { key: "circularNo", label: "رقم التعليمة", type: "text", required: true, placeholder: "CIR-2026-01" },
  { key: "title", label: "العنوان", type: "text", required: true },
  { key: "issuer", label: "الجهة المصدرة", type: "text", required: true },
  { key: "issueDate", label: "تاريخ الإصدار", type: "date", required: true },
  { key: "effectiveDate", label: "ساري من", type: "date" },
  { key: "summary", label: "الملخص", type: "textarea", required: true },
  { key: "tags", label: "الوسوم", type: "text" },
  { key: "status", label: "الحالة", type: "select", options: ["ساري", "ملغى", "مسودة"] },
];

export default function LegalLibraryPage() {
  const { user, ready } = useSession(true);
  const [tab, setTab] = useState<Tab>("documents");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { show, Toast: ActionToast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
    return Promise.all([
      fetch(`/api/legal-documents${q}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/legal-articles${q}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/circular-instructions${q}`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([docs, arts, circs]) => {
        setDocuments(Array.isArray(docs) ? docs : []);
        setArticles(Array.isArray(arts) ? arts : []);
        setCirculars(Array.isArray(circs) ? circs : []);
      })
      .finally(() => setLoading(false));
  }, [search]);

  const { seed, seeding, Toast } = useSeedDemo(load);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(
    () => ({
      documents: documents.length,
      articles: articles.length,
      circulars: circulars.filter((c) => c.status === "ساري").length,
    }),
    [documents, articles, circulars]
  );

  const activeTab = tabs.find((t) => t.key === tab)!;
  const formFields = tab === "documents" ? documentFields : tab === "articles" ? articleFields : circularFields;

  const handleAdd = async (data: Record<string, unknown>) => {
    const attachments = extractAttachments(data);
    const parties = extractPartyFields(data);
    const clean = stripPartyFields(stripAttachments(data));
    const endpoint =
      tab === "documents"
        ? "/api/legal-documents"
        : tab === "articles"
          ? "/api/legal-articles"
          : "/api/circular-instructions";

    const payload =
      tab === "documents"
        ? {
            ...clean,
            type: DOC_TYPE_MAP[String(clean.type)] ?? "other",
            status: clean.status || "منشور",
          }
        : tab === "articles"
          ? {
              ...clean,
              readMinutes: clean.readMinutes ? Number(clean.readMinutes) : null,
              status: clean.status || "منشور",
            }
          : {
              ...clean,
              status: clean.status || "ساري",
            };

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
      const created = await res.json().catch(() => ({}));
      const recordId = String((created as { id?: string }).id ?? "");
      if (recordId && attachments.length) {
        await persistFormAttachments({
          sourceModule: `legal-library-${tab}`,
          sourceId: recordId,
          title: String((payload as Record<string, unknown>).title ?? activeTab.addLabel),
          attachments,
          notes: "مرفقات من نموذج إضافة المكتبة القانونية",
        });
      }
      if (recordId) {
        await upsertRecordParties({
          sourceModule: `legal-library-${tab}`,
          sourceId: recordId,
          parties,
        });
      }
      show(
        "success",
        attachments.length
          ? `✅ تمت ${activeTab.addLabel} مع ${attachments.length} مرفق`
          : `✅ تمت ${activeTab.addLabel} بنجاح`
      );
      setAddOpen(false);
      load();
    } catch {
      show("error", "تعذر الاتصال بالخادم");
    }
  };

  if (!ready || !user) return null;

  const canWrite = canWriteRole(user.role);
  const isEmpty =
    !loading && documents.length === 0 && articles.length === 0 && circulars.length === 0 && !search.trim();

  return (
    <AppShell>
      {Toast}
      {ActionToast}
      <div className="erp-page" style={{ width: "100%" }}>
        <PageHeader
          icon="📖"
          title="المكتبة القانونية"
          subtitle="مستندات، مقالات قانونية، وتعليمات دائرية — بحث وفلترة حسب الفرع والتخصص"
          actions={
            <>
              {canWrite && (
                <BtnPrimary onClick={() => setAddOpen(true)}>＋ {activeTab.addLabel}</BtnPrimary>
              )}
              {canWrite && <BtnSecondary onClick={seed}>{seeding ? "⏳ ..." : "📦 بيانات تجريبية"}</BtnSecondary>}
            </>
          }
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "0.75rem",
            marginBottom: "1.25rem",
          }}
        >
          {[
            { label: "المستندات", value: stats.documents, color: "#0a0a12" },
            { label: "المقالات", value: stats.articles, color: "#c3152a" },
            { label: "تعليمات سارية", value: stats.circulars, color: "#22c55e" },
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

        <input
          type="search"
          placeholder="بحث في المكتبة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 420,
            padding: "0.65rem 0.9rem",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            fontFamily: "var(--font-cairo)",
            fontSize: "0.85rem",
            marginBottom: "1rem",
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginBottom: "1.25rem" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
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
            icon="📖"
            title="المكتبة فارغة"
            description="أضف قانونًا أو مقالة أو تعليمة، أو حمّل البيانات التجريبية"
            onSeed={seed}
            onAdd={canWrite ? () => setAddOpen(true) : undefined}
            seeding={seeding}
            canWrite={canWrite}
          />
        ) : (
          <>
            {tab === "documents" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                {documents.map((d) => (
                  <div key={d.id} className="card-white" style={{ padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          background: "#f8f9fb",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          padding: "0.2rem 0.5rem",
                          color: "#c3152a",
                          fontWeight: 700,
                        }}
                      >
                        {d.type}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{d.publishedAt}</span>
                    </div>
                    <h3 style={{ fontWeight: 800, color: "#0a0a12", marginBottom: "0.4rem", fontSize: "0.95rem" }}>{d.title}</h3>
                    <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "0.5rem" }}>
                      {d.branch} • {d.specialization}
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6 }}>
                      {expanded === d.id ? d.summary : `${d.summary.slice(0, 120)}${d.summary.length > 120 ? "..." : ""}`}
                    </p>
                    {d.summary.length > 120 && (
                      <button
                        type="button"
                        onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#c3152a",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          marginTop: "0.35rem",
                          fontFamily: "var(--font-cairo)",
                        }}
                      >
                        {expanded === d.id ? "عرض أقل" : "عرض المزيد"}
                      </button>
                    )}
                    {d.tags && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.6rem" }}>
                        {d.tags.split(",").map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: "0.7rem",
                              background: "rgba(195,21,42,0.06)",
                              color: "#c3152a",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "6px",
                            }}
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {documents.length === 0 && (
                  <TabEmpty text="لا توجد مستندات" canWrite={canWrite} onAdd={() => setAddOpen(true)} />
                )}
              </div>
            )}

            {tab === "articles" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                {articles.map((a) => (
                  <div key={a.id} className="card-white" style={{ padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>✍️ {a.author}</span>
                      <span style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 600 }}>
                        {formatNumber(a.readMinutes, { maximumFractionDigits: 0 })} د قراءة
                      </span>
                    </div>
                    <h3 style={{ fontWeight: 800, color: "#0a0a12", marginBottom: "0.4rem", fontSize: "0.95rem" }}>{a.title}</h3>
                    <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "0.5rem" }}>
                      {a.branch} • {a.specialization}
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6 }}>{a.summary}</p>
                    {a.tags && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.6rem" }}>
                        {a.tags.split(",").map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: "0.7rem",
                              background: "#f8f9fb",
                              border: "1px solid #e2e8f0",
                              color: "#475569",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "6px",
                            }}
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {articles.length === 0 && (
                  <TabEmpty text="لا توجد مقالات" canWrite={canWrite} onAdd={() => setAddOpen(true)} />
                )}
              </div>
            )}

            {tab === "circulars" && (
              <div className="card-white" style={{ padding: "0.5rem 1rem" }}>
                {circulars.map((c) => (
                  <div key={c.id} style={{ padding: "1rem 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      <div>
                        <p style={{ fontSize: "0.75rem", color: "#c3152a", fontWeight: 700, marginBottom: "0.25rem" }}>
                          {c.circularNo} — {c.issuer}
                        </p>
                        <h3 style={{ fontWeight: 800, color: "#0a0a12", fontSize: "0.92rem", marginBottom: "0.35rem" }}>
                          {c.title}
                        </h3>
                        <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6 }}>{c.summary}</p>
                      </div>
                      <div style={{ textAlign: "left", flexShrink: 0 }}>
                        <p style={{ fontSize: "0.75rem", color: "#64748b" }}>تاريخ الإصدار: {c.issueDate}</p>
                        <p style={{ fontSize: "0.75rem", color: "#64748b" }}>ساري من: {c.effectiveDate}</p>
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: "0.35rem",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: c.status === "ساري" ? "#22c55e" : "#94a3b8",
                          }}
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {circulars.length === 0 && (
                  <TabEmpty text="لا توجد تعليمات دائرية" canWrite={canWrite} onAdd={() => setAddOpen(true)} />
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={addOpen}
        title={activeTab.addLabel}
        fields={formFields}
        onSave={handleAdd}
        onClose={() => setAddOpen(false)}
        saveLabel="إضافة"
        enableParties={false}
        enableFiles
      />
    </AppShell>
  );
}

function TabEmpty({
  text,
  canWrite,
  onAdd,
}: {
  text: string;
  canWrite?: boolean;
  onAdd?: () => void;
}) {
  return (
    <div style={{ textAlign: "center", padding: "2rem", gridColumn: "1 / -1" }}>
      <p style={{ color: "#64748b", marginBottom: canWrite && onAdd ? "0.85rem" : 0 }}>{text}</p>
      {canWrite && onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="btn-primary"
          style={{ padding: "0.55rem 1.2rem", fontSize: "0.85rem" }}
        >
          ＋ إضافة
        </button>
      )}
    </div>
  );
}
