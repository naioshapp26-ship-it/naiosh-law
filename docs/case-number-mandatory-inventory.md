# جرد رقم القضية الإلزامي — NAIOSH LAW

فرع: `cursor/mandatory-case-no-systemwide-551a` · PR #188

## القاعدة

- المصدر الوحيد: `Case.caseNo` في PostgreSQL.
- ترتيب RTL: رقم القضية ← الموكل ← الاتصال ← الباقي.
- غير قابل للإخفاء عبر إعدادات الصفحات (`lockedValues` على `visibleColumns` + فرض في `module-shell` + إعادة فرض عند حفظ API).
- بلا أرقام وهمية. الموكل بلا قضية: «لا توجد قضية مرتبطة».
- مرجع نصي قديم بلا تطابق: «يحتاج مراجعة الربط» / حالة `caseLinkStatus=review` دون ربط تلقائي خاطئ.

## المواضع — جداول ونماذج وإعدادات

| الصفحة / التبويب | مسار | جدول caseNo أولًا | نموذج إضافة/عرض/تعديل | مصدر | قفل إعدادات |
|---|---|---|---|---|---|
| إدارة القضايا | `/app/modules/case-management` | نعم + روابط | إضافة: حقل caseNo؛ تعديل: قراءة فقط؛ عرض: ظاهر | `Case` | نعم |
| إدارة الموكلين | `/app/modules/clients-management` | نعم + روابط متعددة | حقل **رقم القضية / القضايا المرتبطة** (`case-multi-select`) في إضافة/تعديل/عرض؛ اختياري؛ بحث وربط قضايا حقيقية فقط؛ CTA لإنشاء قضية ثم الربط | `Case[]` عبر `clientId` + مزامنة `caseIds` في POST/PATCH | عمود مقفل |
| إدارة الجلسات | `/app/modules/court-sessions` | نعم | case-select إلزامي → `caseId` | `CourtSession.caseId` + `Case` | نعم |
| مركز المتابعة | `/app/modules/follow-up-center` | نعم | case-select إلزامي | `ModuleRecord.data` | نعم |
| الخدمات القانونية | `/app/modules/legal-services` | نعم | case-select إلزامي | ModuleRecord | نعم |
| الاستشارات | `/app/modules/legal-consultations` | نعم | case-select اختياري | ModuleRecord | عمود مقفل |
| الشكاوى | `/app/modules/complaints-management` | نعم | case-select إلزامي | ModuleRecord | نعم |
| الطلبات الداخلية | `/app/modules/internal-requests` | نعم | case-select اختياري | ModuleRecord | عمود مقفل |
| المحاسبة القانونية | `/app/modules/legal-accounting` | نعم | case-select إلزامي | `FinancialRecord.caseRef` = `Case.caseNo` عند الربط | نعم |
| المالية — كفالات | `/app/legal-finance` تبويب bail | عمود رقم القضية | case-select | `BailGuarantee.caseRef` محلول | عرض محلول |
| المالية — ضمانات | تبويب personal | عمود رقم القضية | case-select | `PersonalGuarantee.caseRef` | عرض محلول |
| المالية — تبليغات | تبويب notifications | عمود رقم القضية | case-select | `OfficialNotification.caseRef` | عرض محلول |
| التصدير CSV/Excel/PDF | زر تقارير في ModuleShell | أعمدة = `visibleColumns` المفروضة (تشمل caseNo) | — | صفوف API | caseNo لا يُسقط |
| بوابة العميل | `/portal/cases` وغيرها | موجود مسبقًا | caseId حيث ينطبق | Case | خارج نطاق الموظفين |

## استثناءات / فجوات معروفة

| السطح | الحالة |
|---|---|
| الشبكة المهنية `/app/professional-network` | ما زال حقل نصي `caseRef` — **لم يُرحَّل بالكامل** في هذا PR |
| مركز التقارير (قائمة تعريفات التقارير) | تقارير وصفية عن ملفات التقارير وليست سجلات قضايا؛ التصدير الفعلي للقضايا يتم من صفحات الوحدات |
| فواتير تبويب invoices في legal-finance | لم يُفرض caseNo على كل صف فاتورة في ذلك التبويب المخصص (المحاسبة ModuleShell مغطاة) |
| جلسات بـ caseNo نصي بلا `caseId` ولا تطابق Case | تُعرض للمراجعة (`review`) — **بدون** ربط تلقائي |

## آليات القفل التقنية

1. `displayTab({ lockedVisibleColumns: ["caseNo"] })` في registry / from-module-config  
2. `normalizeAndValidate` في `server.ts` يعيد دمج `lockedValues` في `visibleColumns` ويمنع إخفاءها في `hiddenOptionalFields`  
3. `module-shell` يفرض `CASE_NO_KEY` عند تصفية الأعمدة ويحقن case-select في النماذج ذات العلاقة  
4. روابط الموكلين: `/app/modules/case-management?caseId=<id>` تفتح عرض القضية المطابقة

## حالات الاختبار

1. موكل بقضية واحدة / متعددة / بلا قضايا  
2. فتح كل رابط قضية من خلية الموكل → القضية الصحيحة  
3. نماذج إضافة/عرض/تعديل لكل مجموعة صفحات  
4. محاولة إخفاء caseNo عبر PUT إعدادات الصفحة → يُعاد فرضه  
5. التصدير يستخدم أعمدة ظاهرة تتضمن caseNo  
6. جرد سجلات «يحتاج مراجعة الربط» بلا ربط عشوائي  
7. دورة ربط الموكل↔القضية (`scripts/acceptance-client-case-link.mts`): إضافة بـ0/1/2 قضايا، تعديل الربط، إنشاء قضية لموكل موجود (ربط عكسي)، رفض `caseIds` وهمي، بحث case-select في الجلسات/المحاسبة/المتابعة  

## فرع متابعة بعد #188

فرع: `cursor/client-case-link-picker-551a` — يغلق فجوة نموذج الموكل (عمود بدون حقل إدخال). 
