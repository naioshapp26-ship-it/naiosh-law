"use client";

import type { CSSProperties, ReactNode } from "react";

export type RowActionVariant = "view" | "edit" | "add" | "archive" | "delete" | "assign";

const VARIANT_STYLES: Record<
  RowActionVariant,
  { background: string; backgroundHover: string; color: string }
> = {
  view: {
    background: "rgba(37,99,235,0.1)",
    backgroundHover: "rgba(37,99,235,0.18)",
    color: "#2563eb",
  },
  edit: {
    background: "rgba(195,21,42,0.07)",
    backgroundHover: "rgba(195,21,42,0.14)",
    color: "#c3152a",
  },
  add: {
    background: "rgba(34,197,94,0.1)",
    backgroundHover: "rgba(34,197,94,0.18)",
    color: "#16a34a",
  },
  archive: {
    background: "rgba(100,116,139,0.1)",
    backgroundHover: "rgba(100,116,139,0.18)",
    color: "#475569",
  },
  delete: {
    background: "rgba(239,68,68,0.08)",
    backgroundHover: "rgba(239,68,68,0.15)",
    color: "#dc2626",
  },
  assign: {
    background: "rgba(14,165,233,0.1)",
    backgroundHover: "rgba(14,165,233,0.18)",
    color: "#0284c7",
  },
};

const VARIANT_LABELS: Record<RowActionVariant, string> = {
  view: "👁 عرض",
  edit: "✏️ تعديل",
  add: "➕ إضافة",
  archive: "📦 أرشفة",
  delete: "🗑 حذف",
  assign: "🏷️ تعيين",
};

/** Font Awesome labels for ERP / studio pages that already load FA. */
const VARIANT_FA_LABELS: Record<RowActionVariant, { icon: string; text: string }> = {
  view: { icon: "fa-eye", text: "عرض" },
  edit: { icon: "fa-pen", text: "تعديل" },
  add: { icon: "fa-plus", text: "إضافة" },
  archive: { icon: "fa-box-archive", text: "أرشفة" },
  delete: { icon: "fa-trash", text: "حذف" },
  assign: { icon: "fa-tag", text: "تعيين" },
};

const btnBase: CSSProperties = {
  border: "none",
  borderRadius: "8px",
  padding: "0.35rem 0.7rem",
  cursor: "pointer",
  fontSize: "0.73rem",
  fontWeight: 600,
  fontFamily: "var(--font-cairo), Cairo, sans-serif",
  transition: "background 0.15s",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.3rem",
  whiteSpace: "nowrap",
};

export type RowActionItem = {
  variant: RowActionVariant;
  onClick?: () => void;
  label?: string;
  disabled?: boolean;
  title?: string;
};

type Props = {
  actions: RowActionItem[];
  /** Use Font Awesome icons (ERP studio pages). Default: emoji labels. */
  iconSet?: "emoji" | "fa";
  className?: string;
  style?: CSSProperties;
};

function actionLabel(item: RowActionItem, iconSet: "emoji" | "fa"): ReactNode {
  if (item.label) return item.label;
  if (iconSet === "fa") {
    const fa = VARIANT_FA_LABELS[item.variant];
    return (
      <>
        <i className={`fas ${fa.icon}`} aria-hidden />
        {fa.text}
      </>
    );
  }
  return VARIANT_LABELS[item.variant];
}

/**
 * Unified table row action buttons used across the system:
 * عرض · تعديل · إضافة · أرشفة · حذف (optional تعيين).
 */
export function RowActions({ actions, iconSet = "emoji", className, style }: Props) {
  if (!actions.length) return null;

  return (
    <div
      className={className ? `row-actions ${className}` : "row-actions"}
      style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", ...style }}
      role="group"
      aria-label="الإجراءات"
    >
      {actions.map((item) => {
        const colors = VARIANT_STYLES[item.variant];
        return (
          <button
            key={item.variant + (item.label ?? "")}
            type="button"
            className={`row-action row-action-${item.variant}`}
            disabled={item.disabled}
            title={item.title}
            onClick={item.onClick}
            style={{
              ...btnBase,
              background: colors.background,
              color: colors.color,
              opacity: item.disabled ? 0.5 : 1,
              cursor: item.disabled ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (item.disabled) return;
              (e.currentTarget as HTMLElement).style.background = colors.backgroundHover;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = colors.background;
            }}
          >
            {actionLabel(item, iconSet)}
          </button>
        );
      })}
    </div>
  );
}

/** Convenience builder for the standard five actions (skips missing handlers). */
export function standardRowActions(handlers: {
  onView?: () => void;
  onEdit?: () => void;
  onAdd?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
}): RowActionItem[] {
  const items: RowActionItem[] = [];
  if (handlers.onView) items.push({ variant: "view", onClick: handlers.onView });
  if (handlers.onEdit) items.push({ variant: "edit", onClick: handlers.onEdit });
  if (handlers.onAdd) items.push({ variant: "add", onClick: handlers.onAdd });
  if (handlers.onArchive) items.push({ variant: "archive", onClick: handlers.onArchive });
  if (handlers.onAssign) items.push({ variant: "assign", onClick: handlers.onAssign });
  if (handlers.onDelete) items.push({ variant: "delete", onClick: handlers.onDelete });
  return items;
}
