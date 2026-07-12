"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Scale,
  Shield,
  Users,
} from "lucide-react";

const SLIDES = [
  {
    id: 1,
    badge: "Naiosh Law Platform — نظام قانوني من الجيل القادم",
    title: "إدارة القضايا والموكلين",
    highlight: "بذكاء لا مثيل له",
    description:
      "منصة متكاملة لإدارة مكاتب المحاماة — قضايا، موكلين، جلسات، مستندات، ومحاسبة في نظام واحد آمن وسريع.",
    primaryCta: { label: "ابدأ الآن مجانًا", href: "/register" },
    secondaryCta: { label: "عرض تجريبي مباشر", href: "/demo" },
    stats: [
      { value: "17", label: "وحدة تشغيلية" },
      { value: "128+", label: "قضية نشطة" },
      { value: "500+", label: "موكل مسجل" },
      { value: "99.9%", label: "وقت التشغيل" },
    ],
    visual: "case",
  },
  {
    id: 2,
    badge: "حلول قانونية ذكية — للمكاتب والشركات",
    title: "أنظمة ذكية تدير",
    highlight: "المكاتب وتسرّع النمو",
    description:
      "من إدارة القضايا والجلسات إلى المحاسبة والتقارير — كل ما يحتاجه مكتبك القانوني في منصة واحدة متكاملة.",
    primaryCta: { label: "استأجر النظام الآن", href: "/register" },
    secondaryCta: { label: "استكشف الوحدات", href: "/#modules" },
    stats: [
      { value: "8", label: "محاور قانونية" },
      { value: "74", label: "موضوع قانوني" },
      { value: "24/7", label: "دعم فني" },
      { value: "100%", label: "سحابي آمن" },
    ],
    visual: "shield",
  },
  {
    id: 3,
    badge: "عروض محدودة — ابدأ تجربتك المجانية اليوم",
    title: "منصة نايُوش القانونية",
    highlight: "لإدارة مكتبك باحتراف",
    description:
      "تصنيف قانوني شامل، قوانين دولية، عقود، تحكيم، وإدارة موكلين — كل الأدوات التي يحتاجها المحامي الحديث.",
    primaryCta: { label: "إنشاء حساب", href: "/register" },
    secondaryCta: { label: "دخول النظام", href: "/login" },
    stats: [
      { value: "∞", label: "مستندات" },
      { value: "AI", label: "مساعد ذكي" },
      { value: "RTL", label: "عربي كامل" },
      { value: "SSL", label: "تشفير آمن" },
    ],
    visual: "users",
  },
] as const;

const ROTATE_MS = 6000;

function SlideVisual({ type }: { type: (typeof SLIDES)[number]["visual"] }) {
  if (type === "shield") {
    return (
      <div className="relative w-full max-w-md mx-auto">
        <div className="rounded-2xl border border-white/20 bg-black/30 backdrop-blur-md p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white font-bold">حماية البيانات</p>
              <p className="text-white/60 text-sm">تشفير من طرف لطرف</p>
            </div>
          </div>
          <div className="space-y-3">
            {["صلاحيات متعددة المستويات", "نسخ احتياطي تلقائي", "سجل تدقيق كامل"].map((t) => (
              <div key={t} className="flex items-center gap-2 text-white/80 text-sm">
                <div className="w-2 h-2 rounded-full bg-white" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === "users") {
    return (
      <div className="relative w-full max-w-md mx-auto">
        <div className="rounded-2xl border border-white/20 bg-black/30 backdrop-blur-md p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-white" />
            <span className="text-white font-bold">إدارة الموكلين</span>
          </div>
          {["أحمد محمد العلي", "شركة النور للتجارة", "مؤسسة الريادة"].map((name, i) => (
            <div
              key={name}
              className="flex items-center justify-between py-3 border-b border-white/10 last:border-0"
            >
              <span className="text-white/90 text-sm">{name}</span>
              <span className="text-xs text-white/50">{i + 1} قضية</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="rounded-2xl border border-white/20 bg-black/30 backdrop-blur-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-sm">قضية استئناف تجارية</span>
          </div>
          <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">نشطة</span>
        </div>
        <div className="text-white/50 text-xs mb-3">15 يوليو 2026 — المحكمة التجارية</div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
          <div className="h-full w-3/4 bg-white rounded-full" />
        </div>
        <div className="flex gap-2">
          {["جلسة", "مستند", "موكل"].map((b) => (
            <span key={b} className="text-xs bg-white/10 text-white/80 px-3 py-1.5 rounded-lg">
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingHeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length),
    []
  );

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, next]);

  const slide = SLIDES[index];

  return (
    <section className="relative overflow-hidden" aria-label="بنر رئيسي متحرك">
      {/* Red gradient background like reference */}
      <div className="absolute inset-0 bg-gradient-to-l from-[#1a0508] via-[#8B1A1A] to-[#DC2626]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,255,255,0.08),transparent_60%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 min-h-[520px] lg:min-h-[560px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.45 }}
            className="w-full grid lg:grid-cols-2 gap-10 lg:gap-14 items-center"
          >
            {/* Text — right in RTL */}
            <div className="order-1 lg:order-1 text-center lg:text-right">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-white/15 text-white border border-white/25 mb-5">
                {slide.badge}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-2">
                {slide.title}
              </h1>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white/95 mb-5">
                {slide.highlight}
              </p>
              <p className="text-base sm:text-lg text-white/80 max-w-xl mx-auto lg:mx-0 lg:mr-0 mb-8 leading-relaxed">
                {slide.description}
              </p>

              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-10">
                <Link
                  href={slide.primaryCta.href}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#8B1A1A] font-bold text-sm hover:bg-white/90 transition-all shadow-lg"
                >
                  {slide.primaryCta.label}
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <Link
                  href={slide.secondaryCta.href}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-white/50 text-white font-semibold text-sm hover:bg-white/10 transition-all"
                >
                  {slide.secondaryCta.label}
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto lg:mx-0">
                {slide.stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/25 bg-white/10 backdrop-blur-sm px-3 py-3 text-center"
                  >
                    <div className="text-xl sm:text-2xl font-black text-white">{s.value}</div>
                    <div className="text-[10px] sm:text-xs text-white/70 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual — left in RTL */}
            <div className="order-2 lg:order-2 hidden sm:block">
              <SlideVisual type={slide.visual} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slider controls */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`الشريحة ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="w-9 h-9 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
            aria-label={paused ? "تشغيل" : "إيقاف"}
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={prev}
            className="w-9 h-9 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
            aria-label="السابق"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="w-9 h-9 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
            aria-label="التالي"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 hidden lg:flex">
        <a
          href="#features"
          className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white animate-bounce"
          aria-label="انتقل للأسفل"
        >
          <ChevronLeft className="w-5 h-5 rotate-[-90deg]" />
        </a>
      </div>
    </section>
  );
}
