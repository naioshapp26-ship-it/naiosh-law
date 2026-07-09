"use client";

import { useMemo, useState } from "react";
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
const rowIdKey = "_rowId";

export function DataTable({ columns, data, onEdit, onDelete, onView, searchPlaceholder = "بحث في السجلات..." }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("ar-EG");
    if (!normalizedSearch) return data;

    return data.filter((row) =>
      columns.some((column) =>
        String(row[column.key] ?? "").toLocaleLowerCase("ar-EG").includes(normalizedSearch)
      )
    );
  }, [columns, data, search]);

  const sorted = useMemo(() => (
    sortKey
      ? [...filtered].sort((a, b) => {
        const va = String(a[sortKey] ?? "");
        const vb = String(b[sortKey] ?? "");
        return sortAsc ? va.localeCompare(vb, "ar") : vb.localeCompare(va, "ar");
      })
      : filtered
  ), [filtered, sortAsc, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasActions = !!(onEdit || onDelete || onView);
  const firstColumnKey = columns[0]?.key;
  const primaryColumn = columns[0];
  const badgeColumn = columns.find((column) => column.type === "badge");

  const getRowKey = (row: Record<string, unknown>, index: number) => {
    const fallback = firstColumnKey ? row[firstColumnKey] : undefined;
    return String(row[rowIdKey] ?? fallback ?? index);
  };

  const renderCell = (col: Column, row: Record<string, unknown>) => {
    const val = row[col.key];
    if (col.type === "badge" && col.badgeMap) {
      const map = col.badgeMap[String(val)];
      if (map) return <StatusBadge label={map.label} color={map.color} />;
      return <StatusBadge label={String(val)} color="gray" />;
    }
    if (col.type === "currency") {
      const numericValue = Number(String(val ?? "").replace(/,/g, ""));

      return (
        <span style={{ fontWeight: 700, color: "#0a0a12" }}>
          {Number.isFinite(numericValue) ? `${numericValue.toLocaleString("ar-EG")} ج.م` : "—"}
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
      <div className="data-table-toolbar" style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
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
        <div className="data-table-desktop-scroll" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
            <thead>
              <tr style={{ background: "#f8f9fb", borderBottom: "1px solid #e2e8f0" }}>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    style={{
                      padding: "0.9rem 1rem",
                      textAlign: "start",
                      fontWeight: 700,
                      color: "#475569",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                      cursor: col.sortable !== false ? "pointer" : "default",
                      userSelect: "none",
                    }}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span style={{ marginInlineStart: "0.25rem", color: "#c3152a" }}>
                        {sortAsc ? " ↑" : " ↓"}
                      </span>
                    )}
                  </th>
                ))}
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
      </div>

      <div className="data-table-mobile-list" style={{ display: "none", flexDirection: "column", gap: "0.85rem" }}>
        {paged.length === 0 ? (
          <div className="card-white" style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
            <div style={{ fontWeight: 600 }}>لا توجد نتائج</div>
          </div>
        ) : (
          paged.map((row, i) => (
            <div key={getRowKey(row, i)} className="card-white" style={{ padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.85rem", alignItems: "flex-start", marginBottom: "0.85rem" }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 700, marginBottom: "0.25rem" }}>
                    {columns[0]?.label ?? "السجل"}
                  </p>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0a0a12", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {primaryColumn ? renderCell(primaryColumn, row) : "—"}
                  </div>
                </div>
                {badgeColumn ? (
                  <div style={{ flexShrink: 0 }}>
                    {renderCell(badgeColumn, row)}
                  </div>
                ) : null}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.65rem" }}>
                {columns.slice(1, 5).map((col) => (
                  <div key={col.key} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.65rem" }}>
                    <span style={{ color: "#64748b", fontSize: "0.74rem", fontWeight: 700 }}>{col.label}</span>
                    <span style={{ textAlign: "end", fontSize: "0.8rem", minWidth: 0 }}>{renderCell(col, row)}</span>
                  </div>
                ))}
              </div>

              {hasActions && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9" }}>
                  {onView && (
                    <button
                      onClick={() => onView(row)}
                      style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "0.5rem 0.8rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, color: "#475569", fontFamily: "var(--font-cairo)", flex: 1 }}
                    >
                      👁 عرض
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(row)}
                      style={{ background: "rgba(195,21,42,0.07)", border: "none", borderRadius: "8px", padding: "0.5rem 0.8rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, color: "#c3152a", fontFamily: "var(--font-cairo)", flex: 1 }}
                    >
                      ✏️ تعديل
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(row)}
                      style={{ background: "rgba(239,68,68,0.08)", border: "none", borderRadius: "8px", padding: "0.5rem 0.8rem", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, color: "#dc2626", fontFamily: "var(--font-cairo)", flex: 1 }}
                    >
                      🗑 حذف
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="data-table-pagination"
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
            صفحة {currentPage} من {totalPages} — {sorted.length} سجل إجمالاً
          </span>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                background: currentPage === 1 ? "#f8f9fb" : "#fff",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              ›
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: "0.4rem 0.65rem",
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: p === currentPage ? "#c3152a" : "#e2e8f0",
                    background: p === currentPage ? "#c3152a" : "#fff",
                    color: p === currentPage ? "#fff" : "#475569",
                    cursor: "pointer",
                    fontWeight: p === currentPage ? 800 : 400,
                    minWidth: 32,
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                background: currentPage === totalPages ? "#f8f9fb" : "#fff",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              ‹
            </button>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 700px) {
          .data-table-toolbar {
            flex-direction: column;
            align-items: stretch !important;
          }
          .data-table-desktop-scroll {
            display: none;
          }
          .data-table-mobile-list {
            display: flex !important;
          }
          .data-table-pagination {
            align-items: stretch !important;
            flex-direction: column;
            gap: 0.75rem;
          }
          .data-table-pagination > div {
            justify-content: center;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
