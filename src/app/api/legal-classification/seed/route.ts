import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import { internationalLawAxes } from "@/data/international-laws-structure";

const DEMO_ENTRIES = [
  { axisSlug: "intl-cross-border", topicSlug: "intl-law", topicName: "القانون الدولي", title: "اتفاقية جنيف الرابعة — دراسة امتثال", jurisdiction: "دولي", country: "سويسرا", category: "معاهدات", status: "نشط", clientName: "مؤسسة الإغاثة الدولية", effectiveDate: "1949-08-12", source: "الأمم المتحدة" },
  { axisSlug: "intl-cross-border", topicSlug: "intl-disputes", topicName: "النزاعات الدولية", title: "نزاع تجاري عابر للحدود — شركة النيل", jurisdiction: "تحكيم دولي", country: "الإمارات", category: "تحكيم", status: "قيد المراجعة", clientName: "شركة النيل للتجارة", effectiveDate: "2026-03-01", source: "ICC" },
  { axisSlug: "national-local", topicSlug: "constitution", topicName: "دستور الدولة", title: "مراجعة دستورية — المادة 53", jurisdiction: "محلي", country: "مصر", category: "دستوري", status: "نشط", clientName: "أحمد محمد الصاوي", effectiveDate: "2014-01-18", source: "الجريدة الرسمية" },
  { axisSlug: "national-local", topicSlug: "local-tax", topicName: "قانون الضرائب", title: "استشارة ضريبية — ضريبة القيمة المضافة", jurisdiction: "محلي", country: "مصر", category: "ضرائب", status: "مكتمل", clientName: "شركة النيل للتجارة", effectiveDate: "2026-01-01", source: "مصلحة الضرائب" },
  { axisSlug: "commercial-maritime", topicSlug: "maritime-law", topicName: "القانون البحري", title: "نزاع شحن بحري — بضاعة متأخرة", jurisdiction: "بحري", country: "مصر", category: "نقل بحري", status: "نشط", clientName: "شركة الشحن القانوني", effectiveDate: "2026-02-15", source: "هيئة الموانئ" },
  { axisSlug: "commercial-maritime", topicSlug: "franchise", topicName: "عقود الفرنشايز", title: "عقد امتياز تجاري — سلسلة مطاعم", jurisdiction: "تجاري", country: "السعودية", category: "امتياز", status: "نشط", clientName: "مجموعة الرياض التجارية", effectiveDate: "2026-04-01", source: "وزارة التجارة" },
  { axisSlug: "labor-safety", topicSlug: "occupational-safety", topicName: "السلامة المهنية", title: "تفتيش سلامة مصنع — تقرير امتثال", jurisdiction: "عمالي", country: "مصر", category: "سلامة", status: "قيد المراجعة", clientName: "مصنع الدلتا", effectiveDate: "2026-05-10", source: "وزارة القوى العاملة" },
  { axisSlug: "institutional", topicSlug: "legal-governance", topicName: "حوكمة الإدارات القانونية", title: "سياسة حوكمة قانونية — الإصدار 2.0", jurisdiction: "مؤسسي", country: "مصر", category: "حوكمة", status: "نشط", clientName: "NAIOSH Law", effectiveDate: "2026-01-01", source: "داخلي" },
  { axisSlug: "automation-digital", topicSlug: "digital-transform", topicName: "التحول الرقمي للمنظومات القانونية", title: "مشروع ربط المحاكم الإلكترونية", jurisdiction: "رقمي", country: "مصر", category: "تحول رقمي", status: "نشط", clientName: "وزارة العدل", effectiveDate: "2026-06-01", source: "NAIOSH 360" },
  { axisSlug: "contracts-poa", topicSlug: "legal-poa", topicName: "التوكيلات القانونية", title: "توكيل قضائي — قضية تجارية", jurisdiction: "محلي", country: "مصر", category: "توكيل", status: "نشط", clientName: "سارة إبراهيم المصري", effectiveDate: "2026-07-01", source: "كاتب العدل" },
  { axisSlug: "compliance-crimes", topicSlug: "legal-compliance", topicName: "أنظمة الامتثال القانوني", title: "تدقيق امتثال — معايير ISO 37301", jurisdiction: "امتثال", country: "الإمارات", category: "رقابة", status: "نشط", clientName: "شركة الخليج القابضة", effectiveDate: "2026-03-15", source: "ISO" },
  { axisSlug: "intl-cross-border", topicSlug: "intl-cyber", topicName: "قانون الجرائم الإلكترونية الدولي", title: "تحقيق جريمة إلكترونية عابرة للحدود", jurisdiction: "دولي", country: "أوروبا", category: "جرائم إلكترونية", status: "قيد المراجعة", clientName: "بنك القاهرة الدولي", effectiveDate: "2026-02-20", source: "بودابست" },
];

export async function POST() {
  const { error } = await requireWrite();
  if (error) return error;

  const existing = await prisma.legalClassificationEntry.count();
  if (existing > 0) {
    return NextResponse.json({ message: "البيانات موجودة مسبقاً", count: existing });
  }

  let count = 0;
  for (const entry of DEMO_ENTRIES) {
    count++;
    const refNo = `LAW-${new Date().getFullYear()}-${String(count).padStart(4, "0")}`;
    await prisma.legalClassificationEntry.create({
      data: {
        refNo,
        axisSlug: entry.axisSlug,
        topicSlug: entry.topicSlug,
        topicName: entry.topicName,
        title: entry.title,
        jurisdiction: entry.jurisdiction,
        country: entry.country,
        category: entry.category,
        status: entry.status,
        clientName: entry.clientName,
        effectiveDate: entry.effectiveDate,
        source: entry.source,
        description: `سجل تجريبي لمحور ${internationalLawAxes.find((a) => a.slug === entry.axisSlug)?.title ?? entry.axisSlug}`,
      },
    });
  }

  return NextResponse.json({ message: `تم تحميل ${count} سجل قانوني`, count });
}
