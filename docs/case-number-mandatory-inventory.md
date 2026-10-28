# جرد رقم القضية الإلزامي — NAIOSH LAW

فرع التدقيق الشامل: `cursor/case-link-full-audit-551a` (متابعة بعد #188 / #189)  
التقرير الكامل: `docs/case-number-full-audit-report.md`

## القاعدة

- المصدر الوحيد: `Case.caseNo` في PostgreSQL عبر `caseId` أو تطابق تام لـ `caseNo`.
- ترتيب RTL: رقم القضية ← الموكل ← الاتصال ← الباقي.
- غير قابل للإخفاء عبر إعدادات الصفحات.
- بلا أرقام وهمية عند الإنشاء/التعديل للوحدات الإلزامية.
- الموكل بلا قضية: «لا توجد قضية مرتبطة».
- مرجع نصي قديم بلا تطابق: «يحتاج مراجعة الربط» — دون ربط تلقائي خاطئ.
- العميل لا يصل لواجهات/APIs الموظفين؛ قضاياه عبر `/portal` فقط.

## المواضع

| الصفحة / التبويب | مسار | جدول caseNo أولًا | نموذج إضافة/عرض/تعديل | مصدر | قفل |
|---|---|---|---|---|---|
| إدارة القضايا | `/app/modules/case-management` | نعم + روابط | إضافة caseNo؛ تعديل قراءة فقط | `Case` | نعم |
| إدارة الموكلين | `/app/modules/clients-management` | نعم + روابط متعددة | case-multi-select اختياري | `Case[]` عبر `clientId` | نعم |
| الجلسات | `/app/modules/court-sessions` | نعم | case-select إلزامي + بحث | `CourtSession.caseId` | نعم |
| المتابعة | `/app/modules/follow-up-center` | نعم | case-select إلزامي | ModuleRecord | نعم |
| الخدمات | `/app/modules/legal-services` | نعم | case-select إلزامي | ModuleRecord | نعم |
| الاستشارات | `/app/modules/legal-consultations` | نعم | case-select اختياري | ModuleRecord | نعم |
| الشكاوى | `/app/modules/complaints-management` | نعم | case-select إلزامي | ModuleRecord | نعم |
| الطلبات | `/app/modules/internal-requests` | نعم | case-select اختياري | ModuleRecord | نعم |
| المحاسبة | `/app/modules/legal-accounting` | نعم | case-select إلزامي | FinancialRecord.caseRef | نعم |
| المالية — فواتير | `/app/legal-finance` invoices | نعم | case-select إلزامي | FinancialRecord | عمود مفروض في الواجهة |
| المالية — كفالات/ضمانات/تبليغات | نفس الصفحة | نعم | case-select إلزامي | caseRef محلول | نعم |
| الشبكة المهنية | `/app/professional-network` | رقم القضية في قائمة الطلبات | case-select اختياري | caseRef محلول | — |
| التصدير | ModuleShell | ضمن visibleColumns المفروضة | — | API | caseNo لا يُسقط |
| بوابة العميل | `/portal/cases` | قضاياه | — | Case حيث clientId | عزل middleware |

## استثناءات معلنة

| السطح | الحالة |
|---|---|
| جلسات قديمة بنص `#F-*` / `#PC-*` بلا Case | تُعرض للمراجعة اليدوية — لا ربط تلقائي |
| سجلات Case بأسماء TEST/#LINK في بيئة التطوير | آثار اختبارات — لا حذف تلقائي؛ فحص المصدر أولًا |
| تدقيق بيانات الإنتاج | قراءة فقط عبر `audit-case-full-readonly.mts` على replica — منفصل عن قبول الكود |

## اختبارات

- `scripts/acceptance-case-full-audit.mts` — جرد واجهات + سيناريوهات + عزل + قفل إعدادات  
- `scripts/audit-case-full-readonly.mts` — جرد روابط DB قراءة فقط  
- `scripts/acceptance-client-case-link.mts` — دورة ربط الموكل (PR #189)  
