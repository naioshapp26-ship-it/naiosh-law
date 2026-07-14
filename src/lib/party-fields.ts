import type { FormField } from "@/data/module-configs";

export const PARTY_FIELD_KEYS = [
  "firstParty",
  "firstPartyPhone",
  "secondParty",
  "secondPartyPhone",
] as const;

export type PartyFields = {
  firstParty: string;
  firstPartyPhone: string;
  secondParty: string;
  secondPartyPhone: string;
};

export const PARTY_FORM_FIELDS: FormField[] = [
  { key: "firstParty", label: "طرف أول", type: "text", required: true, placeholder: "اسم الطرف الأول" },
  { key: "firstPartyPhone", label: "رقم جوال الطرف الأول", type: "tel", required: true, placeholder: "05xxxxxxxx" },
  { key: "secondParty", label: "طرف ثاني", type: "text", required: true, placeholder: "اسم الطرف الثاني" },
  { key: "secondPartyPhone", label: "رقم جوال الطرف الثاني", type: "tel", required: true, placeholder: "05xxxxxxxx" },
];

export function emptyPartyFields(): PartyFields {
  return {
    firstParty: "",
    firstPartyPhone: "",
    secondParty: "",
    secondPartyPhone: "",
  };
}

export function extractPartyFields(data: Record<string, unknown>): PartyFields {
  return {
    firstParty: String(data.firstParty ?? "").trim(),
    firstPartyPhone: String(data.firstPartyPhone ?? "").trim(),
    secondParty: String(data.secondParty ?? "").trim(),
    secondPartyPhone: String(data.secondPartyPhone ?? "").trim(),
  };
}

export function stripPartyFields(data: Record<string, unknown>) {
  const next = { ...data };
  for (const key of PARTY_FIELD_KEYS) delete next[key];
  return next;
}

export function hasPartyValues(parties: PartyFields) {
  return Boolean(
    parties.firstParty ||
      parties.firstPartyPhone ||
      parties.secondParty ||
      parties.secondPartyPhone
  );
}

export function partyInitialFrom(data?: Record<string, unknown> | null): PartyFields {
  if (!data) return emptyPartyFields();
  return extractPartyFields(data);
}
