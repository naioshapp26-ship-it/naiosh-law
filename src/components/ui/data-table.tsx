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

function getRowKey(row: Record<string, unknown>, index: number) {
  const stableId =
    row._id ??
    row.id ??
    row.caseNo ??
    row.jobId ??
    row.requestId ??
    row.invoiceNo ??
    row.code ??
    row.ref ??
    row.endpoint ??
    row.email ??
    row.name ??
    row.title;
  return stableId ? String(stableId) : `row-${index}`;
}

function toSortableNumber(value: unknown) {
  const numericValue = Number(String(value ?? "").replace(/[,\s]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function DataTable({ columns, data, onEdit, onDelete, onView, searchPlaceholder = "بحث في السجلات..." }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const normalizedSearch = search.trim().toLowerCase();

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
    setPage(1);
  };

  const filtered = useMemo(
    () =>
      data.filter((row) => {
        if (!normalizedSearch) return true;
        return columns.some((c) =>
          String(row[c.key] ?? "").toLowerCase().includes(normalizedSearch)
        );
      }),
    [columns, data, normalizedSearch]
  );

  const sorted = useMemo(
    () =>
      sortKey
        ? [...filtered].sort((a, b) => {
            const column = columns.find((item) => item.key === sortKey);
            if (column?.type === "currency" || column?.type === "number") {
              const va = toSortableNumber(a[sortKey]);
              const vb = toSortableNumber(b[sortKey]);
              if (va !== null && vb !== null) {
                return sortAsc ? va - vb : vb - va;
              }
            }

            const va = String(a[sortKey] ?? "");
            const vb = String(b[sortKey] ?? "");
            return sortAsc ? va.localeCompare(vb, "ar") : vb.localeCompare(va, "ar");
          })
        : filtered,
    [columns, filtered, sortAsc, sortKey]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [safePage, sorted]);

  const hasActions = !!(onEdit || onDelete || onView);

  const renderCell = (col: Column, row: Record<string, unknown>) => {
    const val = row[col.key];
    if (col.type === "badge" && col.badgeMap) {
      const map = col.badgeMap[String(val)];
      if (map) return <StatusBadge label={map.label} color={map.color} />;
      return <StatusBadge label={String(val)} color="gray" />;
    }
    if (col.type === "currency") {
      if (val === null || val === undefined || String(val).trim() === "") {
        return <span style={{ color: "#64748b" }}>—</span>;
      }
      const numericValue = Number(String(val ?? "").replace(/,/g, ""));
      if (!Number.isFinite(numericValue)) {
        return <span style={{ color: "#64748b" }}>—</span>;
      }
      return (
        <span style={{ fontWeight: 700, color: "#0a0a12" }}>
          {numericValue.toLocaleString("ar-EG")} ج.م
        </span>
      );
    }
    if (col.type === "number") {
      return <span style={{ fontWeight: 600 }}>{String(val)}</span>;
    }
    return <span style={{ color: "#334155" }}>{String(val ?? "—")}</span>;
  };

  const renderActions = (row: Record<string, unknown>) => {
    if (!hasActions) {
      return null;
    }

    return (
      <div className="row-actions" style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
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
    );
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
        <div className="data-table-scroll" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse", fontSize: "0.86rem" }}>
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
                    key={getRowKey(row, (safePage - 1) * PAGE_SIZE + i)}
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
                        {renderActions(row)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div
          className="data-table-cards"
          aria-label="نتائج السجلات"
          style={{ display: "none" }}
        >
          {paged.length === 0 ? (
            <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#94a3b8" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
              <div style={{ fontWeight: 600 }}>لا توجد نتائج</div>
            </div>
          ) : (
            paged.map((row, i) => (
              <article
                key={`${getRowKey(row, (safePage - 1) * PAGE_SIZE + i)}-card`}
                className="mobile-record-card"
                style={{
                  background: "#fff",
                  borderBottom: "1px solid #e2e8f0",
                  padding: "1rem",
                }}
              >
                <div style={{ display: "grid", gap: "0.85rem" }}>
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      className="mobile-record-field"
                      style={{
                        display: "grid",
                        gap: "0.35rem",
                        paddingBottom: "0.75rem",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <span style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 700 }}>
                        {col.label}
                      </span>
                      <div style={{ fontSize: "0.9rem", minWidth: 0 }}>{renderCell(col, row)}</div>
                    </div>
                  ))}
                </div>
                {hasActions && (
                  <div style={{ marginTop: "0.9rem" }}>
                    {renderActions(row)}
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
            صفحة {safePage} من {totalPages} — {sorted.length} سجل إجمالاً
          </span>
          <div className="pagination-buttons" style={{ display: "flex", gap: "0.3rem" }}>
            <button
              disabled={safePage === 1}
              onClick={() => setPage(Math.max(1, safePage - 1))}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                background: safePage === 1 ? "#f8f9fb" : "#fff",
                cursor: safePage === 1 ? "not-allowed" : "pointer",
                opacity: safePage === 1 ? 0.5 : 1,
              }}
            >
              ›
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = Math.max(1, Math.min(safePage - 2, totalPages - 4)) + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button
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
              disabled={safePage === totalPages}
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                background: safePage === totalPages ? "#f8f9fb" : "#fff",
                cursor: safePage === totalPages ? "not-allowed" : "pointer",
                opacity: safePage === totalPages ? 0.5 : 1,
              }}
            >
              ‹
            </button>
          </div>
        </div>
      )}
      <style>{`
        .data-table-scroll {
          -webkit-overflow-scrolling: touch;
        }
        .data-table-cards {
          display: none;
        }
        @media (max-width: 700px) {
          .data-table-toolbar {
            align-items: stretch !important;
            flex-direction: column;
          }
          .data-table-scroll table {
            min-width: 680px !important;
          }
          .data-table-scroll th,
          .data-table-scroll td {
            padding: 0.75rem 0.8rem !important;
          }
          .data-table-pagination {
            align-items: stretch !important;
            flex-direction: column;
            gap: 0.75rem;
          }
          .pagination-buttons {
            justify-content: center;
            flex-wrap: wrap;
          }
          .row-actions {
            min-width: 160px;
          }
        }
        @media (max-width: 640px) {
          .data-table-scroll {
            display: none;
          }
          .data-table-cards {
            display: flex !important;
            flex-direction: column;
          }
          .mobile-record-card:last-child {
            border-bottom: 0 !important;
          }
          .mobile-record-field:last-child {
            border-bottom: 0 !important;
            padding-bottom: 0 !important;
          }
          .data-table-cards .row-actions {
            min-width: 0;
            width: 100%;
          }
          .data-table-cards .row-actions > button {
            flex: 1 1 92px;
            min-height: 38px;
          }
        }
      `}</style>
    </div>
  );
}
