import Link from "next/link";
import { operationalModules } from "@/lib/module-routing";

const stats = [
  { value: String(operationalModules.length), label: "وحدة تشغيلية" },
  { value: "128+", label: "قضية نشطة" },
  { value: "500+", label: "موكل مسجل" },
  { value: "99.9%", label: "وقت التشغيل" },
];

const headlineText = "إدارة القضايا والموكلين بذكاء";

export function HeroSection() {
  const dashboardLoginHref = `/login?next=${encodeURIComponent("/app/dashboard")}`;

  return (
    <section
      style={{
        minHeight: "100vh",
        background: "#0a0a12",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        paddingTop: "5rem",
      }}
    >
      {/* Glow blobs */}
      <div
        className="glow-pulse"
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(195,21,42,0.22) 0%, transparent 65%)",
          top: -250,
          left: -150,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(195,21,42,0.1) 0%, transparent 65%)",
          bottom: -100,
          right: -80,
          pointerEvents: "none",
        }}
      />

      {/* Grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
          backgroundSize: "65px 65px",
          pointerEvents: "none",
        }}
      />

      {/* Decorative ring */}
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
      <div
        style={{
          position: "absolute",
          width: 280,
          height: 280,
          borderRadius: "50%",
          border: "1px solid rgba(195,21,42,0.08)",
          top: "50%",
          left: "60%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="container-max"
        style={{ position: "relative", zIndex: 10, width: "100%", paddingBlock: "5rem" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
          className="hero-grid"
        >
          {/* ── Text column ── */}
          <div
            className="hero-content-col"
            style={{
              width: "100%",
              maxWidth: "min(820px, 72vw)",
              marginLeft: "auto",
              marginRight: 0,
              textAlign: "right",
            }}
          >
            {/* Badge */}
            <div
              className="hero-badge"
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
            </div>

            {/* Heading */}
            <h1
              className="hero-heading"
              style={{
                fontSize: "clamp(2rem, 4.2vw, 3.8rem)",
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1.1,
                marginBottom: "1.55rem",
                letterSpacing: "-0.02em",
                display: "flex",
                flexWrap: "nowrap",
                justifyContent: "flex-end",
                alignItems: "baseline",
                gap: "0.75rem",
              }}
            >
              <span
                className="hero-heading-main"
                style={{
                  display: "inline-block",
                  textAlign: "right",
                  textShadow: "0 0 34px rgba(255,255,255,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                {headlineText}
              </span>
              <span
                className="hero-heading-accent"
                style={{
                  color: "#c3152a",
                  textShadow: "0 0 40px rgba(195,21,42,0.5)",
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  fontSize: "0.96em",
                }}
              >
                لا مثيل له
              </span>
            </h1>

            {/* Subtext */}
            <p
              className="hero-sub"
              style={{
                color: "#94a3b8",
                fontSize: "1.08rem",
                lineHeight: 1.9,
                maxWidth: "620px",
                marginLeft: "auto",
                marginBottom: "2.75rem",
              }}
            >
              منصة احترافية لمكاتب المحاماة تضم {operationalModules.length} وحدة تشغيلية مترابطة — من
              إدارة القضايا والجلسات وحتى المحاسبة القانونية والذكاء الاصطناعي.
            </p>

            {/* CTAs */}
            <div
              className="hero-cta"
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                marginBottom: "3.75rem",
                justifyContent: "flex-end",
              }}
            >
              <Link href="/login" className="btn-primary" style={{ fontSize: "1rem", padding: "1rem 2.25rem" }}>
                ابدأ الآن مجانًا →
              </Link>
              <Link href={dashboardLoginHref} className="btn-ghost-dark" style={{ fontSize: "1rem", padding: "1rem 2.25rem" }}>
                عرض تجريبي مباشر
              </Link>
            </div>

            {/* Stats */}
            <div
              className="hero-stats"
              style={{
                display: "flex",
                gap: "2.5rem",
                flexWrap: "wrap",
                paddingTop: "2rem",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                justifyContent: "flex-end",
              }}
            >
              {stats.map((s) => (
                <div key={s.label} style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "1.85rem",
                      fontWeight: 900,
                      color: "#ffffff",
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#475569",
                      marginTop: "0.3rem",
                      fontWeight: 500,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Visual column ── */}
          <div
            className="float-anim hero-card-col"
            style={{
              position: "absolute",
              left: 0,
              top: "calc(50% - 180px)",
              width: "min(420px, 35vw)",
              zIndex: 5,
            }}
          >
            {/* Main case card */}
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

              <h3
                style={{
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "1rem",
                  marginBottom: "0.35rem",
                }}
              >
                قضية استئناف تجارية
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "1.4rem" }}>
                محكمة الاستئناف القاهرة — الغرفة 7
              </p>

              {/* Next session */}
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
                  <p style={{ color: "#64748b", fontSize: "0.68rem", marginBottom: "0.2rem" }}>
                    الجلسة القادمة
                  </p>
                  <p style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.88rem" }}>
                    الأربعاء، 15 يوليو 2026
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>تقدم القضية</span>
                  <span style={{ fontSize: "0.72rem", color: "#c3152a", fontWeight: 700 }}>65%</span>
                </div>
                <div
                  style={{
                    height: 5,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: "99px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: "65%",
                      background: "linear-gradient(90deg, #c3152a, #ff6b6b)",
                      borderRadius: "99px",
                    }}
                  />
                </div>
              </div>

              {/* Tags */}
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

            {/* Alert mini card */}
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
                <p style={{ color: "#ffffff", fontSize: "0.82rem", fontWeight: 600 }}>
                  تنبيه عاجل
                </p>
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

            {/* Stats mini card */}
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
                  <p style={{ color: "#ffffff", fontSize: "1.15rem", fontWeight: 900, lineHeight: 1 }}>
                    {s.val}
                  </p>
                  <p style={{ color: "#475569", fontSize: "0.65rem", marginTop: "0.2rem" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.4rem",
          color: "#334155",
          fontSize: "0.7rem",
          fontWeight: 500,
        }}
      >
        <span>اكتشف المزيد</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ animation: "float 2s ease-in-out infinite" }}
        >
          <path
            d="M8 3v10M4 9l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <style>{`
        @keyframes hero-badge-drift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .hero-badge-pill {
          animation: hero-badge-drift 3.4s ease-in-out infinite;
        }
        @media (max-width: 1200px) {
          .hero-card-col {
            width: 320px !important;
            opacity: 0.8;
          }
          .hero-content-col {
            max-width: min(720px, 70vw) !important;
          }
        }
        @media (max-width: 980px) {
          .hero-heading {
            line-height: 1.12 !important;
            font-size: clamp(1.8rem, 5vw, 3rem) !important;
            flex-wrap: wrap !important;
            row-gap: 0.25rem !important;
          }
          .hero-heading-main {
            white-space: normal !important;
            width: 100%;
          }
          .hero-badge-pill {
            font-size: 0.92rem !important;
            padding: 0.58rem 1.4rem !important;
          }
        }
        @media (max-width: 900px) {
          .hero-grid {
            display: block !important;
          }
          .hero-content-col {
            max-width: 760px !important;
            text-align: center !important;
          }
          .hero-heading {
            justify-content: center !important;
          }
          .hero-heading-main, .hero-heading-accent {
            text-align: center !important;
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
          .hero-card-col {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
