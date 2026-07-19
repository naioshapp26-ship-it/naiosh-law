"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Heart,
  Mail,
  Plus,
  ArrowUp,
  Play,
  Paperclip,
  ChevronDown,
} from "lucide-react";
import { useSiteTheme } from "@/components/theme-provider";
import { isHeroVideoSrc } from "@/lib/hero-media";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const SIDE_RAIL = [
  { label: "قضاياي", href: "/app/modules/case-management", active: false },
  { label: "موكلي", href: "/app/modules/clients-management", active: false },
  { label: "جلساتي", href: "/app/modules/court-sessions", active: false },
  { label: "مكتبتي", href: "/app/legal-library", active: false },
  { label: "أنظمتي", href: "/app/dashboard", active: false },
  { label: "ماليتي", href: "/app/legal-finance", active: false },
  { label: "أرشيفي", href: "/app/archive", active: false },
  { label: "صفحتي", href: "/app/dashboard", active: true },
  { label: "الفريق", href: "/app/modules/administration", active: false },
];

const CTA_BUTTONS = [
  { label: "ابدأ الآن مجانًا", href: "/login" },
  { label: "دخول النظام", href: "/login" },
  { label: "عرض الوحدات", href: "/#modules" },
  { label: "طلب عرض تجريبي", href: "/#demo-request" },
];

const STATS = [
  { value: "17", label: "وحدة تشغيلية" },
  { value: "+500", label: "موكل مسجل" },
  { value: "99.9%", label: "وقت التشغيل" },
];

const TOOLBAR = [
  { icon: Plus, label: "إضافة" },
  { icon: Heart, label: "المفضلة" },
  { icon: Mail, label: "الرسائل" },
  { icon: ArrowUp, label: "أعلى" },
];

const HEADLINE = "إدارة القضايا والموكلين بذكاء لا مثيل له";

const fadeUp = (reduce: boolean | null, delay = 0) =>
  reduce
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.65, delay, ease: EASE },
      };

/**
 * هيرو بتصميم إمبراطورية نايوش (تدرج أحمر، قائمة يمين، وسائط يسار)
 * مع عناوين ومحتوى النظام القانوني + حركة حيّة.
 */
export function EmpireLandingHero() {
  const reduce = useReducedMotion();
  const { heroBannerSrc, theme } = useSiteTheme();
  const isVideo = isHeroVideoSrc(heroBannerSrc, theme.heroMediaKind);
  const [notes, setNotes] = useState("");
  const [activeRail, setActiveRail] = useState("صفحتي");
  const hasMedia = Boolean(heroBannerSrc);
  const words = HEADLINE.split(" ");

  return (
    <section
      className="empire-hero"
      aria-label="قسم الهيرو الرئيسي"
      style={{
        position: "relative",
        minHeight: "calc(100vh - 100px)",
        marginTop: 0,
        overflow: "hidden",
        background:
          "radial-gradient(ellipse 80% 70% at 35% 45%, #e11d2e 0%, #9f1239 38%, #450a0a 68%, #1a0508 100%)",
        color: "#fff",
      }}
    >
      {/* شبكة خفيفة + توهج متحرك */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 42%), radial-gradient(circle at 70% 60%, rgba(255,80,80,0.18) 0%, transparent 45%)",
          pointerEvents: "none",
        }}
        animate={reduce ? undefined : { opacity: [0.7, 1, 0.7], scale: [1, 1.04, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {!reduce && (
        <>
          <motion.div
            aria-hidden
            className="empire-orb"
            style={{
              position: "absolute",
              width: 340,
              height: 340,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.14) 0%, transparent 68%)",
              top: "8%",
              left: "12%",
              pointerEvents: "none",
              filter: "blur(2px)",
            }}
            animate={{ x: [0, 36, 0], y: [0, 22, 0], opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="empire-orb"
            style={{
              position: "absolute",
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(254,202,202,0.16) 0%, transparent 70%)",
              bottom: "12%",
              right: "18%",
              pointerEvents: "none",
            }}
            animate={{ x: [0, -28, 0], y: [0, -18, 0], opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          />
        </>
      )}

      {/* شريط أدوات عائم أقصى اليسار */}
      <motion.aside
        className="empire-left-toolbar"
        aria-label="أدوات سريعة"
        initial={reduce ? false : { opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
        style={{
          position: "absolute",
          left: 18,
          top: "42%",
          transform: "translateY(-50%)",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          background: "rgba(255,255,255,0.95)",
          borderRadius: 18,
          padding: "10px 8px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        }}
      >
        {TOOLBAR.map(({ icon: Icon, label }, i) => (
          <motion.button
            key={label}
            type="button"
            aria-label={label}
            onClick={() => {
              if (label === "أعلى") window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            initial={reduce ? false : { opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 + i * 0.07, duration: 0.4, ease: EASE }}
            whileHover={reduce ? undefined : { scale: 1.12, backgroundColor: "rgba(195,21,42,0.08)" }}
            whileTap={reduce ? undefined : { scale: 0.94 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "none",
              background: "transparent",
              color: "#9f1239",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <Icon size={18} />
          </motion.button>
        ))}
      </motion.aside>

      <div
        className="container-max empire-hero-inner"
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          paddingBlock: "2.75rem 3.5rem",
          paddingInline: "clamp(1rem, 3vw, 1.5rem)",
          boxSizing: "border-box",
        }}
      >
        <div
          className="empire-hero-grid"
          style={{
            display: "grid",
            direction: "ltr",
            gridTemplateColumns: "minmax(280px, 1.05fr) minmax(320px, 1.15fr) 168px",
            gap: "1.75rem",
            alignItems: "center",
          }}
        >
          {/* يسار: وسائط + ملاحظات */}
          <motion.div
            className="empire-media-col"
            initial={reduce ? false : { opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, ease: EASE }}
            style={{ position: "relative", direction: "rtl" }}
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "relative",
                borderRadius: 22,
                overflow: "hidden",
                aspectRatio: "16 / 10",
                background: "#111827",
                boxShadow:
                  "0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.12), 0 0 60px rgba(225,29,46,0.35)",
              }}
            >
              {hasMedia && heroBannerSrc ? (
                isVideo ? (
                  <video
                    src={heroBannerSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroBannerSrc}
                    alt="بنر الهيرو"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                )
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background:
                      "linear-gradient(145deg, rgba(255,255,255,0.12), rgba(0,0,0,0.35)), url(/naiosh-logo.png) center/55% no-repeat",
                    backgroundColor: "#7f1d1d",
                  }}
                />
              )}

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.55, ease: EASE }}
                style={{
                  position: "absolute",
                  left: 14,
                  bottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#fff",
                  color: "#0a0a12",
                  borderRadius: 14,
                  padding: "8px 12px 8px 8px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                  maxWidth: "78%",
                }}
              >
                <motion.span
                  animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#c3152a",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Play size={16} fill="currentColor" />
                </motion.span>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, lineHeight: 1.35 }}>
                  الذكاء القانوني في مكتبك — شاهد العرض
                </span>
              </motion.div>
            </motion.div>

            <motion.div {...fadeUp(reduce, 0.28)} style={{ marginTop: "1rem" }}>
              <label
                htmlFor="empire-notes"
                style={{
                  display: "block",
                  background: "rgba(80,10,18,0.72)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 14,
                  padding: "0.85rem 1rem",
                }}
              >
                <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                  اكتب ملاحظاتك
                </span>
                <textarea
                  id="empire-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="ملاحظة سريعة للمكتب أو للفريق..."
                  style={{
                    width: "100%",
                    marginTop: 6,
                    resize: "vertical",
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "#fff",
                    fontFamily: "var(--font-cairo)",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                  }}
                />
              </label>
              <motion.div whileHover={reduce ? undefined : { y: -2, scale: 1.01 }} whileTap={reduce ? undefined : { scale: 0.98 }}>
                <Link
                  href="/app/archive"
                  style={{
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: "#c3152a",
                    color: "#fff",
                    borderRadius: 14,
                    padding: "0.9rem 1rem",
                    fontWeight: 800,
                    fontSize: "0.92rem",
                    boxShadow: "0 10px 28px rgba(195,21,42,0.45)",
                  }}
                >
                  <Paperclip size={16} />
                  إضافة ملف PDF أو صورة
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* وسط: العنوان والأزرار والإحصائيات */}
          <motion.div
            className="empire-copy-col"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
            style={{
              textAlign: "center",
              paddingInline: "0.35rem",
              direction: "rtl",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(1.85rem, 3.4vw, 2.85rem)",
                fontWeight: 900,
                lineHeight: 1.28,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                marginBottom: "1rem",
                textShadow: "0 8px 30px rgba(0,0,0,0.35)",
              }}
            >
              {words.map((word, i) => (
                <motion.span
                  key={`${word}-${i}`}
                  initial={reduce ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.12 + i * 0.07, ease: EASE }}
                  style={{ display: "inline-block", marginInline: "0.18em" }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.55, ease: EASE }}
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "clamp(0.95rem, 1.4vw, 1.08rem)",
                lineHeight: 1.9,
                maxWidth: 520,
                margin: "0 auto 1.75rem",
              }}
            >
              منصة احترافية لمكاتب المحاماة تضم 17 وحدة تشغيلية مترابطة — من إدارة القضايا والجلسات
              وحتى المحاسبة القانونية والذكاء الاصطناعي.
            </motion.p>

            <div
              className="empire-cta-row"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.65rem",
                justifyContent: "center",
                marginBottom: "1.75rem",
              }}
            >
              {CTA_BUTTONS.map((btn, i) => (
                <motion.div
                  key={btn.label}
                  initial={reduce ? false : { opacity: 0, y: 14, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.45, delay: 0.62 + i * 0.07, ease: EASE }}
                  whileHover={reduce ? undefined : { y: -3, scale: 1.04 }}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                >
                  <Link
                    href={btn.href}
                    className={i === 0 ? "empire-cta-pulse" : undefined}
                    style={{
                      display: "inline-block",
                      background: i === 0 ? "#c3152a" : "rgba(0,0,0,0.22)",
                      color: "#fff",
                      borderRadius: 999,
                      padding: "0.72rem 1.15rem",
                      fontSize: "0.84rem",
                      fontWeight: 800,
                      boxShadow: i === 0 ? "0 8px 22px rgba(195,21,42,0.4)" : "none",
                      border: "1px solid rgba(255,255,255,0.12)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {btn.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            <div
              className="empire-stats-row"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                justifyContent: "center",
              }}
            >
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.85 + i * 0.1, ease: EASE }}
                  whileHover={reduce ? undefined : { y: -4, borderColor: "rgba(255,255,255,0.55)" }}
                  style={{
                    minWidth: 120,
                    border: "1px solid rgba(255,255,255,0.35)",
                    borderRadius: 14,
                    padding: "0.85rem 1rem",
                    background: "rgba(0,0,0,0.12)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <div style={{ fontSize: "1.35rem", fontWeight: 900, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: "0.75rem", marginTop: 6, opacity: 0.9, fontWeight: 600 }}>
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* يمين: قائمة جانبية عمودية */}
          <motion.aside
            className="empire-side-rail"
            aria-label="قائمة الوصول السريع"
            initial={reduce ? false : { opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "stretch",
              direction: "rtl",
            }}
          >
            {SIDE_RAIL.map((item, i) => {
              const active = activeRail === item.label || item.active;
              return (
                <motion.div
                  key={item.label}
                  initial={reduce ? false : { opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.05, ease: EASE }}
                  whileHover={reduce ? undefined : { x: -4, scale: 1.02 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setActiveRail(item.label)}
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "0.72rem 0.85rem",
                      borderRadius: 14,
                      background: active ? "#c3152a" : "rgba(20,8,12,0.72)",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "0.86rem",
                      border: active ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.1)",
                      boxShadow: active ? "0 10px 24px rgba(195,21,42,0.45)" : "0 6px 18px rgba(0,0,0,0.2)",
                      transition: "background 0.2s ease, box-shadow 0.2s ease",
                    }}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
            <motion.button
              type="button"
              whileHover={reduce ? undefined : { scale: 1.03 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              style={{
                marginTop: 4,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "0.55rem 0.7rem",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.25)",
                color: "rgba(255,255,255,0.9)",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-cairo)",
              }}
            >
              المكتب
              <ChevronDown size={14} />
            </motion.button>
          </motion.aside>
        </div>
      </div>

      {!reduce && (
        <motion.div
          aria-hidden
          className="empire-scroll-hint"
          animate={{ y: [0, 8, 0], opacity: [0.35, 0.85, 0.35] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            bottom: 18,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            width: 22,
            height: 34,
            borderRadius: 12,
            border: "1.5px solid rgba(255,255,255,0.45)",
            display: "grid",
            placeItems: "start center",
            paddingTop: 6,
          }}
        >
          <span
            style={{
              width: 4,
              height: 8,
              borderRadius: 4,
              background: "rgba(255,255,255,0.85)",
            }}
          />
        </motion.div>
      )}

      <style>{`
        .empire-cta-pulse {
          animation: empire-cta-glow 2.8s ease-in-out infinite;
        }
        @keyframes empire-cta-glow {
          0%, 100% { box-shadow: 0 8px 22px rgba(195,21,42,0.35); }
          50% { box-shadow: 0 10px 32px rgba(195,21,42,0.65); }
        }
        @media (prefers-reduced-motion: reduce) {
          .empire-cta-pulse { animation: none !important; }
        }
        @media (max-width: 1100px) {
          .empire-hero-grid {
            grid-template-columns: minmax(260px, 1fr) minmax(280px, 1.1fr) 140px !important;
            gap: 1.1rem !important;
          }
          .empire-left-toolbar { display: none !important; }
        }
        @media (max-width: 900px) {
          .empire-hero-grid {
            grid-template-columns: 1fr !important;
          }
          .empire-side-rail {
            flex-direction: row !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
          }
          .empire-side-rail a, .empire-side-rail button {
            flex: 1 1 110px;
          }
          .empire-left-toolbar { display: none !important; }
          .empire-scroll-hint { display: none !important; }
        }
      `}</style>
    </section>
  );
}
