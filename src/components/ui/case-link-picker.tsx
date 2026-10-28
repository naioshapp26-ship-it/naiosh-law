"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { NO_LINKED_CASE } from "@/lib/case-identity";

export type CaseOption = {
  id: string;
  caseNo: string;
  client: string;
};

type MultiProps = {
  id?: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  options: CaseOption[];
  value: string[];
  onChange: (ids: string[], selected: CaseOption[]) => void;
  /** Prefill create-case deep link when editing an existing client */
  clientId?: string;
  clientName?: string;
};

type SingleProps = {
  id?: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  options: CaseOption[];
  value: string;
  onChange: (id: string, selected: CaseOption | null) => void;
  allowEmpty?: boolean;
};

function filterOptions(options: CaseOption[], q: string): CaseOption[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return options;
  return options.filter(
    (o) =>
      o.caseNo.toLowerCase().includes(needle) ||
      o.client.toLowerCase().includes(needle) ||
      o.id.toLowerCase() === needle
  );
}

export function CaseMultiSelect({
  id,
  label,
  required,
  readOnly,
  options,
  value,
  onChange,
  clientId,
  clientName,
}: MultiProps) {
  const [query, setQuery] = useState("");
  const selected = useMemo(
    () =>
      value
        .map((id) => options.find((o) => o.id === id))
        .filter((o): o is CaseOption => Boolean(o)),
    [value, options]
  );
  const available = useMemo(() => {
    const taken = new Set(value);
    return filterOptions(
      options.filter((o) => !taken.has(o.id)),
      query
    ).slice(0, 40);
  }, [options, value, query]);

  const createHref = useMemo(() => {
    const params = new URLSearchParams({ add: "1" });
    if (clientId) params.set("clientId", clientId);
    if (clientName) params.set("clientName", clientName);
    return `/app/modules/case-management?${params.toString()}`;
  }, [clientId, clientName]);

  const add = (opt: CaseOption) => {
    if (readOnly || value.includes(opt.id)) return;
    const next = [...value, opt.id];
    const nextSelected = [
      ...selected,
      opt,
    ];
    onChange(next, nextSelected);
    setQuery("");
  };

  const remove = (id: string) => {
    if (readOnly) return;
    const next = value.filter((v) => v !== id);
    onChange(
      next,
      selected.filter((s) => s.id !== id)
    );
  };

  return (
    <div>
      <label className="input-label" htmlFor={id}>
        {label}
        {required && <span style={{ color: "#101D32" }}> *</span>}
        {!required && (
          <span style={{ color: "#94a3b8", fontWeight: 600 }}> (اختياري)</span>
        )}
      </label>

      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          background: "#fff",
          padding: "0.75rem",
        }}
      >
        {selected.length === 0 ? (
          <p
            style={{
              margin: "0 0 0.65rem",
              color: "#94a3b8",
              fontStyle: "italic",
              fontSize: "0.85rem",
              fontFamily: "var(--font-cairo)",
            }}
          >
            {NO_LINKED_CASE} — يمكن حفظ الموكل الآن وربطه لاحقًا بقضية حقيقية.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.45rem",
              marginBottom: "0.65rem",
            }}
          >
            {selected.map((s) => (
              <span
                key={s.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: 999,
                  padding: "0.28rem 0.65rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#101D32",
                  fontFamily: "var(--font-cairo)",
                }}
              >
                {s.caseNo}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    aria-label={`إلغاء ربط ${s.caseNo}`}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#64748b",
                      fontWeight: 900,
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {!readOnly && (
          <>
            <input
              id={id}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field"
              placeholder="ابحث برقم القضية أو اسمها / اسم الموكل..."
              autoComplete="off"
              style={{ marginBottom: "0.5rem" }}
            />
            <div
              style={{
                maxHeight: 180,
                overflowY: "auto",
                border: "1px solid #f1f5f9",
                borderRadius: 10,
                background: "#f8fafc",
              }}
            >
              {available.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    padding: "0.75rem",
                    color: "#94a3b8",
                    fontSize: "0.82rem",
                    fontFamily: "var(--font-cairo)",
                  }}
                >
                  لا توجد قضية مطابقة في PostgreSQL. لا يُسمح بكتابة رقم وهمي.
                </p>
              ) : (
                available.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => add(opt)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "right",
                      border: "none",
                      borderBottom: "1px solid #eef2f7",
                      background: "transparent",
                      padding: "0.65rem 0.85rem",
                      cursor: "pointer",
                      fontFamily: "var(--font-cairo)",
                      fontSize: "0.85rem",
                      color: "#0f172a",
                    }}
                  >
                    <strong style={{ color: "#101D32" }}>{opt.caseNo}</strong>
                    {opt.client ? (
                      <span style={{ color: "#64748b", marginInlineStart: 8 }}>
                        — {opt.client}
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </>
        )}

        <div
          style={{
            marginTop: "0.75rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              color: "#64748b",
              fontFamily: "var(--font-cairo)",
            }}
          >
            الربط يتم فقط من القضايا الحقيقية. لإنشاء قضية جديدة ثم ربطها:
          </p>
          <Link
            href={createHref}
            className="btn-primary"
            style={{
              padding: "0.45rem 0.9rem",
              fontSize: "0.78rem",
              textDecoration: "none",
              display: "inline-flex",
            }}
            onClick={(e) => {
              if (!clientId) {
                // Allow navigation; user can create case then return to link.
                return;
              }
              e.stopPropagation();
            }}
          >
            ＋ إنشاء قضية وربطها
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CaseSingleSelect({
  id,
  label,
  required,
  readOnly,
  options,
  value,
  onChange,
  allowEmpty = true,
}: SingleProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value) ?? null;
  const filtered = useMemo(
    () => filterOptions(options, query).slice(0, 50),
    [options, query]
  );

  return (
    <div>
      <label className="input-label" htmlFor={id}>
        {label}
        {required && <span style={{ color: "#101D32" }}> *</span>}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type="search"
          className="input-field"
          disabled={readOnly}
          value={open ? query : selected ? `${selected.caseNo}${selected.client ? ` — ${selected.client}` : ""}` : query}
          placeholder={
            required ? "ابحث واختر قضية من السجل المركزي..." : "بدون قضية مرتبطة — ابحث للربط"
          }
          autoComplete="off"
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => {
            setOpen(true);
            setQuery(e.target.value);
          }}
          required={required && !value}
          readOnly={readOnly}
          style={
            readOnly
              ? { background: "#f8fafc", color: "#334155", fontWeight: 700 }
              : undefined
          }
        />
        {open && !readOnly && (
          <div
            style={{
              position: "absolute",
              zIndex: 30,
              insetInline: 0,
              top: "calc(100% + 4px)",
              maxHeight: 220,
              overflowY: "auto",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
            }}
          >
            {allowEmpty && (
              <button
                type="button"
                onClick={() => {
                  onChange("", null);
                  setOpen(false);
                  setQuery("");
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "right",
                  border: "none",
                  borderBottom: "1px solid #f1f5f9",
                  background: "transparent",
                  padding: "0.65rem 0.85rem",
                  cursor: "pointer",
                  fontFamily: "var(--font-cairo)",
                  color: "#64748b",
                  fontSize: "0.85rem",
                }}
              >
                {required ? "— إلغاء الاختيار —" : NO_LINKED_CASE}
              </button>
            )}
            {filtered.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  padding: "0.75rem",
                  color: "#94a3b8",
                  fontSize: "0.82rem",
                  fontFamily: "var(--font-cairo)",
                }}
              >
                لا توجد قضية مطابقة — لا يُسمح بإدخال رقم غير موجود.
              </p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id, opt);
                    setOpen(false);
                    setQuery("");
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "right",
                    border: "none",
                    borderBottom: "1px solid #f1f5f9",
                    background: value === opt.id ? "#f1f5f9" : "transparent",
                    padding: "0.65rem 0.85rem",
                    cursor: "pointer",
                    fontFamily: "var(--font-cairo)",
                    fontSize: "0.85rem",
                    color: "#0f172a",
                  }}
                >
                  <strong style={{ color: "#101D32" }}>{opt.caseNo}</strong>
                  {opt.client ? (
                    <span style={{ color: "#64748b", marginInlineStart: 8 }}>
                      — {opt.client}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {open && !readOnly && (
        <button
          type="button"
          aria-label="إغلاق قائمة القضايا"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 20,
            border: "none",
            background: "transparent",
            cursor: "default",
          }}
        />
      )}
    </div>
  );
}
