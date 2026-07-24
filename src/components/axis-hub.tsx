"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ImperialAxis, NavDropdown, NavItem } from "@/data/empire-structure";
import { resolveItemHref } from "@/lib/empire-routes";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RowActions, standardRowActions } from "@/components/ui/row-actions";
import { useSession, canWriteRole } from "@/lib/session";
import {
  ADD_AXIS_ITEM_FORM_FIELDS,
  appendCustomAxisItem,
  createCustomAxisItem,
  hideAxisItem,
  isAxisItemHidden,
  itemStorageKey,
  loadAxisItemOverrides,
  loadCustomAxisItems,
  loadHiddenAxisItemKeys,
  removeCustomAxisItem,
  updateCustomAxisItem,
  upsertAxisItemOverride,
  type AxisItemOverride,
  type CustomAxisItem,
} from "@/lib/custom-axis-items";

type Props = {
  axis: ImperialAxis;
  userName: string;
};

type EditableItem = NavItem & { isCustom?: boolean };

type EditTarget = {
  id: string;
  isCustom: boolean;
  label: string;
  href?: string;
  moduleSlug?: string;
  description?: string;
};

function ItemCard({
  item,
  canWrite,
  onEdit,
  onDelete,
}: {
  item: EditableItem;
  canWrite: boolean;
  onEdit: (item: EditableItem) => void;
  onDelete: (item: EditableItem) => void;
}) {
  const href = resolveItemHref(item);
  return (
    <div
      className="card-white"
      style={{
        padding: "1rem 1.15rem",
        borderRight: "3px solid rgba(195,21,42,0.35)",
        display: "flex",
        flexDirection: "column",
        gap: "0.65rem",
      }}
    >
      <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "block", flex: 1 }}>
        <p style={{ fontWeight: 700, color: "#0a0a12", fontSize: "0.88rem", marginBottom: "0.25rem" }}>
          {item.label}
        </p>
        {item.description && (
          <p style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "0.35rem", lineHeight: 1.5 }}>
            {item.description}
          </p>
        )}
        {item.moduleSlug ? (
          <span style={{ fontSize: "0.7rem", color: "#c3152a", fontWeight: 600 }}>وحدة تشغيلية ←</span>
        ) : (
          <span style={{ fontSize: "0.7rem", color: "#c3152a", fontWeight: 600 }}>فتح ←</span>
        )}
      </Link>
      {canWrite ? (
        <RowActions
          actions={standardRowActions({
            onEdit: () => onEdit(item),
            onDelete: () => onDelete(item),
          })}
        />
      ) : null}
    </div>
  );
}

function DropdownSection({
  dropdown,
  defaultOpen,
  canWrite,
  onEdit,
  onDelete,
}: {
  dropdown: NavDropdown;
  defaultOpen?: boolean;
  canWrite: boolean;
  onEdit: (item: EditableItem) => void;
  onDelete: (item: EditableItem) => void;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="card-white" style={{ overflow: "hidden", marginBottom: "0.85rem" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.1rem 1.25rem",
          background: open ? "linear-gradient(135deg, rgba(195,21,42,0.06) 0%, #fff 100%)" : "#fff",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-cairo)",
          textAlign: "right",
        }}
      >
        <div>
          <p style={{ fontWeight: 800, color: "#0a0a12", fontSize: "0.95rem" }}>{dropdown.title}</p>
          <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
            {dropdown.items.length} عنصر
          </p>
        </div>
        <span style={{ color: "#c3152a", fontWeight: 700, fontSize: "0.85rem" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div
          style={{
            padding: "0 1rem 1rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "0.65rem",
            borderTop: "1px solid #f1f5f9",
            paddingTop: "1rem",
          }}
        >
          {dropdown.items.map((item) => (
            <ItemCard
              key={item.id}
              item={{ ...item, isCustom: false }}
              canWrite={canWrite}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddAxisItemButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-primary"
      style={{ padding: "0.55rem 1rem", fontSize: "0.82rem" }}
    >
      ＋ إضافة
    </button>
  );
}

export function AxisHubPage({ axis, userName }: Props) {
  const { user } = useSession();
  const canWrite = user ? canWriteRole(user.role) : false;
  const [customItems, setCustomItems] = useState<CustomAxisItem[]>([]);
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<Record<string, AxisItemOverride>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EditTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setCustomItems(loadCustomAxisItems(axis.slug));
    setHiddenKeys(loadHiddenAxisItemKeys());
    setOverrides(loadAxisItemOverrides());
  }, [axis.slug]);

  const withOverride = (item: NavItem): NavItem => {
    const o = overrides[itemStorageKey(axis.slug, item.id)];
    if (!o) return item;
    return {
      ...item,
      label: o.label?.trim() || item.label,
      href: o.href?.trim() || item.href,
      moduleSlug: o.moduleSlug?.trim() || item.moduleSlug,
      description: o.description?.trim() || item.description,
    };
  };

  const isHidden = (itemId: string) =>
    hiddenKeys.includes(itemStorageKey(axis.slug, itemId)) || isAxisItemHidden(axis.slug, itemId);

  const visibleBuiltInItems = useMemo(() => {
    return (axis.items ?? [])
      .filter((item) => !isHidden(item.id))
      .map((item) => ({ ...withOverride(item), isCustom: false as const }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- helpers close over axis/overrides/hiddenKeys
  }, [axis.items, axis.slug, overrides, hiddenKeys]);

  const visibleCustomItems = useMemo(() => {
    return customItems
      .filter((item) => !isHidden(item.id))
      .map((item) => ({ ...withOverride(item), isCustom: true as const }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customItems, axis.slug, overrides, hiddenKeys]);

  const visibleDropdowns = useMemo(() => {
    if (!axis.dropdowns) return [];
    return axis.dropdowns
      .map((dropdown) => ({
        ...dropdown,
        items: dropdown.items
          .filter((item) => !isHidden(item.id))
          .map((item) => withOverride(item)),
      }))
      .filter((dropdown) => dropdown.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axis.dropdowns, axis.slug, overrides, hiddenKeys]);

  const builtInCount =
    visibleBuiltInItems.length ||
    visibleDropdowns.reduce((n, d) => n + d.items.length, 0);
  const itemCount = builtInCount + visibleCustomItems.length;

  const flatItems = useMemo(
    () => [...visibleBuiltInItems, ...visibleCustomItems],
    [visibleBuiltInItems, visibleCustomItems]
  );

  const handleAdd = (data: Record<string, unknown>) => {
    const item = createCustomAxisItem(axis.slug, data);
    setCustomItems(appendCustomAxisItem(item));
    setAddOpen(false);
  };

  const openEdit = (item: EditableItem) => {
    setEditTarget({
      id: item.id,
      isCustom: !!item.isCustom,
      label: item.label,
      href: item.href,
      moduleSlug: item.moduleSlug,
      description: item.description,
    });
  };

  const openDelete = (item: EditableItem) => {
    setDeleteTarget({
      id: item.id,
      isCustom: !!item.isCustom,
      label: item.label,
      href: item.href,
      moduleSlug: item.moduleSlug,
      description: item.description,
    });
  };

  const handleEdit = (data: Record<string, unknown>) => {
    if (!editTarget) return;
    if (editTarget.isCustom) {
      setCustomItems(updateCustomAxisItem(axis.slug, editTarget.id, data));
    } else {
      upsertAxisItemOverride(axis.slug, editTarget.id, data);
      setOverrides(loadAxisItemOverrides());
    }
    setEditTarget(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.isCustom) {
        setCustomItems(removeCustomAxisItem(axis.slug, deleteTarget.id));
      } else {
        setHiddenKeys(hideAxisItem(axis.slug, deleteTarget.id));
      }
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="erp-page" style={{ width: "100%" }}>
      {/* Hero banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${axis.color} 0%, #0a0a12 100%)`,
          borderRadius: "20px",
          padding: "2rem 2.25rem",
          marginBottom: "1.75rem",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -30,
            left: -30,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.6rem",
                }}
              >
                {axis.icon}
              </span>
              <div>
                <p style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: "0.15rem" }}>{axis.subtitle}</p>
                <h1 style={{ fontSize: "1.55rem", fontWeight: 900 }}>{axis.title}</h1>
              </div>
            </div>
            <p style={{ fontSize: "0.9rem", opacity: 0.85, maxWidth: 560, lineHeight: 1.7 }}>
              مرحبًا {userName} — هذا المحور يحتوي على {itemCount} عنصرًا ضمن الهيكل السيادي الموحّد.
            </p>
          </div>
          {canWrite && <AddAxisItemButton onClick={() => setAddOpen(true)} />}
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        {[
          { label: "إجمالي العناصر", value: itemCount, icon: "📋" },
          { label: "المحور", value: `#${axis.id}`, icon: axis.icon },
          ...(axis.dropdowns
            ? [{ label: "القوائم المنسدلة", value: visibleDropdowns.length, icon: "📂" }]
            : []),
        ].map((s) => (
          <div key={s.label} className="card-white" style={{ padding: "1rem 1.1rem" }}>
            <p style={{ fontSize: "0.72rem", color: "#64748b" }}>{s.label}</p>
            <p style={{ fontSize: "1.35rem", fontWeight: 900, color: axis.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      {axis.dropdowns ? (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0, color: "#0a0a12" }}>
              القوائم المنسدلة — التصنيف القانوني
            </h2>
            {canWrite && <AddAxisItemButton onClick={() => setAddOpen(true)} />}
          </div>
          {axis.slug === "legal-classification" && (
            <Link
              href="/app/international-laws"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.25rem",
                padding: "0.75rem 1.25rem",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #c3152a 0%, #a01020 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(195,21,42,0.3)",
              }}
            >
              📚 فتح منظومة التصنيف القانوني الكاملة (8 محاور) ←
            </Link>
          )}
          {visibleDropdowns.map((d, i) => (
            <DropdownSection
              key={d.id}
              dropdown={d}
              defaultOpen={i === 0}
              canWrite={canWrite}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))}
          {visibleCustomItems.length > 0 && (
            <div style={{ marginTop: "1.25rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.75rem", color: "#0a0a12" }}>
                عناصر مضافة
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "0.85rem",
                }}
              >
                {visibleCustomItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    canWrite={canWrite}
                    onEdit={openEdit}
                    onDelete={openDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginBottom: "0.85rem",
            }}
          >
            <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: "#0a0a12" }}>عناصر المحور</h2>
            {canWrite && <AddAxisItemButton onClick={() => setAddOpen(true)} />}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "0.85rem",
            }}
          >
            {flatItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                canWrite={canWrite}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <Link
          href="/app/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "#c3152a",
            fontWeight: 700,
            fontSize: "0.875rem",
          }}
        >
          ← العودة للوحة التحكم الإمبراطورية
        </Link>
      </div>

      <Modal
        open={addOpen}
        title={`إضافة عنصر — ${axis.title}`}
        fields={ADD_AXIS_ITEM_FORM_FIELDS}
        onSave={handleAdd}
        onClose={() => setAddOpen(false)}
        saveLabel="إضافة"
        enableParties={false}
        filesLabel="شواهد وملفات العنصر (مستند · صورة · فيديو)"
      />

      <Modal
        key={editTarget?.id ?? "edit-item-closed"}
        open={!!editTarget}
        title={`تعديل عنصر — ${axis.title}`}
        fields={ADD_AXIS_ITEM_FORM_FIELDS}
        initial={
          editTarget
            ? {
                label: editTarget.label,
                href: editTarget.href ?? "",
                moduleSlug: editTarget.moduleSlug ?? "",
                description: editTarget.description ?? "",
              }
            : undefined
        }
        onSave={handleEdit}
        onClose={() => setEditTarget(null)}
        saveLabel="حفظ التعديل"
        enableParties={false}
        filesLabel="شواهد وملفات العنصر (مستند · صورة · فيديو)"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="تأكيد حذف العنصر"
        message={
          deleteTarget
            ? `هل تريد حذف العنصر «${deleteTarget.label}»؟ لن يظهر بعد ذلك ضمن عناصر هذا المحور.`
            : ""
        }
        confirmLabel="حذف العنصر"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
