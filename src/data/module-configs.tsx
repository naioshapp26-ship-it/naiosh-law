import type { BadgeColor } from "@/components/ui/status-badge";
import type { KpiCard } from "@/components/ui/stats-row";

export type FormField = {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "number" | "textarea" | "email" | "tel" | "files";
  options?: string[];
  required?: boolean;
  placeholder?: string;
};

export type Column = {
  key: string;
  label: string;
  type?: "text" | "badge" | "currency" | "number";
  sortable?: boolean;
  badgeMap?: Record<string, { label: string; color: BadgeColor }>;
};

export type ModuleConfig = {
  slug: string;
  entityName: string;
  addLabel: string;
  kpis: KpiCard[];
  columns: Column[];
  data: Record<string, unknown>[];
  formFields: FormField[];
};

/* ─── Shared badge maps ─────────────────────────────────── */
const casesStatusMap: Record<string, { label: string; color: BadgeColor }> = {
  نشطة:   { label: "نشطة",   color: "green"  },
  معلقة:  { label: "معلقة",  color: "yellow" },
  مغلقة:  { label: "مغلقة",  color: "gray"   },
  فائزة:  { label: "فائزة",  color: "blue"   },
  خاسرة:  { label: "خاسرة",  color: "red"    },
  محكوم:  { label: "محكوم",  color: "purple" },
};
const priorityMap: Record<string, { label: string; color: BadgeColor }> = {
  عاجل:  { label: "عاجل",  color: "red"    },
  عالٍ:  { label: "عالٍ",  color: "orange" },
  متوسط: { label: "متوسط", color: "yellow" },
  منخفض: { label: "منخفض", color: "gray"   },
};
const payStatusMap: Record<string, { label: string; color: BadgeColor }> = {
  مسدد:    { label: "مسدد",    color: "green"  },
  جزئي:    { label: "جزئي",    color: "yellow" },
  "غير مسدد": { label: "غير مسدد", color: "red" },
  مؤجل:    { label: "مؤجل",    color: "gray"   },
};
const sessionStatusMap: Record<string, { label: string; color: BadgeColor }> = {
  مجدولة: { label: "مجدولة", color: "blue"   },
  قريبة:  { label: "قريبة",  color: "orange" },
  منعقدة: { label: "منعقدة", color: "green"  },
  مؤجلة:  { label: "مؤجلة",  color: "yellow" },
  ملغاة:  { label: "ملغاة",  color: "red"    },
};
const activeMap: Record<string, { label: string; color: BadgeColor }> = {
  نشط:  { label: "نشط",  color: "green" },
  معلق: { label: "معلق", color: "yellow"},
  محظور:{ label: "محظور",color: "red"   },
  موقف: { label: "موقف", color: "gray"  },
};

/* ─── CONFIGS ───────────────────────────────────────────── */
export const moduleConfigs: ModuleConfig[] = [

  /* 1. CASE MANAGEMENT */
  {
    slug: "case-management",
    entityName: "قضية",
    addLabel: "إضافة قضية جديدة",
    kpis: [
      { label: "إجمالي القضايا",  value: "128", delta: "+7 هذا الأسبوع", deltaPos: true,  icon: "⚖️", accent: "#c3152a" },
      { label: "قضايا نشطة",     value: "89",  delta: "70% من الإجمالي", deltaPos: true,  icon: "🟢", accent: "#22c55e" },
      { label: "جلسات الشهر",    value: "47",  delta: "12 هذا الأسبوع",  deltaPos: true,  icon: "🏛️", accent: "#0ea5e9" },
      { label: "إجمالي الرسوم",   value: "284k",delta: "+23% عن الشهر",   deltaPos: true,  icon: "💰", accent: "#f59e0b" },
    ],
    columns: [
      { key: "caseNo",    label: "رقم القضية" },
      { key: "client",    label: "الموكل" },
      { key: "type",      label: "النوع" },
      { key: "court",     label: "المحكمة" },
      { key: "status",    label: "الحالة",    type: "badge", badgeMap: casesStatusMap },
      { key: "nextDate",  label: "الجلسة القادمة" },
      { key: "fees",      label: "الرسوم",    type: "currency" },
    ],
    data: [
      { caseNo: "#2024-0547", client: "أحمد محمد الصاوي",      type: "استئناف تجاري",    court: "محكمة الاستئناف القاهرة",     status: "نشطة",  nextDate: "15 يوليو 2026", fees: "25000"  },
      { caseNo: "#2024-0548", client: "شركة النيل للتجارة",    type: "نزاع عقاري",       court: "المحكمة الابتدائية الجيزة",    status: "نشطة",  nextDate: "16 يوليو 2026", fees: "45000"  },
      { caseNo: "#2024-0312", client: "سارة إبراهيم المصري",   type: "أحوال شخصية",      court: "محكمة الأسرة القاهرة",          status: "معلقة", nextDate: "20 يوليو 2026", fees: "12000"  },
      { caseNo: "#2024-0299", client: "مجموعة الدلتا الصناعية",type: "عمالي",            court: "محكمة العمال القاهرة",           status: "نشطة",  nextDate: "22 يوليو 2026", fees: "38000"  },
      { caseNo: "#2024-0280", client: "خالد عبد الرحمن عمر",   type: "جنائي",            court: "محكمة الجنايات القاهرة",         status: "نشطة",  nextDate: "18 يوليو 2026", fees: "55000"  },
      { caseNo: "#2024-0265", client: "هدى سامي الشافعي",      type: "مدني",             court: "المحكمة الابتدائية القاهرة",     status: "فائزة", nextDate: "—",              fees: "18000"  },
      { caseNo: "#2024-0250", client: "شركة الأهرام للإنشاءات",type: "تجاري",            court: "محكمة التحكيم التجاري",          status: "نشطة",  nextDate: "25 يوليو 2026", fees: "120000" },
      { caseNo: "#2024-0231", client: "يوسف مصطفى حمدان",      type: "إداري",            court: "المحكمة الإدارية العليا",         status: "نشطة",  nextDate: "28 يوليو 2026", fees: "22000"  },
      { caseNo: "#2024-0215", client: "دينا كريم العزيزي",      type: "ملكية فكرية",      court: "المحكمة الاقتصادية القاهرة",     status: "معلقة", nextDate: "30 يوليو 2026", fees: "32000"  },
      { caseNo: "#2024-0200", client: "محمد طارق السيد",        type: "إفلاس",            court: "المحكمة الاقتصادية الإسكندرية", status: "نشطة",  nextDate: "1 أغسطس 2026",  fees: "68000"  },
      { caseNo: "#2024-0185", client: "مؤسسة الشرق للتصدير",   type: "جمركي",            court: "المحكمة الاقتصادية القاهرة",     status: "خاسرة", nextDate: "—",              fees: "15000"  },
      { caseNo: "#2024-0170", client: "رانيا أحمد فرحات",       type: "عقاري",            court: "المحكمة الابتدائية الجيزة",      status: "فائزة", nextDate: "—",              fees: "28000"  },
      { caseNo: "#2024-0155", client: "علي حسن الجوهري",        type: "عمالي",            court: "محكمة العمال الجيزة",            status: "نشطة",  nextDate: "5 أغسطس 2026",  fees: "9500"   },
      { caseNo: "#2024-0140", client: "شركة المعادي للاستثمار", type: "تجاري",            court: "محكمة الاستئناف القاهرة",        status: "محكوم", nextDate: "—",              fees: "95000"  },
      { caseNo: "#2024-0125", client: "أميرة عمر الحسيني",      type: "أحوال شخصية",      court: "محكمة الأسرة الجيزة",            status: "نشطة",  nextDate: "8 أغسطس 2026",  fees: "7500"   },
    ],
    formFields: [
      { key: "client",   label: "اسم الموكل",  type: "text",   required: true },
      { key: "type",     label: "نوع القضية",  type: "select", options: ["جنائي","مدني","تجاري","عمالي","أحوال شخصية","إداري","عقاري","ملكية فكرية","إفلاس","جمركي"] },
      { key: "court",    label: "المحكمة",     type: "select", options: ["محكمة النقض","محكمة الاستئناف القاهرة","المحكمة الابتدائية القاهرة","المحكمة الابتدائية الجيزة","محكمة الجنايات القاهرة","محكمة الأسرة القاهرة","محكمة العمال القاهرة","المحكمة الإدارية العليا","المحكمة الاقتصادية القاهرة","محكمة التحكيم التجاري"] },
      { key: "status",   label: "الحالة",      type: "select", options: ["نشطة","معلقة","مغلقة","فائزة","خاسرة","محكوم"] },
      { key: "nextDate", label: "الجلسة القادمة", type: "date" },
      { key: "fees",     label: "الرسوم ($)", type: "number", placeholder: "0" },
      { key: "notes",    label: "ملاحظات",     type: "textarea" },
    ],
  },

  /* 2. CLIENTS MANAGEMENT */
  {
    slug: "clients-management",
    entityName: "موكل",
    addLabel: "إضافة موكل جديد",
    kpis: [
      { label: "إجمالي الموكلين", value: "247", delta: "+14 هذا الشهر", deltaPos: true, icon: "👥", accent: "#0ea5e9" },
      { label: "موكلون نشطون",    value: "183", delta: "74% من الإجمالي", deltaPos: true, icon: "✅", accent: "#22c55e" },
      { label: "عقود سارية",      value: "91",  delta: "+3 هذا الأسبوع", deltaPos: true, icon: "📄", accent: "#8b5cf6" },
      { label: "إجمالي الوكالات", value: "156", delta: "+8 هذا الشهر",   deltaPos: true, icon: "🤝", accent: "#f59e0b" },
    ],
    columns: [
      { key: "id",      label: "#" },
      { key: "name",    label: "اسم الموكل" },
      { key: "type",    label: "النوع" },
      { key: "phone",   label: "الهاتف" },
      { key: "cases",   label: "عدد القضايا", type: "number" },
      { key: "status",  label: "الحالة",  type: "badge", badgeMap: activeMap },
      { key: "since",   label: "منذ" },
    ],
    data: [
      { id:1,  name:"أحمد محمد الصاوي",       type:"فرد",    phone:"0100-123-4567", cases:3,  status:"نشط",  since:"يناير 2023"  },
      { id:2,  name:"شركة النيل للتجارة",      type:"شركة",  phone:"0222-345-6789", cases:7,  status:"نشط",  since:"مارس 2022"   },
      { id:3,  name:"سارة إبراهيم المصري",     type:"فرد",    phone:"0115-234-5678", cases:2,  status:"نشط",  since:"يونيو 2023"  },
      { id:4,  name:"مجموعة الدلتا الصناعية",  type:"شركة",  phone:"0233-456-7890", cases:5,  status:"نشط",  since:"سبتمبر 2021" },
      { id:5,  name:"خالد عبد الرحمن عمر",    type:"فرد",    phone:"0112-987-6543", cases:1,  status:"نشط",  since:"أبريل 2024"  },
      { id:6,  name:"هدى سامي الشافعي",        type:"فرد",    phone:"0100-654-3210", cases:4,  status:"نشط",  since:"نوفمبر 2022" },
      { id:7,  name:"شركة الأهرام للإنشاءات", type:"شركة",  phone:"0244-567-8901", cases:9,  status:"نشط",  since:"يناير 2020"  },
      { id:8,  name:"يوسف مصطفى حمدان",       type:"فرد",    phone:"0111-765-4321", cases:2,  status:"معلق", since:"فبراير 2024" },
      { id:9,  name:"دينا كريم العزيزي",       type:"فرد",    phone:"0100-876-5432", cases:3,  status:"نشط",  since:"مايو 2023"   },
      { id:10, name:"مؤسسة الشرق للتصدير",    type:"مؤسسة", phone:"0255-678-9012", cases:6,  status:"نشط",  since:"أكتوبر 2021" },
      { id:11, name:"محمد طارق السيد",         type:"فرد",    phone:"0115-543-2109", cases:1,  status:"نشط",  since:"يوليو 2024"  },
      { id:12, name:"رانيا أحمد فرحات",        type:"فرد",    phone:"0100-432-1098", cases:2,  status:"نشط",  since:"مارس 2023"   },
      { id:13, name:"شركة المعادي للاستثمار",  type:"شركة",  phone:"0266-789-0123", cases:12, status:"نشط",  since:"مايو 2019"   },
      { id:14, name:"أميرة عمر الحسيني",       type:"فرد",    phone:"0112-321-0987", cases:1,  status:"نشط",  since:"يناير 2025"  },
      { id:15, name:"علي حسن الجوهري",         type:"فرد",    phone:"0111-210-9876", cases:3,  status:"معلق", since:"سبتمبر 2023" },
    ],
    formFields: [
      { key:"name",    label:"الاسم الكامل",       type:"text",   required:true },
      { key:"type",    label:"نوع الموكل",          type:"select", options:["فرد","شركة","مؤسسة","جهة حكومية"] },
      { key:"phone",   label:"رقم الهاتف",          type:"tel",    placeholder:"01X-XXX-XXXX" },
      { key:"email",   label:"البريد الإلكتروني",   type:"email",  placeholder:"example@email.com" },
      { key:"national",label:"رقم الهوية الوطنية", type:"text",   placeholder:"XXXXXXXXXXXXXX" },
      { key:"status",  label:"الحالة",              type:"select", options:["نشط","معلق","محظور","موقف"] },
      { key:"address", label:"العنوان",              type:"textarea" },
    ],
  },

  /* 3. COURT SESSIONS */
  {
    slug: "court-sessions",
    entityName: "جلسة",
    addLabel: "جدولة جلسة جديدة",
    kpis: [
      { label: "جلسات هذا الشهر",  value: "47",  delta: "+5 عن الشهر السابق", deltaPos: true,  icon: "🏛️", accent: "#0ea5e9" },
      { label: "جلسات هذا الأسبوع",value: "12",  delta: "3 غدًا",              deltaPos: true,  icon: "📅", accent: "#22c55e" },
      { label: "جلسات مؤجلة",     value: "8",   delta: "تتطلب إعادة جدولة",   deltaPos: false, icon: "⏳", accent: "#f59e0b" },
      { label: "قضايا محددة",      value: "89",  delta: "68 نشطة",             deltaPos: true,  icon: "⚖️", accent: "#c3152a" },
    ],
    columns: [
      { key: "caseNo",   label: "رقم القضية" },
      { key: "client",   label: "الموكل" },
      { key: "court",    label: "المحكمة" },
      { key: "room",     label: "القاعة" },
      { key: "date",     label: "التاريخ" },
      { key: "time",     label: "الوقت" },
      { key: "status",   label: "الحالة", type: "badge", badgeMap: sessionStatusMap },
    ],
    data: [
      { caseNo:"#2024-0547", client:"أحمد محمد الصاوي",       court:"محكمة الاستئناف القاهرة",     room:"الغرفة 7",   date:"15 يوليو 2026", time:"09:30 ص", status:"قريبة"  },
      { caseNo:"#2024-0548", client:"شركة النيل للتجارة",      court:"المحكمة الابتدائية الجيزة",   room:"القاعة 3",   date:"16 يوليو 2026", time:"11:00 ص", status:"مجدولة" },
      { caseNo:"#2024-0250", client:"شركة الأهرام للإنشاءات", court:"محكمة التحكيم التجاري",       room:"القاعة A",   date:"25 يوليو 2026", time:"10:00 ص", status:"مجدولة" },
      { caseNo:"#2024-0280", client:"خالد عبد الرحمن عمر",    court:"محكمة الجنايات القاهرة",       room:"قاعة الكبرى",date:"18 يوليو 2026", time:"08:30 ص", status:"قريبة"  },
      { caseNo:"#2024-0231", client:"يوسف مصطفى حمدان",       court:"المحكمة الإدارية العليا",      room:"الغرفة 12",  date:"28 يوليو 2026", time:"12:00 م", status:"مجدولة" },
      { caseNo:"#2024-0215", client:"دينا كريم العزيزي",       court:"المحكمة الاقتصادية القاهرة",  room:"القاعة 5",   date:"30 يوليو 2026", time:"09:00 ص", status:"مجدولة" },
      { caseNo:"#2024-0299", client:"مجموعة الدلتا الصناعية", court:"محكمة العمال القاهرة",         room:"القاعة 2",   date:"22 يوليو 2026", time:"10:30 ص", status:"مجدولة" },
      { caseNo:"#2024-0155", client:"علي حسن الجوهري",         court:"محكمة العمال الجيزة",          room:"القاعة 1",   date:"5 أغسطس 2026",  time:"09:00 ص", status:"مجدولة" },
      { caseNo:"#2024-0125", client:"أميرة عمر الحسيني",       court:"محكمة الأسرة الجيزة",          room:"الغرفة 4",   date:"8 أغسطس 2026",  time:"11:00 ص", status:"مجدولة" },
      { caseNo:"#2024-0312", client:"سارة إبراهيم المصري",    court:"محكمة الأسرة القاهرة",          room:"الغرفة 6",   date:"20 يوليو 2026",  time:"10:00 ص", status:"مؤجلة"  },
      { caseNo:"#2024-0200", client:"محمد طارق السيد",         court:"المحكمة الاقتصادية الإسكندرية",room:"القاعة 3",   date:"1 أغسطس 2026",  time:"09:30 ص", status:"مجدولة" },
      { caseNo:"#2023-0890", client:"شركة المعادي للاستثمار",  court:"محكمة الاستئناف القاهرة",     room:"الغرفة 9",   date:"12 يوليو 2026",  time:"10:00 ص", status:"منعقدة" },
    ],
    formFields: [
      { key:"caseNo",  label:"رقم القضية",        type:"text",   required:true },
      { key:"client",  label:"اسم الموكل",         type:"text",   required:true },
      { key:"court",   label:"المحكمة",            type:"select", options:["محكمة الاستئناف القاهرة","المحكمة الابتدائية القاهرة","المحكمة الابتدائية الجيزة","محكمة الجنايات القاهرة","محكمة الأسرة القاهرة","محكمة العمال القاهرة","المحكمة الإدارية العليا","المحكمة الاقتصادية القاهرة","محكمة التحكيم التجاري","المحكمة الاقتصادية الإسكندرية"] },
      { key:"room",    label:"القاعة / الغرفة",    type:"text",   placeholder:"مثال: القاعة 3" },
      { key:"date",    label:"تاريخ الجلسة",       type:"date",   required:true },
      { key:"time",    label:"وقت الجلسة",         type:"text",   placeholder:"09:00 ص" },
      { key:"status",  label:"الحالة",             type:"select", options:["مجدولة","قريبة","منعقدة","مؤجلة","ملغاة"] },
      { key:"notes",   label:"ملاحظات",            type:"textarea" },
    ],
  },

  /* 4. FOLLOW-UP CENTER */
  {
    slug: "follow-up-center",
    entityName: "متابعة",
    addLabel: "إضافة متابعة جديدة",
    kpis: [
      { label: "إجمالي المتابعات", value: "94",  delta: "+6 هذا الأسبوع", deltaPos: true,  icon: "📋", accent: "#0ea5e9" },
      { label: "متابعات عاجلة",   value: "18",  delta: "تحتاج تدخل",      deltaPos: false, icon: "⚡", accent: "#c3152a" },
      { label: "أحكام معلقة",     value: "12",  delta: "منتظرة تنفيذ",    deltaPos: false, icon: "⚖️", accent: "#f59e0b" },
      { label: "مكتملة هذا الشهر",value: "37",  delta: "+15% عن الشهر",   deltaPos: true,  icon: "✅", accent: "#22c55e" },
    ],
    columns: [
      { key:"ref",      label:"المرجع" },
      { key:"type",     label:"النوع" },
      { key:"client",   label:"الموكل" },
      { key:"due",      label:"الموعد النهائي" },
      { key:"priority", label:"الأولوية",  type:"badge", badgeMap: priorityMap },
      { key:"status",   label:"الحالة",    type:"badge", badgeMap: { مكتمل:{label:"مكتمل",color:"green"}, جارٍ:{label:"جارٍ",color:"blue"}, معلق:{label:"معلق",color:"yellow"}, متأخر:{label:"متأخر",color:"red"} } },
    ],
    data: [
      { ref:"FU-001", type:"متابعة حكم",     client:"أحمد محمد الصاوي",       due:"15 يوليو 2026", priority:"عاجل",  status:"جارٍ"  },
      { ref:"FU-002", type:"متابعة سداد",    client:"شركة النيل للتجارة",      due:"20 يوليو 2026", priority:"عالٍ",  status:"معلق"  },
      { ref:"FU-003", type:"متابعة إجراء",   client:"مجموعة الدلتا الصناعية",  due:"18 يوليو 2026", priority:"عاجل",  status:"جارٍ"  },
      { ref:"FU-004", type:"متابعة أتعاب",   client:"شركة الأهرام للإنشاءات", due:"25 يوليو 2026", priority:"متوسط", status:"معلق"  },
      { ref:"FU-005", type:"متابعة سداد",    client:"يوسف مصطفى حمدان",       due:"10 يوليو 2026", priority:"عاجل",  status:"متأخر" },
      { ref:"FU-006", type:"متابعة حكم",     client:"دينا كريم العزيزي",       due:"30 يوليو 2026", priority:"متوسط", status:"جارٍ"  },
      { ref:"FU-007", type:"متابعة إجراء",   client:"شركة المعادي للاستثمار",  due:"5 أغسطس 2026",  priority:"منخفض", status:"معلق"  },
      { ref:"FU-008", type:"متابعة أتعاب",   client:"سارة إبراهيم المصري",    due:"22 يوليو 2026", priority:"عالٍ",  status:"مكتمل" },
      { ref:"FU-009", type:"متابعة سداد",    client:"خالد عبد الرحمن عمر",    due:"28 يوليو 2026", priority:"عالٍ",  status:"جارٍ"  },
      { ref:"FU-010", type:"متابعة حكم",     client:"رانيا أحمد فرحات",        due:"1 أغسطس 2026",  priority:"متوسط", status:"مكتمل" },
      { ref:"FU-011", type:"متابعة إجراء",   client:"محمد طارق السيد",         due:"3 أغسطس 2026",  priority:"منخفض", status:"معلق"  },
      { ref:"FU-012", type:"متابعة أتعاب",   client:"مؤسسة الشرق للتصدير",    due:"8 أغسطس 2026",  priority:"عاجل",  status:"جارٍ"  },
    ],
    formFields: [
      { key:"type",   label:"نوع المتابعة",   type:"select",   options:["متابعة حكم","متابعة إجراء","متابعة سداد","متابعة أتعاب"] },
      { key:"client", label:"الموكل",          type:"text",     required:true },
      { key:"due",    label:"الموعد النهائي",  type:"date",     required:true },
      { key:"priority",label:"الأولوية",       type:"select",   options:["عاجل","عالٍ","متوسط","منخفض"] },
      { key:"status", label:"الحالة",          type:"select",   options:["معلق","جارٍ","مكتمل","متأخر"] },
      { key:"notes",  label:"ملاحظات",         type:"textarea" },
    ],
  },

  /* 5. LEGAL ACCOUNTING */
  {
    slug: "legal-accounting",
    entityName: "سجل مالي",
    addLabel: "إضافة سجل مالي",
    kpis: [
      { label: "إجمالي الرسوم",       value: "724k",  delta: "+23% عن الشهر",   deltaPos: true,  icon: "💰", accent: "#22c55e"  },
      { label: "مدفوعات هذا الشهر",   value: "184k",  delta: "+18% عن الشهر",   deltaPos: true,  icon: "💳", accent: "#0ea5e9"  },
      { label: "مبالغ معلقة",         value: "312k",  delta: "43% من الإجمالي", deltaPos: false, icon: "⏳", accent: "#f59e0b"  },
      { label: "فواتير غير مسددة",    value: "28",    delta: "8 متأخرة",         deltaPos: false, icon: "📄", accent: "#c3152a"  },
    ],
    columns: [
      { key:"invoiceNo", label:"رقم الفاتورة" },
      { key:"client",    label:"الموكل" },
      { key:"type",      label:"النوع" },
      { key:"amount",    label:"المبلغ",       type:"currency" },
      { key:"paid",      label:"المسدد",       type:"currency" },
      { key:"issueDate", label:"تاريخ الإصدار" },
      { key:"status",    label:"الحالة",   type:"badge", badgeMap: payStatusMap },
    ],
    data: [
      { invoiceNo:"INV-2024-001", client:"شركة النيل للتجارة",      type:"رسوم قضية",        amount:"45000",  paid:"45000",  issueDate:"1 يونيو 2024",  status:"مسدد"       },
      { invoiceNo:"INV-2024-002", client:"أحمد محمد الصاوي",        type:"رسوم استشارة",     amount:"12000",  paid:"6000",   issueDate:"5 يونيو 2024",  status:"جزئي"       },
      { invoiceNo:"INV-2024-003", client:"شركة الأهرام للإنشاءات", type:"رسوم قضية",        amount:"95000",  paid:"0",      issueDate:"10 يونيو 2024", status:"غير مسدد"   },
      { invoiceNo:"INV-2024-004", client:"مجموعة الدلتا الصناعية", type:"رسوم تحكيم",       amount:"38000",  paid:"38000",  issueDate:"15 يونيو 2024", status:"مسدد"       },
      { invoiceNo:"INV-2024-005", client:"دينا كريم العزيزي",       type:"رسوم قضية",        amount:"32000",  paid:"16000",  issueDate:"20 يونيو 2024", status:"جزئي"       },
      { invoiceNo:"INV-2024-006", client:"مؤسسة الشرق للتصدير",    type:"رسوم استشارة",     amount:"18000",  paid:"18000",  issueDate:"25 يونيو 2024", status:"مسدد"       },
      { invoiceNo:"INV-2024-007", client:"محمد طارق السيد",         type:"رسوم قضية",        amount:"68000",  paid:"0",      issueDate:"1 يوليو 2024",  status:"غير مسدد"   },
      { invoiceNo:"INV-2024-008", client:"شركة المعادي للاستثمار",  type:"رسوم سنوية",       amount:"120000", paid:"60000",  issueDate:"5 يوليو 2024",  status:"جزئي"       },
      { invoiceNo:"INV-2024-009", client:"سارة إبراهيم المصري",    type:"رسوم قضية",        amount:"9500",   paid:"9500",   issueDate:"8 يوليو 2024",  status:"مسدد"       },
      { invoiceNo:"INV-2024-010", client:"رانيا أحمد فرحات",        type:"رسوم استشارة",     amount:"5500",   paid:"5500",   issueDate:"10 يوليو 2024", status:"مسدد"       },
      { invoiceNo:"INV-2024-011", client:"خالد عبد الرحمن عمر",    type:"رسوم قضية",        amount:"55000",  paid:"0",      issueDate:"12 يوليو 2024", status:"غير مسدد"   },
      { invoiceNo:"INV-2024-012", client:"أميرة عمر الحسيني",       type:"رسوم استشارة",     amount:"4500",   paid:"4500",   issueDate:"15 يوليو 2024", status:"مسدد"       },
    ],
    formFields: [
      { key:"client",    label:"الموكل",           type:"text",   required:true },
      { key:"type",      label:"نوع الرسوم",       type:"select", options:["رسوم قضية","رسوم استشارة","رسوم تحكيم","رسوم سنوية","مصروفات قضائية"] },
      { key:"amount",    label:"المبلغ الإجمالي ($)",  type:"number", required:true },
      { key:"paid",      label:"المبلغ المسدد ($)",    type:"number" },
      { key:"issueDate", label:"تاريخ الفاتورة",   type:"date",   required:true },
      { key:"dueDate",   label:"تاريخ الاستحقاق",  type:"date" },
      { key:"status",    label:"حالة السداد",      type:"select", options:["مسدد","جزئي","غير مسدد","مؤجل"] },
      { key:"notes",     label:"ملاحظات",           type:"textarea" },
    ],
  },

  /* 6. LEGAL SERVICES */
  {
    slug: "legal-services",
    entityName: "خدمة",
    addLabel: "إضافة طلب خدمة",
    kpis: [
      { label: "طلبات هذا الشهر",  value: "67",  delta: "+12 عن الشهر",  deltaPos: true,  icon: "📝", accent: "#8b5cf6" },
      { label: "طلبات منجزة",     value: "48",  delta: "72%",             deltaPos: true,  icon: "✅", accent: "#22c55e" },
      { label: "طلبات جارية",     value: "14",  delta: "نشطة",            deltaPos: true,  icon: "⚡", accent: "#0ea5e9" },
      { label: "متوسط وقت التنفيذ",value: "3.2", delta: "أيام",           deltaPos: true,  icon: "⏱️", accent: "#f59e0b" },
    ],
    columns: [
      { key:"ref",       label:"المرجع" },
      { key:"service",   label:"الخدمة" },
      { key:"client",    label:"الموكل" },
      { key:"assignedTo",label:"المسؤول" },
      { key:"requested", label:"تاريخ الطلب" },
      { key:"priority",  label:"الأولوية", type:"badge", badgeMap: priorityMap },
      { key:"status",    label:"الحالة",   type:"badge", badgeMap: { منجز:{label:"منجز",color:"green"}, جارٍ:{label:"جارٍ",color:"blue"}, معلق:{label:"معلق",color:"yellow"}, ملغى:{label:"ملغى",color:"red"} } },
    ],
    data: [
      { ref:"SRV-001", service:"صياغة عقد بيع",          client:"شركة النيل",            assignedTo:"م. سامي علي",     requested:"2 يوليو 2026",  priority:"عالٍ",  status:"منجز"  },
      { ref:"SRV-002", service:"مراجعة عقد إيجار",       client:"أحمد الصاوي",           assignedTo:"م. منى محمد",     requested:"3 يوليو 2026",  priority:"متوسط", status:"جارٍ"  },
      { ref:"SRV-003", service:"إعداد توكيل رسمي",       client:"دينا العزيزي",           assignedTo:"م. كريم أحمد",    requested:"4 يوليو 2026",  priority:"عاجل",  status:"منجز"  },
      { ref:"SRV-004", service:"استشارة قانونية مكتوبة", client:"شركة الأهرام",           assignedTo:"م. هدى إبراهيم",  requested:"5 يوليو 2026",  priority:"عالٍ",  status:"جارٍ"  },
      { ref:"SRV-005", service:"صياغة مذكرة دفاعية",    client:"خالد عبد الرحمن",        assignedTo:"م. يوسف طارق",    requested:"6 يوليو 2026",  priority:"عاجل",  status:"جارٍ"  },
      { ref:"SRV-006", service:"مراجعة عقد شراكة",      client:"مجموعة الدلتا",          assignedTo:"م. سامي علي",     requested:"6 يوليو 2026",  priority:"متوسط", status:"معلق"  },
      { ref:"SRV-007", service:"إعداد عقد عمل",          client:"شركة المعادي",           assignedTo:"م. رانيا فرحات",  requested:"7 يوليو 2026",  priority:"منخفض", status:"معلق"  },
      { ref:"SRV-008", service:"بحث قانوني",              client:"مؤسسة الشرق",           assignedTo:"م. طارق عمر",     requested:"7 يوليو 2026",  priority:"متوسط", status:"جارٍ"  },
    ],
    formFields: [
      { key:"service",   label:"نوع الخدمة",    type:"select", options:["صياغة عقد","مراجعة عقد","إعداد توكيل","استشارة مكتوبة","صياغة مذكرة","بحث قانوني","ترجمة قانونية","تسجيل حقوق ملكية"] },
      { key:"client",    label:"الموكل",         type:"text",   required:true },
      { key:"assignedTo",label:"المسؤول",        type:"text",   required:true },
      { key:"requested", label:"تاريخ الطلب",    type:"date",   required:true },
      { key:"priority",  label:"الأولوية",       type:"select", options:["عاجل","عالٍ","متوسط","منخفض"] },
      { key:"status",    label:"الحالة",         type:"select", options:["معلق","جارٍ","منجز","ملغى"] },
      { key:"notes",     label:"ملاحظات",        type:"textarea" },
    ],
  },

  /* 7. LEGAL CONSULTATIONS */
  {
    slug: "legal-consultations",
    entityName: "استشارة",
    addLabel: "تسجيل استشارة جديدة",
    kpis: [
      { label: "استشارات هذا الشهر", value: "52",  delta: "+8 عن الشهر السابق", deltaPos: true, icon: "💬", accent: "#0ea5e9" },
      { label: "استشارات مكتملة",    value: "44",  delta: "85%",                  deltaPos: true, icon: "✅", accent: "#22c55e" },
      { label: "إيرادات الاستشارات", value: "38k", delta: "+20% عن الشهر",        deltaPos: true, icon: "💰", accent: "#f59e0b" },
      { label: "عملاء جدد",          value: "11",  delta: "من الاستشارات",         deltaPos: true, icon: "👤", accent: "#8b5cf6" },
    ],
    columns: [
      { key:"ref",        label:"المرجع" },
      { key:"client",     label:"العميل" },
      { key:"topic",      label:"موضوع الاستشارة" },
      { key:"lawyer",     label:"المستشار" },
      { key:"date",       label:"التاريخ" },
      { key:"duration",   label:"المدة" },
      { key:"status",     label:"الحالة", type:"badge", badgeMap: { مكتملة:{label:"مكتملة",color:"green"}, مجدولة:{label:"مجدولة",color:"blue"}, ملغاة:{label:"ملغاة",color:"red"} } },
    ],
    data: [
      { ref:"CON-001", client:"أحمد الصاوي",      topic:"نزاع عقاري",           lawyer:"م. سامي علي",    date:"1 يوليو 2026",  duration:"45 دقيقة", status:"مكتملة" },
      { ref:"CON-002", client:"شركة النيل",        topic:"عقود التوريد",         lawyer:"م. منى محمد",    date:"2 يوليو 2026",  duration:"60 دقيقة", status:"مكتملة" },
      { ref:"CON-003", client:"دينا العزيزي",      topic:"حقوق الملكية الفكرية", lawyer:"م. كريم أحمد",   date:"3 يوليو 2026",  duration:"30 دقيقة", status:"مكتملة" },
      { ref:"CON-004", client:"خالد عمر",          topic:"قانون العمل",          lawyer:"م. هدى إبراهيم", date:"5 يوليو 2026",  duration:"50 دقيقة", status:"مكتملة" },
      { ref:"CON-005", client:"رانيا فرحات",       topic:"الإفلاس التجاري",      lawyer:"م. يوسف طارق",   date:"8 يوليو 2026",  duration:"90 دقيقة", status:"مكتملة" },
      { ref:"CON-006", client:"محمد طارق",         topic:"نزاع عائلي",           lawyer:"م. سامي علي",    date:"10 يوليو 2026", duration:"45 دقيقة", status:"مجدولة" },
      { ref:"CON-007", client:"شركة المعادي",      topic:"عقود الشراكة",         lawyer:"م. منى محمد",    date:"12 يوليو 2026", duration:"60 دقيقة", status:"مجدولة" },
      { ref:"CON-008", client:"أميرة الحسيني",     topic:"أحوال شخصية",          lawyer:"م. كريم أحمد",   date:"15 يوليو 2026", duration:"30 دقيقة", status:"مجدولة" },
    ],
    formFields: [
      { key:"client",   label:"اسم العميل",          type:"text",   required:true },
      { key:"topic",    label:"موضوع الاستشارة",     type:"text",   required:true },
      { key:"lawyer",   label:"المستشار القانوني",   type:"text",   required:true },
      { key:"date",     label:"تاريخ الاستشارة",     type:"date",   required:true },
      { key:"duration", label:"المدة المقدرة",       type:"select", options:["30 دقيقة","45 دقيقة","60 دقيقة","90 دقيقة","120 دقيقة"] },
      { key:"status",   label:"الحالة",              type:"select", options:["مجدولة","مكتملة","ملغاة"] },
      { key:"notes",    label:"ملاحظات",             type:"textarea" },
    ],
  },

  /* 8. INTERNAL REQUESTS */
  {
    slug: "internal-requests",
    entityName: "طلب",
    addLabel: "فتح طلب جديد",
    kpis: [
      { label: "طلبات مفتوحة",    value: "23",  delta: "+5 هذا الأسبوع",  deltaPos: false, icon: "📤", accent: "#c3152a" },
      { label: "طلبات منجزة",    value: "88",  delta: "هذا الشهر",        deltaPos: true,  icon: "✅", accent: "#22c55e" },
      { label: "متوسط الإنجاز",  value: "2.1", delta: "أيام",             deltaPos: true,  icon: "⚡", accent: "#0ea5e9" },
      { label: "طلبات متأخرة",   value: "4",   delta: "تتجاوز المدة",     deltaPos: false, icon: "⏰", accent: "#f59e0b" },
    ],
    columns: [
      { key:"ref",       label:"المرجع" },
      { key:"title",     label:"الطلب" },
      { key:"requester", label:"مقدم الطلب" },
      { key:"dept",      label:"القسم" },
      { key:"date",      label:"تاريخ الفتح" },
      { key:"priority",  label:"الأولوية", type:"badge", badgeMap: priorityMap },
      { key:"status",    label:"الحالة",   type:"badge", badgeMap: { منجز:{label:"منجز",color:"green"}, جارٍ:{label:"جارٍ",color:"blue"}, مفتوح:{label:"مفتوح",color:"yellow"}, متأخر:{label:"متأخر",color:"red"} } },
    ],
    data: [
      { ref:"IR-001", title:"طلب إذن إجازة",         requester:"م. سامي علي",     dept:"القضايا",     date:"1 يوليو 2026", priority:"منخفض", status:"منجز"  },
      { ref:"IR-002", title:"طلب معدات مكتبية",      requester:"م. منى محمد",     dept:"الاستشارات",  date:"2 يوليو 2026", priority:"متوسط", status:"جارٍ"  },
      { ref:"IR-003", title:"طلب وصول نظام",         requester:"م. كريم أحمد",    dept:"IT",          date:"3 يوليو 2026", priority:"عالٍ",  status:"مفتوح" },
      { ref:"IR-004", title:"طلب تدريب قانوني",      requester:"م. هدى إبراهيم",  dept:"القضايا",     date:"4 يوليو 2026", priority:"متوسط", status:"جارٍ"  },
      { ref:"IR-005", title:"طلب صرف مصروفات",      requester:"م. يوسف طارق",    dept:"المالية",     date:"5 يوليو 2026", priority:"عاجل",  status:"منجز"  },
      { ref:"IR-006", title:"طلب مراجعة عقد موظف",  requester:"م. رانيا فرحات",  dept:"HR",          date:"6 يوليو 2026", priority:"عالٍ",  status:"متأخر" },
      { ref:"IR-007", title:"طلب طباعة مستندات",    requester:"م. طارق عمر",     dept:"الأرشيف",     date:"7 يوليو 2026", priority:"منخفض", status:"منجز"  },
      { ref:"IR-008", title:"طلب تحديث بيانات موكل",requester:"م. سامي علي",     dept:"القضايا",     date:"7 يوليو 2026", priority:"عاجل",  status:"جارٍ"  },
    ],
    formFields: [
      { key:"title",     label:"موضوع الطلب",    type:"text",   required:true },
      { key:"requester", label:"مقدم الطلب",    type:"text",   required:true },
      { key:"dept",      label:"القسم",          type:"select", options:["القضايا","الاستشارات","المالية","HR","IT","الأرشيف","الإدارة"] },
      { key:"priority",  label:"الأولوية",      type:"select", options:["عاجل","عالٍ","متوسط","منخفض"] },
      { key:"status",    label:"الحالة",         type:"select", options:["مفتوح","جارٍ","منجز","متأخر"] },
      { key:"notes",     label:"تفاصيل الطلب",  type:"textarea", required:true },
    ],
  },

  /* 9. COMPLAINTS MANAGEMENT */
  {
    slug: "complaints-management",
    entityName: "شكوى",
    addLabel: "تسجيل شكوى جديدة",
    kpis: [
      { label: "شكاوى مفتوحة",   value: "12", delta: "+3 هذا الأسبوع",   deltaPos: false, icon: "🔔", accent: "#c3152a" },
      { label: "شكاوى منجزة",   value: "65", delta: "هذا الربع",         deltaPos: true,  icon: "✅", accent: "#22c55e" },
      { label: "متوسط حل الشكوى",value: "4.5",delta: "أيام",             deltaPos: false, icon: "⏱️", accent: "#f59e0b" },
      { label: "رضا العملاء",   value: "94%", delta: "+2% عن الربع السابق",deltaPos: true, icon: "😊", accent: "#8b5cf6" },
    ],
    columns: [
      { key:"ref",     label:"المرجع" },
      { key:"client",  label:"العميل" },
      { key:"subject", label:"موضوع الشكوى" },
      { key:"date",    label:"تاريخ الاستلام" },
      { key:"category",label:"التصنيف" },
      { key:"priority",label:"الأولوية", type:"badge", badgeMap: priorityMap },
      { key:"status",  label:"الحالة",   type:"badge", badgeMap: { مغلق:{label:"مغلق",color:"green"}, تحقيق:{label:"تحقيق",color:"blue"}, مفتوح:{label:"مفتوح",color:"yellow"}, مرفوض:{label:"مرفوض",color:"red"} } },
    ],
    data: [
      { ref:"CMP-001", client:"سارة المصري",    subject:"تأخر في تقديم الاعتراض",   date:"1 يوليو 2026", category:"تأخير",       priority:"عالٍ",  status:"مفتوح"  },
      { ref:"CMP-002", client:"أحمد الصاوي",   subject:"عدم التواصل من الفريق",     date:"2 يوليو 2026", category:"تواصل",       priority:"متوسط", status:"تحقيق"  },
      { ref:"CMP-003", client:"شركة الدلتا",   subject:"خطأ في تفاصيل العقد",       date:"3 يوليو 2026", category:"وثائق",       priority:"عاجل",  status:"مفتوح"  },
      { ref:"CMP-004", client:"خالد عمر",      subject:"رسوم إضافية غير مبررة",     date:"28 يونيو 2026",category:"مالي",        priority:"عالٍ",  status:"تحقيق"  },
      { ref:"CMP-005", client:"رانيا فرحات",   subject:"عدم الاستجابة للاستشارة",  date:"25 يونيو 2026",category:"تواصل",       priority:"متوسط", status:"مغلق"   },
      { ref:"CMP-006", client:"شركة المعادي",  subject:"اختلاف في استراتيجية الدفاع",date:"20 يونيو 2026",category:"قانوني",     priority:"عاجل",  status:"مغلق"   },
      { ref:"CMP-007", client:"أميرة الحسيني", subject:"تأخر في إعداد المستندات",   date:"15 يونيو 2026",category:"تأخير",       priority:"عالٍ",  status:"مغلق"   },
    ],
    formFields: [
      { key:"client",  label:"اسم العميل",      type:"text",   required:true },
      { key:"subject", label:"موضوع الشكوى",   type:"text",   required:true },
      { key:"category",label:"التصنيف",         type:"select", options:["تأخير","تواصل","وثائق","مالي","قانوني","أخرى"] },
      { key:"priority",label:"الأولوية",        type:"select", options:["عاجل","عالٍ","متوسط","منخفض"] },
      { key:"status",  label:"الحالة",          type:"select", options:["مفتوح","تحقيق","مغلق","مرفوض"] },
      { key:"details", label:"تفاصيل الشكوى",  type:"textarea", required:true },
    ],
  },

  /* 10. SMART TEMPLATES */
  {
    slug: "smart-templates",
    entityName: "قالب",
    addLabel: "إنشاء قالب جديد",
    kpis: [
      { label: "إجمالي القوالب",    value: "48",  delta: "+5 هذا الشهر",     deltaPos: true,  icon: "🤖", accent: "#8b5cf6" },
      { label: "استخدامات هذا الشهر",value: "187", delta: "+34 عن الشهر",    deltaPos: true,  icon: "📄", accent: "#0ea5e9" },
      { label: "قوالب مميزة",       value: "12",  delta: "الأكثر استخدامًا", deltaPos: true,  icon: "⭐", accent: "#f59e0b" },
      { label: "وقت توفير يومي",    value: "3.5h",delta: "ساعات في المتوسط", deltaPos: true,  icon: "⏱️", accent: "#22c55e" },
    ],
    columns: [
      { key:"name",      label:"اسم القالب" },
      { key:"category",  label:"التصنيف" },
      { key:"uses",      label:"عدد الاستخدامات", type:"number" },
      { key:"lastUsed",  label:"آخر استخدام" },
      { key:"createdBy", label:"أنشأه" },
      { key:"status",    label:"الحالة", type:"badge", badgeMap: { نشط:{label:"نشط",color:"green"}, مسودة:{label:"مسودة",color:"yellow"}, معطل:{label:"معطل",color:"gray"} } },
    ],
    data: [
      { name:"عقد الوكالة القانونية العامة",      category:"عقود",        uses:47, lastUsed:"7 يوليو 2026",  createdBy:"م. سامي",  status:"نشط"   },
      { name:"مذكرة دفاعية — جنائي",              category:"مذكرات",      uses:38, lastUsed:"6 يوليو 2026",  createdBy:"م. منى",   status:"نشط"   },
      { name:"خطاب إشعار قانوني",                category:"مراسلات",     uses:29, lastUsed:"5 يوليو 2026",  createdBy:"م. كريم",  status:"نشط"   },
      { name:"عقد البيع والشراء العقاري",          category:"عقود",        uses:24, lastUsed:"4 يوليو 2026",  createdBy:"م. هدى",   status:"نشط"   },
      { name:"توكيل خاص — قضايا الأسرة",          category:"توكيلات",     uses:19, lastUsed:"3 يوليو 2026",  createdBy:"م. سامي",  status:"نشط"   },
      { name:"عقد العمل الفردي",                  category:"عقود",        uses:16, lastUsed:"2 يوليو 2026",  createdBy:"م. منى",   status:"نشط"   },
      { name:"لائحة اعتراضية — إداري",            category:"مذكرات",      uses:12, lastUsed:"1 يوليو 2026",  createdBy:"م. كريم",  status:"نشط"   },
      { name:"اتفاقية السرية وعدم الإفصاح",       category:"عقود",        uses:9,  lastUsed:"28 يونيو 2026", createdBy:"م. يوسف",  status:"نشط"   },
      { name:"طلب إنهاء عقد التوريد",             category:"مراسلات",     uses:7,  lastUsed:"25 يونيو 2026", createdBy:"م. رانيا", status:"نشط"   },
      { name:"تقرير تقييم الضرر",                category:"تقارير",      uses:5,  lastUsed:"20 يونيو 2026", createdBy:"م. طارق",  status:"مسودة" },
    ],
    formFields: [
      { key:"name",      label:"اسم القالب",    type:"text",   required:true },
      { key:"category",  label:"التصنيف",        type:"select", options:["عقود","مذكرات","مراسلات","توكيلات","تقارير","صحائف دعوى","طعون"] },
      { key:"createdBy", label:"أنشأه",          type:"text",   required:true },
      { key:"status",    label:"الحالة",         type:"select", options:["نشط","مسودة","معطل"] },
      { key:"content",   label:"محتوى القالب",  type:"textarea" },
    ],
  },

  /* 11. REPORTS CENTER */
  {
    slug: "reports-center",
    entityName: "تقرير",
    addLabel: "إنشاء تقرير جديد",
    kpis: [
      { label: "تقارير هذا الشهر",  value: "34",  delta: "+8 عن الشهر",     deltaPos: true, icon: "📊", accent: "#0ea5e9" },
      { label: "تقارير مجدولة",    value: "12",  delta: "دورية تلقائية",    deltaPos: true, icon: "🔄", accent: "#22c55e" },
      { label: "آخر تصدير",        value: "PDF", delta: "منذ 3 ساعات",      deltaPos: true, icon: "📁", accent: "#f59e0b" },
      { label: "مستخدم التقارير",  value: "6",   delta: "مستخدمين نشطين",  deltaPos: true, icon: "👥", accent: "#8b5cf6" },
    ],
    columns: [
      { key:"name",     label:"اسم التقرير" },
      { key:"type",     label:"النوع" },
      { key:"period",   label:"الفترة" },
      { key:"createdBy",label:"أنشأه" },
      { key:"created",  label:"تاريخ الإنشاء" },
      { key:"format",   label:"الصيغة" },
      { key:"status",   label:"الحالة", type:"badge", badgeMap: { جاهز:{label:"جاهز",color:"green"}, جارٍ:{label:"جارٍ",color:"blue"}, فشل:{label:"فشل",color:"red"} } },
    ],
    data: [
      { name:"تقرير القضايا الشهري",     type:"تشغيلي", period:"يونيو 2026", createdBy:"م. سامي", created:"1 يوليو 2026",  format:"PDF", status:"جاهز" },
      { name:"تقرير الإيرادات الربعي",   type:"مالي",   period:"Q2 2026",    createdBy:"م. منى",  created:"2 يوليو 2026",  format:"XLSX",status:"جاهز" },
      { name:"تقرير أداء الفريق",        type:"إداري",  period:"يونيو 2026", createdBy:"م. كريم", created:"3 يوليو 2026",  format:"PDF", status:"جاهز" },
      { name:"تقرير الجلسات الأسبوعية",  type:"تشغيلي", period:"أسبوع 27",   createdBy:"م. هدى",  created:"5 يوليو 2026",  format:"PDF", status:"جاهز" },
      { name:"تقرير مدفوعات الموكلين",   type:"مالي",   period:"يونيو 2026", createdBy:"م. يوسف", created:"6 يوليو 2026",  format:"XLSX",status:"جاهز" },
      { name:"تقرير المتابعات المتأخرة", type:"تشغيلي", period:"يوليو 2026", createdBy:"م. رانيا",created:"7 يوليو 2026",  format:"PDF", status:"جارٍ" },
      { name:"تقرير الشكاوى الربعي",     type:"إداري",  period:"Q2 2026",    createdBy:"م. طارق", created:"8 يوليو 2026",  format:"PDF", status:"جارٍ" },
    ],
    formFields: [
      { key:"name",     label:"اسم التقرير",    type:"text",   required:true },
      { key:"type",     label:"نوع التقرير",    type:"select", options:["تشغيلي","مالي","إداري","قانوني","إحصائي"] },
      { key:"period",   label:"الفترة الزمنية", type:"text",   placeholder:"مثال: يونيو 2026" },
      { key:"format",   label:"صيغة الملف",    type:"select", options:["PDF","XLSX","CSV","Word"] },
      { key:"schedule", label:"جدولة دورية",   type:"select", options:["مرة واحدة","يومي","أسبوعي","شهري","ربع سنوي"] },
      { key:"notes",    label:"ملاحظات",        type:"textarea" },
    ],
  },

  /* 12. ADMINISTRATION */
  {
    slug: "administration",
    entityName: "مستخدم",
    addLabel: "إضافة مستخدم جديد",
    kpis: [
      { label: "إجمالي المستخدمين", value: "18",  delta: "+2 هذا الشهر",    deltaPos: true,  icon: "👥", accent: "#0ea5e9" },
      { label: "مستخدمون نشطون",   value: "15",  delta: "83%",               deltaPos: true,  icon: "✅", accent: "#22c55e" },
      { label: "أدوار محددة",      value: "6",   delta: "صلاحيات مختلفة",   deltaPos: true,  icon: "🔐", accent: "#8b5cf6" },
      { label: "تسجيلات اليوم",    value: "47",  delta: "حدث تدقيق",        deltaPos: true,  icon: "📋", accent: "#f59e0b" },
    ],
    columns: [
      { key:"id",      label:"#" },
      { key:"name",    label:"الاسم" },
      { key:"email",   label:"البريد" },
      { key:"role",    label:"الدور" },
      { key:"dept",    label:"القسم" },
      { key:"lastSeen",label:"آخر ظهور" },
      { key:"status",  label:"الحالة", type:"badge", badgeMap: { نشط:{label:"نشط",color:"green"}, معطل:{label:"معطل",color:"gray"}, محظور:{label:"محظور",color:"red"} } },
    ],
    data: [
      { id:1, name:"مدير النظام",       email:"admin@naioshlaw.com",    role:"Admin",       dept:"الإدارة",     lastSeen:"الآن",              status:"نشط"  },
      { id:2, name:"م. سامي علي",       email:"sami@naioshlaw.com",     role:"محامٍ أول",   dept:"القضايا",     lastSeen:"منذ 5 دقائق",       status:"نشط"  },
      { id:3, name:"م. منى محمد",       email:"mona@naioshlaw.com",     role:"محامٍ",       dept:"الاستشارات",  lastSeen:"منذ 30 دقيقة",      status:"نشط"  },
      { id:4, name:"م. كريم أحمد",      email:"karim@naioshlaw.com",    role:"محامٍ",       dept:"القضايا",     lastSeen:"منذ ساعة",          status:"نشط"  },
      { id:5, name:"م. هدى إبراهيم",   email:"hoda@naioshlaw.com",     role:"مساعد قانوني",dept:"القضايا",     lastSeen:"اليوم 09:15",       status:"نشط"  },
      { id:6, name:"م. يوسف طارق",      email:"yousef@naioshlaw.com",   role:"محامٍ",       dept:"الاستشارات",  lastSeen:"اليوم 08:30",       status:"نشط"  },
      { id:7, name:"م. رانيا فرحات",   email:"rania@naioshlaw.com",    role:"محاسب قانوني",dept:"المالية",     lastSeen:"منذ 2 ساعة",        status:"نشط"  },
      { id:8, name:"م. طارق عمر",       email:"tarek@naioshlaw.com",    role:"مساعد قانوني",dept:"الأرشيف",     lastSeen:"أمس",               status:"نشط"  },
      { id:9, name:"م. أميرة سالم",    email:"amira@naioshlaw.com",    role:"سكرتارية",    dept:"الاستقبال",   lastSeen:"منذ 3 أيام",        status:"نشط"  },
      { id:10,name:"عميل تجريبي",       email:"client@naioshlaw.com",   role:"Client",      dept:"خارجي",       lastSeen:"منذ يومين",         status:"نشط"  },
      { id:11,name:"م. إبراهيم حسن",   email:"ibrahim@naioshlaw.com",  role:"محامٍ",       dept:"القضايا",     lastSeen:"منذ أسبوع",         status:"معطل" },
    ],
    formFields: [
      { key:"name",   label:"الاسم الكامل",       type:"text",   required:true },
      { key:"email",  label:"البريد الإلكتروني",   type:"email",  required:true },
      { key:"role",   label:"الدور الوظيفي",      type:"select", options:["Admin","محامٍ أول","محامٍ","مساعد قانوني","محاسب قانوني","سكرتارية","Client"] },
      { key:"dept",   label:"القسم",              type:"select", options:["الإدارة","القضايا","الاستشارات","المالية","الأرشيف","الاستقبال","IT","خارجي"] },
      { key:"status", label:"الحالة",             type:"select", options:["نشط","معطل","محظور"] },
      { key:"phone",  label:"رقم الهاتف",         type:"tel" },
    ],
  },

  /* 13. NOTIFICATIONS CENTER */
  {
    slug: "notifications-center",
    entityName: "إشعار",
    addLabel: "إنشاء قاعدة إشعار",
    kpis: [
      { label: "إشعارات اليوم",    value: "142", delta: "+23 عن أمس",     deltaPos: true,  icon: "🔔", accent: "#f59e0b" },
      { label: "قواعد نشطة",      value: "28",  delta: "قاعدة trigger",   deltaPos: true,  icon: "⚡", accent: "#22c55e" },
      { label: "إشعارات مرسلة",   value: "2.8k",delta: "هذا الشهر",      deltaPos: true,  icon: "📤", accent: "#0ea5e9" },
      { label: "إشعارات غير مقروءة",value: "14", delta: "تنتظر المراجعة", deltaPos: false, icon: "📭", accent: "#c3152a" },
    ],
    columns: [
      { key:"title",    label:"عنوان الإشعار" },
      { key:"trigger",  label:"الحدث المحرك" },
      { key:"channel",  label:"القناة" },
      { key:"audience", label:"المستقبل" },
      { key:"sent",     label:"مُرسَل", type:"number" },
      { key:"status",   label:"الحالة", type:"badge", badgeMap: { نشط:{label:"نشط",color:"green"}, موقف:{label:"موقف",color:"yellow"}, معطل:{label:"معطل",color:"gray"} } },
    ],
    data: [
      { title:"تذكير جلسة قادمة",       trigger:"قبل الجلسة بـ 24 ساعة", channel:"بريد + رسالة", audience:"المسؤول + الموكل", sent:892, status:"نشط"  },
      { title:"فاتورة غير مسددة",       trigger:"تجاوز تاريخ الاستحقاق", channel:"بريد",          audience:"المسؤول + الموكل", sent:234, status:"نشط"  },
      { title:"مهمة عاجلة",             trigger:"إسناد مهمة عاجلة",      channel:"رسالة",         audience:"المُسند له",        sent:156, status:"نشط"  },
      { title:"موعد تقديم مذكرة",       trigger:"قبل 48 ساعة من الموعد", channel:"بريد",          audience:"المحامي المسؤول",   sent:445, status:"نشط"  },
      { title:"تحديث حالة القضية",      trigger:"تغيير حالة القضية",     channel:"بريد",          audience:"الموكل",            sent:312, status:"نشط"  },
      { title:"تقرير أسبوعي",           trigger:"كل يوم أحد 8 ص",        channel:"بريد",          audience:"الإدارة",           sent:48,  status:"نشط"  },
      { title:"تذكير دفع رسوم",         trigger:"قبل الاستحقاق بـ 7 أيام",channel:"بريد + رسالة", audience:"الموكل",            sent:89,  status:"موقف" },
      { title:"شكوى جديدة",             trigger:"استلام شكوى",            channel:"بريد",          audience:"الإدارة",           sent:23,  status:"نشط"  },
    ],
    formFields: [
      { key:"title",    label:"عنوان الإشعار",   type:"text",   required:true },
      { key:"trigger",  label:"الحدث المحرك",    type:"select", options:["قبل الجلسة","تجاوز الاستحقاق","تغيير الحالة","إسناد مهمة","استلام شكوى","دوري - يومي","دوري - أسبوعي","دوري - شهري"] },
      { key:"channel",  label:"قناة الإرسال",    type:"select", options:["بريد","رسالة نصية","بريد + رسالة","إشعار النظام"] },
      { key:"audience", label:"المستقبل",         type:"select", options:["الموكل","المحامي المسؤول","الإدارة","الجميع"] },
      { key:"status",   label:"الحالة",           type:"select", options:["نشط","موقف","معطل"] },
    ],
  },

  /* 14. INTEGRATIONS */
  {
    slug: "integrations",
    entityName: "تكامل",
    addLabel: "إضافة تكامل جديد",
    kpis: [
      { label: "تكاملات نشطة",     value: "8",   delta: "+2 هذا الربع",   deltaPos: true,  icon: "🔗", accent: "#0ea5e9" },
      { label: "استدعاءات اليوم",  value: "3.2k",delta: "+500 عن أمس",    deltaPos: true,  icon: "⚡", accent: "#22c55e" },
      { label: "نسبة النجاح",      value: "99.2%",delta: "هذا الشهر",     deltaPos: true,  icon: "✅", accent: "#8b5cf6" },
      { label: "وقت الاستجابة",    value: "142ms",delta: "-12ms عن الأسبوع",deltaPos: true, icon: "⏱️", accent: "#f59e0b" },
    ],
    columns: [
      { key:"name",        label:"اسم التكامل" },
      { key:"type",        label:"النوع" },
      { key:"endpoint",    label:"Endpoint" },
      { key:"callsToday",  label:"استدعاءات اليوم", type:"number" },
      { key:"successRate", label:"نسبة النجاح" },
      { key:"lastChecked", label:"آخر فحص" },
      { key:"status",      label:"الحالة", type:"badge", badgeMap: { متصل:{label:"متصل",color:"green"}, منقطع:{label:"منقطع",color:"red"}, تحذير:{label:"تحذير",color:"yellow"} } },
    ],
    data: [
      { name:"SMS Gateway",     type:"رسائل نصية",    endpoint:"/api/sms",         callsToday:342, successRate:"99.7%", lastChecked:"منذ 5 دقائق", status:"متصل"  },
      { name:"Email Provider",  type:"بريد إلكتروني", endpoint:"/api/email",       callsToday:218, successRate:"99.9%", lastChecked:"منذ 2 دقائق", status:"متصل"  },
      { name:"Payment Gateway", type:"مدفوعات",       endpoint:"/api/payments",    callsToday:45,  successRate:"100%",  lastChecked:"منذ 10 دقائق",status:"متصل"  },
      { name:"E-Signature",     type:"توقيع إلكتروني",endpoint:"/api/sign",        callsToday:12,  successRate:"98.5%", lastChecked:"منذ 15 دقيقة",status:"متصل"  },
      { name:"Court API",       type:"بيانات محاكم",  endpoint:"/api/courts",      callsToday:89,  successRate:"97.2%", lastChecked:"منذ 20 دقيقة",status:"تحذير" },
      { name:"Tax Authority",   type:"ضريبي",         endpoint:"/api/tax",         callsToday:3,   successRate:"100%",  lastChecked:"منذ 30 دقيقة",status:"متصل"  },
      { name:"Document OCR",    type:"معالجة مستندات",endpoint:"/api/ocr",         callsToday:67,  successRate:"94.5%", lastChecked:"منذ 45 دقيقة",status:"متصل"  },
      { name:"Analytics",       type:"تحليلات",       endpoint:"/api/analytics",   callsToday:1240,successRate:"99.8%", lastChecked:"منذ دقيقة",   status:"متصل"  },
    ],
    formFields: [
      { key:"name",     label:"اسم التكامل",  type:"text",   required:true },
      { key:"type",     label:"نوع التكامل",  type:"select", options:["رسائل نصية","بريد إلكتروني","مدفوعات","توقيع إلكتروني","بيانات خارجية","ضريبي","تحليلات","أخرى"] },
      { key:"endpoint", label:"API Endpoint", type:"text",   placeholder:"/api/..." },
      { key:"apiKey",   label:"API Key",      type:"text",   placeholder:"مشفّر..." },
      { key:"status",   label:"الحالة",       type:"select", options:["متصل","منقطع","تحذير"] },
    ],
  },

  /* 15. AI CENTER */
  {
    slug: "ai-center",
    entityName: "مهمة AI",
    addLabel: "تشغيل مهمة ذكاء اصطناعي",
    kpis: [
      { label: "مهام منفذة هذا الشهر",  value: "234",  delta: "+78 عن الشهر",  deltaPos: true,  icon: "🧠", accent: "#8b5cf6" },
      { label: "وقت توفير تحليل",       value: "4.5h",  delta: "يومياً في المتوسط",deltaPos: true, icon: "⏱️", accent: "#0ea5e9" },
      { label: "دقة تحليل المستندات",   value: "96.3%", delta: "+1.2% عن الشهر",  deltaPos: true,  icon: "🎯", accent: "#22c55e" },
      { label: "مستندات محللة",         value: "1.2k",  delta: "هذا الشهر",      deltaPos: true,  icon: "📄", accent: "#f59e0b" },
    ],
    columns: [
      { key:"jobId",   label:"رقم المهمة" },
      { key:"type",    label:"نوع المهمة" },
      { key:"input",   label:"المدخل" },
      { key:"user",    label:"المستخدم" },
      { key:"started", label:"بدأت" },
      { key:"duration",label:"المدة" },
      { key:"status",  label:"الحالة", type:"badge", badgeMap: { مكتمل:{label:"مكتمل",color:"green"}, جارٍ:{label:"جارٍ",color:"blue"}, فشل:{label:"فشل",color:"red"}, انتظار:{label:"انتظار",color:"yellow"} } },
    ],
    data: [
      { jobId:"AI-001", type:"تحليل عقد",        input:"عقد_بيع_عقاري.pdf",   user:"م. سامي",  started:"قبل 5 دقائق", duration:"45 ثانية", status:"مكتمل"  },
      { jobId:"AI-002", type:"تلخيص قضية",       input:"قضية #2024-0547",     user:"م. منى",   started:"قبل 12 دقيقة",duration:"2 دقيقة",  status:"مكتمل"  },
      { jobId:"AI-003", type:"اقتراح صياغة",     input:"مذكرة دفاعية",        user:"م. كريم",  started:"قبل 20 دقيقة",duration:"90 ثانية", status:"مكتمل"  },
      { jobId:"AI-004", type:"استخراج بنود",     input:"عقد_توريد.pdf",        user:"م. هدى",   started:"قبل 35 دقيقة",duration:"60 ثانية", status:"مكتمل"  },
      { jobId:"AI-005", type:"تحليل مخاطر",      input:"قضية #2024-0280",     user:"م. يوسف",  started:"قبل 45 دقيقة",duration:"3 دقائق",  status:"مكتمل"  },
      { jobId:"AI-006", type:"ترجمة قانونية",    input:"حكم أجنبي.pdf",        user:"م. رانيا", started:"قبل ساعة",    duration:"5 دقائق",  status:"مكتمل"  },
      { jobId:"AI-007", type:"تحليل عقد",        input:"اتفاقية_شراكة.pdf",   user:"م. سامي",  started:"قبل 5 دقائق", duration:"جارٍ...",  status:"جارٍ"   },
      { jobId:"AI-008", type:"تلخيص قضية",       input:"قضية #2024-0200",     user:"م. منى",   started:"قبل 3 دقائق", duration:"انتظار",   status:"انتظار" },
    ],
    formFields: [
      { key:"type",   label:"نوع المهمة",     type:"select", options:["تحليل عقد","تلخيص قضية","اقتراح صياغة","استخراج بنود حرجة","تحليل مخاطر","ترجمة قانونية","مقارنة مستندات"] },
      { key:"input",  label:"المدخل / الملف", type:"text",   required:true },
      { key:"user",   label:"المستخدم",       type:"text",   required:true },
      { key:"notes",  label:"تعليمات إضافية", type:"textarea" },
    ],
  },

  /* 16. GENERAL TOOLS */
  {
    slug: "general-tools",
    entityName: "مهمة",
    addLabel: "إضافة مهمة جديدة",
    kpis: [
      { label: "مهام اليوم",      value: "14",  delta: "5 مكتملة",         deltaPos: true,  icon: "📋", accent: "#0ea5e9" },
      { label: "ملاحظات محفوظة", value: "48",  delta: "+7 هذا الأسبوع",   deltaPos: true,  icon: "📝", accent: "#8b5cf6" },
      { label: "ملفات الأرشيف",  value: "1.4k",delta: "12 GB مستخدم",     deltaPos: true,  icon: "🗂️", accent: "#22c55e" },
      { label: "بحث سريع",       value: "34",  delta: "بحث اليوم",         deltaPos: true,  icon: "🔍", accent: "#f59e0b" },
    ],
    columns: [
      { key:"title",    label:"المهمة" },
      { key:"assignee", label:"المسؤول" },
      { key:"category", label:"التصنيف" },
      { key:"due",      label:"الموعد" },
      { key:"priority", label:"الأولوية", type:"badge", badgeMap: priorityMap },
      { key:"status",   label:"الحالة",   type:"badge", badgeMap: { مكتمل:{label:"مكتمل",color:"green"}, جارٍ:{label:"جارٍ",color:"blue"}, معلق:{label:"معلق",color:"yellow"} } },
    ],
    data: [
      { title:"مراجعة أرشيف قضايا 2023",      assignee:"م. سامي",  category:"أرشفة",  due:"15 يوليو 2026", priority:"متوسط", status:"جارٍ"  },
      { title:"تحديث دليل الموكلين",          assignee:"م. منى",   category:"إدارة",  due:"12 يوليو 2026", priority:"عالٍ",  status:"معلق"  },
      { title:"إعداد تقرير الأداء الأسبوعي", assignee:"م. كريم",  category:"تقارير", due:"8 يوليو 2026",  priority:"عاجل",  status:"جارٍ"  },
      { title:"تنظيم مجلد المستندات",         assignee:"م. هدى",   category:"أرشفة",  due:"10 يوليو 2026", priority:"منخفض", status:"معلق"  },
      { title:"ترقية بيانات قاعدة البيانات",  assignee:"م. يوسف", category:"IT",     due:"20 يوليو 2026", priority:"متوسط", status:"معلق"  },
      { title:"إعداد جدول الإجازات",          assignee:"م. رانيا", category:"HR",     due:"11 يوليو 2026", priority:"عالٍ",  status:"مكتمل" },
      { title:"مراجعة قائمة العملاء",         assignee:"م. طارق",  category:"إدارة",  due:"9 يوليو 2026",  priority:"متوسط", status:"مكتمل" },
    ],
    formFields: [
      { key:"title",    label:"عنوان المهمة",  type:"text",   required:true },
      { key:"assignee", label:"المسؤول",       type:"text",   required:true },
      { key:"category", label:"التصنيف",       type:"select", options:["أرشفة","إدارة","تقارير","IT","HR","مالية","أخرى"] },
      { key:"due",      label:"الموعد النهائي",type:"date" },
      { key:"priority", label:"الأولوية",      type:"select", options:["عاجل","عالٍ","متوسط","منخفض"] },
      { key:"status",   label:"الحالة",        type:"select", options:["معلق","جارٍ","مكتمل"] },
      { key:"notes",    label:"ملاحظات",       type:"textarea" },
    ],
  },
];

export const moduleConfigMap = Object.fromEntries(
  moduleConfigs.map((c) => [c.slug, c])
);
