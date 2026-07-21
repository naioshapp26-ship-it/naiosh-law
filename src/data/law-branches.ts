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

export const LAW_BRANCHES: LawBranch[] = [
  {
    "id": "egypt",
    "nameAr": "مصر",
    "nameEn": "Egypt",
    "type": "مكاتب خاصة",
    "hours": "من 9:00 صباحًا إلى 6:00 مساءً",
    "flagSrc": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='40' y='0' fill='%23ce1126'/%3E%3Crect width='120' height='40' y='40' fill='%23ffffff'/%3E%3Crect width='120' height='40' y='80' fill='%23000000'/%3E%3C/svg%3E",
    "flagAlt": "علم مصر",
    "searchText": "مصر Egypt"
  },
  {
    "id": "iraq",
    "nameAr": "العراق",
    "nameEn": "Iraq",
    "type": "حاضنة أعمال",
    "hours": "من 8:30 صباحًا إلى 5:30 مساءً",
    "flagSrc": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='40' y='0' fill='%23ce1126'/%3E%3Crect width='120' height='40' y='40' fill='%23ffffff'/%3E%3Crect width='120' height='40' y='80' fill='%23000000'/%3E%3Ccircle cx='42' cy='60' r='5' fill='%2300742f'/%3E%3Ccircle cx='60' cy='60' r='5' fill='%2300742f'/%3E%3Ccircle cx='78' cy='60' r='5' fill='%2300742f'/%3E%3C/svg%3E",
    "flagAlt": "علم العراق",
    "searchText": "العراق Iraq"
  },
  {
    "id": "saudi-arabia",
    "nameAr": "السعودية",
    "nameEn": "Saudi Arabia",
    "type": "مكاتب خاصة",
    "hours": "من 9:00 صباحًا إلى 7:00 مساءً",
    "flagSrc": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='120' fill='%23006c35'/%3E%3Crect x='24' y='72' width='72' height='8' rx='4' fill='%23ffffff'/%3E%3C/svg%3E",
    "flagAlt": "علم السعودية",
    "searchText": "السعودية Saudi Arabia"
  },
  {
    "id": "uae",
    "nameAr": "الإمارات",
    "nameEn": "UAE",
    "type": "مسرعة أعمال",
    "hours": "من 10:00 صباحًا إلى 7:00 مساءً",
    "flagSrc": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='30' height='120' fill='%23ff0000'/%3E%3Crect x='30' width='90' height='40' fill='%23007a3d'/%3E%3Crect x='30' y='40' width='90' height='40' fill='%23ffffff'/%3E%3Crect x='30' y='80' width='90' height='40' fill='%23000000'/%3E%3C/svg%3E",
    "flagAlt": "علم الإمارات",
    "searchText": "الإمارات UAE"
  },
  {
    "id": "turkey",
    "nameAr": "تركيا",
    "nameEn": "Turkey",
    "type": "حاضنة أعمال",
    "hours": "من 9:00 صباحًا إلى 6:00 مساءً",
    "flagSrc": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='120' fill='%23e30a17'/%3E%3Ccircle cx='52' cy='60' r='22' fill='%23ffffff'/%3E%3Ccircle cx='58' cy='60' r='18' fill='%23e30a17'/%3E%3C/svg%3E",
    "flagAlt": "علم تركيا",
    "searchText": "تركيا Turkey"
  },
  {
    "id": "jordan",
    "nameAr": "الأردن",
    "nameEn": "Jordan",
    "type": "مكاتب خاصة",
    "hours": "من 8:00 صباحًا إلى 5:00 مساءً",
    "flagSrc": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='40' y='0' fill='%23000000'/%3E%3Crect width='120' height='40' y='40' fill='%23ffffff'/%3E%3Crect width='120' height='40' y='80' fill='%23007839'/%3E%3Cpolygon points='0,0 54,60 0,120' fill='%23ce1126'/%3E%3C/svg%3E",
    "flagAlt": "علم الأردن",
    "searchText": "الأردن Jordan"
  }
];
