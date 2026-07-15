"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useSiteTheme } from "@/components/theme-provider";
import { isHeroVideoSrc } from "@/lib/hero-media";

const stats = [
  { value: 17, suffix: "", label: "وحدة تشغيلية" },
  { value: 128, suffix: "+", label: "قضية نشطة" },
  { value: 500, suffix: "+", label: "موكل مسجل" },
  { value: 99.9, suffix: "%", label: "وقت التشغيل", decimals: 1 },
];

const VISUAL_SLIDES = [
  { id: "case", label: "إدارة القضايا" },
  { id: "shield", label: "حماية البيانات" },
  { id: "clients", label: "إدارة الموكلين" },
  { id: "ai", label: "ذكاء اصطناعي" },
] as const;

const ROTATE_MS = 6000;
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const itemAnim = {
  hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE },
  },
};

const wordAnim = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

const slideAnim = {
  initial: { opacity: 0, x: -40, scale: 0.94, rotateY: 8 },
  animate: { opacity: 1, x: 0, scale: 1, rotateY: 0 },
  exit: { opacity: 0, x: 36, scale: 0.96, rotateY: -6 },
  transition: { duration: 0.55, ease: EASE },
};

const headlineWords = ["إدارة", "القضايا", "والموكلين", "بذكاء"];

function AnimatedStat({
  value,
  suffix,
  label,
  decimals = 0,
  delay = 0,
}: {
  value: number;
  suffix: string;
  label: string;
  decimals?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString()
  );
  const [text, setText] = useState(reduce ? (decimals > 0 ? value.toFixed(decimals) : String(value)) : "0");

  useEffect(() => {
    if (reduce) {
      setText(decimals > 0 ? value.toFixed(decimals) : String(value));
      return;
    }
    const unsub = display.on("change", (v) => setText(v));
    const controls = animate(mv, value, { duration: 1.6, delay: delay + 0.9, ease: EASE });
    return () => {
      unsub();
      controls.stop();
    };
  }, [value, decimals, delay, display, mv, reduce]);

  return (
    <motion.div
      style={{ textAlign: "right" }}
      variants={itemAnim}
      whileHover={reduce ? undefined : { y: -4, scale: 1.04 }}
    >
      <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
        {text}
        {suffix}
      </div>
      <div style={{ fontSize: "0.75rem", color: "#475569", marginTop: "0.3rem", fontWeight: 500 }}>{label}</div>
    </motion.div>
  );
}

type Props = {
  variant?: "default" | "landing";
};

function CaseVisual() {
  return (
    <>
      <div
        className="glass-dark"
        style={{
          padding: "1.75rem",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
          }}
        >
          <span style={{ fontSize: "0.7rem", color: "#475569", fontWeight: 600, letterSpacing: "0.05em" }}>
            ← إدارة القضايا
          </span>
          <span
            style={{
              background: "rgba(34,197,94,0.12)",
              color: "#4ade80",
              borderRadius: "100px",
              padding: "0.2rem 0.8rem",
              fontSize: "0.7rem",
              fontWeight: 700,
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            ● نشطة
          </span>
        </div>

        <h3 style={{ color: "#ffffff", fontWeight: 800, fontSize: "1rem", marginBottom: "0.35rem" }}>
          قضية استئناف تجارية
        </h3>
        <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "1.4rem" }}>
          محكمة الاستئناف القاهرة — الغرفة 7
        </p>

        <div
          style={{
            background: "rgba(195,21,42,0.08)",
            border: "1px solid rgba(195,21,42,0.18)",
            borderRadius: "14px",
            padding: "0.85rem 1rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: "rgba(195,21,42,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              flexShrink: 0,
            }}
          >
            🏛️
          </div>
          <div>
            <p style={{ color: "#64748b", fontSize: "0.68rem", marginBottom: "0.2rem" }}>الجلسة القادمة</p>
            <p style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.88rem" }}>الأربعاء، 15 يوليو 2026</p>
          </div>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.72rem", color: "#64748b" }}>تقدم القضية</span>
            <motion.span
              style={{ fontSize: "0.72rem", color: "#c3152a", fontWeight: 700 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              65%
            </motion.span>
          </div>
          <div
            style={{
              height: 5,
              background: "rgba(255,255,255,0.06)",
              borderRadius: "99px",
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #c3152a, #ff6b6b)",
                borderRadius: "99px",
              }}
              initial={{ width: "0%" }}
              animate={{ width: "65%" }}
              transition={{ duration: 1.4, delay: 0.55, ease: EASE }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["مرفقات 12", "إجراءات 7", "أحكام"].map((tag) => (
            <span
              key={tag}
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "#64748b",
                borderRadius: "8px",
                padding: "0.25rem 0.65rem",
                fontSize: "0.68rem",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div
        className="glass-dark"
        style={{
          padding: "1rem 1.25rem",
          marginTop: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "0.85rem",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "11px",
            background: "rgba(251,191,36,0.12)",
            border: "1px solid rgba(251,191,36,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            flexShrink: 0,
          }}
        >
          ⚡
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "#ffffff", fontSize: "0.82rem", fontWeight: 600 }}>تنبيه عاجل</p>
          <p style={{ color: "#64748b", fontSize: "0.72rem", marginTop: "0.1rem" }}>
            موعد تقديم المذكرة غدًا الساعة 9 ص
          </p>
        </div>
        <span
          style={{
            background: "rgba(251,191,36,0.12)",
            color: "#fbbf24",
            fontSize: "0.65rem",
            fontWeight: 700,
            borderRadius: "6px",
            padding: "0.2rem 0.5rem",
            flexShrink: 0,
          }}
        >
          عاجل
        </span>
      </div>

      <div
        className="glass-dark"
        style={{
          padding: "1rem 1.25rem",
          marginTop: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}
      >
        {[
          { label: "قضايا", val: "128" },
          { label: "جلسات الأسبوع", val: "26" },
          { label: "مهام اليوم", val: "14" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center", flex: 1 }}>
            <p style={{ color: "#ffffff", fontSize: "1.15rem", fontWeight: 900, lineHeight: 1 }}>{s.val}</p>
            <p style={{ color: "#475569", fontSize: "0.65rem", marginTop: "0.2rem" }}>{s.label}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function ShieldVisual() {
  return (
  <>
      <div
        className="glass-dark"
        style={{
          padding: "1.75rem",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "14px",
              background: "rgba(195,21,42,0.15)",
              border: "1px solid rgba(195,21,42,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
            }}
          >
            🔐
          </div>
          <div>
            <p style={{ color: "#ffffff", fontWeight: 800, fontSize: "1rem" }}>حماية البيانات</p>
            <p style={{ color: "#64748b", fontSize: "0.78rem" }}>تشفير من طرف لطرف</p>
          </div>
        </div>
        {["صلاحيات متعددة المستويات", "نسخ احتياطي تلقائي", "سجل تدقيق كامل", "تشفير SSL"].map((t) => (
          <div
            key={t}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              padding: "0.55rem 0",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#c3152a", flexShrink: 0 }} />
            <span style={{ color: "#94a3b8", fontSize: "0.82rem" }}>{t}</span>
          </div>
        ))}
      </div>

      <div
        className="glass-dark"
        style={{
          padding: "1rem 1.25rem",
          marginTop: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}
      >
        {[
          { label: "مستخدمون", val: "24" },
          { label: "أدوار", val: "8" },
          { label: "سجلات", val: "1.2k" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center", flex: 1 }}>
            <p style={{ color: "#ffffff", fontSize: "1.15rem", fontWeight: 900, lineHeight: 1 }}>{s.val}</p>
            <p style={{ color: "#475569", fontSize: "0.65rem", marginTop: "0.2rem" }}>{s.label}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function ClientsVisual() {
  return (
    <>
      <div
        className="glass-dark"
        style={{
          padding: "1.75rem",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "1.25rem" }}>👥</span>
          <span style={{ color: "#ffffff", fontWeight: 800, fontSize: "1rem" }}>إدارة الموكلين</span>
        </div>
        {[
          { name: "أحمد محمد العلي", cases: "3 قضايا" },
          { name: "شركة النور للتجارة", cases: "7 قضايا" },
          { name: "مؤسسة الريادة", cases: "2 قضية" },
          { name: "سارة حسن محمود", cases: "1 قضية" },
        ].map((c) => (
          <div
            key={c.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.65rem 0",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span style={{ color: "#e2e8f0", fontSize: "0.82rem" }}>{c.name}</span>
            <span style={{ color: "#64748b", fontSize: "0.7rem" }}>{c.cases}</span>
          </div>
        ))}
      </div>

      <div
        className="glass-dark"
        style={{
          padding: "1rem 1.25rem",
          marginTop: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "0.85rem",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "11px",
            background: "rgba(34,197,94,0.12)",
            border: "1px solid rgba(34,197,94,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
          }}
        >
          ✓
        </div>
        <div>
          <p style={{ color: "#ffffff", fontSize: "0.82rem", fontWeight: 600 }}>500+ موكل مسجل</p>
          <p style={{ color: "#64748b", fontSize: "0.72rem", marginTop: "0.1rem" }}>نمو 23% هذا الشهر</p>
        </div>
      </div>
    </>
  );
}

function AiVisual() {
  return (
    <>
      <div
        className="glass-dark"
        style={{
          padding: "1.75rem",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "1.25rem" }}>🧠</span>
          <span style={{ color: "#ffffff", fontWeight: 800, fontSize: "1rem" }}>مساعد ذكي قانوني</span>
        </div>
        <div
          style={{
            background: "rgba(195,21,42,0.08)",
            border: "1px solid rgba(195,21,42,0.18)",
            borderRadius: "14px",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <p style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "0.5rem" }}>تحليل المستند</p>
          <p style={{ color: "#ffffff", fontSize: "0.85rem", lineHeight: 1.7 }}>
            تم استخراج 12 بندًا قانونيًا من العقد — جاهز للمراجعة
          </p>
        </div>
        {["تلخيص القضايا", "صياغة مذكرات", "بحث قانوني"].map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ color: "#c3152a", fontSize: "0.7rem" }}>●</span>
            <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{t}</span>
          </div>
        ))}
      </div>

      <div
        className="glass-dark"
        style={{
          padding: "1rem 1.25rem",
          marginTop: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}
      >
        {[
          { label: "مستندات", val: "∞" },
          { label: "دقة", val: "98%" },
          { label: "وقت موفر", val: "4h" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center", flex: 1 }}>
            <p style={{ color: "#ffffff", fontSize: "1.15rem", fontWeight: 900, lineHeight: 1 }}>{s.val}</p>
            <p style={{ color: "#475569", fontSize: "0.65rem", marginTop: "0.2rem" }}>{s.label}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function HeroVisualSlide({ slideId }: { slideId: (typeof VISUAL_SLIDES)[number]["id"] }) {
  switch (slideId) {
    case "shield":
      return <ShieldVisual />;
    case "clients":
      return <ClientsVisual />;
    case "ai":
      return <AiVisual />;
    default:
      return <CaseVisual />;
  }
}

export function HeroSection({ variant = "default" }: Props) {
  const isLanding = variant === "landing";
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);
  const reduce = useReducedMotion();
  const { heroBannerSrc, theme } = useSiteTheme();
  const isVideoBanner = isHeroVideoSrc(heroBannerSrc, theme.heroMediaKind);
  // اعرض البنر فور توفره من الإعدادات — بدون بوابة preload تمنع الظهور
  const hasBanner = Boolean(heroBannerSrc) && !mediaFailed;

  const next = useCallback(() => setIndex((i) => (i + 1) % VISUAL_SLIDES.length), []);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + VISUAL_SLIDES.length) % VISUAL_SLIDES.length),
    []
  );

  useEffect(() => {
    setMediaFailed(false);
  }, [heroBannerSrc, theme.heroMediaKind]);

  useEffect(() => {
    if (paused || hasBanner) return;
    const t = setInterval(next, ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, next, hasBanner]);

  return (
    <section
      style={{
        minHeight: isLanding ? "calc(100vh - 108px)" : "100vh",
        background: "#0a0a12",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        paddingTop: isLanding ? "2rem" : "5rem",
      }}
      aria-label="قسم الهيرو الرئيسي"
      data-hero-banner={hasBanner ? "true" : "false"}
    >
      {/* خلفية خفيفة من الصورة المرفوعة (غائمة) + تدرج ليبقى النص مقروءًا */}
      {hasBanner && heroBannerSrc && (
        <>
          {isVideoBanner ? (
            <video
              src={heroBannerSrc}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden
              className="hero-banner-bg"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                zIndex: 0,
                pointerEvents: "none",
                opacity: 0.35,
                filter: "blur(2px) saturate(0.9)",
                transform: "scale(1.04)",
              }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroBannerSrc}
              alt=""
              aria-hidden
              className="hero-banner-bg"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                zIndex: 0,
                pointerEvents: "none",
                opacity: 0.38,
                filter: "blur(2px) saturate(0.95)",
                transform: "scale(1.04)",
              }}
            />
          )}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              background:
                "linear-gradient(105deg, rgba(10,10,18,0.78) 0%, rgba(10,10,18,0.62) 42%, rgba(10,10,18,0.86) 100%)",
              pointerEvents: "none",
            }}
          />
        </>
      )}

      <>
        <motion.div
          className="glow-pulse"
          style={{
            position: "absolute",
            width: 800,
            height: 800,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(195,21,42,0.22) 0%, transparent 65%)",
            top: -250,
            left: -150,
            pointerEvents: "none",
            zIndex: 2,
          }}
          animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.55, 0.95, 0.55] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(195,21,42,0.1) 0%, transparent 65%)",
            bottom: -100,
            right: -80,
            pointerEvents: "none",
            zIndex: 2,
          }}
          animate={reduce ? undefined : { scale: [1, 1.18, 1], x: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {!hasBanner && (
          <>
            <motion.div
              className="hero-grid-bg"
              style={{
                position: "absolute",
                inset: "-65px",
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
                backgroundSize: "65px 65px",
                pointerEvents: "none",
              }}
              animate={reduce ? undefined : { y: [0, 32, 0], opacity: [0.45, 0.75, 0.45] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />

            {!reduce &&
              [0, 1, 2, 3, 4, 5].map((i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  style={{
                    position: "absolute",
                    width: 4 + (i % 3) * 2,
                    height: 4 + (i % 3) * 2,
                    borderRadius: "50%",
                    background: i % 2 === 0 ? "rgba(195,21,42,0.55)" : "rgba(255,255,255,0.25)",
                    top: `${18 + i * 12}%`,
                    left: `${8 + i * 14}%`,
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                  animate={{
                    y: [0, -28 - i * 4, 0],
                    opacity: [0.2, 0.9, 0.2],
                    scale: [1, 1.4, 1],
                  }}
                  transition={{ duration: 4 + i * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.35 }}
                />
              ))}

            <div
              className="spin-slow"
              style={{
                position: "absolute",
                width: 420,
                height: 420,
                borderRadius: "50%",
                border: "1px solid rgba(195,21,42,0.12)",
                top: "50%",
                left: "60%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            />
            <motion.div
              style={{
                position: "absolute",
                width: 280,
                height: 280,
                borderRadius: "50%",
                border: "1px solid rgba(195,21,42,0.08)",
                top: "50%",
                left: "60%",
                marginTop: -140,
                marginLeft: -140,
                pointerEvents: "none",
              }}
              animate={reduce ? undefined : { rotate: -360 }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            />
          </>
        )}
      </>

      <div
        className="container-max"
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          paddingBlock: isLanding ? "3rem" : "5rem",
          // مسافة أمان من حافة الشاشة حتى لا يُقطع النص
          paddingInlineEnd: "clamp(1.25rem, 3.5vw, 2.75rem)",
          paddingInlineStart: "clamp(1rem, 2vw, 1.5rem)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
          className="hero-grid"
        >
          <motion.div
            className="hero-content-col"
            variants={container}
            initial="hidden"
            animate="show"
            style={{
              width: "100%",
              maxWidth: hasBanner ? "min(560px, 48vw)" : "min(720px, 68vw)",
              marginLeft: "auto",
              marginRight: 0,
              textAlign: "right",
              boxSizing: "border-box",
            }}
          >
            <motion.div
              className="hero-badge"
              variants={itemAnim}
              style={{
                marginBottom: "0.2rem",
                width: "fit-content",
                maxWidth: "100%",
                display: "flex",
                justifyContent: "flex-end",
                marginLeft: "auto",
                transform: "translateY(-12px)",
              }}
            >
              <span
                className="hero-badge-pill"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.78rem",
                  background: "rgba(195,21,42,0.1)",
                  border: "1px solid rgba(195,21,42,0.28)",
                  borderRadius: "100px",
                  padding: "0.74rem 1.95rem",
                  color: "#fca5a5",
                  fontSize: "1.04rem",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}
              >
                <span
                  className="pulse-dot"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#c3152a",
                    flexShrink: 0,
                  }}
                />
                Naiosh Law Platform — نظام قانوني من الجيل القادم
              </span>
            </motion.div>

            <motion.h1
              className="hero-heading"
              style={{
                fontSize: "clamp(2rem, 4vw, 3.4rem)",
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1.12,
                marginBottom: "1.55rem",
                letterSpacing: "-0.02em",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "0.12rem",
                width: "100%",
                maxWidth: "100%",
                overflow: "visible",
              }}
              variants={container}
            >
              <motion.span
                className="hero-heading-main"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "0.06em",
                  textAlign: "right",
                  textShadow: "0 0 34px rgba(255,255,255,0.08)",
                  maxWidth: "100%",
                }}
                variants={container}
              >
                {headlineWords.map((word) => (
                  <motion.span
                    key={word}
                    variants={wordAnim}
                    style={{ display: "block", whiteSpace: "nowrap" }}
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.span>
              <motion.span
                className="hero-heading-accent"
                variants={itemAnim}
                style={{
                  color: "#c3152a",
                  display: "block",
                  whiteSpace: "nowrap",
                  fontSize: "0.96em",
                }}
              >
                <motion.span
                  style={{ display: "inline-block", textShadow: "0 0 40px rgba(195,21,42,0.5)" }}
                  animate={
                    reduce
                      ? undefined
                      : {
                          textShadow: [
                            "0 0 24px rgba(195,21,42,0.35)",
                            "0 0 48px rgba(195,21,42,0.75)",
                            "0 0 24px rgba(195,21,42,0.35)",
                          ],
                        }
                  }
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  لا مثيل له
                </motion.span>
              </motion.span>
            </motion.h1>

            <motion.p
              className="hero-sub"
              variants={itemAnim}
              style={{
                color: "#94a3b8",
                fontSize: "1.08rem",
                lineHeight: 1.95,
                maxWidth: "min(480px, 100%)",
                width: "100%",
                marginLeft: "auto",
                marginBottom: "2.75rem",
                textWrap: "pretty",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              منصة احترافية لمكاتب المحاماة تضم 17 وحدة تشغيلية مترابطة — من إدارة القضايا والجلسات
              وحتى المحاسبة القانونية والذكاء الاصطناعي.
            </motion.p>

            <motion.div
              className="hero-cta"
              variants={itemAnim}
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                marginBottom: "3.75rem",
                justifyContent: "flex-end",
              }}
            >
              <motion.div
                whileHover={reduce ? undefined : { scale: 1.07, y: -3 }}
                whileTap={reduce ? undefined : { scale: 0.96 }}
                animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Link href="/login" className="btn-primary btn-pulse-glow" style={{ fontSize: "1rem", padding: "1rem 2.25rem" }}>
                  ابدأ الآن مجانًا →
                </Link>
              </motion.div>
              <motion.div whileHover={reduce ? undefined : { scale: 1.05, y: -2 }} whileTap={reduce ? undefined : { scale: 0.97 }}>
                <Link href="/app/dashboard" className="btn-ghost-dark" style={{ fontSize: "1rem", padding: "1rem 2.25rem" }}>
                  عرض تجريبي مباشر
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              className="hero-stats"
              variants={container}
              style={{
                display: "flex",
                gap: "2.5rem",
                flexWrap: "wrap",
                paddingTop: "2rem",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                justifyContent: "flex-end",
              }}
            >
              {stats.map((s, i) => (
                <AnimatedStat
                  key={s.label}
                  value={s.value}
                  suffix={s.suffix}
                  label={s.label}
                  decimals={s.decimals}
                  delay={i * 0.12}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* لوحة الصورة المرفوعة — تظهر واضحة على اليسار مثل NAIS */}
          {hasBanner && heroBannerSrc ? (
            <div
              className="hero-card-col hero-media-panel"
              style={{
                position: "absolute",
                // قرّب البنر فقط ناحية النص (نصف المسافة السابقة) دون تحريك الكتابة
                left: "clamp(5rem, 16vw, 12rem)",
                top: "50%",
                transform: "translateY(-50%)",
                width: "min(420px, 34vw)",
                zIndex: 5,
              }}
            >
              <motion.div
                className="float-anim"
                initial={reduce ? false : { opacity: 0, x: -56, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.85, delay: 0.2, ease: EASE }}
              >
                <div
                  className="hero-media-frame"
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "4 / 3",
                    borderRadius: 18,
                    overflow: "hidden",
                    boxShadow:
                      "0 28px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.12)",
                    background: "#111827",
                  }}
                >
                  {isVideoBanner ? (
                    <video
                      key={heroBannerSrc}
                      src={heroBannerSrc}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="hero-banner-video"
                      onError={() => setMediaFailed(true)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        display: "block",
                      }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={heroBannerSrc}
                      src={heroBannerSrc}
                      alt="بانر الهيرو"
                      className="hero-banner-image"
                      onError={() => setMediaFailed(true)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        display: "block",
                      }}
                    />
                  )}
                </div>
              </motion.div>
            </div>
          ) : (
            <motion.div
              className="float-anim hero-card-col"
              initial={reduce ? false : { opacity: 0, x: -70, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
              style={{
                position: "absolute",
                left: 0,
                top: "calc(50% - 180px)",
                width: "min(420px, 35vw)",
                zIndex: 5,
                perspective: 900,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div key={VISUAL_SLIDES[index].id} {...slideAnim}>
                  <HeroVisualSlide slideId={VISUAL_SLIDES[index].id} />
                </motion.div>
              </AnimatePresence>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "1.25rem",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  {VISUAL_SLIDES.map((slide, i) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={slide.label}
                      style={{
                        height: 8,
                        width: i === index ? 28 : 8,
                        borderRadius: 99,
                        border: "none",
                        background: i === index ? "#c3152a" : "rgba(255,255,255,0.25)",
                        cursor: "pointer",
                        transition: "all 0.25s",
                      }}
                    />
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <button
                    type="button"
                    onClick={() => setPaused((p) => !p)}
                    aria-label={paused ? "تشغيل" : "إيقاف"}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    {paused ? <Play size={14} /> : <Pause size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="السابق"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="التالي"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.4rem",
          color: hasBanner ? "rgba(255,255,255,0.65)" : "#334155",
          fontSize: "0.7rem",
          fontWeight: 500,
          zIndex: 10,
        }}
      >
        <a href="#features" style={{ color: "inherit", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
          <span>اكتشف المزيد</span>
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <path
              d="M8 3v10M4 9l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </a>
      </motion.div>

      <style>{`
        @keyframes hero-badge-drift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .hero-badge-pill {
          animation: hero-badge-drift 3.4s ease-in-out infinite;
        }
        @media (max-width: 1200px) {
          .hero-card-col:not(.hero-media-panel) {
            width: 320px !important;
            opacity: 0.8;
          }
          .hero-media-panel {
            width: min(360px, 32vw) !important;
            left: clamp(3.5rem, 12vw, 9rem) !important;
          }
          .hero-content-col {
            max-width: min(520px, 52vw) !important;
          }
          .hero-sub {
            max-width: min(460px, 100%) !important;
          }
        }
        @media (max-width: 1100px) {
          .hero-heading {
            font-size: clamp(1.85rem, 3.6vw, 3rem) !important;
          }
        }
        @media (max-width: 980px) {
          .hero-heading {
            line-height: 1.12 !important;
            font-size: clamp(1.7rem, 5vw, 2.6rem) !important;
          }
          .hero-heading-main {
            align-items: center !important;
          }
          .hero-badge-pill {
            font-size: 0.92rem !important;
            padding: 0.58rem 1.4rem !important;
          }
          .hero-sub {
            max-width: min(460px, 90%) !important;
            margin-inline: auto !important;
          }
        }
        @media (max-width: 900px) {
          .hero-grid {
            display: flex !important;
            flex-direction: column-reverse !important;
            align-items: center !important;
            gap: 2rem !important;
          }
          .hero-content-col {
            max-width: 760px !important;
            text-align: center !important;
            padding-inline: 1.25rem !important;
          }
          .hero-sub {
            text-align: center !important;
            margin-inline: auto !important;
            max-width: min(480px, 92%) !important;
          }
          .hero-heading {
            justify-content: center !important;
            align-items: center !important;
          }
          .hero-heading-main, .hero-heading-accent {
            text-align: center !important;
            align-items: center !important;
          }
          .hero-badge {
            justify-content: center !important;
            transform: none !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
          .hero-cta, .hero-stats {
            justify-content: center !important;
          }
          .hero-card-col:not(.hero-media-panel) {
            display: none;
          }
          .hero-media-panel {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            transform: none !important;
            width: min(520px, 92vw) !important;
            margin: 0 auto !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-badge-pill, .float-anim, .glow-pulse, .spin-slow, .pulse-dot {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
