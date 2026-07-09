"use client";

import { useId, useMemo, useState } from "react";
import { StatusBadge } from "./status-badge";
import type { Column } from "@/data/module-configs";

type Props = {
  columns: Column[];
  data: Record<string, unknown>[];
  onEdit?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
  onView?: (row: Record<string, unknown>) => void;
  searchPlaceholder?: string;
};

const PAGE_SIZE = 10;
const rowIdentityKeys = ["_id", "id", "caseNo", "ref", "jobId", "email", "endpoint", "name", "title"];

function getRowKey(row: Record<string, unknown>, index: number) {
  for (const key of rowIdentityKeys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") {
      return `${key}:${String(value)}`;
    }
  }

  return `row:${index}:${JSON.stringify(row)}`;
}

function getComparableValue(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  const normalizedNumber = Number(String(value ?? "").replace(/[,%]/g, ""));
  return Number.isFinite(normalizedNumber) && String(value ?? "").trim() !== "" ? normalizedNumber : String(value ?? "");
}

export function DataTable({ columns, data, onEdit, onDelete, onView, searchPlaceholder = "بحث في السجلات..." }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const searchInputId = useId();

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
    setPage(1);
  };

  const filtered = useMemo(() => data.filter((row) => {
    if (!search) return true;
    return columns.some((c) =>
      String(row[c.key] ?? "").toLowerCase().includes(search.toLowerCase())
    );
  }), [columns, data, search]);

  const sorted = useMemo(() => sortKey
    ? [...filtered].sort((a, b) => {
        const va = getComparableValue(a[sortKey]);
        const vb = getComparableValue(b[sortKey]);
        if (typeof va === "number" && typeof vb === "number") {
          return sortAsc ? va - vb : vb - va;
        }
        return sortAsc
          ? String(va).localeCompare(String(vb), "ar")
          : String(vb).localeCompare(String(va), "ar");
      })
    : filtered, [filtered, sortAsc, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasActions = !!(onEdit || onDelete || onView);

  const renderCell = (col: Column, row: Record<string, unknown>) => {
    const val = row[col.key];
    if (col.type === "badge" && col.badgeMap) {
      const map = col.badgeMap[String(val)];
      if (map) return <StatusBadge label={map.label} color={map.color} />;
      return <StatusBadge label={String(val)} color="gray" />;
    }
    if (col.type === "currency") {
      const amount = Number(String(val ?? "").replace(/,/g, ""));
      return (
        <span style={{ fontWeight: 700, color: "#0a0a12" }}>
          {Number.isFinite(amount) ? `${amount.toLocaleString("ar-EG")} ج.م` : "—"}
        </span>
      );
    }
    if (col.type === "number") {
      return <span style={{ fontWeight: 600 }}>{String(val)}</span>;
    }
    return <span style={{ color: "#334155" }}>{String(val ?? "—")}</span>;
  };

  return (
    <div>
      {/* Search + count */}
      <div className="table-toolbar" style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <label htmlFor={searchInputId} className="sr-only">بحث في السجلات</label>
          <span
            style={{
              position: "absolute",
              top: "50%",
              insetInlineStart: "1rem",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              fontSize: "0.9rem",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            id={searchInputId}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={searchPlaceholder}
            className="input-field"
            style={{ paddingInlineStart: "2.6rem" }}
          />
        </div>
        <div
          style={{
            background: "#f1f5f9",
            borderRadius: "10px",
            padding: "0.6rem 1rem",
            fontSize: "0.78rem",
            color: "#64748b",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {filtered.length} سجل
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div className="desktop-table-wrap" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
            <thead>
              <tr style={{ background: "#f8f9fb", borderBottom: "1px solid #e2e8f0" }}>
                {columns.map((col) => {
                  const sortable = col.sortable !== false;
                  const ariaSort = sortKey === col.key ? (sortAsc ? "ascending" : "descending") : "none";
                  return (
                  <th
                    key={col.key}
                    aria-sort={sortable ? ariaSort : undefined}
                    style={{
                      padding: "0.9rem 1rem",
                      textAlign: "start",
                      fontWeight: 700,
                      color: "#475569",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                      cursor: sortable ? "pointer" : "default",
                      userSelect: "none",
                    }}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        style={{
                          alignItems: "center",
                          background: "transparent",
                          border: 0,
                          color: "inherit",
                          cursor: "pointer",
                          display: "inline-flex",
                          font: "inherit",
                          fontWeight: 700,
                          gap: "0.25rem",
                          padding: 0,
                        }}
                      >
                        <span>{col.label}</span>
                        {sortKey === col.key && (
                          <span style={{ color: "#c3152a" }} aria-hidden="true">
                            {sortAsc ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                  );
                })}
                {hasActions && (
                  <th
                    style={{
                      padding: "0.9rem 1rem",
                      textAlign: "start",
                      fontWeight: 700,
                      color: "#475569",
                      fontSize: "0.75rem",
                    }}
                  >
                    الإجراءات
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (hasActions ? 1 : 0)}
                    style={{ padding: "3.5rem", textAlign: "center", color: "#94a3b8" }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
                    <div style={{ fontWeight: 600 }}>لا توجد نتائج</div>
                  </td>
                </tr>
              ) : (
                paged.map((row, i) => (
                  <tr
                    key={getRowKey(row, i)}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.15s",
                      background: "transparent",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "#fafbfc")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "transparent")
                    }
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}
                      >
                        {renderCell(col, row)}
                      </td>
                    ))}
                    {hasActions && (
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                          {onView && (
                            <button
                              type="button"
                              onClick={() => onView(row)}
                              style={{
                                background: "#f1f5f9",
                                border: "none",
                                borderRadius: "8px",
                                padding: "0.35rem 0.7rem",
                                cursor: "pointer",
                                fontSize: "0.73rem",
                                fontWeight: 600,
                                color: "#475569",
                                fontFamily: "var(--font-cairo)",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#e2e8f0")}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#f1f5f9")}
                            >
                              👁 عرض
                            </button>
                          )}
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(row)}
                              style={{
                                background: "rgba(195,21,42,0.07)",
                                border: "none",
                                borderRadius: "8px",
                                padding: "0.35rem 0.7rem",
                                cursor: "pointer",
                                fontSize: "0.73rem",
                                fontWeight: 600,
                                color: "#c3152a",
                                fontFamily: "var(--font-cairo)",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(195,21,42,0.14)")}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(195,21,42,0.07)")}
                            >
                              ✏️ تعديل
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(row)}
                              style={{
                                background: "rgba(239,68,68,0.08)",
                                border: "none",
                                borderRadius: "8px",
                                padding: "0.35rem 0.7rem",
                                cursor: "pointer",
                                fontSize: "0.73rem",
                                fontWeight: 600,
                                color: "#dc2626",
                                fontFamily: "var(--font-cairo)",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)")}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)")}
                            >
                              🗑 حذف
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mobile-card-list" style={{ display: "none", padding: "0.85rem", background: "#f8f9fb" }}>
          {paged.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
              <div style={{ fontWeight: 600 }}>لا توجد نتائج</div>
            </div>
          ) : (
            paged.map((row, index) => (
              <article
                key={getRowKey(row, index)}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "0.9rem",
                  marginBottom: index === paged.length - 1 ? 0 : "0.75rem",
                }}
              >
                <div style={{ display: "grid", gap: "0.65rem" }}>
                  {columns.map((col) => (
                    <div key={col.key}>
                      <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 700, marginBottom: "0.2rem" }}>
                        {col.label}
                      </div>
                      <div style={{ fontSize: "0.82rem", overflowWrap: "anywhere" }}>
                        {renderCell(col, row)}
                      </div>
                    </div>
                  ))}
                </div>
                {hasActions && (
                  <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginTop: "0.85rem" }}>
                    {onView && (
                      <button type="button" onClick={() => onView(row)} className="table-action-neutral">
                        👁 عرض
                      </button>
                    )}
                    {onEdit && (
                      <button type="button" onClick={() => onEdit(row)} className="table-action-primary">
                        ✏️ تعديل
                      </button>
                    )}
                    {onDelete && (
                      <button type="button" onClick={() => onDelete(row)} className="table-action-danger">
                        🗑 حذف
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="table-pagination"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "1rem",
            fontSize: "0.8rem",
            color: "#64748b",
          }}
        >
          <span>
            صفحة {safePage} من {totalPages} — {sorted.length} سجل إجمالاً
          </span>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            <button
              type="button"
              aria-label="الصفحة السابقة"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                background: safePage === 1 ? "#f8f9fb" : "#fff",
                cursor: safePage === 1 ? "not-allowed" : "pointer",
                opacity: safePage === 1 ? 0.5 : 1,
              }}
            >
              السابق
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = Math.max(1, Math.min(safePage - 2, totalPages - 4)) + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: "0.4rem 0.65rem",
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: p === safePage ? "#c3152a" : "#e2e8f0",
                    background: p === safePage ? "#c3152a" : "#fff",
                    color: p === safePage ? "#fff" : "#475569",
                    cursor: "pointer",
                    fontWeight: p === safePage ? 800 : 400,
                    minWidth: 32,
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              aria-label="الصفحة التالية"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                background: safePage === totalPages ? "#f8f9fb" : "#fff",
                cursor: safePage === totalPages ? "not-allowed" : "pointer",
                opacity: safePage === totalPages ? 0.5 : 1,
              }}
            >
              التالي
            </button>
          </div>
        </div>
      )}
      <style>{`
        .table-action-neutral,
        .table-action-primary,
        .table-action-danger {
          border: 0;
          border-radius: 8px;
          cursor: pointer;
          font-family: var(--font-cairo);
          font-size: 0.73rem;
          font-weight: 700;
          padding: 0.45rem 0.75rem;
        }
        .table-action-neutral { background: #f1f5f9; color: #475569; }
        .table-action-primary { background: rgba(195,21,42,0.07); color: #c3152a; }
        .table-action-danger { background: rgba(239,68,68,0.08); color: #dc2626; }
        @media (max-width: 520px) {
          .table-toolbar {
            align-items: stretch !important;
            flex-direction: column !important;
          }
          .table-pagination {
            align-items: stretch !important;
            flex-direction: column !important;
            gap: 0.75rem;
          }
          .table-pagination > div {
            flex-wrap: wrap;
          }
        }
        @media (max-width: 640px) {
          .desktop-table-wrap { display: none; }
          .mobile-card-list { display: block !important; }
        }
      `}</style>
    </div>
  );
}
