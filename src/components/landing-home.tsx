"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { LandingPromoBar } from "@/components/landing-promo-bar";
import { EmpireLandingHero } from "@/components/empire-landing-hero";
import { ModuleCard } from "@/components/module-card";
import { BrandLogo } from "@/components/brand-logo";
import { modules } from "@/data/modules";

const features = [
  {
    icon: "⚖️",
    title: "إدارة قضايا متكاملة",
    desc: "تتبع كل مرحلة من مراحل القضية بدقة وتوثيق شامل من الفتح حتى الإغلاق",
  },
  {
    icon: "🏛️",
    title: "جلسات وتذكيرات ذكية",
    desc: "جدولة آلية مع تنبيهات تصل قبل الجلسة بوقت كافٍ عبر قنوات متعددة",
  },
  {
    icon: "💰",
    title: "محاسبة قانونية دقيقة",
    desc: "رسوم وفواتير وتقارير مالية منفصلة لكل قضية وموكل مع تتبع المدفوعات",
  },
  {
    icon: "📊",
    title: "تقارير تنفيذية فورية",
    desc: "تحليلات أداء الفريق والقضايا والمالية بفلاتر متقدمة وتصدير فوري",
  },
  {
    icon: "🧠",
    title: "ذكاء اصطناعي قانوني",
    desc: "تحليل المستندات وتلخيص القضايا واقتراح الصياغات القانونية تلقائيًا",
  },
  {
    icon: "🔐",
    title: "صلاحيات متعددة المستويات",
    desc: "تحكم كامل في صلاحيات كل مستخدم وفريق مع سجل تدقيق شامل",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

function Reveal({
  children,
  className = "",
  delay = 0,
  y = 40,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: Math.min(y, 28) }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08, margin: "0px 0px 120px 0px" }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingHome() {
  const reduce = useReducedMotion();

  return (
    <>
      <LandingPromoBar />
      <Navbar variant="landing" />
      <EmpireLandingHero />

      {/* Features */}
      <section id="features" style={{ background: "#f8f9fb", padding: "4.5rem 0", position: "relative", overflow: "hidden" }}>
        {!reduce && (
          <motion.div
            aria-hidden
            style={{
              position: "absolute",
              width: 420,
              height: 420,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(195,21,42,0.08) 0%, transparent 70%)",
              top: -80,
              right: -60,
              pointerEvents: "none",
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <div className="container-max" style={{ position: "relative" }}>
          <Reveal style={{ textAlign: "center", marginBottom: "4rem" }}>
            <p
              style={{
                color: "#c3152a",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "0.85rem",
              }}
            >
              لماذا Naiosh Law
            </p>
            <h2
              style={{
                fontSize: "2.5rem",
                fontWeight: 900,
                color: "#0a0a12",
                letterSpacing: "-0.02em",
                marginBottom: "1rem",
              }}
            >
              كل ما تحتاجه مكتب المحاماة
            </h2>
            <p style={{ color: "#64748b", fontSize: "1.05rem", maxWidth: "520px", margin: "0 auto", lineHeight: 1.8 }}>
              منصة واحدة تغني عن عشرات الأدوات المتفرقة وتوفر تدفق عمل سلس من البداية للنهاية
            </p>
          </Reveal>

          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}
            className="features-grid"
          >
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <motion.div
                  className="card-white landing-feature-card"
                  style={{ padding: "2rem", height: "100%" }}
                  whileHover={reduce ? undefined : { y: -10, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                >
                  <motion.div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "14px",
                      background: "rgba(195,21,42,0.07)",
                      border: "1px solid rgba(195,21,42,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                      marginBottom: "1.25rem",
                    }}
                    whileHover={reduce ? undefined : { rotate: [0, -10, 10, 0], scale: 1.12 }}
                    transition={{ duration: 0.45 }}
                  >
                    {f.icon}
                  </motion.div>
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      color: "#0a0a12",
                      marginBottom: "0.6rem",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: 1.75 }}>{f.desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" style={{ background: "#ffffff", padding: "6rem 0" }}>
        <div className="container-max">
          <Reveal style={{ textAlign: "center", marginBottom: "4rem" }}>
            <p
              style={{
                color: "#c3152a",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "0.85rem",
              }}
            >
              الوحدات التشغيلية
            </p>
            <h2
              style={{
                fontSize: "2.5rem",
                fontWeight: 900,
                color: "#0a0a12",
                letterSpacing: "-0.02em",
                marginBottom: "1rem",
              }}
            >
              17 وحدة مترابطة وكاملة
            </h2>
            <p style={{ color: "#64748b", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto", lineHeight: 1.8 }}>
              كل وحدة مستقلة بشاشاتها ووظائفها وعلاقاتها وصلاحياتها الخاصة
            </p>
          </Reveal>

          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}
            className="modules-grid"
          >
            {modules.map((item, i) => (
              <Reveal key={item.slug} delay={(i % 6) * 0.05} y={28}>
                <motion.div
                  whileHover={reduce ? undefined : { y: -6, scale: 1.02 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 340, damping: 24 }}
                  style={{ height: "100%" }}
                >
                  <ModuleCard item={item} />
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="demo-request"
        style={{
          background: "#0a0a12",
          padding: "6rem 0",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(195,21,42,0.2) 0%, transparent 65%)",
            top: "50%",
            left: "50%",
            marginTop: -300,
            marginLeft: -300,
            pointerEvents: "none",
          }}
          animate={reduce ? undefined : { scale: [1, 1.2, 1], opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        {!reduce && (
          <motion.div
            aria-hidden
            style={{
              position: "absolute",
              insetInline: 0,
              top: 0,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(195,21,42,0.7), transparent)",
            }}
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 2.6, repeat: Infinity }}
          />
        )}

        <div className="container-max" style={{ position: "relative" }}>
          <Reveal>
            <h2
              style={{
                fontSize: "2.75rem",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                marginBottom: "1rem",
              }}
            >
              جاهز لتحويل مكتبك القانوني؟
            </h2>
            <p style={{ color: "#475569", fontSize: "1.1rem", marginBottom: "3rem", lineHeight: 1.8 }}>
              ادخل بحساب تجريبي مباشرة وشوف النظام شغّال بالكامل
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <motion.div whileHover={reduce ? undefined : { scale: 1.06, y: -3 }} whileTap={reduce ? undefined : { scale: 0.96 }}>
                <Link href="/login" className="btn-primary btn-pulse-glow" style={{ fontSize: "1.05rem", padding: "1.05rem 2.5rem" }}>
                  ابدأ تجربتك المجانية →
                </Link>
              </motion.div>
              <motion.div whileHover={reduce ? undefined : { scale: 1.04 }} whileTap={reduce ? undefined : { scale: 0.97 }}>
                <Link href="/app/dashboard" className="btn-ghost-dark" style={{ fontSize: "1.05rem", padding: "1.05rem 2.5rem" }}>
                  الدخول كزائر
                </Link>
              </motion.div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "1.25rem",
                justifyContent: "center",
                marginTop: "2.5rem",
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "مدير النظام", email: "admin@naioshlaw.com" },
                { label: "عميل تجريبي", email: "client@naioshlaw.com" },
              ].map((u, i) => (
                <Reveal key={u.email} delay={0.15 + i * 0.1} y={20}>
                  <motion.div
                    whileHover={reduce ? undefined : { y: -4, borderColor: "rgba(195,21,42,0.35)" }}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      padding: "0.85rem 1.25rem",
                      textAlign: "start",
                    }}
                  >
                    <p style={{ color: "#ffffff", fontSize: "0.82rem", fontWeight: 700 }}>{u.label}</p>
                    <p style={{ color: "#475569", fontSize: "0.75rem", marginTop: "0.15rem" }}>{u.email}</p>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="footer-support"
        style={{
          background: "#0a0a12",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "2rem 0",
        }}
      >
        <Reveal y={16}>
          <div
            className="container-max"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <BrandLogo href="/" size={40} variant="light" subtitle="جميع الحقوق محفوظة © 2026" />
            <div
              style={{
                color: "#c3152a",
                fontWeight: 800,
                fontSize: "0.95rem",
                letterSpacing: "-0.01em",
              }}
            >
              ناعوش للمحاماة والاستشارات القانونية
            </div>
          </div>
        </Reveal>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .modules-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1100px) {
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .modules-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        .landing-feature-card {
          transition: box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .landing-feature-card:hover {
          box-shadow: 0 18px 40px rgba(195, 21, 42, 0.12);
        }
      `}</style>
    </>
  );
}
