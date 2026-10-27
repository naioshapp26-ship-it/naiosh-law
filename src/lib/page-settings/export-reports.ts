"use client";

import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as ArabicReshaper from "arabic-persian-reshaper";
import bidiFactory from "bidi-js";

export type ExportColumn = { key: string; label: string };
export type ExportReportsOpts = {
  title: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  headerText?: string;
  footerText?: string;
  showLogo?: boolean;
  /** portrait | landscape */
  paperOrientation?: string;
  fileBase?: string;
};

const bidi = typeof bidiFactory === "function" ? bidiFactory() : (bidiFactory as { default: () => ReturnType<typeof bidiFactory> }).default();

function reshapeAr(text: string): string {
  const raw = text ?? "";
  try {
    const shaper =
      (ArabicReshaper as { ArabicShaper?: { convertArabic: (s: string) => string } }).ArabicShaper ||
      (ArabicReshaper as { default?: { ArabicShaper: { convertArabic: (s: string) => string } } }).default
        ?.ArabicShaper;
    const reshaped = shaper ? shaper.convertArabic(raw) : raw;
    const embeddingLevels = bidi.getEmbeddingLevels(reshaped);
    return bidi.getReorderedString(reshaped, embeddingLevels);
  } catch {
    return raw;
  }
}

function cellStr(v: unknown) {
  if (v == null) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(v: unknown) {
  const s = cellStr(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportCsv(opts: ExportReportsOpts) {
  const header = opts.columns.map((c) => escapeCsvCell(c.label)).join(",");
  const lines = opts.rows.map((row) =>
    opts.columns.map((c) => escapeCsvCell(row[c.key])).join(",")
  );
  const content = "\uFEFF" + [header, ...lines].join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  downloadBlob(`${opts.fileBase || "export"}.csv`, blob);
}

export async function exportXlsx(opts: ExportReportsOpts) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "NAIOSH Law";
  wb.created = new Date();
  const landscape = opts.paperOrientation === "landscape";
  const ws = wb.addWorksheet(opts.title.slice(0, 31) || "Sheet1", {
    views: [{ rightToLeft: true }],
    pageSetup: {
      orientation: landscape ? "landscape" : "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
    headerFooter: {
      oddHeader: opts.showLogo === false ? (opts.headerText || "") : `&R${opts.headerText || "NAIOSH Law 360"}`,
      oddFooter: `&L${opts.footerText || "سري — للاستخدام الداخلي"}&R&P / &N`,
    },
  });

  // Title row
  const colCount = Math.max(opts.columns.length, 1);
  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = opts.headerText || opts.title;
  titleCell.font = { bold: true, size: 14, color: { argb: "FF101D32" } };
  titleCell.alignment = { horizontal: "right", vertical: "middle" };

  ws.mergeCells(2, 1, 2, colCount);
  const sub = ws.getCell(2, 1);
  sub.value = `${opts.title} — ${opts.rows.length} سجل — ${new Date().toLocaleDateString("ar")}`;
  sub.font = { size: 10, color: { argb: "FF64748B" } };
  sub.alignment = { horizontal: "right" };

  const headerRow = ws.addRow(opts.columns.map((c) => c.label));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF101D32" },
    };
    cell.alignment = { horizontal: "right" };
  });

  for (const row of opts.rows) {
    const r = ws.addRow(opts.columns.map((c) => cellStr(row[c.key])));
    r.eachCell((cell) => {
      cell.alignment = { horizontal: "right", wrapText: true };
    });
  }

  opts.columns.forEach((_, i) => {
    ws.getColumn(i + 1).width = 18;
  });

  if (opts.footerText) {
    ws.addRow([]);
    const foot = ws.addRow([opts.footerText]);
    foot.getCell(1).font = { italic: true, size: 9, color: { argb: "FF64748B" } };
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(`${opts.fileBase || "export"}.xlsx`, blob);
}

let fontCached: string | null = null;

async function loadArabicFontBase64(): Promise<string | null> {
  if (fontCached) return fontCached;
  try {
    const res = await fetch("/fonts/NotoNaskhArabic-Regular.ttf", { cache: "force-cache" });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    fontCached = btoa(binary);
    return fontCached;
  } catch {
    return null;
  }
}

export async function exportPdf(opts: ExportReportsOpts) {
  const landscape = opts.paperOrientation === "landscape";
  const doc = new jsPDF({
    orientation: landscape ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  });

  const fontB64 = await loadArabicFontBase64();
  let fontName = "helvetica";
  if (fontB64) {
    doc.addFileToVFS("NotoNaskhArabic-Regular.ttf", fontB64);
    doc.addFont("NotoNaskhArabic-Regular.ttf", "NotoNaskhArabic", "normal");
    doc.addFont("NotoNaskhArabic-Regular.ttf", "NotoNaskhArabic", "bold");
    fontName = "NotoNaskhArabic";
    doc.setFont(fontName, "normal");
  }

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 36;

  if (opts.showLogo !== false) {
    doc.setFontSize(10);
    doc.text(reshapeAr("NAIOSH Law 360"), pageW - margin, y, { align: "right" });
    y += 16;
  }

  doc.setFontSize(14);
  doc.setFont(fontName, fontB64 ? "bold" : "bold");
  doc.text(reshapeAr(opts.headerText || opts.title), pageW - margin, y, { align: "right" });
  y += 18;
  doc.setFont(fontName, "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    reshapeAr(`${opts.title} — ${opts.rows.length} سجل — ${new Date().toLocaleDateString("ar")}`),
    pageW - margin,
    y,
    { align: "right" }
  );
  doc.setTextColor(0);
  y += 12;

  const head = [opts.columns.map((c) => reshapeAr(c.label))];
  const body = opts.rows.map((row) =>
    opts.columns.map((c) => reshapeAr(cellStr(row[c.key])))
  );

  autoTable(doc, {
    startY: y,
    head,
    body,
    styles: {
      font: fontName,
      fontSize: 9,
      halign: "right",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [16, 29, 50],
      textColor: 255,
      font: fontName,
      halign: "right",
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      const footer = opts.footerText || "سري — للاستخدام الداخلي";
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        reshapeAr(footer),
        pageW - margin,
        doc.internal.pageSize.getHeight() - 24,
        { align: "right" }
      );
      doc.setTextColor(0);
      void data;
    },
  });

  doc.save(`${opts.fileBase || "export"}.pdf`);
}
