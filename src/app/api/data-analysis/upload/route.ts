import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 40 * 1024 * 1024; // 40MB — matches Intelligence portal limit for files
const ALLOWED_EXT = new Set([".csv", ".xlsx", ".xls", ".tsv", ".txt"]);
const BLOCKED_EXT = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".js",
  ".mjs",
  ".html",
  ".htm",
  ".svg",
  ".php",
  ".py",
]);

function safeExt(name: string) {
  const base = path.basename(name).toLowerCase();
  const ext = path.extname(base);
  return { base, ext };
}

export async function POST(request: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: "الملف فارغ" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "حجم الملف يتجاوز 40 ميجابايت" },
      { status: 400 }
    );
  }

  const { base, ext } = safeExt(file.name || "upload.bin");
  if (BLOCKED_EXT.has(ext) || !ALLOWED_EXT.has(ext)) {
    return NextResponse.json(
      {
        error:
          "نوع الملف غير مسموح. المسموح: CSV أو Excel (.xlsx/.xls) أو TSV/TXT",
      },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buf).digest("hex");
  const id = randomUUID();

  // Isolate storage by Law user — never share with Hub/Intelligence paths
  const dir = path.join(
    process.cwd(),
    "uploads",
    "data-analysis",
    session!.sub
  );
  await fs.mkdir(dir, { recursive: true });
  const storedName = `${id}${ext}`;
  const full = path.join(dir, storedName);
  await fs.writeFile(full, buf, { mode: 0o600 });

  // Meta sidecar (no cross-tenant index)
  const meta = {
    id,
    userId: session!.sub,
    role: session!.role,
    originalName: base.slice(0, 180),
    ext,
    size: file.size,
    sha256,
    storedName,
    createdAt: new Date().toISOString(),
    system: "naiosh-law",
  };
  await fs.writeFile(
    path.join(dir, `${id}.json`),
    JSON.stringify(meta, null, 2),
    { mode: 0o600 }
  );

  return NextResponse.json({
    ok: true,
    upload: {
      id,
      originalName: meta.originalName,
      size: meta.size,
      sha256,
      ext,
      // Client re-reads the File locally for analysis; server keeps audit copy only
    },
  });
}
