import { PARTY_FORM_FIELDS } from "../src/lib/party-fields";
import {
  assertFieldLabel,
  fieldsFromColumnLabels,
  sanitizeFormFields,
} from "../src/lib/form-field-labels";

/**
 * End-to-end field composition for «إضافة ملكية نايوش» —
 * mirrors Modal effectiveFields (columns + parties + notes).
 */
function buildOwnershipModalFields() {
  const columns = [
    "اسم صاحب الطلب",
    "نوع الملكية",
    "جهة التوثيق",
    "الحالة",
    "بداية التوثيق",
    "نهاية التوثيق",
  ];
  const base = fieldsFromColumnLabels(columns);
  const insertAt = Math.max(
    0,
    base.findIndex((f) => f.type === "textarea" || f.key === "notes")
  );
  const at = insertAt === -1 ? base.length : insertAt;
  return sanitizeFormFields([...base.slice(0, at), ...PARTY_FORM_FIELDS, ...base.slice(at)]);
}

const fields = buildOwnershipModalFields();
const requiredLabels = [
  "اسم صاحب الطلب",
  "نوع الملكية",
  "جهة التوثيق",
  "الحالة",
  "بداية التوثيق",
  "نهاية التوثيق",
  "طرف أول",
  "رقم جوال الطرف الأول",
  "طرف ثاني",
  "رقم جوال الطرف الثاني",
  "ملاحظات",
];

const missing = requiredLabels.filter((l) => !fields.some((f) => assertFieldLabel(f) === l));
if (missing.length) {
  console.error("FAIL flow: missing labels", missing);
  process.exit(1);
}

for (const f of fields) {
  if (f.type === "select" && (!f.options || f.options.length === 0)) {
    console.error(`FAIL flow: select «${f.label}» has no options`);
    process.exit(1);
  }
}

console.log("PASS flow: إضافة ملكية نايوش");
console.log(
  fields
    .map((f) => `${f.label}${f.required ? " *" : ""} [${f.type}]`)
    .join("\n")
);
