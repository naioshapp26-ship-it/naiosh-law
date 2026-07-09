"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useSession } from "@/lib/session";

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

const tabs: { key: Tab; label: string }[] = [
  { key: "documents", label: "المستندات" },
  { key: "articles", label: "المقالات" },
  { key: "circulars", label: "التعليمات الدائرية" },
];

export default function LegalLibraryPage() {
  const { user, ready } = useSession(true);
  const [tab, setTab] = useState<Tab>("documents");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
    Promise.all([
      fetch(`/api/legal-documents${q}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/legal-articles${q}`, { credentials: "include" }).then((r) => r.json()),
      fetch(`/api/circular-instructions${q}`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([docs, arts, circs]) => {
        setDocuments(docs);
        setArticles(arts);
        setCirculars(circs);
      })
      .finally(() => setLoading(false));
  }, [search]);

  const stats = useMemo(
    () => ({
      documents: documents.length,
      articles: articles.length,
      circulars: circulars.filter((c) => c.status === "ساري").length,
    }),
    [documents, articles, circulars]
  );

  if (!ready || !user) return null;

  return (
    <AppShell role={user.role} name={user.name}>
      <div style={{ maxWidth: 1200 }}>
        <h1 style={{ fontSize: "1.55rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.35rem" }}>
          📖 المكتبة القانونية
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
          مستندات، مقالات قانونية، وتعليمات دائرية — بحث وفلترة حسب الفرع والتخصص
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {[
            { label: "المستندات", value: stats.documents, color: "#0a0a12" },
            { label: "المقالات", value: stats.articles, color: "#c3152a" },
            { label: "تعليمات سارية", value: stats.circulars, color: "#22c55e" },
          ].map((s) => (
            <div key={s.label} className="card-white" style={{ padding: "1rem 1.1rem" }}>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.25rem" }}>{s.label}</p>
              <p style={{ fontWeight: 800, fontSize: "1.05rem", color: s.color }}>{s.value}</p>
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
          <p style={{ color: "#64748b" }}>جاري التحميل...</p>
        ) : (
          <>
            {tab === "documents" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                {documents.map((d) => (
                  <div key={d.id} className="card-white" style={{ padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", background: "#f8f9fb", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "0.2rem 0.5rem", color: "#c3152a", fontWeight: 700 }}>
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
                        style={{ background: "none", border: "none", color: "#c3152a", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", marginTop: "0.35rem", fontFamily: "var(--font-cairo)" }}
                      >
                        {expanded === d.id ? "عرض أقل" : "عرض المزيد"}
                      </button>
                    )}
                    {d.tags && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.6rem" }}>
                        {d.tags.split(",").map((tag) => (
                          <span key={tag} style={{ fontSize: "0.7rem", background: "rgba(195,21,42,0.06)", color: "#c3152a", padding: "0.15rem 0.45rem", borderRadius: "6px" }}>
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {documents.length === 0 && <EmptyState text="لا توجد مستندات" />}
              </div>
            )}

            {tab === "articles" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                {articles.map((a) => (
                  <div key={a.id} className="card-white" style={{ padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>✍️ {a.author}</span>
                      <span style={{ fontSize: "0.72rem", color: "#f59e0b", fontWeight: 600 }}>{a.readMinutes} د قراءة</span>
                    </div>
                    <h3 style={{ fontWeight: 800, color: "#0a0a12", marginBottom: "0.4rem", fontSize: "0.95rem" }}>{a.title}</h3>
                    <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "0.5rem" }}>
                      {a.branch} • {a.specialization}
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.6 }}>{a.summary}</p>
                    {a.tags && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.6rem" }}>
                        {a.tags.split(",").map((tag) => (
                          <span key={tag} style={{ fontSize: "0.7rem", background: "#f8f9fb", border: "1px solid #e2e8f0", color: "#475569", padding: "0.15rem 0.45rem", borderRadius: "6px" }}>
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {articles.length === 0 && <EmptyState text="لا توجد مقالات" />}
              </div>
            )}

            {tab === "circulars" && (
              <div className="card-white" style={{ padding: "0.5rem 1rem" }}>
                {circulars.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "1rem 0",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <p style={{ fontSize: "0.75rem", color: "#c3152a", fontWeight: 700, marginBottom: "0.25rem" }}>
                          {c.circularNo} — {c.issuer}
                        </p>
                        <h3 style={{ fontWeight: 800, color: "#0a0a12", fontSize: "0.92rem", marginBottom: "0.35rem" }}>{c.title}</h3>
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
                {circulars.length === 0 && <EmptyState text="لا توجد تعليمات دائرية" />}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p style={{ color: "#64748b", textAlign: "center", padding: "2rem", gridColumn: "1 / -1" }}>
      {text}
    </p>
  );
}
