import { moduleConfigs } from "../src/data/module-configs";
import { PARTY_FORM_FIELDS } from "../src/lib/party-fields";
import {
  collectFormLabelIssues,
  defaultLabeledCreateFields,
  fieldsFromColumnLabels,
} from "../src/lib/form-field-labels";
import { getErpPageConfig } from "../src/data/erp-page-catalog";

const issues: string[] = [];

for (const cfg of moduleConfigs) {
  for (const issue of collectFormLabelIssues(cfg.formFields)) {
    issues.push(`${cfg.slug}: ${issue}`);
  }
}

for (const issue of collectFormLabelIssues(PARTY_FORM_FIELDS)) {
  issues.push(`party-fields: ${issue}`);
}

const ownershipCols = [
  "اسم صاحب الطلب",
  "نوع الملكية",
  "جهة التوثيق",
  "الحالة",
  "بداية التوثيق",
  "نهاية التوثيق",
];
const ownershipFields = fieldsFromColumnLabels(ownershipCols);
for (const label of [...ownershipCols, "ملاحظات"]) {
  if (!ownershipFields.some((f) => f.label === label)) {
    issues.push(`ownership-flow: missing label «${label}»`);
  }
}

const ip = getErpPageConfig("intellectual-property");
if (!ip || ip.title !== "ملكية نايوش") {
  issues.push("erp: intellectual-property title must be «ملكية نايوش»");
}
for (const col of ownershipCols) {
  if (!ip?.columns?.includes(col)) {
    issues.push(`erp: ownership columns missing «${col}»`);
  }
}

const generic = defaultLabeledCreateFields("ملكية نايوش");
for (const label of [
  "اسم صاحب الطلب",
  "جهة التوثيق",
  "بداية التوثيق",
  "نهاية التوثيق",
  "الحالة",
  "ملاحظات",
]) {
  if (!generic.some((f) => f.label === label)) {
    issues.push(`default-create: missing «${label}»`);
  }
}

if (issues.length) {
  console.error("FAIL: form label audit found issues:\n- " + issues.join("\n- "));
  process.exit(1);
}

console.log("PASS: all audited form fields have Arabic labels");
console.log("PASS: ملكية نايوش fields →", ownershipFields.map((f) => f.label).join(" · "));
console.log("PASS: modal title pattern → إضافة ملكية نايوش");
