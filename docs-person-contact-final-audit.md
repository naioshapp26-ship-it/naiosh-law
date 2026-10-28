# Final Audit — Person Contact Forms (PR #183)

Generated: 2026-10-28T19:23:50.373Z (Africa/Cairo)

| # | المجال | الفحص | النتيجة | التفاصيل |
|---|---|---|---|---|
| 1 | cases | إضافة — حقول الاتصال | **PASS** | all 6 contact labels present |
| 2 | cases | إضافة — حفظ API | **PASS** | posts=201 /api/cases |
| 3 | cases | بعد الحفظ — ظهور في الجدول | **PASS** | personInTable=true |
| 4 | cases | عرض — بيانات الاتصال | **PASS** | dataVisible=true secondaryVisible=true |
| 5 | cases | تعديل — حقول الاتصال | **PASS** | all 6 labels |
| 6 | cases | تعديل — استمرار المدينة/الجوال | **PASS** | persisted=true apis=200 /api/cases/cmvsi4cqb00di6hjs0k7msau4 |
| 7 | cases | Console errors أثناء الدورة | **PASS** | none |
| 8 | clients | إضافة — حقول الاتصال | **PASS** | all 6 contact labels present |
| 9 | clients | إضافة — حفظ API | **PASS** | posts=201 /api/clients |
| 10 | clients | بعد الحفظ — ظهور في الجدول | **PASS** | personInTable=true |
| 11 | clients | عرض — بيانات الاتصال | **PASS** | dataVisible=true secondaryVisible=true |
| 12 | clients | تعديل — حقول الاتصال | **PASS** | all 6 labels |
| 13 | clients | تعديل — استمرار المدينة/الجوال | **PASS** | persisted=true apis=200 /api/clients/cmvsi4r4q00dl6hjsd3zniofz |
| 14 | clients | Console errors أثناء الدورة | **PASS** | none |
| 15 | consultations | إضافة — حقول الاتصال | **PASS** | all 6 contact labels present |
| 16 | consultations | إضافة — حفظ API | **PASS** | posts=201 /api/module-records/legal-consultations |
| 17 | consultations | بعد الحفظ — ظهور في الجدول | **PASS** | personInTable=true |
| 18 | consultations | عرض — بيانات الاتصال | **PASS** | dataVisible=true secondaryVisible=true |
| 19 | consultations | تعديل — حقول الاتصال | **PASS** | all 6 labels |
| 20 | consultations | تعديل — استمرار المدينة/الجوال | **PASS** | persisted=true apis=200 /api/module-records/legal-consultations/cmvsi553t00dz6hjszqcb3n3j |
| 21 | consultations | Console errors أثناء الدورة | **PASS** | none |
| 22 | sessions | إضافة — حقول الاتصال (مسح) | **PASS** | all 6 |
| 23 | followup | إضافة — حقول الاتصال (مسح) | **PASS** | all 6 |
| 24 | accounting | إضافة — حقول الاتصال (مسح) | **PASS** | all 6 |
| 25 | services | إضافة — حقول الاتصال (مسح) | **PASS** | all 6 |
| 26 | complaints | إضافة — حقول الاتصال (مسح) | **PASS** | all 6 |
| 27 | requests | إضافة — حقول الاتصال (مسح) | **PASS** | all 6 |
| 28 | postgres | موكل محفوظ في Client | **PASS** | id=cmvsi4r4q00dl6hjsd3zniofz phone=1555000222 dial=+20 sec=1001112233 city=الجيزة |
| 29 | postgres | الجوال الإضافي يبقى بعد التعديل (بدون مسح) | **PASS** | phoneSecondary=1001112233 |
| 30 | postgres | قضية مرتبطة بـ clientId | **PASS** | case=#2026-0021 clientId=cmvsi4cpx00db6hjs953jdoux |
| 31 | postgres | استشارة محفوظة ومرتبطة بعميل مركزي | **PASS** | record=cmvsi553t00dz6hjszqcb3n3j dataClientId=cmvsi553k00ds6hjsbqut4x9d linked=cmvsi553k00ds6hjsbqut4x9d city=الجيزة |
| 32 | central | إنشاء عميل مركزي | **PASS** | status=201 id=cmvsi5shu00e26hjs7eqr5rxs |
| 33 | central | قضية مرتبطة بنفس Client | **PASS** | status=201 caseClientId=cmvsi5shu00e26hjs7eqr5rxs |
| 34 | central | تعديل بيانات Client المركزية | **PASS** | status=200 |
| 35 | central | سجل تدقيق PersonContactChange | **PASS** | auditRows=6 |
| 36 | central | انعكاس التعديل المركزي على القضية | **PASS** | city=الإسكندرية phone=+20 1555999000 |
| 37 | central | عدم تغيير عميل آخر بالخطأ | **PASS** | before={"phone":"1555000001","city":"أسيوط"} after={"phone":"1555000001","city":"أسيوط"} |
| 38 | central | تعديل الاتصال من نموذج القضية يحدّث Client المركزي | **PASS** | patch=200 clientCity=المنصورة clientPhone=1555111000 |
| 39 | central | تنبيه واجهة عند تعديل الاتصال المركزي | **PASS** | notice visible |
| 40 | session | استمرار بعد خروج/دخول | **PASS** | found=true |
| 41 | roles | عميل: منع GET /api/clients | **PASS** | status=403 |
| 42 | roles | عميل: منع POST /api/clients | **PASS** | status=403 |
| 43 | roles | عميل: منع PATCH عميل مركزي | **PASS** | status=403 |
| 44 | roles | عميل: منع lookup | **PASS** | status=403 |
| 45 | roles | واجهة الموكلين لدور client | **PASS** | create blocked / unauthorized |
| 46 | api | أخطاء API غير متوقعة أثناء الاختبار | **PASS** | none (401/me + 403/clients/site-settings أثناء تبديل الدور متوقعة) |
| 47 | regression | وظائف قديمة — جدول القضايا يعمل | **PASS** | headers present |

PASS=47 FAIL=0 GAP=0