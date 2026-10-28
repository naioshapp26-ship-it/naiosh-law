# Person Contact E2E Evidence

| Page | Href | Fields | Result | Detail |
|---|---|---|---|---|
| إدارة القضايا — أعمدة | `/app/modules/case-management` | phone,country,city | **PASS** | headers=["رقم القضية","الموكل","رقم الجوال","النوع","المحكمة","الدولة","المدينة","الحالة","الجلسة القادمة","الرسوم","الإجراءات"] phone=true country=true city=true order=true |
| API الموكلين — إنشاء ببيانات اتصال | `/api/clients` | phone,phoneDialCode,country,city | **PASS** | status=201 id=cmvsfc47a000p6hjsdn63tnlh body={"id":"cmvsfc47a000p6hjsdn63tnlh"} |
| API القضايا — إنشاء مع اتصال مركزي | `/api/cases` | phone,country,city via Client | **PASS** | status=201 id=cmvsfc47z000u6hjsv1scaorb json={"id":"cmvsfc47z000u6hjsv1scaorb","caseNo":"#2026-0007","clientId":"cmvsfc47a000p6hjsdn63tnlh","phone":"1001234567","country":"مصر","city":"القاهرة"} |
| API القضايا — قراءة بيانات حقيقية | `/api/cases` | phone,country,city | **PASS** | found=true phone=+20 1001234567 country=مصر city=القاهرة |
| إدارة القضايا — جدول بعد الإضافة | `/app/modules/case-management` | phone,country,city | **PASS** | person=true phone=true city=true |
| إدارة الموكلين | `/app/modules/clients-management` | phone,country,city | **PASS** | name=true phone=true country=true city=true |
| انعكاس التعديل المركزي على القضايا | `/api/clients + /api/cases` | city | **PASS** | patch=200 caseCity=الجيزة |
| الجلسات | `/api/court-sessions` | phone,country,city | **PASS** | status=200 n=0 sampleKeys= |
| المحاسبة | `/api/financial-records` | phone,country,city | **PASS** | status=200 n=3 sampleKeys=id,invoiceNo,ref,client,type,amount,paid,issueDate,date,status,clientId,phone,country,city,phoneDialCode |
| مركز المتابعة | `/app/modules/follow-up-center` | phone,country,city columns | **PASS** | headers=["المرجع","النوع","الموكل","رقم الجوال","الدولة","المدينة","الموعد النهائي","الأولوية","الحالة","الإجراءات"] colsOk=true |
| الخدمات القانونية | `/app/modules/legal-services` | phone,country,city columns | **PASS** | headers=["المرجع","الخدمة","الموكل","رقم الجوال","الدولة","المدينة","المسؤول","تاريخ الطلب","الأولوية","الحالة","الإجراءات"] colsOk=true |
| الاستشارات | `/app/modules/legal-consultations` | phone,country,city columns | **PASS** | headers=["المرجع","العميل","رقم الجوال","الدولة","المدينة","موضوع الاستشارة","المستشار","التاريخ","المدة","الحالة","الإجراءات"] colsOk=true |
| الشكاوى | `/app/modules/complaints-management` | phone,country,city columns | **PASS** | headers=["المرجع","العميل","رقم الجوال","الدولة","المدينة","موضوع الشكوى","تاريخ الاستلام","التصنيف","الأولوية","الحالة","الإجراءات"] colsOk=true |
| الجلسات (واجهة) | `/app/modules/court-sessions` | phone,country,city columns | **PASS** | headers=["رقم القضية","الموكل","رقم الجوال","المحكمة","الدولة","المدينة","القاعة","التاريخ","الوقت","الحالة","حقل دفعة اختبار","الإجراءات"] colsOk=true |
| المحاسبة (واجهة) | `/app/modules/legal-accounting` | phone,country,city columns | **PASS** | headers=["رقم الفاتورة","الموكل","رقم الجوال","الدولة","المدينة","النوع","المبلغ","المسدد","تاريخ الإصدار","الحالة","x","الإجراءات"] colsOk=true |
| إعدادات الصفحات — إدارة القضايا | `/app/page-settings/case-management` | phone,country,city options | **PASS** | hasPhone=true hasCountry=true |
| عزل بيانات العملاء (دور client) | `/api/clients` | forbidden for client role | **PASS** | status=403 |
| إدارة القضايا — موبايل | `/app/modules/case-management` | layout | **PASS** | viewport 390x844 screenshot captured |
| مركز الإشعارات | `/app/modules/notifications-center` | — | **N/A** | صفحة غير معنية ببيانات أشخاص/أطراف كحقول إلزامية للموكل |
| التكاملات | `/app/modules/integrations` | — | **N/A** | صفحة غير معنية ببيانات أشخاص/أطراف كحقول إلزامية للموكل |

PASS=18 FAIL=0 N/A=2