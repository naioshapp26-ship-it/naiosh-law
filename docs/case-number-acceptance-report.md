# تقرير قبول نهائي — رقم القضية الإلزامي (PR #188)

تاريخ التشغيل: Africa/Cairo · فرع `cursor/mandatory-case-no-systemwide-551a`  
النتيجة: **70/70 PASS** (`scripts/acceptance-case-no-final.mts`) — **بدون دمج**.

## 1) الجرد

حدّثنا `docs/case-number-mandatory-inventory.md` ليشمل الجداول والنماذج والإعدادات لكل الصفحات ذات العلاقة (قضايا، موكلون، جلسات، متابعة، خدمات، استشارات، شكاوى، طلبات، محاسبة، مالية قانونية بتبويباتها، التصدير)، مع استثناءات صريحة.

## 2) نماذج إضافة / عرض / تعديل

| مجموعة | إضافة | عرض | تعديل |
|---|---|---|---|
| الموكلون | بدون case-select (مسموح) | caseNo ظاهر | — |
| القضايا | حقل رقم القضية | ظاهر | قراءة فقط |
| الجلسات | case-select من Cases الحقيقية | ظاهر | case-select |
| المحاسبة | case-select | — | — |
| متابعة / خدمات / استشارات / شكاوى / طلبات | case-select في الإضافة | — | — |

## 3) روابط القضايا المتعددة من الموكلين

- `TEST-CASE-A` → `/app/modules/case-management?caseId=<id-A>` ويفتح عرض القضية الصحيحة.
- `TEST-CASE-B` → نفس السلوك لـ id-B.
- إصلاح deep-link في `module-shell` لفتح Modal العرض عند وجود `?caseId=`.

## 4) قفل الإعدادات عبر API

محاولة إخفاء `caseNo` من `visibleColumns` ووضعها في `hiddenOptionalFields` على:  
`case-management`, `clients-management`, `court-sessions`, `legal-accounting`, `follow-up-center`, `legal-services`, `complaints-management`  
→ يُعاد فرض `caseNo` في الأعمدة الظاهرة، ولا يُسمح بإخفائه، ويبقى في `requiredFields` حيث ينطبق.

## 5) التصدير / الطباعة

- أعمدة التصدير = `visibleColumns` المفروضة (تشمل caseNo).
- رأس جدول الموكلين يبدأ بـ رقم القضية.
- صف متعدد القضايا يصدّر `TEST-CASE-B · TEST-CASE-A` كنص.
- كل صفوف `/api/cases` تحمل `caseNo`.
- نافذة التقارير (PDF/Excel/CSV) تفتح من الصفحة.

## 6) «يحتاج مراجعة الربط» — بدون ربط تلقائي

| السطح | للمراجعة | ملاحظات |
|---|---:|---|
| جلسات المحكمة | **6** | أمثلة: `#F-mvsgmd14`, `#F-mvsgprkt`, `#F-mvsgr16j`, `#F-mvsgv5p0`, `#PC-mvsfc17k`, `#PC-test` — caseNo نصي بلا Case مطابق؛ تُعرض للمراجعة فقط |
| سجلات مالية | 0 مراجعة (3 مربوطة / 4 بلا قضية) | |
| كفالات / ضمانات / تبليغات | 0 مراجعة | |
| ModuleRecord (متابعة/خدمات/…) | 0 مراجعة — أغلبها «لا توجد قضية مرتبطة» | |
| الشبكة المهنية | 0 سجلات حالياً | ما زال `caseRef` نصيًا كفجوة معروفة |

## 7) نتيجة المتصفح حسب المجموعة

| مجموعة | النتيجة |
|---|---|
| settings-api | 20/20 |
| clients | 10/10 |
| cases | 6/6 |
| sessions | 6/6 |
| accounting | 3/3 |
| modules | 15/15 |
| legal-finance | 3/3 |
| export | 6/6 |
| gaps (موثّق) | 1/1 |

### استثناءات معلنة (ليست PASS مخفي)

1. **الشبكة المهنية**: ما زال حقل `مرجع القضية` نصيًا — لم يُرحَّل بالكامل في هذا PR.  
2. **تبويب فواتير legal-finance المخصص**: عمود رقم القضية مفروض على كفالات/ضمانات/تبليغات؛ تبويب الفواتير الأصلي منفصل عن ModuleShell المحاسبة (المحاسبة `/app/modules/legal-accounting` مغطاة).  
3. **جلسات قديمة بـ caseNo نصي**: 6 سجلات للمراجعة اليدوية — لا ربط تلقائي بقضية خاطئة.

## أدلة لقطات

تحت `/opt/cursor/artifacts/case-no-acceptance/` — منها:  
`clients-table.png`, `clients-view.png`, `clients-link-A-open.png`, `clients-link-B-open.png`, `cases-add.png`, `cases-edit.png`, `cases-view.png`, `sessions-add.png`, `sessions-edit.png`, `accounting-add.png`, `legal-finance.png`, `export-modal.png`, ونماذج الوحدات الأخرى.

**PR #188 لم يُدمَج.** بانتظار موافقتك الصريحة.
