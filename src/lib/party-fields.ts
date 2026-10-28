import type { FormField } from "@/data/module-configs";
import { COUNTRY_NAMES, COUNTRY_DIAL_CODES, parseDialCodeOption } from "@/lib/person-contact";

export const PARTY_FIELD_KEYS = [
  "firstParty",
  "firstPartyDialCode",
  "firstPartyPhone",
  "firstPartyCountry",
  "firstPartyCity",
  "firstPartyPhoneSecondaryDialCode",
  "firstPartyPhoneSecondary",
  "secondParty",
  "secondPartyDialCode",
  "secondPartyPhone",
  "secondPartyCountry",
  "secondPartyCity",
  "secondPartyPhoneSecondaryDialCode",
  "secondPartyPhoneSecondary",
] as const;

export type PartyFields = {
  firstParty: string;
  firstPartyDialCode: string;
  firstPartyPhone: string;
  firstPartyCountry: string;
  firstPartyCity: string;
  firstPartyPhoneSecondaryDialCode: string;
  firstPartyPhoneSecondary: string;
  secondParty: string;
  secondPartyDialCode: string;
  secondPartyPhone: string;
  secondPartyCountry: string;
  secondPartyCity: string;
  secondPartyPhoneSecondaryDialCode: string;
  secondPartyPhoneSecondary: string;
};

const DIAL_OPTIONS = COUNTRY_DIAL_CODES.map((c) => `${c.dialCode} (${c.country})`);

function partyContactBlock(prefix: "first" | "second", label: string): FormField[] {
  const p = prefix === "first" ? "firstParty" : "secondParty";
  return [
    { key: p, label, type: "text", required: false, placeholder: `اسم ${label}` },
    {
      key: `${p}DialCode`,
      label: `مفتاح جوال ${label}`,
      type: "select",
      required: false,
      options: DIAL_OPTIONS,
    },
    {
      key: `${p}Phone`,
      label: `رقم جوال ${label}`,
      type: "tel",
      required: false,
      placeholder: "5XXXXXXXX",
    },
    {
      key: `${p}Country`,
      label: `دولة ${label}`,
      type: "select",
      required: false,
      options: COUNTRY_NAMES,
    },
    {
      key: `${p}City`,
      label: `مدينة ${label}`,
      type: "text",
      required: false,
      placeholder: "المدينة",
      dependsOn: `${p}Country`,
    },
    {
      key: `${p}PhoneSecondaryDialCode`,
      label: `مفتاح الجوال الإضافي — ${label}`,
      type: "select",
      required: false,
      options: DIAL_OPTIONS,
    },
    {
      key: `${p}PhoneSecondary`,
      label: `رقم جوال إضافي — ${label}`,
      type: "tel",
      required: false,
      placeholder: "اختياري — 5XXXXXXXX",
    },
  ];
}

/** Optional on the main form — parties can also be completed via سجل الأطراف / الملحق */
export const PARTY_FORM_FIELDS: FormField[] = [
  ...partyContactBlock("first", "الطرف الأول"),
  ...partyContactBlock("second", "الطرف الثاني"),
];

export function emptyPartyFields(): PartyFields {
  return {
    firstParty: "",
    firstPartyDialCode: "",
    firstPartyPhone: "",
    firstPartyCountry: "",
    firstPartyCity: "",
    firstPartyPhoneSecondaryDialCode: "",
    firstPartyPhoneSecondary: "",
    secondParty: "",
    secondPartyDialCode: "",
    secondPartyPhone: "",
    secondPartyCountry: "",
    secondPartyCity: "",
    secondPartyPhoneSecondaryDialCode: "",
    secondPartyPhoneSecondary: "",
  };
}

export function extractPartyFields(data: Record<string, unknown>): PartyFields {
  return {
    firstParty: String(data.firstParty ?? "").trim(),
    firstPartyDialCode: parseDialCodeOption(String(data.firstPartyDialCode ?? "")),
    firstPartyPhone: String(data.firstPartyPhone ?? "").trim(),
    firstPartyCountry: String(data.firstPartyCountry ?? "").trim(),
    firstPartyCity: String(data.firstPartyCity ?? "").trim(),
    firstPartyPhoneSecondaryDialCode: parseDialCodeOption(
      String(data.firstPartyPhoneSecondaryDialCode ?? "")
    ),
    firstPartyPhoneSecondary: String(data.firstPartyPhoneSecondary ?? "").trim(),
    secondParty: String(data.secondParty ?? "").trim(),
    secondPartyDialCode: parseDialCodeOption(String(data.secondPartyDialCode ?? "")),
    secondPartyPhone: String(data.secondPartyPhone ?? "").trim(),
    secondPartyCountry: String(data.secondPartyCountry ?? "").trim(),
    secondPartyCity: String(data.secondPartyCity ?? "").trim(),
    secondPartyPhoneSecondaryDialCode: parseDialCodeOption(
      String(data.secondPartyPhoneSecondaryDialCode ?? "")
    ),
    secondPartyPhoneSecondary: String(data.secondPartyPhoneSecondary ?? "").trim(),
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
      parties.firstPartyPhoneSecondary ||
      parties.secondParty ||
      parties.secondPartyPhone ||
      parties.secondPartyCountry ||
      parties.secondPartyCity ||
      parties.secondPartyPhoneSecondary
  );
}

export function partyInitialFrom(data?: Record<string, unknown> | null): PartyFields {
  if (!data) return emptyPartyFields();
  return extractPartyFields(data);
}
