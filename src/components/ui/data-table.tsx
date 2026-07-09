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

  const columnByKey = useMemo(
    () => new Map(columns.map((column) => [column.key, column])),
    [columns]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;

    return data.filter((row) =>
      columns.some((c) => String(row[c.key] ?? "").toLowerCase().includes(term))
    );
  }, [columns, data, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;

    const sortColumn = columnByKey.get(sortKey);
    const compare = (a: Record<string, unknown>, b: Record<string, unknown>) => {
      const va = a[sortKey];
      const vb = b[sortKey];

      if (sortColumn?.type === "currency" || sortColumn?.type === "number") {
        const na = Number(String(va ?? "0").replace(/[,%]/g, ""));
        const nb = Number(String(vb ?? "0").replace(/[,%]/g, ""));
        return na - nb;
      }

      return String(va ?? "").localeCompare(String(vb ?? ""), "ar", {
        numeric: true,
        sensitivity: "base",
      });
    };

    return [...filtered].sort((a, b) => (sortAsc ? compare(a, b) : compare(b, a)));
  }, [columnByKey, filtered, sortAsc, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const hasActions = !!(onEdit || onDelete || onView);

  const getRowKey = (row: Record<string, unknown>, index: number) => {
    const primaryKey = row._id ?? row.id ?? row.caseNo ?? row.name ?? row.title ?? row.email;
    if (primaryKey != null) return String(primaryKey);

    const firstColumn = columns[0]?.key;
    if (firstColumn && row[firstColumn] != null) return `${firstColumn}-${String(row[firstColumn])}`;

    return `row-${safePage}-${index}`;
  };

  const renderCell = (col: Column, row: Record<string, unknown>) => {
    const val = row[col.key];
    if (col.type === "badge" && col.badgeMap) {
      const map = col.badgeMap[String(val)];
      if (map) return <StatusBadge label={map.label} color={map.color} />;
      return <StatusBadge label={String(val)} color="gray" />;
    }
    if (col.type === "currency") {
      return (
        <span style={{ fontWeight: 700, color: "#0a0a12" }}>
          {Number(String(val).replace(/,/g, "")).toLocaleString("ar-EG")} ج.م
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
      <div
        style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center", flexWrap: "wrap" }}
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
        <div style={{ overflowX: "auto" }}>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div
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
              disabled={safePage === 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="الصفحة السابقة"
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
              onClick={() => setPage((p) => p + 1)}
              aria-label="الصفحة التالية"
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
    </div>
  );
}
