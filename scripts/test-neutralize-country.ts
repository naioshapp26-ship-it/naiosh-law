import {
  hasCountrySpecificWording,
  neutralizeCountryWording,
} from "../src/lib/neutralize-country-wording";

const cases: Array<[string, string]> = [
  ["دليل التحكيم التجاري المصري", "دليل التحكيم التجاري"],
  ["قانون العمل السعودي", "قانون العمل"],
  ["الهيئة السعودية للملكية الفكرية", "هيئة الملكية الفكرية"],
  ["تحليل اختصاص المحاكم البحرية المصرية.", "تحليل اختصاص المحاكم البحرية."],
  ["نموذج عقد بيع تجاري", "نموذج عقد بيع تجاري"],
];

for (const [input, expected] of cases) {
  const got = neutralizeCountryWording(input);
  if (got !== expected) {
    console.error("FAIL", { input, expected, got });
    process.exit(1);
  }
  if (input !== expected && !hasCountrySpecificWording(input)) {
    console.error("FAIL hasCountrySpecificWording", input);
    process.exit(1);
  }
}

console.log("PASS neutralize-country-wording");
