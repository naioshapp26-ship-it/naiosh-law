import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero";
import { ModuleCard } from "@/components/module-card";
import { operationalModules } from "@/data/modules";

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

const statItems = [
  { value: String(operationalModules.length), label: "وحدة تشغيلية" },
  { value: "128+", label: "قضية نشطة" },
  { value: "500+", label: "موكل مسجل" },
  { value: "99.9%", label: "وقت التشغيل" },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <HeroSection />

      {/* ── Stats Bar ── */}
      <section
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "2.75rem 0",
        }}
      >
        <div className="container-max">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1rem",
              textAlign: "center",
            }}
            className="stats-grid"
          >
            {statItems.map((s) => (
              <div key={s.label}>
                <div
                  style={{ fontSize: "2.4rem", fontWeight: 900, color: "#c3152a", lineHeight: 1 }}
                >
                  {s.value}
                </div>
                <div
                  style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.35rem", fontWeight: 500 }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ background: "#f8f9fb", padding: "6rem 0" }}>
        <div className="container-max">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
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
              منصة واحدة تغني عن عشرات الأدوات المتفرقة وتوفر تدفق عمل سلس من
              البداية للنهاية
            </p>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}
            className="features-grid"
          >
            {features.map((f) => (
              <div
                key={f.title}
                className="card-white"
                style={{ padding: "2rem" }}
              >
                <div
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
                >
                  {f.icon}
                </div>
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
                <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: 1.75 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules ── */}
      <section id="modules" style={{ background: "#ffffff", padding: "6rem 0" }}>
        <div className="container-max">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
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
              {operationalModules.length} وحدة مترابطة وكاملة
            </h2>
            <p style={{ color: "#64748b", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto", lineHeight: 1.8 }}>
              كل وحدة مستقلة بشاشاتها ووظائفها وعلاقاتها وصلاحياتها الخاصة
            </p>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}
            className="modules-grid"
          >
            {operationalModules.map((item) => (
              <ModuleCard key={item.slug} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          background: "#0a0a12",
          padding: "6rem 0",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(195,21,42,0.2) 0%, transparent 65%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }}
        />
        <div className="container-max" style={{ position: "relative" }}>
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
            <Link
              href="/login"
              className="btn-primary"
              style={{ fontSize: "1.05rem", padding: "1.05rem 2.5rem" }}
            >
              ابدأ تجربتك المجانية →
            </Link>
            <Link
              href="/app/dashboard"
              className="btn-ghost-dark"
              style={{ fontSize: "1.05rem", padding: "1.05rem 2.5rem" }}
            >
              الدخول كزائر
            </Link>
          </div>

          {/* Demo credentials */}
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
            ].map((u) => (
              <div
                key={u.email}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "0.85rem 1.25rem",
                  textAlign: "start",
                }}
              >
                <p style={{ color: "#ffffff", fontSize: "0.82rem", fontWeight: 700 }}>
                  {u.label}
                </p>
                <p style={{ color: "#475569", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                  {u.email}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          background: "#0a0a12",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "2rem 0",
        }}
      >
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
          <div style={{ color: "#334155", fontSize: "0.85rem" }}>
            © 2026 Naiosh Law. جميع الحقوق محفوظة.
          </div>
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
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .modules-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1100px) {
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .modules-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </>
  );
}
