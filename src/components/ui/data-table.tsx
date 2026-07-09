"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
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
const CARD_LAYOUT_WIDTH = 820;
const textCollator = new Intl.Collator("ar", {
  numeric: true,
  sensitivity: "base",
});

function getRowKey(row: Record<string, unknown>, index: number) {
  const stableId = row._id ?? row.id ?? row.caseNo ?? row.jobId ?? row.requestId ?? row.invoiceNo ?? row.code;
  return stableId ? String(stableId) : `row-${index}`;
}

function parseNumericValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) {
    return null;
  }

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

function useCardLayout() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [isCardLayout, setIsCardLayout] = useState(false);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  useEffect(() => {
    if (!container) {
      return;
    }

    const update = (width = container.getBoundingClientRect().width) => {
      setIsCardLayout(width < CARD_LAYOUT_WIDTH);
    };

    update();
    if (typeof ResizeObserver === "undefined") {
      const handleResize = () => update();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }

    const observer = new ResizeObserver((entries) => {
      update(entries[0]?.contentRect.width);
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [container]);

  return { isCardLayout, containerRef };
}

export function DataTable({ columns, data, onEdit, onDelete, onView, searchPlaceholder = "بحث في السجلات..." }: Props) {
  const searchId = useId();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const { isCardLayout, containerRef } = useCardLayout();
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
            const valueA = a[sortKey];
            const valueB = b[sortKey];

            if (column?.type === "number" || column?.type === "currency") {
              const numberA = parseNumericValue(valueA);
              const numberB = parseNumericValue(valueB);

              if (numberA !== null && numberB !== null) {
                return sortAsc ? numberA - numberB : numberB - numberA;
              }
            }

            const va = String(valueA ?? "");
            const vb = String(valueB ?? "");
            return sortAsc ? textCollator.compare(va, vb) : textCollator.compare(vb, va);
          })
        : filtered,
    [columns, filtered, sortAsc, sortKey]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [safePage, sorted]);

  const hasActions = !!(onEdit || onDelete || onView);
  const getActionLabel = (action: string, row: Record<string, unknown>) => {
    const primaryValue = columns.map((column) => row[column.key]).find((value) => value);
    return `${action} ${String(primaryValue ?? "السجل")}`;
  };

  const renderActions = (row: Record<string, unknown>) => {
    if (!hasActions) {
      return null;
    }

    return (
      <div className="row-actions" style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        {onView && (
          <button
            type="button"
            onClick={() => onView(row)}
            aria-label={getActionLabel("عرض", row)}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 0.8rem",
              cursor: "pointer",
              fontSize: "0.73rem",
              fontWeight: 600,
              color: "#475569",
              fontFamily: "var(--font-cairo)",
              transition: "all 0.15s",
              minHeight: 40,
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
            aria-label={getActionLabel("تعديل", row)}
            style={{
              background: "rgba(195,21,42,0.07)",
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 0.8rem",
              cursor: "pointer",
              fontSize: "0.73rem",
              fontWeight: 600,
              color: "#c3152a",
              fontFamily: "var(--font-cairo)",
              transition: "all 0.15s",
              minHeight: 40,
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
            aria-label={getActionLabel("حذف", row)}
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 0.8rem",
              cursor: "pointer",
              fontSize: "0.73rem",
              fontWeight: 600,
              color: "#dc2626",
              fontFamily: "var(--font-cairo)",
              transition: "all 0.15s",
              minHeight: 40,
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

  return (
    <div ref={containerRef}>
      {/* Search + count */}
      <div
        className="data-table-toolbar"
        style={{
          display: "flex",
          flexDirection: isCardLayout ? "column" : "row",
          gap: "0.75rem",
          marginBottom: "1rem",
          alignItems: isCardLayout ? "stretch" : "center",
        }}
      >
        <div style={{ position: "relative", flex: 1 }}>
          <label className="sr-only" htmlFor={searchId}>
            {searchPlaceholder}
          </label>
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
            id={searchId}
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
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

      {!isCardLayout ? (
        <div
          className="data-table-frame"
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
                      onKeyDown={(event) => {
                        if (col.sortable === false || (event.key !== "Enter" && event.key !== " ")) {
                          return;
                        }

                        event.preventDefault();
                        handleSort(col.key);
                      }}
                      tabIndex={col.sortable !== false ? 0 : undefined}
                      role={col.sortable !== false ? "button" : undefined}
                      aria-sort={
                        sortKey === col.key ? (sortAsc ? "ascending" : "descending") : "none"
                      }
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
        </div>
      ) : (
      <div className="data-table-cards" style={{ display: "grid", gap: "0.85rem" }}>
        {paged.length === 0 ? (
          <div className="card-white" style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
            <div style={{ fontWeight: 600 }}>لا توجد نتائج</div>
          </div>
        ) : (
          paged.map((row, index) => (
            <article
              key={getRowKey(row, (safePage - 1) * PAGE_SIZE + index)}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "1rem",
                background: "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {columns.map((col) => (
                  <div
                    key={col.key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(90px, 0.42fr) minmax(0, 1fr)",
                      gap: "0.75rem",
                      alignItems: "start",
                    }}
                  >
                    <span style={{ color: "#94a3b8", fontSize: "0.72rem", fontWeight: 700 }}>
                      {col.label}
                    </span>
                    <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{renderCell(col, row)}</span>
                  </div>
                ))}
              </div>
              {hasActions && (
                <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9" }}>
                  {renderActions(row)}
                </div>
              )}
            </article>
          ))
        )}
      </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="data-table-pagination"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isCardLayout ? "stretch" : "center",
            flexDirection: isCardLayout ? "column" : "row",
            gap: isCardLayout ? "0.75rem" : undefined,
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
              type="button"
              aria-label="الصفحة السابقة"
              disabled={safePage === 1}
              onClick={() => setPage(Math.max(1, safePage - 1))}
              style={{
                padding: "0.5rem 0.9rem",
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
                  aria-label={`الانتقال إلى الصفحة ${p}`}
                  aria-current={p === safePage ? "page" : undefined}
                  style={{
                    padding: "0.5rem 0.7rem",
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: p === safePage ? "#c3152a" : "#e2e8f0",
                    background: p === safePage ? "#c3152a" : "#fff",
                    color: p === safePage ? "#fff" : "#475569",
                    cursor: "pointer",
                    fontWeight: p === safePage ? 800 : 400,
                    minWidth: 40,
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
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              style={{
                padding: "0.5rem 0.9rem",
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
        .data-table-scroll {
          -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 520px) {
          .data-table-pagination {
            align-items: stretch !important;
            flex-direction: column;
            gap: 0.75rem;
          }
          .pagination-buttons {
            justify-content: center;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
