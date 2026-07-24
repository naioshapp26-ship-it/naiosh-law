export type LawBranchType = "مكاتب خاصة" | "حاضنة أعمال" | "مسرعة أعمال";

export type LawBranch = {
  id: string;
  nameAr: string;
  nameEn: string;
  type: LawBranchType;
  hours: string;
  flagSrc: string;
  flagAlt: string;
  searchText: string;
};

export const LAW_BRANCHES_INTRO =
  "شبكة الفروع العالمية مصممة لتقديم تجربة موحدة واحترافية عبر مواقعنا المختلفة.";

export const LAW_BRANCH_TYPES: Array<LawBranchType | "all"> = [
  "all",
  "مكاتب خاصة",
  "حاضنة أعمال",
  "مسرعة أعمال",
];

function svgFlag(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function branch(
  id: string,
  nameAr: string,
  nameEn: string,
  type: LawBranchType,
  hours: string,
  flagSvg: string
): LawBranch {
  return {
    id,
    nameAr,
    nameEn,
    type,
    hours,
    flagSrc: svgFlag(flagSvg),
    flagAlt: `علم ${nameAr}`,
    searchText: `${nameAr} ${nameEn}`,
  };
}

const HOURS_A = "من 9:00 صباحًا إلى 7:00 مساءً";
const HOURS_B = "من 9:00 صباحًا إلى 6:00 مساءً";
const HOURS_C = "من 8:30 صباحًا إلى 5:30 مساءً";
const HOURS_D = "من 10:00 صباحًا إلى 7:00 مساءً";
const HOURS_E = "من 8:00 صباحًا إلى 5:00 مساءً";

/**
 * فروع نايوش — مرتبة حسب القائمة الرسمية.
 * الموجود سابقًا محفوظ بنفس البيانات؛ التكرارات (مثل المغرب مرتين) أُزيلت.
 */
export const LAW_BRANCHES: LawBranch[] = [
  branch(
    "saudi-arabia",
    "السعودية",
    "Saudi Arabia",
    "مكاتب خاصة",
    HOURS_A,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#006c35"/><rect x="24" y="72" width="72" height="8" rx="4" fill="#ffffff"/></svg>`
  ),
  branch(
    "uae",
    "الإمارات",
    "UAE",
    "مسرعة أعمال",
    HOURS_D,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="30" height="120" fill="#ff0000"/><rect x="30" width="90" height="40" fill="#007a3d"/><rect x="30" y="40" width="90" height="40" fill="#ffffff"/><rect x="30" y="80" width="90" height="40" fill="#000000"/></svg>`
  ),
  branch(
    "qatar",
    "قطر",
    "Qatar",
    "حاضنة أعمال",
    HOURS_B,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#8a1538"/><polygon points="0,0 40,10 0,20 40,30 0,40 40,50 0,60 40,70 0,80 40,90 0,100 40,110 0,120" fill="#ffffff"/></svg>`
  ),
  branch(
    "kuwait",
    "الكويت",
    "Kuwait",
    "مكاتب خاصة",
    HOURS_C,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="40" fill="#007a3d"/><rect y="40" width="120" height="40" fill="#ffffff"/><rect y="80" width="120" height="40" fill="#ce1126"/><polygon points="0,0 48,40 48,80 0,120" fill="#000000"/></svg>`
  ),
  branch(
    "oman",
    "عمان",
    "Oman",
    "مسرعة أعمال",
    HOURS_A,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="36" height="120" fill="#c8102e"/><rect x="36" width="84" height="40" fill="#ffffff"/><rect x="36" y="40" width="84" height="40" fill="#c8102e"/><rect x="36" y="80" width="84" height="40" fill="#00843d"/></svg>`
  ),
  branch(
    "bahrain",
    "البحرين",
    "Bahrain",
    "حاضنة أعمال",
    HOURS_B,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#ce1126"/><polygon points="0,0 40,10 0,20 40,30 0,40 40,50 0,60 40,70 0,80 40,90 0,100 40,110 0,120" fill="#ffffff"/></svg>`
  ),
  branch(
    "jordan",
    "الأردن",
    "Jordan",
    "مكاتب خاصة",
    HOURS_E,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="40" y="0" fill="#000000"/><rect width="120" height="40" y="40" fill="#ffffff"/><rect width="120" height="40" y="80" fill="#007839"/><polygon points="0,0 54,60 0,120" fill="#ce1126"/></svg>`
  ),
  branch(
    "syria",
    "سوريا",
    "Syria",
    "حاضنة أعمال",
    HOURS_C,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="40" fill="#ce1126"/><rect y="40" width="120" height="40" fill="#ffffff"/><rect y="80" width="120" height="40" fill="#000000"/><circle cx="48" cy="60" r="6" fill="#007a3d"/><circle cx="72" cy="60" r="6" fill="#007a3d"/></svg>`
  ),
  branch(
    "lebanon",
    "لبنان",
    "Lebanon",
    "مكاتب خاصة",
    HOURS_B,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="40" fill="#ed1c24"/><rect y="40" width="120" height="40" fill="#ffffff"/><rect y="80" width="120" height="40" fill="#ed1c24"/><polygon points="60,48 72,72 48,72" fill="#00a651"/></svg>`
  ),
  branch(
    "iraq",
    "العراق",
    "Iraq",
    "حاضنة أعمال",
    HOURS_C,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="40" y="0" fill="#ce1126"/><rect width="120" height="40" y="40" fill="#ffffff"/><rect width="120" height="40" y="80" fill="#000000"/><circle cx="42" cy="60" r="5" fill="#00742f"/><circle cx="60" cy="60" r="5" fill="#00742f"/><circle cx="78" cy="60" r="5" fill="#00742f"/></svg>`
  ),
  branch(
    "turkey",
    "تركيا",
    "Turkey",
    "حاضنة أعمال",
    HOURS_B,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#e30a17"/><circle cx="52" cy="60" r="22" fill="#ffffff"/><circle cx="58" cy="60" r="18" fill="#e30a17"/></svg>`
  ),
  branch(
    "egypt",
    "مصر",
    "Egypt",
    "مكاتب خاصة",
    HOURS_B,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="40" y="0" fill="#ce1126"/><rect width="120" height="40" y="40" fill="#ffffff"/><rect width="120" height="40" y="80" fill="#000000"/></svg>`
  ),
  branch(
    "libya",
    "ليبيا",
    "Libya",
    "مسرعة أعمال",
    HOURS_A,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="30" fill="#e70013"/><rect y="30" width="120" height="60" fill="#000000"/><rect y="90" width="120" height="30" fill="#239e46"/><circle cx="60" cy="60" r="10" fill="#ffffff"/></svg>`
  ),
  branch(
    "tunisia",
    "تونس",
    "Tunisia",
    "مكاتب خاصة",
    HOURS_C,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#e70013"/><circle cx="60" cy="60" r="24" fill="#ffffff"/><circle cx="66" cy="60" r="18" fill="#e70013"/></svg>`
  ),
  branch(
    "algeria",
    "الجزائر",
    "Algeria",
    "حاضنة أعمال",
    HOURS_B,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="60" height="120" fill="#006233"/><rect x="60" width="60" height="120" fill="#ffffff"/><circle cx="70" cy="60" r="16" fill="#d21034"/><circle cx="76" cy="60" r="12" fill="#ffffff"/></svg>`
  ),
  branch(
    "morocco",
    "المغرب",
    "Morocco",
    "مكاتب خاصة",
    HOURS_A,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#c1272d"/><polygon points="60,34 66,54 88,54 70,66 76,88 60,74 44,88 50,66 32,54 54,54" fill="none" stroke="#006233" stroke-width="4"/></svg>`
  ),
  branch(
    "sudan",
    "السودان",
    "Sudan",
    "مسرعة أعمال",
    HOURS_C,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="40" fill="#d21034"/><rect y="40" width="120" height="40" fill="#ffffff"/><rect y="80" width="120" height="40" fill="#000000"/><polygon points="0,0 54,60 0,120" fill="#007229"/></svg>`
  ),
  branch(
    "djibouti",
    "جيبوتي",
    "Djibouti",
    "حاضنة أعمال",
    HOURS_D,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="60" fill="#6ab2e7"/><rect y="60" width="120" height="60" fill="#12ad2b"/><polygon points="0,0 70,60 0,120" fill="#ffffff"/><polygon points="24,52 28,60 36,60 30,66 32,74 24,68 16,74 18,66 12,60 20,60" fill="#d7141a"/></svg>`
  ),
  branch(
    "united-kingdom",
    "المملكة المتحدة",
    "United Kingdom",
    "مكاتب خاصة",
    HOURS_B,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#012169"/><path d="M0,0 L120,120 M120,0 L0,120" stroke="#ffffff" stroke-width="20"/><path d="M0,0 L120,120 M120,0 L0,120" stroke="#c8102e" stroke-width="10"/><path d="M60,0 V120 M0,60 H120" stroke="#ffffff" stroke-width="28"/><path d="M60,0 V120 M0,60 H120" stroke="#c8102e" stroke-width="16"/></svg>`
  ),
  branch(
    "germany",
    "ألمانيا",
    "Germany",
    "مسرعة أعمال",
    HOURS_A,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="40" fill="#000000"/><rect y="40" width="120" height="40" fill="#dd0000"/><rect y="80" width="120" height="40" fill="#ffce00"/></svg>`
  ),
  branch(
    "united-states",
    "الولايات المتحدة",
    "United States",
    "حاضنة أعمال",
    HOURS_D,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#b22234"/><rect y="9" width="120" height="9" fill="#ffffff"/><rect y="27" width="120" height="9" fill="#ffffff"/><rect y="45" width="120" height="9" fill="#ffffff"/><rect y="63" width="120" height="9" fill="#ffffff"/><rect y="81" width="120" height="9" fill="#ffffff"/><rect y="99" width="120" height="9" fill="#ffffff"/><rect width="54" height="63" fill="#3c3b6e"/></svg>`
  ),
  branch(
    "canada",
    "كندا",
    "Canada",
    "مكاتب خاصة",
    HOURS_C,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="30" height="120" fill="#ff0000"/><rect x="90" width="30" height="120" fill="#ff0000"/><rect x="30" width="60" height="120" fill="#ffffff"/><polygon points="60,36 66,54 86,54 70,66 76,86 60,74 44,86 50,66 34,54 54,54" fill="#ff0000"/></svg>`
  ),
  branch(
    "singapore",
    "سنغافورة",
    "Singapore",
    "مسرعة أعمال",
    HOURS_A,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="60" fill="#ef3340"/><rect y="60" width="120" height="60" fill="#ffffff"/><circle cx="34" cy="30" r="16" fill="#ffffff"/><circle cx="40" cy="30" r="13" fill="#ef3340"/></svg>`
  ),
  branch(
    "malaysia",
    "ماليزيا",
    "Malaysia",
    "حاضنة أعمال",
    HOURS_B,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#cc0001"/><rect y="8" width="120" height="8" fill="#ffffff"/><rect y="24" width="120" height="8" fill="#ffffff"/><rect y="40" width="120" height="8" fill="#ffffff"/><rect y="56" width="120" height="8" fill="#ffffff"/><rect y="72" width="120" height="8" fill="#ffffff"/><rect y="88" width="120" height="8" fill="#ffffff"/><rect y="104" width="120" height="8" fill="#ffffff"/><rect width="60" height="60" fill="#010066"/><circle cx="30" cy="30" r="14" fill="#ffcc00"/></svg>`
  ),
  branch(
    "australia",
    "أستراليا",
    "Australia",
    "مكاتب خاصة",
    HOURS_E,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#00008b"/><rect width="54" height="40" fill="#012169"/><path d="M0,0 L54,40 M54,0 L0,40" stroke="#ffffff" stroke-width="6"/><path d="M27,0 V40 M0,20 H54" stroke="#ffffff" stroke-width="8"/><circle cx="84" cy="78" r="10" fill="#ffffff"/></svg>`
  ),
  branch(
    "south-africa",
    "جنوب أفريقيا",
    "South Africa",
    "مسرعة أعمال",
    HOURS_C,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="40" fill="#e03c31"/><rect y="40" width="120" height="40" fill="#ffffff"/><rect y="80" width="120" height="40" fill="#001489"/><polygon points="0,20 70,60 0,100" fill="#007749"/><polygon points="0,0 48,60 0,120" fill="#000000"/><polygon points="8,20 48,60 8,100" fill="#ffb612"/></svg>`
  ),
  branch(
    "india",
    "الهند",
    "India",
    "حاضنة أعمال",
    HOURS_B,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="40" fill="#ff9933"/><rect y="40" width="120" height="40" fill="#ffffff"/><rect y="80" width="120" height="40" fill="#138808"/><circle cx="60" cy="60" r="12" fill="none" stroke="#000080" stroke-width="3"/></svg>`
  ),
  branch(
    "netherlands",
    "هولندا",
    "Netherlands",
    "مكاتب خاصة",
    HOURS_A,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="40" fill="#ae1c28"/><rect y="40" width="120" height="40" fill="#ffffff"/><rect y="80" width="120" height="40" fill="#21468b"/></svg>`
  ),
  branch(
    "kenya",
    "كينيا",
    "Kenya",
    "مسرعة أعمال",
    HOURS_D,
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="30" fill="#000000"/><rect y="30" width="120" height="10" fill="#ffffff"/><rect y="40" width="120" height="40" fill="#bb0000"/><rect y="80" width="120" height="10" fill="#ffffff"/><rect y="90" width="120" height="30" fill="#006600"/><ellipse cx="60" cy="60" rx="14" ry="22" fill="#ffffff"/></svg>`
  ),
];
