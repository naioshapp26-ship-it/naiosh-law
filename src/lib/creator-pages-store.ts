import { promises as fs } from "fs";
import path from "path";
import type { CreatorPage } from "@/data/erp-nav-pages";

const STORE_PATH = path.join(process.cwd(), "data", "creator-pages.json");

async function ensureStore(): Promise<CreatorPage[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CreatorPage[]) : [];
  } catch {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, "[]", "utf8");
    return [];
  }
}

async function writeStore(pages: CreatorPage[]) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(pages, null, 2), "utf8");
}

export async function listCreatorPages() {
  return ensureStore();
}

export async function getCreatorPageByUserId(userId: string) {
  const pages = await ensureStore();
  return pages.find((p) => p.userId === userId) ?? null;
}

export async function getCreatorPageByUsername(username: string) {
  const pages = await ensureStore();
  const key = username.trim().toLowerCase();
  return pages.find((p) => p.username.toLowerCase() === key) ?? null;
}

export async function isUsernameAvailable(username: string, exceptUserId?: string) {
  const existing = await getCreatorPageByUsername(username);
  if (!existing) return true;
  return exceptUserId ? existing.userId === exceptUserId : false;
}

export async function upsertCreatorPage(
  userId: string,
  email: string,
  data: Partial<CreatorPage> & { name: string; username: string }
) {
  const pages = await ensureStore();
  const now = new Date().toISOString();
  const idx = pages.findIndex((p) => p.userId === userId);
  const username = data.username.trim().toLowerCase();

  if (idx >= 0) {
    const next: CreatorPage = {
      ...pages[idx],
      ...data,
      userId,
      email,
      username,
      updatedAt: now,
    };
    pages[idx] = next;
    await writeStore(pages);
    return next;
  }

  const created: CreatorPage = {
    id: `cp_${Date.now().toString(36)}`,
    userId,
    email,
    name: data.name,
    username,
    bio: data.bio ?? "",
    phone: data.phone ?? "",
    pageEmail: data.pageEmail ?? email,
    whatsapp: data.whatsapp ?? "",
    facebook: data.facebook ?? "",
    instagram: data.instagram ?? "",
    youtube: data.youtube ?? "",
    snapchat: data.snapchat ?? "",
    tiktok: data.tiktok ?? "",
    profileImageUrl: data.profileImageUrl ?? "",
    coverImageUrl: data.coverImageUrl ?? "",
    customLinks: data.customLinks ?? [],
    specialty: data.specialty ?? "محامٍ عام",
    city: data.city ?? "",
    status: "active",
    views: 0,
    clicks: 0,
    createdAt: now,
    updatedAt: now,
  };
  pages.push(created);
  await writeStore(pages);
  return created;
}

export async function bumpCreatorPageStat(username: string, field: "views" | "clicks") {
  const pages = await ensureStore();
  const key = username.trim().toLowerCase();
  const idx = pages.findIndex((p) => p.username.toLowerCase() === key);
  if (idx < 0) return null;
  pages[idx] = { ...pages[idx], [field]: (pages[idx][field] ?? 0) + 1, updatedAt: new Date().toISOString() };
  await writeStore(pages);
  return pages[idx];
}
