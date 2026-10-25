"use client";

import { useState } from "react";
import { StatusBadge } from "./status-badge";
import { RowActions, standardRowActions } from "./row-actions";
import type { Column } from "@/data/module-configs";
import { formatCurrency, formatNumber } from "@/lib/format";

type Props = {
  columns: Column[];
  data: Record<string, unknown>[];
  onEdit?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
  onView?: (row: Record<string, unknown>) => void;
  onArchive?: (row: Record<string, unknown>) => void;
  onSupplement?: (row: Record<string, unknown>) => void;
  searchPlaceholder?: string;
};

const PAGE_SIZE = 10;

export function DataTable({ columns, data, onEdit, onDelete, onView, onArchive, onSupplement, searchPlaceholder = "بحث في السجلات..." }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
    setPage(1);
  };

  const filtered = data.filter((row) => {
    if (!search) return true;
    return columns.some((c) =>
      String(row[c.key] ?? "").toLowerCase().includes(search.toLowerCase())
    );
  });

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const va = String(a[sortKey] ?? "");
        const vb = String(b[sortKey] ?? "");
        return sortAsc ? va.localeCompare(vb, "ar") : vb.localeCompare(va, "ar");
      })
    : filtered;

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActions = !!(onEdit || onDelete || onView || onArchive || onSupplement);

  const renderCell = (col: Column, row: Record<string, unknown>) => {
    const val = row[col.key];
    if (col.type === "badge" && col.badgeMap) {
      const map = col.badgeMap[String(val)];
      if (map) return <StatusBadge label={map.label} color={map.color} />;
      return <StatusBadge label={String(val)} color="gray" />;
    }
    if (col.type === "currency") {
      return (
        <span className="dt-cell-primary" style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate" }}>
          {formatCurrency(val)}
        </span>
      );
    }
    if (col.type === "number") {
      return (
        <span className="dt-cell-primary" style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", direction: "ltr", unicodeBidi: "isolate" }}>
          {formatNumber(val)}
        </span>
      );
    }
    return <span className="dt-cell-secondary">{String(val ?? "—")}</span>;
  };

  return (
    <div>
      {/* Search + count */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span
            className="dt-search-icon"
            style={{
              position: "absolute",
              top: "50%",
              insetInlineStart: "1rem",
              transform: "translateY(-50%)",
              color: "var(--text-muted, #94a3b8)",
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
        <div className="dt-count">
          {filtered.length} سجل
        </div>
      </div>

      {/* Table */}
      <div className="dt-wrap">
        <div style={{ overflowX: "auto" }}>
          <table className="dt-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="dt-th"
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    style={{
                      padding: "0.9rem 1rem",
                      textAlign: "start",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                      cursor: col.sortable !== false ? "pointer" : "default",
                      userSelect: "none",
                    }}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span style={{ marginInlineStart: "0.25rem", color: "var(--brand-gold, #B79A61)" }}>
                        {sortAsc ? " ↑" : " ↓"}
                      </span>
                    )}
                  </th>
                ))}
                {hasActions && (
                  <th
                    className="dt-th"
                    style={{
                      padding: "0.9rem 1rem",
                      textAlign: "start",
                      fontWeight: 700,
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
                    className="dt-cell-secondary"
                    style={{ padding: "3.5rem", textAlign: "center" }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
                    <div style={{ fontWeight: 600 }}>لا توجد نتائج</div>
                  </td>
                </tr>
              ) : (
                paged.map((row, i) => (
                  <tr key={i} className="dt-row">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="dt-td"
                        style={{ padding: "0.85rem 1rem", verticalAlign: "middle" }}
                      >
                        {renderCell(col, row)}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="dt-td" style={{ padding: "0.85rem 1rem" }}>
                        <RowActions
                          actions={standardRowActions({
                            onView: onView ? () => onView(row) : undefined,
                            onEdit: onEdit ? () => onEdit(row) : undefined,
                            onAdd: onSupplement ? () => onSupplement(row) : undefined,
                            onArchive: onArchive ? () => onArchive(row) : undefined,
                            onDelete: onDelete ? () => onDelete(row) : undefined,
                          })}
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="dt-pagination"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "1rem",
            fontSize: "0.8rem",
          }}
        >
          <span>
            صفحة {page} من {totalPages} — {sorted.length} سجل إجمالاً
          </span>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="dt-page-btn"
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #e2e8f0)",
                cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              ›
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (p < 1 || p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`dt-page-btn${p === page ? " is-active" : ""}`}
                  style={{
                    padding: "0.4rem 0.65rem",
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: p === page ? "var(--brand-navy, #101D32)" : "var(--border-color, #e2e8f0)",
                    background: p === page ? "var(--brand-navy, #101D32)" : "var(--bg-card, #fff)",
                    color: p === page ? "#fff" : "var(--text-secondary, #475569)",
                    cursor: "pointer",
                    fontWeight: p === page ? 800 : 400,
                    minWidth: 32,
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="dt-page-btn"
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #e2e8f0)",
                cursor: page === totalPages ? "not-allowed" : "pointer",
                opacity: page === totalPages ? 0.5 : 1,
              }}
            >
              ‹
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
