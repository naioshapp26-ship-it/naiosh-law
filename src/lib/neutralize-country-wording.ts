/**
 * Naiosh product content must stay jurisdiction-neutral —
 * no country adjectives or named national systems in library/catalog copy.
 */

const PHRASE_FIXES: Array<[RegExp, string]> = [
  [/الهيئة السعودية للملكية الفكرية/g, "هيئة الملكية الفكرية"],
  [/قانون العمل السعودي/g, "قانون العمل"],
  [/دليل التحكيم التجاري المصري/g, "دليل التحكيم التجاري"],
  [/التشريعات المصرية/g, "التشريعات المعمول بها"],
  [/المحاكم البحرية المصرية/g, "المحاكم البحرية"],
  [/أنظمة التحكيم في مصر/g, "أنظمة التحكيم المحلية"],
];

const COUNTRY_ADJECTIVE =
  /\s*(?:المصري(?:ة)?|السعودي(?:ة)?|الإماراتي(?:ة)?|الكويتي(?:ة)?|القطري(?:ة)?|البحريني(?:ة)?|العماني(?:ة)?|الأردني(?:ة)?|اللبناني(?:ة)?|السوري(?:ة)?|العراقي(?:ة)?|المغربي(?:ة)?|التونسي(?:ة)?|الجزائري(?:ة)?|اليمني(?:ة)?|السوداني(?:ة)?|الفلسطيني(?:ة)?)/g;

const COUNTRY_NAME_IN_PHRASE =
  /(?:في|بـ|لـ)?\s*(?:مصر|السعودية|المملكة العربية السعودية|الإمارات|الكويت|قطر|البحرين|عُمان|عمان|الأردن|لبنان|سوريا|العراق|المغرب|تونس|الجزائر|اليمن|السودان|فلسطين)(?=\s|$|،|,|\.|،)/g;

export function neutralizeCountryWording(text: string): string {
  let out = String(text ?? "");
  for (const [pattern, replacement] of PHRASE_FIXES) {
    out = out.replace(pattern, replacement);
  }
  return out
    .replace(COUNTRY_ADJECTIVE, "")
    .replace(COUNTRY_NAME_IN_PHRASE, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([،,:./])/g, "$1")
    .replace(/([—-])\s*$/g, "")
    .trim();
}

export function hasCountrySpecificWording(text: string): boolean {
  const t = String(text ?? "").trim();
  return neutralizeCountryWording(t) !== t;
}
