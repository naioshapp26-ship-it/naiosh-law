"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import {
  AN_TYPES,
  anDefaults,
  anParseCSV,
  anParseXLSX,
  anRun,
  anSampleCSV,
  anTable,
} from "@/lib/data-analysis/engine";

type DatasetMeta = {
  key: string;
  label: string;
  description: string;
  available: boolean;
};

type AnalysisBlock = {
  title?: string;
  summary?: string;
  kpis?: Array<[string, string, string?] | string[]>;
  tables?: Array<{ h: string; cols: string[]; rows: unknown[][] }>;
  notes?: string[];
};

function ensureCss() {
  if (typeof document === "undefined") return;
  if (document.querySelector('link[data-da-law-css]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/erp-app/data-analysis-law.css?v=unify-page-hero-20261101";
  link.setAttribute("data-da-law-css", "1");
  document.head.appendChild(link);
}

function downloadText(filename: string, text: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["\ufeff" + text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DataAnalysisWorkspace() {
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [source, setSource] = useState<"cases" | "sessions" | "clients" | "finance" | "file" | "sample">(
    "cases"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [scope, setScope] = useState<string>("");
  const [result, setResult] = useState<Record<string, AnalysisBlock> | null>(null);
  const [tableMeta, setTableMeta] = useState<{ n: number; cols: number; target: string | null } | null>(
    null
  );

  useEffect(() => {
    ensureCss();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/data-analysis/datasets", { credentials: "include" });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "تعذر تحميل المصادر");
        setDatasets(body.datasets ?? []);
        setScope(body.scope ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "خطأ في التحميل");
      }
    })();
  }, []);

  const runFromCsv = useCallback(async (csv: string, label: string) => {
    const rows = anParseCSV(csv);
    const T = anTable(rows);
    const defaults = anDefaults(T);
    const cfg = {
      ...defaults,
      types: (AN_TYPES as string[][]).map((t) => t[0]!),
      focus: "all",
    };
    const { out } = anRun(T, cfg);
    setResult(out as Record<string, AnalysisBlock>);
    setTableMeta({ n: T.n, cols: T.cols.length, target: defaults.target });
    setInfo(`تم التحليل: ${label} · ${T.n} صف · ${T.cols.length} عمود`);
  }, []);

  const runAnalysis = useCallback(async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    setResult(null);
    try {
      if (source === "sample") {
        await runFromCsv(anSampleCSV(), "بيانات نموذجية للتدريب");
        return;
      }
      if (source === "file") {
        throw new Error("اختر ملفًا من حقل الرفع أولاً");
      }
      const res = await fetch(
        `/api/data-analysis/datasets?key=${encodeURIComponent(source)}`,
        { credentials: "include" }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "تعذر جلب البيانات القانونية");
      if (!body.csv || body.count === 0) {
        throw new Error("لا توجد سجلات مصرّح بها لهذا المصدر");
      }
      await runFromCsv(body.csv as string, body.meta?.label || source);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل التحليل");
    } finally {
      setBusy(false);
    }
  }, [runFromCsv, source]);

  const onFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setBusy(true);
      setError(null);
      setInfo(null);
      setResult(null);
      try {
        // Server audit copy + validation
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/data-analysis/upload", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        const upBody = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(upBody.error || "رفض الخادم الملف");

        const name = file.name.toLowerCase();
        let rows: string[][];
        if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
          const buf = await file.arrayBuffer();
          rows = await anParseXLSX(buf);
        } else {
          const text = await file.text();
          rows = anParseCSV(text);
        }
        const T = anTable(rows);
        const defaults = anDefaults(T);
        const cfg = {
          ...defaults,
          types: (AN_TYPES as string[][]).map((t) => t[0]!),
          focus: "all",
        };
        const { out } = anRun(T, cfg);
        setResult(out as Record<string, AnalysisBlock>);
        setTableMeta({ n: T.n, cols: T.cols.length, target: defaults.target });
        setInfo(
          `ملف «${upBody.upload?.originalName || file.name}» · ${T.n} صف · بصمة ${String(
            upBody.upload?.sha256 || ""
          ).slice(0, 12)}…`
        );
        setSource("file");
      } catch (e) {
        setError(e instanceof Error ? e.message : "فشل تحليل الملف");
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const exportReport = useCallback(() => {
    if (!result) return;
    const lines = ["القسم,الملخص"];
    for (const [key, block] of Object.entries(result)) {
      const title = block.title || key;
      const summary = String(block.summary || "").replace(/"/g, '""');
      lines.push(`"${title}","${summary}"`);
      for (const kpi of block.kpis || []) {
        lines.push(`"KPI","${kpi[0]} = ${kpi[1]}"`);
      }
    }
    downloadText(
      `naiosh-law-analysis-${new Date().toISOString().slice(0, 10)}.csv`,
      lines.join("\n")
    );
  }, [result]);

  const blocks = useMemo(() => {
    if (!result) return [] as Array<[string, AnalysisBlock]>;
    const order = (AN_TYPES as string[][]).map((t) => t[0]!);
    return order
      .filter((k) => result[k])
      .map((k) => [k, result[k]!] as [string, AnalysisBlock]);
  }, [result]);

  return (
    <div className="da-law" dir="rtl">
      <PageHero
        icon={<i className="fas fa-chart-line" aria-hidden />}
        title="مساحة تحليل البيانات القانونية"
        subtitle={`اختر مصدرًا مصرّحًا أو ارفع ملفًا · النطاق: ${scope || "…"}`}
        actions={
          <>
            <Link href="/data-analysis" className="da-law-btn ghost" style={{ textDecoration: "none" }}>
              الصفحة التعريفية
            </Link>
            <button type="button" className="btn-primary" disabled={!result} onClick={exportReport}>
              تصدير التقرير
            </button>
          </>
        }
      />

      <section className="da-law-section">
        <div className="da-ws-toolbar">
          <div className="da-ws-field">
            <label htmlFor="da-source">مصدر البيانات</label>
            <select
              id="da-source"
              value={source === "file" ? "cases" : source}
              onChange={(e) =>
                setSource(e.target.value as typeof source)
              }
            >
              {datasets.map((d) => (
                <option key={d.key} value={d.key} disabled={!d.available}>
                  {d.label}
                </option>
              ))}
              <option value="sample">بيانات نموذجية (للتدريب فقط)</option>
            </select>
          </div>
          <button
            type="button"
            className="da-law-btn primary"
            disabled={busy}
            onClick={() => void runAnalysis()}
          >
            {busy ? "جاري التحليل…" : "تنفيذ التحليل"}
          </button>
          <div className="da-ws-field">
            <label htmlFor="da-file">رفع CSV / Excel</label>
            <input
              id="da-file"
              type="file"
              accept=".csv,.xlsx,.xls,.tsv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {error ? <div className="da-ws-error">{error}</div> : null}
        {info ? <div className="da-ws-ok">{info}</div> : null}
        {tableMeta ? (
          <p className="lead" style={{ marginTop: 0 }}>
            الهدف المكتشف: {tableMeta.target || "—"} · الصفوف: {tableMeta.n} · الأعمدة:{" "}
            {tableMeta.cols}
          </p>
        ) : null}
      </section>

      {blocks.length > 0 ? (
        <div className="da-ws-results">
          {blocks.map(([key, block]) => (
            <article key={key} className="da-ws-block">
              <h3>{block.title || key}</h3>
              {block.summary ? <p className="summary">{block.summary}</p> : null}
              {block.kpis && block.kpis.length > 0 ? (
                <div className="da-ws-kpis">
                  {block.kpis.map((kpi, i) => (
                    <div
                      key={`${key}-kpi-${i}`}
                      className={`da-ws-kpi${kpi[2] ? ` ${kpi[2]}` : ""}`}
                    >
                      <span>{kpi[0]}</span>
                      <strong>{kpi[1]}</strong>
                    </div>
                  ))}
                </div>
              ) : null}
              {(block.tables || []).map((tbl, ti) => (
                <div key={`${key}-t-${ti}`} style={{ marginBottom: "0.75rem" }}>
                  <p style={{ margin: "0 0 0.35rem", fontWeight: 800, color: "#101d32" }}>
                    {tbl.h}
                  </p>
                  <div className="da-ws-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {tbl.cols.map((c) => (
                            <th key={c}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tbl.rows.slice(0, 40).map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci}>{String(cell ?? "")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              {block.notes?.length ? (
                <ul style={{ margin: 0, paddingInlineStart: "1.2rem", color: "#64748b" }}>
                  {block.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
