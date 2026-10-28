# تقرير جرد شامل — رقم القضية والعلاقات (بعد PR #189)

فرع: `cursor/case-link-full-audit-551a`  
تاريخ: 2026-10-29 (Africa/Cairo)  
**بدون دمج / بدون نشر** حتى موافقة صريحة.

## فصل مهم: كود ≠ إنتاج

| الطبقة | ماذا تثبت؟ | ماذا لا تثبت؟ |
|---|---|---|
| **اختبارات البيئة المعزولة** (`scripts/acceptance-case-full-audit.mts`) | سلوك النماذج/APIs/القفل/العزل في هذه البيئة | أن بيانات Railway/الإنتاج كلها مرتبطة بشكل صحيح |
| **جرد قراءة فقط لقاعدة هذه البيئة** (`scripts/audit-case-full-readonly.mts`) | حالة الروابط والمراجع النصية **هنا** | حالة الإنتاج |
| **تدقيق الإنتاج** | يجب تشغيل نفس سكربت القراءة فقط ضد نسخة/نسخة احتياطية إنتاجية | أي تعديل أو حذف تلقائي — **ممنوع** |

> نجاح 44/44 هنا يثبت الكود والعلاقات في بيئة الاختبار. **لا يعلن اكتمال بيانات الإنتاج.**

---

## 1) جرد الصفحات (جدول / إضافة / عرض / تعديل / المصدر)

| الصفحة | مسار | عمود caseNo أول RTL + مقفل | إضافة | عرض | تعديل | مصدر PostgreSQL |
|---|---|---|---|---|---|---|
| إدارة القضايا | `/app/modules/case-management` | نعم | حقل caseNo (نص عند الإنشاء) | نعم + deep-link `?caseId=` | قراءة فقط لرقم القضية | `Case.caseNo` |
| إدارة الموكلين | `/app/modules/clients-management` | نعم + روابط متعددة | **case-multi-select** اختياري | نعم | نعم (مزامنة `caseIds`) | `Case[]` عبر `clientId` |
| الجلسات | `/app/modules/court-sessions` | نعم | case-select إلزامي + بحث | نعم | case-select | `CourtSession.caseId` → `Case` |
| المتابعة | `/app/modules/follow-up-center` | نعم | case-select إلزامي | نعم | نعم | `ModuleRecord.data.caseId/caseNo` |
| الخدمات | `/app/modules/legal-services` | نعم | case-select إلزامي | نعم | نعم | ModuleRecord |
| الاستشارات | `/app/modules/legal-consultations` | نعم | case-select اختياري | نعم | نعم | ModuleRecord |
| الشكاوى | `/app/modules/complaints-management` | نعم | case-select إلزامي | نعم | نعم | ModuleRecord |
| الطلبات | `/app/modules/internal-requests` | نعم | case-select اختياري | نعم | نعم | ModuleRecord |
| المحاسبة | `/app/modules/legal-accounting` | نعم | case-select إلزامي | نعم | نعم | `FinancialRecord.caseRef` = `Case.caseNo` |
| المالية — فواتير | `/app/legal-finance` تبويب الفواتير | **نعم (أُصلح)** | case-select إلزامي | عبر التفاصيل | نعم | نفس `FinancialRecord` |
| المالية — كفالات | تبويب bail | نعم | case-select إلزامي | نعم | نعم | `BailGuarantee.caseRef` محلول |
| المالية — ضمانات | تبويب personal | نعم | case-select إلزامي | نعم | نعم | `PersonalGuarantee.caseRef` |
| المالية — تبليغات | تبويب notifications | نعم | case-select إلزامي | نعم | نعم | `OfficialNotification.caseRef` |
| الشبكة المهنية | `/app/professional-network` | عرض رقم في قائمة الطلبات | **case-select** (أُصلح؛ اختياري) | نعم | — | `ProfessionalNetwork.caseRef` محلول |
| التصدير CSV/Excel/PDF | ModuleShell | caseNo ضمن الأعمدة المفروضة | — | — | — | صفوف API |
| بوابة العميل | `/portal/cases` | خاص بالموكل | — | قضاياه فقط | — | `Case` حيث `clientId` |

### قواعد الكتابة (بعد هذا الفرع)

- الوحدات ذات `CASE_PICKER_REQUIRED` ترفض `caseNo` غير الموجود (400).
- الكفالات / الضمانات / التبليغات / الفواتير ترفض الربط الوهمي.
- الشبكة المهنية: إن وُجد رقم يجب أن يطابق `Case` حقيقي؛ الفارغ مسموح.
- المراجع القديمة غير المتطابقة تُعرض «يحتاج مراجعة الربط» **دون** ربط عشوائي.

---

## 2) جرد قراءة فقط — قاعدة بيئة الكود (ليس الإنتاج)

مصدر: `/opt/cursor/artifacts/case-full-audit/readonly-db-audit.json`

| السطح | total | linked | none | review | ملاحظات |
|---|---:|---:|---:|---:|---|
| Case | 26 | — | — | — | 4 أسماء تبدو تجريبية (`TEST-CASE-*`, `#LINK-*`) — **فُحصت ولم تُحذف** (آثار قبول سابقة في هذه البيئة) |
| Clients | 88 | 25 بقضية واحدة / 63 بلا / متعدد يتغير مع الاختبارات | | | بلا قضية = «لا توجد قضية مرتبطة» |
| Court sessions | 6 | 0 | 0 | **6** | `#F-*`, `#PC-*` نصية بلا Case مطابق → مراجعة فقط |
| Financial records | 7 | 3 | 4 | 0 | |
| Bail / Personal / Notifications | 2/2/3 | كلها linked | 0 | 0 | |
| ModuleRecord (متابعة/خدمات/…) | متفاوت | غالبًا none قبل سيناريوهات القبول | 0 review | روابط جديدة تُنشأ عبر الاختبار |
| Professional network | 0 | — | — | — | لا سجلات حالياً |

**لا حذف** لأي سجل لمجرد أن رقمه يبدو DEMO/TEST — المصدر هنا سكربتات قبول سابقة على نفس قاعدة التطوير.

---

## 3) نتيجة اختبارات الكود (معزولة)

`npx tsx scripts/acceptance-case-full-audit.mts` → **44/44 PASS**

يشمل:

1. أول عمود RTL + نموذج اختيار قضية لكل وحدة case-bearing  
2. فواتير legal-finance + كفالات  
3. case-select في طلبات الشبكة المهنية  
4. سيناريوهات: موكل 0/1/2 قضايا، جلسة، فاتورة، متابعة؛ رفض وهمي  
5. قفل إعدادات الصفحة (إخفاء caseNo يُرفض)  
6. عزل العميل: middleware يمنع `/api/cases` (403)، إعادة توجيه من `/app/modules/*` إلى `/portal`، بوابة تعرض قضاياه فقط  

أدلة لقطات: `/opt/cursor/artifacts/case-full-audit/`

---

## 4) إصلاحات هذا الفرع (متابعة #189)

1. عزل إضافي: `caseAccessWhere` / `assertCaseAccessible` على `/api/cases` (+ middleware الحالي للعميل).  
2. رفض الربط الوهمي في module-records (الإلزامية)، bail، personal، notifications، professional-network.  
3. تبويب فواتير legal-finance: عمود رقم القضية أولًا + case-select.  
4. الشبكة المهنية: case-select بدل نص حر.  
5. سكربتات جرد/قبول كاملة + هذا التقرير.  
6. **متابعة تقرير الجرد الفرعي:** مزامنة `caseId` في PATCH للجلسات/المالية/الكفالات/الضمانات/التبليغات؛ تعبئة `caseId` عند التعديل في Modal؛ تبويب التبليغات برقم قضية أولًا؛ قفل caseNo في إعدادات legal-finance/الشبكة؛ تنظيف fallback التجريبي في ModuleShell؛ تسمية صريحة لبيانات البوابة التجريبية؛ تحليل البيانات يصدر `caseNo` محلولًا.

---

## 5) تدقيق الإنتاج (قراءة فقط — خارج هذه البيئة)

على نسخة إنتاج أو snapshot:

```bash
DATABASE_URL="<prod-read-replica>" npx tsx scripts/audit-case-full-readonly.mts
```

ثم قارن `looksTestOrDemo` و`review` مع هذا التقرير.  
**ممنوع** تشغيل سكربتات قبول تكتب بيانات على الإنتاج دون موافقة منفصلة.
