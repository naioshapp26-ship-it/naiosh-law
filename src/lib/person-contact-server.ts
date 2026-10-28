/**
 * Server-only helpers: resolve/update central Client contact + audit log.
 * Never fabricate missing values — leave null and let UI show «غير مسجل».
 */

import { prisma } from "@/lib/prisma";
import {
  contactFieldsFromBody,
  canViewPersonContact,
  canEditPersonContact,
  toDisplayContact,
  validateMobileNumber,
  validateCountryCity,
  dialCodeForCountry,
  type PersonContactSnapshot,
  type DisplayContact,
  PERSON_CONTACT_FIELD_KEYS,
} from "@/lib/person-contact";

export type ClientContactRow = {
  id: string;
  name: string;
  phone: string | null;
  phoneDialCode: string | null;
  phoneSecondary: string | null;
  phoneSecondaryDialCode: string | null;
  primaryPhoneSlot: number;
  country: string | null;
  city: string | null;
  countrySecondary: string | null;
  citySecondary: string | null;
  primaryAddressSlot: number;
};

function snapshotFromClient(c: ClientContactRow): PersonContactSnapshot {
  return {
    phoneDialCode: c.phoneDialCode,
    phone: c.phone,
    phoneSecondary: c.phoneSecondary,
    phoneSecondaryDialCode: c.phoneSecondaryDialCode,
    primaryPhoneSlot: c.primaryPhoneSlot ?? 0,
    country: c.country,
    city: c.city,
    countrySecondary: c.countrySecondary,
    citySecondary: c.citySecondary,
    primaryAddressSlot: c.primaryAddressSlot ?? 0,
  };
}

export function clientToDisplay(
  c: ClientContactRow | null | undefined,
  opts: { role: string | null | undefined; isOwnRecord?: boolean }
): DisplayContact {
  const canView = canViewPersonContact(opts.role, { isOwnRecord: opts.isOwnRecord });
  return toDisplayContact(c ? snapshotFromClient(c) : null, { mask: !canView });
}

export async function findClientContactById(clientId: string) {
  return prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      name: true,
      phone: true,
      phoneDialCode: true,
      phoneSecondary: true,
      phoneSecondaryDialCode: true,
      primaryPhoneSlot: true,
      country: true,
      city: true,
      countrySecondary: true,
      citySecondary: true,
      primaryAddressSlot: true,
    },
  });
}

export async function findClientContactByName(name: string) {
  const n = name.trim();
  if (!n) return null;
  return prisma.client.findFirst({
    where: { name: n },
    select: {
      id: true,
      name: true,
      phone: true,
      phoneDialCode: true,
      phoneSecondary: true,
      phoneSecondaryDialCode: true,
      primaryPhoneSlot: true,
      country: true,
      city: true,
      countrySecondary: true,
      citySecondary: true,
      primaryAddressSlot: true,
    },
  });
}

async function logContactChanges(opts: {
  clientId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  changedById?: string | null;
  changedByName?: string | null;
  sourceModule?: string | null;
  sourceId?: string | null;
}) {
  const entries: {
    clientId: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
    changedById: string | null;
    changedByName: string | null;
    sourceModule: string | null;
    sourceId: string | null;
  }[] = [];

  for (const key of PERSON_CONTACT_FIELD_KEYS) {
    const oldV = opts.before[key];
    const newV = opts.after[key];
    if (newV === undefined) continue;
    const oldS = oldV == null || oldV === "" ? null : String(oldV);
    const newS = newV == null || newV === "" ? null : String(newV);
    if (oldS === newS) continue;
    entries.push({
      clientId: opts.clientId,
      field: key,
      oldValue: oldS,
      newValue: newS,
      changedById: opts.changedById ?? null,
      changedByName: opts.changedByName ?? null,
      sourceModule: opts.sourceModule ?? null,
      sourceId: opts.sourceId ?? null,
    });
  }

  if (entries.length === 0) return;
  await prisma.personContactChange.createMany({ data: entries });
}

/**
 * Apply contact fields from a request body onto a Client.
 * Validates phone/country/city when provided. Does not invent values.
 */
export async function applyContactToClient(opts: {
  clientId: string;
  body: Record<string, unknown>;
  role: string;
  changedById?: string | null;
  changedByName?: string | null;
  sourceModule?: string | null;
  sourceId?: string | null;
  requireComplete?: boolean;
}): Promise<{ ok: true; client: ClientContactRow } | { ok: false; error: string; status: number }> {
  if (!canEditPersonContact(opts.role)) {
    return { ok: false, error: "ليست لديك صلاحية تعديل بيانات الاتصال", status: 403 };
  }

  const existing = await findClientContactById(opts.clientId);
  if (!existing) return { ok: false, error: "العميل غير موجود", status: 404 };

  const patch = contactFieldsFromBody(opts.body);
  if (Object.keys(patch).length === 0) {
    return { ok: true, client: existing };
  }

  const nextPhone = patch.phone !== undefined ? patch.phone : existing.phone;
  const nextDial =
    patch.phoneDialCode !== undefined
      ? patch.phoneDialCode
      : existing.phoneDialCode ?? dialCodeForCountry(patch.country ?? existing.country);
  const nextCountry = patch.country !== undefined ? patch.country : existing.country;
  const nextCity = patch.city !== undefined ? patch.city : existing.city;

  if (patch.phone !== undefined || patch.phoneDialCode !== undefined) {
    if (nextPhone) {
      const v = validateMobileNumber(nextDial, nextPhone);
      if (!v.ok) return { ok: false, error: v.error ?? "رقم الجوال غير صالح", status: 400 };
    } else if (opts.requireComplete) {
      return { ok: false, error: "رقم الجوال مطلوب", status: 400 };
    }
  }

  if (patch.country !== undefined || patch.city !== undefined) {
    const v = validateCountryCity(nextCountry, nextCity, {
      allowCustomCity: true,
      required: Boolean(opts.requireComplete),
    });
    if (!v.ok) return { ok: false, error: v.error ?? "الدولة/المدينة غير صالحة", status: 400 };
  }

  // Auto-fill dial from country when dial omitted but country set
  if (patch.country && patch.phoneDialCode === undefined && !existing.phoneDialCode) {
    patch.phoneDialCode = dialCodeForCountry(patch.country);
  }

  const before: Record<string, unknown> = { ...snapshotFromClient(existing) };
  const updated = await prisma.client.update({
    where: { id: opts.clientId },
    data: {
      phone: patch.phone !== undefined ? patch.phone : undefined,
      phoneDialCode: patch.phoneDialCode !== undefined ? patch.phoneDialCode : undefined,
      phoneSecondary: patch.phoneSecondary !== undefined ? patch.phoneSecondary : undefined,
      phoneSecondaryDialCode:
        patch.phoneSecondaryDialCode !== undefined ? patch.phoneSecondaryDialCode : undefined,
      primaryPhoneSlot: patch.primaryPhoneSlot !== undefined ? patch.primaryPhoneSlot : undefined,
      country: patch.country !== undefined ? patch.country : undefined,
      city: patch.city !== undefined ? patch.city : undefined,
      countrySecondary: patch.countrySecondary !== undefined ? patch.countrySecondary : undefined,
      citySecondary: patch.citySecondary !== undefined ? patch.citySecondary : undefined,
      primaryAddressSlot:
        patch.primaryAddressSlot !== undefined ? patch.primaryAddressSlot : undefined,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      phoneDialCode: true,
      phoneSecondary: true,
      phoneSecondaryDialCode: true,
      primaryPhoneSlot: true,
      country: true,
      city: true,
      countrySecondary: true,
      citySecondary: true,
      primaryAddressSlot: true,
    },
  });

  await logContactChanges({
    clientId: opts.clientId,
    before,
    after: { ...before, ...patch },
    changedById: opts.changedById,
    changedByName: opts.changedByName,
    sourceModule: opts.sourceModule,
    sourceId: opts.sourceId,
  });

  return { ok: true, client: updated };
}

/**
 * Ensure a Client exists for a person name and optionally apply contact fields.
 * Used when forms submit client name + contact without an explicit clientId.
 */
export async function ensureClientWithContact(opts: {
  name: string;
  clientId?: string | null;
  body: Record<string, unknown>;
  role: string;
  changedById?: string | null;
  changedByName?: string | null;
  sourceModule?: string | null;
  sourceId?: string | null;
  requireComplete?: boolean;
}): Promise<
  | { ok: true; clientId: string; clientName: string; contact: ClientContactRow }
  | { ok: false; error: string; status: number }
> {
  const name = opts.name.trim();
  if (!name && !opts.clientId) {
    return { ok: false, error: "اسم الموكل مطلوب", status: 400 };
  }

  let clientId = opts.clientId ?? null;
  if (clientId) {
    const linked = await findClientContactById(clientId);
    if (!linked) return { ok: false, error: "العميل غير موجود", status: 404 };
  } else {
    const byName = await findClientContactByName(name);
    if (byName) {
      clientId = byName.id;
    } else {
      const created = await prisma.client.create({
        data: {
          name,
          type: "فرد",
          status: "نشط",
        },
        select: {
          id: true,
          name: true,
          phone: true,
          phoneDialCode: true,
          phoneSecondary: true,
          phoneSecondaryDialCode: true,
          primaryPhoneSlot: true,
          country: true,
          city: true,
          countrySecondary: true,
          citySecondary: true,
          primaryAddressSlot: true,
        },
      });
      clientId = created.id;
    }
  }

  const applied = await applyContactToClient({
    clientId,
    body: opts.body,
    role: opts.role,
    changedById: opts.changedById,
    changedByName: opts.changedByName,
    sourceModule: opts.sourceModule,
    sourceId: opts.sourceId,
    requireComplete: opts.requireComplete,
  });
  if (!applied.ok) return applied;

  return {
    ok: true,
    clientId,
    clientName: applied.client.name || name,
    contact: applied.client,
  };
}

export function mapRowWithClientContact<T extends Record<string, unknown>>(
  row: T,
  client: ClientContactRow | null | undefined,
  role: string | null | undefined,
  opts?: { isOwnRecord?: boolean }
): T & {
  phone: string;
  country: string;
  city: string;
  phoneDialCode: string;
  clientId: string | null;
  contactIncomplete: boolean;
} {
  const display = clientToDisplay(client, {
    role,
    isOwnRecord: opts?.isOwnRecord,
  });
  const canView = canViewPersonContact(role, { isOwnRecord: opts?.isOwnRecord });
  return {
    ...row,
    clientId: client?.id ?? (typeof row.clientId === "string" ? row.clientId : null),
    phone: display.phone,
    country: display.country,
    city: display.city,
    phoneDialCode: canView ? display.phoneDialCode ?? "" : "",
    contactIncomplete: display.incomplete,
  };
}
