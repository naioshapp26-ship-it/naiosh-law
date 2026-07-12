/** منظومة نايوش 360 — التصنيف القانوني الدولي والمحلي (8 محاور) */

export type LawTopic = {
  slug: string;
  name: string;
};

export type LawAxis = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
  topics: LawTopic[];
};

export const NAIOSH_360_INTRO =
  "منظومة نايوش 360 القانونية والاستشارات والمحاماة هي منصة سيادية متكاملة تجمع بين القانون الدولي والمحلي، وتوفر حلولًا قانونية شاملة تمتد عبر الحدود، وتدير النزاعات، وتبني الشراكات، وتؤسس للحوكمة القانونية داخل المؤسسات، وتدعم التحول الرقمي التشريعي، وتضمن الامتثال والرقابة.";

export const IMPERIAL_IDENTITY =
  "منصة نايوش 360 القانونية هي منظومة سيادية متكاملة تجمع بين القانون الدولي والمحلي، وتدمج بين الحوكمة والأتمتة، وتبني جسورًا بين التشريع والاقتصاد، وتوفر حلولًا قانونية شاملة تمتد من الفرد إلى الدولة، ومن الدولة إلى العالم.";

/** القائمة الأولية — موضوعات المنظومة الشاملة */
export const PRIMARY_TOPIC_CATALOG: string[] = [
  "القانون الدولي",
  "المنظمات الدولية",
  "الشراكات الدولية",
  "البروتوكولات الدولية",
  "عقود الفرنشايز",
  "النزاعات المحلية",
  "النزاعات الدولية",
  "فضّ النزاعات الدولية",
  "التوكيلات القانونية",
  "التوكيلات التجارية",
  "التأمين الدولي",
  "التأمين البحري",
  "سلاسل الإمداد",
  "الحوادث الدولية",
  "القانون التجاري",
  "القانون البحري",
  "قانون العقوبات الدولية",
  "قانون العقوبات حسب الدولة",
  "دستور الدولة",
  "قانون الجرائم الإلكترونية الدولي",
  "قانون الجرائم الإلكترونية حسب الدولة",
  "قانون الاتجار بالممنوعات",
  "قانون تعاطي المخدرات",
  "قانون النقل الدولي",
  "قانون النقل المحلي",
  "قانون السير الدولي",
  "قانون السير للدولة",
  "القوانين الجمركية الدولية",
  "القوانين الجمركية المحلية",
  "قانون الضرائب",
  "التجارة الدولية",
  "المؤتمرات الدولية",
  "الفعاليات الدولية",
  "الفعاليات المحلية",
  "تصريح العمالة الوافدة",
  "قانون العمل والعمال",
  "منظمات العمل الدولية",
  "حقوق العاملين",
  "السلامة المهنية",
  "تعويضات مخاطر العمل",
  "المخالفات",
  "اللوجستيات وعقود المشتريات",
  "التعاملات البنكية",
  "القروض البنكية",
  "قوانين الاستثمار",
  "قوانين التخليص الجمركي",
  "قوانين ضبط الجودة",
  "قوانين السلامة في القطاعات والمصانع",
  "الاحتيالات الدولية",
  "عقود الإيجار التجارية",
  "عقود الإيجار السكنية",
  "حوكمة الإدارات القانونية",
  "أتمتة العمليات التشغيلية",
  "الموارد البشرية",
  "الأرشفة",
  "أنظمة الجودة القانونية",
  "أنظمة الأيزو",
  "السياسات التشغيلية",
  "نظام قياس الأداء",
  "النظم الاجتماعية",
  "القوانين العشائرية المساندة",
  "العطوات وفضّ النزاعات",
  "الابتزاز والتنمر",
  "النزاعات المالية",
  "الرهن وفك الرهن",
];

function topic(slug: string, name: string): LawTopic {
  return { slug, name };
}

export const internationalLawAxes: LawAxis[] = [
  {
    id: 1,
    slug: "intl-cross-border",
    title: "القانون الدولي والأنظمة العابرة للحدود",
    subtitle: "المحور الأول",
    icon: "🌐",
    color: "#0ea5e9",
    description:
      "يمثل هذا المحور البوابة العليا للتشريعات الدولية، ويعكس قدرة نايوش على إدارة العلاقات العابرة للحدود، وصياغة الحلول القانونية التي تتجاوز الإطار المحلي. هذا المحور يُظهر القوة التشريعية العابرة للقارات التي تميز إمبراطورية نايوش.",
    topics: [
      topic("intl-law", "القانون الدولي"),
      topic("intl-orgs", "المنظمات الدولية"),
      topic("intl-partners", "الشراكات الدولية"),
      topic("intl-protocols", "البروتوكولات الدولية"),
      topic("intl-disputes", "النزاعات الدولية"),
      topic("intl-mediation", "فضّ النزاعات الدولية"),
      topic("intl-incidents", "الحوادث الدولية"),
      topic("intl-penal", "قانون العقوبات الدولية"),
      topic("intl-cyber", "قانون الجرائم الإلكترونية الدولي"),
      topic("intl-contraband", "قانون الاتجار بالممنوعات"),
      topic("intl-transport", "قانون النقل الدولي"),
      topic("intl-customs", "القوانين الجمركية الدولية"),
      topic("intl-insurance", "التأمين الدولي"),
      topic("intl-marine-ins", "التأمين البحري"),
      topic("intl-supply", "سلاسل الإمداد الدولية"),
      topic("intl-fraud", "الاحتيالات الدولية"),
      topic("intl-conferences", "المؤتمرات الدولية"),
      topic("intl-events", "الفعاليات الدولية"),
    ],
  },
  {
    id: 2,
    slug: "national-local",
    title: "القوانين الوطنية والتشريعات المحلية",
    subtitle: "المحور الثاني",
    icon: "🏛️",
    color: "#8b5cf6",
    description:
      "يمثل الأساس التشريعي للدولة، ويعكس قدرة نايوش على التعامل مع الأنظمة المحلية بدقة وامتثال كامل. هذا المحور هو العمود الفقري للعدالة الوطنية.",
    topics: [
      topic("local-disputes", "النزاعات المحلية"),
      topic("local-penal", "قانون العقوبات حسب الدولة"),
      topic("local-cyber", "قانون الجرائم الإلكترونية حسب الدولة"),
      topic("local-drugs", "قانون تعاطي المخدرات"),
      topic("local-transport", "قانون النقل المحلي"),
      topic("local-traffic", "قانون السير للدولة"),
      topic("local-customs", "القوانين الجمركية المحلية"),
      topic("local-tax", "قانون الضرائب"),
      topic("constitution", "دستور الدولة"),
      topic("local-events", "الفعاليات المحلية"),
      topic("tribal-laws", "القوانين العشائرية المساندة"),
      topic("reconciliation", "العطوات وفضّ النزاعات"),
      topic("financial-disputes", "النزاعات المالية"),
      topic("mortgage", "الرهن وفك الرهن"),
    ],
  },
  {
    id: 3,
    slug: "commercial-maritime",
    title: "القانون التجاري والبحري والامتيازات",
    subtitle: "المحور الثالث",
    icon: "⚓",
    color: "#f59e0b",
    description:
      "يمثل القوة الاقتصادية والتجارية لمنظومة نايوش، ويعالج كافة التشريعات المرتبطة بالتجارة والبحر والامتيازات. هذا المحور هو الذراع الاقتصادية للإمبراطورية القانونية.",
    topics: [
      topic("commercial-law", "القانون التجاري"),
      topic("maritime-law", "القانون البحري"),
      topic("franchise", "عقود الفرنشايز"),
      topic("commercial-lease", "عقود الإيجار التجارية"),
      topic("residential-lease", "عقود الإيجار السكنية"),
      topic("logistics", "اللوجستيات وعقود المشتريات"),
      topic("banking", "التعاملات البنكية"),
      topic("loans", "القروض البنكية"),
      topic("investment-laws", "قوانين الاستثمار"),
      topic("customs-clearance", "قوانين التخليص الجمركي"),
    ],
  },
  {
    id: 4,
    slug: "labor-safety",
    title: "العمل والعمال والسلامة المهنية",
    subtitle: "المحور الرابع",
    icon: "👷",
    color: "#22c55e",
    description:
      "يمثل حماية الإنسان العامل، وضمان بيئة عمل آمنة وعادلة. هذا المحور هو ضمانة العدالة المهنية في منظومة نايوش.",
    topics: [
      topic("labor-law", "قانون العمل والعمال"),
      topic("labor-orgs", "منظمات العمل الدولية"),
      topic("worker-rights", "حقوق العاملين"),
      topic("occupational-safety", "السلامة المهنية"),
      topic("work-compensation", "تعويضات مخاطر العمل"),
      topic("sector-safety", "قوانين السلامة في القطاعات والمصانع"),
      topic("violations", "المخالفات الدستورية والقانونية والسير"),
    ],
  },
  {
    id: 5,
    slug: "institutional",
    title: "الأنظمة القانونية المؤسسية",
    subtitle: "المحور الخامس",
    icon: "🏢",
    color: "#6366f1",
    description:
      "يمثل البنية الداخلية للحوكمة القانونية داخل المؤسسات. هذا المحور هو عقل المؤسسة القانوني.",
    topics: [
      topic("legal-governance", "حوكمة الإدارات القانونية"),
      topic("quality-systems", "أنظمة الجودة القانونية"),
      topic("operational-policies", "السياسات التشغيلية"),
      topic("iso", "أنظمة الأيزو"),
      topic("performance", "نظام قياس الأداء"),
      topic("social-systems", "النظم الاجتماعية"),
      topic("archiving", "الأرشفة"),
    ],
  },
  {
    id: 6,
    slug: "automation-digital",
    title: "الأتمتة والتحول الرقمي القانوني",
    subtitle: "المحور السادس",
    icon: "🤖",
    color: "#06b6d4",
    description:
      "يمثل مستقبل القانون، ويعكس قدرة نايوش على تحويل العمليات القانونية إلى منظومات رقمية متكاملة. هذا المحور هو الثورة الرقمية القانونية.",
    topics: [
      topic("ops-automation", "أتمتة العمليات التشغيلية"),
      topic("digital-transform", "التحول الرقمي للمنظومات القانونية"),
      topic("data-mgmt", "إدارة البيانات القانونية"),
      topic("court-link", "الربط بين الأنظمة القضائية والإدارية"),
    ],
  },
  {
    id: 7,
    slug: "contracts-poa",
    title: "التوكيلات والعقود الدولية والمحلية",
    subtitle: "المحور السابع",
    icon: "📜",
    color: "#ec4899",
    description:
      "يمثل البنية التعاقدية التي تربط الأفراد والمؤسسات عبر منظومات قانونية موثوقة. هذا المحور هو شبكة العلاقات القانونية في نايوش.",
    topics: [
      topic("legal-poa", "التوكيلات القانونية"),
      topic("commercial-poa", "التوكيلات التجارية"),
      topic("intl-partnership", "عقود الشراكات الدولية"),
      topic("franchise-contracts", "عقود الامتياز"),
      topic("transport-contracts", "عقود النقل"),
      topic("insurance-contracts", "عقود التأمين"),
      topic("supply-contracts", "عقود الإمداد واللوجستيات"),
    ],
  },
  {
    id: 8,
    slug: "compliance-crimes",
    title: "الجرائم والامتثال والرقابة",
    subtitle: "المحور الثامن",
    icon: "🛡️",
    color: "#ef4444",
    description:
      "يمثل منظومة الردع والرقابة القانونية التي تحمي المجتمع والمؤسسات. هذا المحور هو درع الحماية التشريعية.",
    topics: [
      topic("cyber-crimes", "قانون الجرائم الإلكترونية"),
      topic("contraband-law", "قانون الاتجار بالممنوعات"),
      topic("drugs-law", "قانون تعاطي المخدرات"),
      topic("intl-fraud-2", "الاحتيالات الدولية"),
      topic("violations-2", "المخالفات"),
      topic("quality-control", "أنظمة ضبط الجودة"),
      topic("legal-compliance", "أنظمة الامتثال القانوني"),
    ],
  },
];

export const axisBySlug = Object.fromEntries(
  internationalLawAxes.map((a) => [a.slug, a])
) as Record<string, LawAxis>;

export const topicBySlug = Object.fromEntries(
  internationalLawAxes.flatMap((a) => a.topics.map((t) => [t.slug, { ...t, axisSlug: a.slug, axisTitle: a.title }]))
) as Record<string, LawTopic & { axisSlug: string; axisTitle: string }>;

export const TOTAL_TOPICS = internationalLawAxes.reduce((n, a) => n + a.topics.length, 0);
