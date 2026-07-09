"use client";

import { useEffect, useMemo, useState } from "react";
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

const toComparableNumber = (value: unknown) => {
  const numeric = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setMatches(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [query]);

  return matches;
}

export function DataTable({ columns, data, onEdit, onDelete, onView, searchPlaceholder = "بحث في السجلات..." }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const useCardLayout = useMediaQuery("(max-width: 900px)");

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
    setPage(1);
  };

  const filtered = useMemo(() => data.filter((row) => {
    if (!search) return true;
    const query = search.toLowerCase().trim();
    return columns.some((c) =>
      String(row[c.key] ?? "").toLowerCase().includes(query)
    );
  }), [columns, data, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const column = columns.find((item) => item.key === sortKey);
    return [...filtered].sort((a, b) => {
      const value = column?.type === "number" || column?.type === "currency"
        ? toComparableNumber(a[sortKey]) - toComparableNumber(b[sortKey])
        : String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), "ar", {
            numeric: true,
            sensitivity: "base",
          });
      return sortAsc ? value : -value;
    });
  }, [columns, filtered, sortAsc, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const showDesktopTable = useCardLayout !== true;
  const showMobileCards = useCardLayout !== false;

  const hasActions = !!(onEdit || onDelete || onView);
  const firstColumnKey = columns[0]?.key;

  const getRowKey = (row: Record<string, unknown>, index: number) =>
    String(row._id ?? (firstColumnKey ? row[firstColumnKey] : "") ?? index);

  const renderCell = (col: Column, row: Record<string, unknown>) => {
    const val = row[col.key];
    if (col.type === "badge" && col.badgeMap) {
      const map = col.badgeMap[String(val)];
      if (map) return <StatusBadge label={map.label} color={map.color} />;
      return <StatusBadge label={String(val)} color="gray" />;
    }
    if (col.type === "currency") {
      const amount = toComparableNumber(val);
      return (
        <span style={{ fontWeight: 700, color: "#0a0a12" }}>
          {amount.toLocaleString("ar-EG")} ج.م
        </span>
      );
    }
    if (col.type === "number") {
      return <span style={{ fontWeight: 600 }}>{String(val)}</span>;
    }
    return <span style={{ color: "#334155" }}>{String(val ?? "—")}</span>;
  };

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <div>
      {/* Search + count */}
      <div
        className="data-table-toolbar"
        style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}
      >
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
        {showDesktopTable && (
        <div className="desktop-table-wrap" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse", fontSize: "0.86rem" }}>
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
                    className="data-table-row"
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.15s",
                      background: "transparent",
                    }}
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
                                minHeight: 34,
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
                                minHeight: 34,
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
                                minHeight: 34,
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
        )}
        {showMobileCards && (
        <div className="mobile-card-list" style={{ display: "none", padding: "0.75rem", background: "#f8f9fb" }}>
          {paged.length === 0 ? (
            <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#94a3b8" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
              <div style={{ fontWeight: 600 }}>لا توجد نتائج</div>
            </div>
          ) : (
            paged.map((row, index) => (
              <article
                key={getRowKey(row, index)}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "0.95rem",
                  boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
                }}
              >
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {columns.map((col) => (
                    <div key={col.key}>
                      <p style={{ color: "#94a3b8", fontSize: "0.68rem", fontWeight: 700, marginBottom: "0.22rem" }}>
                        {col.label}
                      </p>
                      <div style={{ fontSize: "0.85rem", overflowWrap: "anywhere" }}>
                        {renderCell(col, row)}
                      </div>
                    </div>
                  ))}
                </div>
                {hasActions && (
                  <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginTop: "0.9rem" }}>
                    {onView && (
                      <button
                        onClick={() => onView(row)}
                        style={{ flex: "1 1 80px", background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "0.5rem", cursor: "pointer", fontSize: "0.76rem", fontWeight: 700, color: "#475569", fontFamily: "var(--font-cairo)" }}
                      >
                        👁 عرض
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        style={{ flex: "1 1 80px", background: "rgba(195,21,42,0.07)", border: "none", borderRadius: "8px", padding: "0.5rem", cursor: "pointer", fontSize: "0.76rem", fontWeight: 700, color: "#c3152a", fontFamily: "var(--font-cairo)" }}
                      >
                        ✏️ تعديل
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        style={{ flex: "1 1 80px", background: "rgba(239,68,68,0.08)", border: "none", borderRadius: "8px", padding: "0.5rem", cursor: "pointer", fontSize: "0.76rem", fontWeight: 700, color: "#dc2626", fontFamily: "var(--font-cairo)" }}
                      >
                        🗑 حذف
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
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
          <div className="data-table-pages" style={{ display: "flex", gap: "0.3rem" }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
        @media (hover: hover) and (pointer: fine) {
          .data-table-row:hover { background: #fafbfc !important; }
        }
        @media (max-width: 900px) {
          .desktop-table-wrap { display: none; }
          .mobile-card-list {
            display: grid !important;
            gap: 0.75rem;
          }
        }
        @media (pointer: coarse) {
          .desktop-table-wrap button,
          .mobile-card-list button,
          .data-table-pages button {
            min-height: 44px;
          }
        }
        @media (max-width: 600px) {
          .data-table-toolbar {
            flex-direction: column;
            align-items: stretch !important;
          }
          .data-table-pagination {
            flex-direction: column;
            align-items: stretch !important;
            gap: 0.75rem;
          }
          .data-table-pages {
            justify-content: center;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
