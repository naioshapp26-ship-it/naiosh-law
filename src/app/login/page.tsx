"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { demoAccounts } from "@/data/auth";
import { saveSessionUser, type SessionUser } from "@/lib/session";
import { getSafeAppPath, type Role } from "@/lib/session-shared";

const perks = [
  "إدارة شاملة للقضايا والموكلين",
  "جلسات وتذكيرات ذكية تلقائية",
  "محاسبة قانونية دقيقة",
  "ذكاء اصطناعي قانوني متكامل",
  "تقارير تنفيذية فورية",
];
const demoLoginEnabled =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_NAIOSH_ENABLE_DEMO_LOGIN === "true";

type LoginResponse = {
  ok: boolean;
  user?: SessionUser;
  error?: string;
};

function getRedirectTarget() {
  if (typeof window === "undefined") {
    return "/app/dashboard";
  }

  return getSafeAppPath(new URLSearchParams(window.location.search).get("next"));
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@naioshlaw.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    let active = true;

    const redirectAuthenticatedUser = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const result = (await response.json()) as LoginResponse;

        if (active && response.ok && result.ok && result.user) {
          saveSessionUser(result.user);
          router.replace(getRedirectTarget());
        }
      } catch {
        // Stay on the login form if the session check cannot complete.
      }
    };

    void redirectAuthenticatedUser();

    return () => {
      active = false;
    };
  }, [router]);

  const submitLogin = async (body: Record<string, unknown>) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as LoginResponse;

      if (!response.ok || !result.ok || !result.user) {
        setError(result.error ?? "البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        setLoading(false);
        return;
      }

      saveSessionUser(result.user);
      setLoading(false);
      router.replace(getRedirectTarget());
      router.refresh();
    } catch {
      setError("تعذر الاتصال بخدمة الدخول. حاول مرة أخرى.");
      setLoading(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitLogin({ email, password });
  };

  const loginDemo = (role: Role) => {
    const user = demoAccounts.find((account) => account.role === role);
    if (user) {
      setEmail(user.email);
    }
    void submitLogin({ demoRole: role });
  };

  return (
    <main
      id="main-content"
      style={{ minHeight: "100dvh", display: "flex", background: "#0a0a12" }}
      className="login-wrap"
    >
      {/* ── Left: Branding panel ── */}
      <div
        style={{
          width: "42%",
          background: "linear-gradient(160deg, #c3152a 0%, #6d0b16 60%, #2a0508 100%)",
          padding: "3rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
        className="brand-panel"
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            width: 350,
            height: 350,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.08)",
            bottom: -80,
            left: -80,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.06)",
            bottom: 60,
            left: 60,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%)",
            top: -150,
            right: -150,
            pointerEvents: "none",
          }}
        />

        {/* Top: Logo */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "3rem" }}>
            <div
              style={{
                width: 44,
                height: 44,
                background: "rgba(255,255,255,0.12)",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                color: "#fff",
                fontSize: "1.2rem",
                border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              N
            </div>
            <div>
              <div style={{ color: "#ffffff", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.2 }}>
                Naiosh Law
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem" }}>
                النظام القانوني المتكامل
              </div>
            </div>
          </div>

          {/* Tagline */}
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.25,
              marginBottom: "1.75rem",
              letterSpacing: "-0.02em",
            }}
          >
            منصة احترافية
            <br />
            لمكاتب المحاماة
            <br />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.3rem", fontWeight: 600 }}>
              من الجيل القادم
            </span>
          </h2>

          {/* Perks */}
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {perks.map((perk) => (
              <li
                key={perk}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.65rem",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "0.88rem",
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    flexShrink: 0,
                    color: "#ffffff",
                  }}
                >
                  ✓
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: Quote */}
        <div
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "16px",
            padding: "1.25rem",
            backdropFilter: "blur(10px)",
          }}
        >
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.85rem", lineHeight: 1.7, fontStyle: "italic" }}>
            &quot;العدالة لا تُدار بالورق المتراكم، بل بالنظام الذي يُوثّق كل خطوة ويُحاسب كل لحظة.&quot;
          </p>
          <div style={{ marginTop: "0.85rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
              }}
            >
              ⚖️
            </div>
            <div>
              <p style={{ color: "#ffffff", fontSize: "0.78rem", fontWeight: 700 }}>Naiosh Law</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem" }}>النظام القانوني المتكامل</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div
        style={{
          flex: 1,
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 2rem",
          minHeight: "100dvh",
        }}
      >
        <div
          style={{ width: "100%", maxWidth: "420px" }}
        >
          {/* Heading */}
          <div className="login-fade login-fade-1" style={{ marginBottom: "2.5rem" }}>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                color: "#0a0a12",
                letterSpacing: "-0.02em",
                marginBottom: "0.5rem",
              }}
            >
              مرحبًا بعودتك 👋
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6 }}>
              سجّل دخولك للوصول إلى لوحة التحكم الكاملة
            </p>
          </div>

          {demoLoginEnabled && (
            <div className="login-fade login-fade-2" style={{ marginBottom: "2rem" }}>
              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8", marginBottom: "0.65rem" }}>
                دخول سريع تجريبي:
              </p>
              <div className="demo-login-buttons" style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => loginDemo("admin")}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "0.65rem",
                    borderRadius: "10px",
                    border: "1.5px solid #e2e8f0",
                    background: "#f8f9fb",
                    cursor: "pointer",
                    fontFamily: "var(--font-cairo)",
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#c3152a";
                    (e.currentTarget as HTMLElement).style.background = "rgba(195,21,42,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                    (e.currentTarget as HTMLElement).style.background = "#f8f9fb";
                  }}
                >
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0a0a12", display: "block" }}>
                    ⚙️ Admin
                  </span>
                  <span style={{ fontSize: "0.68rem", color: "#64748b" }}>مدير النظام</span>
                </button>
                <button
                  type="button"
                  onClick={() => loginDemo("client")}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "0.65rem",
                    borderRadius: "10px",
                    border: "1.5px solid #e2e8f0",
                    background: "#f8f9fb",
                    cursor: "pointer",
                    fontFamily: "var(--font-cairo)",
                    transition: "all 0.2s",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#c3152a";
                    (e.currentTarget as HTMLElement).style.background = "rgba(195,21,42,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                    (e.currentTarget as HTMLElement).style.background = "#f8f9fb";
                  }}
                >
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0a0a12", display: "block" }}>
                    👤 Client
                  </span>
                  <span style={{ fontSize: "0.68rem", color: "#64748b" }}>عميل تجريبي</span>
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          <div
            className="login-fade login-fade-3"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>
              {demoLoginEnabled ? "أو ادخل يدويًا" : "تسجيل الدخول"}
            </span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          {/* Form */}
          <form onSubmit={onSubmit}>
            <div className="login-fade login-fade-4" style={{ marginBottom: "1.25rem" }}>
              <label className="input-label" htmlFor="login-email">البريد الإلكتروني</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    top: "50%",
                    insetInlineEnd: "1rem",
                    transform: "translateY(-50%)",
                    fontSize: "1rem",
                    pointerEvents: "none",
                  }}
                >
                  ✉️
                </span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                  placeholder="example@naioshlaw.com"
                  style={{ paddingInlineEnd: "2.75rem" }}
                />
              </div>
            </div>

            <div className="login-fade login-fade-5" style={{ marginBottom: "1.5rem" }}>
              <label className="input-label" htmlFor="login-password">كلمة المرور</label>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute",
                    top: "50%",
                    insetInlineEnd: "1rem",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1rem",
                    padding: 0,
                    lineHeight: 1,
                  }}
                  aria-label="إظهار/إخفاء كلمة المرور"
                  aria-pressed={showPass}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field"
                  placeholder="••••••••"
                  style={{ paddingInlineEnd: "2.75rem" }}
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="login-error"
                style={{
                  background: "rgba(195,21,42,0.06)",
                  border: "1px solid rgba(195,21,42,0.2)",
                  borderRadius: "10px",
                  padding: "0.75rem 1rem",
                  marginBottom: "1.25rem",
                  color: "#c3152a",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "1rem",
                fontSize: "1rem",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}
            >
              {loading ? (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    style={{ animation: "spin-slow 0.9s linear infinite" }}
                  >
                    <circle
                      cx="9"
                      cy="9"
                      r="7"
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth="2"
                    />
                    <path
                      d="M9 2a7 7 0 017 7"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  جاري الدخول...
                </>
              ) : (
                <>دخول النظام →</>
              )}
            </button>
          </form>

          {/* Hint */}
          <p
            className="login-fade login-fade-6"
            style={{
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "0.78rem",
              marginTop: "1.75rem",
              lineHeight: 1.6,
            }}
          >
            {demoLoginEnabled
              ? "هذا نظام تجريبي للعرض — استخدم أي من الحسابات أعلاه للدخول الفوري بدون كشف كلمات المرور في المتصفح"
              : "الدخول التجريبي السريع غير مفعّل في هذه البيئة. استخدم بيانات الدخول المصرح بها."}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes login-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-fade, .login-error {
          animation: login-fade-in 0.35s ease both;
        }
        .login-fade-1 { animation-delay: 0.04s; }
        .login-fade-2 { animation-delay: 0.08s; }
        .login-fade-3 { animation-delay: 0.12s; }
        .login-fade-4 { animation-delay: 0.16s; }
        .login-fade-5 { animation-delay: 0.20s; }
        .login-fade-6 { animation-delay: 0.24s; }
        @media (max-width: 860px) {
          .brand-panel { display: none !important; }
          .login-wrap { background: #f8f9fb !important; }
        }
        @media (max-width: 480px) {
          .demo-login-buttons { flex-direction: column; }
          .login-wrap > div:last-child { padding: 2rem 1rem !important; }
        }
      `}</style>
    </main>
  );
}
