import type { FormField } from "@/data/module-configs";
import { COUNTRY_NAMES, COUNTRY_DIAL_CODES, parseDialCodeOption } from "@/lib/person-contact";

export const PARTY_FIELD_KEYS = [
  "firstParty",
  "firstPartyDialCode",
  "firstPartyPhone",
  "firstPartyCountry",
  "firstPartyCity",
  "secondParty",
  "secondPartyDialCode",
  "secondPartyPhone",
  "secondPartyCountry",
  "secondPartyCity",
] as const;

export type PartyFields = {
  firstParty: string;
  firstPartyDialCode: string;
  firstPartyPhone: string;
  firstPartyCountry: string;
  firstPartyCity: string;
  secondParty: string;
  secondPartyDialCode: string;
  secondPartyPhone: string;
  secondPartyCountry: string;
  secondPartyCity: string;
};

const DIAL_OPTIONS = COUNTRY_DIAL_CODES.map((c) => `${c.dialCode} (${c.country})`);

/** Optional on the main form — parties can also be completed via سجل الأطراف / الملحق */
export const PARTY_FORM_FIELDS: FormField[] = [
  { key: "firstParty", label: "طرف أول", type: "text", required: false, placeholder: "اسم الطرف الأول" },
  {
    key: "firstPartyDialCode",
    label: "مفتاح جوال الطرف الأول",
    type: "select",
    required: false,
    options: DIAL_OPTIONS,
  },
  {
    key: "firstPartyPhone",
    label: "رقم جوال الطرف الأول",
    type: "tel",
    required: false,
    placeholder: "5XXXXXXXX",
  },
  {
    key: "firstPartyCountry",
    label: "دولة الطرف الأول",
    type: "select",
    required: false,
    options: COUNTRY_NAMES,
  },
  {
    key: "firstPartyCity",
    label: "مدينة الطرف الأول",
    type: "text",
    required: false,
    placeholder: "المدينة",
    dependsOn: "firstPartyCountry",
  },
  { key: "secondParty", label: "طرف ثاني", type: "text", required: false, placeholder: "اسم الطرف الثاني" },
  {
    key: "secondPartyDialCode",
    label: "مفتاح جوال الطرف الثاني",
    type: "select",
    required: false,
    options: DIAL_OPTIONS,
  },
  {
    key: "secondPartyPhone",
    label: "رقم جوال الطرف الثاني",
    type: "tel",
    required: false,
    placeholder: "5XXXXXXXX",
  },
  {
    key: "secondPartyCountry",
    label: "دولة الطرف الثاني",
    type: "select",
    required: false,
    options: COUNTRY_NAMES,
  },
  {
    key: "secondPartyCity",
    label: "مدينة الطرف الثاني",
    type: "text",
    required: false,
    placeholder: "المدينة",
    dependsOn: "secondPartyCountry",
  },
];

export function emptyPartyFields(): PartyFields {
  return {
    firstParty: "",
    firstPartyDialCode: "",
    firstPartyPhone: "",
    firstPartyCountry: "",
    firstPartyCity: "",
    secondParty: "",
    secondPartyDialCode: "",
    secondPartyPhone: "",
    secondPartyCountry: "",
    secondPartyCity: "",
  };
}

export function extractPartyFields(data: Record<string, unknown>): PartyFields {
  return {
    firstParty: String(data.firstParty ?? "").trim(),
    firstPartyDialCode: parseDialCodeOption(String(data.firstPartyDialCode ?? "")),
    firstPartyPhone: String(data.firstPartyPhone ?? "").trim(),
    firstPartyCountry: String(data.firstPartyCountry ?? "").trim(),
    firstPartyCity: String(data.firstPartyCity ?? "").trim(),
    secondParty: String(data.secondParty ?? "").trim(),
    secondPartyDialCode: parseDialCodeOption(String(data.secondPartyDialCode ?? "")),
    secondPartyPhone: String(data.secondPartyPhone ?? "").trim(),
    secondPartyCountry: String(data.secondPartyCountry ?? "").trim(),
    secondPartyCity: String(data.secondPartyCity ?? "").trim(),
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
      parties.firstPartyCountry ||
      parties.firstPartyCity ||
      parties.secondParty ||
      parties.secondPartyPhone ||
      parties.secondPartyCountry ||
      parties.secondPartyCity
  );
}

export function partyInitialFrom(data?: Record<string, unknown> | null): PartyFields {
  if (!data) return emptyPartyFields();
  return extractPartyFields(data);
}
