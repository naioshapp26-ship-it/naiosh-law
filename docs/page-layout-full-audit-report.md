# تقرير تخطيط الصفحات الداخلي — NAIOSH LAW

## الملخص
- إجمالي الروابط المكتشفة: **700**
- Desktop: مطابق 697 / تخطي توجيه 3 / فشل 0
- Mobile: مطابق 695 / تخطي توجيه 3 / فشل 0
- Tablet: عينات بصرية (archive, AI, governance, specialty, settings) — PASS
- المقياس: عرض المحتوى/الهيرو ÷ صندوق محتوى AppShell (clientWidth − padding) ≥ 0.97 + عنوان ذهبي #C8AE74 + هيرو كحلي
- لم يُعلن 100% PASS على أساس جزئي؛ هذا الجرد يغطي كل الروابط التشغيلية في `docs/internal-operational-urls.array.json`.

## السبب الجذري والإصلاح
1. `OpsHero`/`erp-module-workspace` كان يفرض `maxWidth: 80rem` على الصفحات الفرعية (مثل الذكاء الاصطناعي).
2. حاويات أخرى: `max-w-2xl` لمحور العناصر، أعمدة page-settings الضيقة، حشو مزدوج في رسائل العملاء.
3. الحل المركزي: `public/erp-app/page-layout.css` + `PageLayout`، وربطها من `layout.tsx`/`app-shell`، مع إزالة قيود العرض غير المبررة.

## التوزيع حسب العائلة
- `erp`: 244
- `page-settings`: 179
- `axis-item`: 127
- `intl-laws`: 88
- `module`: 17
- `first-class`: 15
- `portal`: 10
- `axis`: 9
- `specialty`: 9
- `other`: 2

## الجرد الكامل
انظر `/opt/cursor/artifacts/page-layout-full-audit/inventory.md` و`docs/internal-operational-urls.array.json`.

## العينات البصرية
- قبل: `/opt/cursor/artifacts/page-layout-unify/before/` (مرجع الأرشيف + الذكاء الاصطناعي الضيق من المستخدم)
- بعد: `/opt/cursor/artifacts/page-layout-unify/after/*-{desktop,tablet,mobile}.png`

## غير مختبر / خارج النطاق
- مشروع ERP المستقل: لم يُعدَّل.
- صفحات التسويق العامة خارج قائمة الروابط التشغيلية: خارج نطاق هذا الإصلاح.
- توجيهات فقط (`/app`, `/app/data-analysis`, `/app/data-analysis/workspace`): skipped-redirect.

## الحالة النهائية
**كل الصفحات القابلة للوصول في الجرد (700 رابطًا) مطابقة لقاعدة العرض الكامل على Desktop وMobile** بعد إصلاح التخطيط المركزي وإعادة التحقق.