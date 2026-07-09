"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { fetchArray } from "@/lib/fetch-array";
import { useSession } from "@/lib/session";

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

export default function LegalKnowledgePage() {
  const { user, ready } = useSession(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [openBranch, setOpenBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;

    Promise.resolve()
      .then(() => {
        if (!cancelled) {
          setLoading(true);
          setError("");
        }
      })
      .then(() => fetchArray<Branch>("/api/legal-branches"))
      .then((data) => {
        if (!cancelled) setBranches(data);
      })
      .catch(() => {
        if (cancelled) return;
        setBranches([]);
        setError("تعذر تحميل التصنيف القانوني");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  if (!ready || !user) return null;

  return (
    <AppShell role={user.role} name={user.name}>
      <div style={{ maxWidth: 1100 }}>
        <h1 style={{ fontSize: "1.55rem", fontWeight: 900, color: "#0a0a12", marginBottom: "0.35rem" }}>
          📚 التصنيف القانوني
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.75rem" }}>
          شجرة الفروع والتخصصات والمواد القانونية — فلترة القضايا والاستشارات حسب التخصص
        </p>

        {loading ? (
          <p style={{ color: "#64748b" }}>جاري التحميل...</p>
        ) : error ? (
          <div className="card-white" style={{ padding: "1.25rem", color: "#c3152a", fontWeight: 700 }}>
            {error}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {branches.map((branch) => (
              <div key={branch.id} className="card-white" style={{ padding: "1.25rem" }}>
                <button
                  type="button"
                  onClick={() => setOpenBranch(openBranch === branch.id ? null : branch.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-cairo)",
                    textAlign: "right",
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: "1rem", color: "#0a0a12" }}>{branch.name}</span>
                  <span style={{ color: "#c3152a", fontSize: "0.85rem", textAlign: "start" }}>
                    {branch.specializations.length} تخصص • {branch._count?.cases ?? 0} قضية {openBranch === branch.id ? "▲" : "▼"}
                  </span>
                </button>
                {openBranch === branch.id && (
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
                    {branch.specializations.map((spec) => (
                      <div key={spec.id} style={{ marginBottom: "0.85rem" }}>
                        <p style={{ fontWeight: 700, color: "#c3152a", fontSize: "0.9rem", marginBottom: "0.35rem" }}>
                          ▸ {spec.name}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", paddingInlineStart: "1rem" }}>
                          {spec.subjects.map((s) => (
                            <span
                              key={s.subject.id}
                              style={{
                                background: "#f8f9fb",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                padding: "0.3rem 0.65rem",
                                fontSize: "0.75rem",
                                color: "#475569",
                              }}
                            >
                              {s.subject.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
