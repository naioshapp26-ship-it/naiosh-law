"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LAW_RENT_PLANS, LAW_RENT_SYSTEMS, type RentPlanId } from "@/data/erp-nav-pages";

const STEPS = ["الشركة", "الخطة والأنظمة", "الدفع", "التجهيز", "النجاح"] as const;

export default function RentSystemPage() {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<RentPlanId>("office");
  const [selectedSystems, setSelectedSystems] = useState<Set<string>>(new Set(["cases", "finance"]));
  const [company, setCompany] = useState({
    companyName: "",
    subdomain: "",
    adminName: "",
    adminPhone: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [busy, setBusy] = useState(false);
  const [provisionPct, setProvisionPct] = useState(0);

  const selectedPlan = useMemo(() => LAW_RENT_PLANS.find((p) => p.id === plan)!, [plan]);

  const toggleSystem = (id: string) => {
    setSelectedSystems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runProvisioning = async () => {
    setStep(4);
    setBusy(true);
    setProvisionPct(0);
    for (let i = 1; i <= 10; i++) {
      await new Promise((r) => setTimeout(r, 220));
      setProvisionPct(i * 10);
    }
    setBusy(false);
    setStep(5);
  };

  return (
    <div className="rs-page">
      <div className={`rs-shell ${step === 2 ? "wide" : ""}`}>
        <div className="rs-brand">
          <BrandLogo size={44} showText subtitle="استأجر منظومة نايوش القانونية" />
          <Link href="/" className="rs-back">
            رجوع للواجهة
          </Link>
        </div>

        <h1>ابدأ رحلتك القانونية</h1>
        <p className="rs-sub">نفس مسار تأجير النظام في ERP — ببيانات ووحدات نايوش القانونية 360</p>

        <div className="rs-steps">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <div key={label} className="rs-step">
                <div className={`rs-circle ${active || done ? "on" : ""}`}>{n}</div>
                <span>{label}</span>
                {n < STEPS.length ? <div className={`rs-line ${done ? "on" : ""}`} /> : null}
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div className="rs-card">
            <h2>بيانات مكتبك / شركتك</h2>
            <div className="rs-fields">
              <label>
                اسم المكتب القانوني
                <input
                  value={company.companyName}
                  onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                  placeholder="مكتب النخبة للمحاماة"
                />
              </label>
              <label>
                النطاق الفرعي
                <div className="rs-subdomain">
                  <input
                    value={company.subdomain}
                    onChange={(e) => setCompany({ ...company, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    placeholder="elite-law"
                  />
                  <span>.naioshlaw.app</span>
                </div>
              </label>
              <label>
                اسم مدير النظام
                <input value={company.adminName} onChange={(e) => setCompany({ ...company, adminName: e.target.value })} placeholder="أ. سارة" />
              </label>
              <label>
                الجوال
                <input value={company.adminPhone} onChange={(e) => setCompany({ ...company, adminPhone: e.target.value })} placeholder="05xxxxxxxx" />
              </label>
              <label>
                البريد
                <input type="email" value={company.adminEmail} onChange={(e) => setCompany({ ...company, adminEmail: e.target.value })} placeholder="admin@office.com" />
              </label>
              <label>
                كلمة المرور
                <input type="password" value={company.adminPassword} onChange={(e) => setCompany({ ...company, adminPassword: e.target.value })} placeholder="••••••••" />
              </label>
            </div>
            <button
              type="button"
              className="rs-primary"
              disabled={!company.companyName || !company.subdomain || !company.adminEmail}
              onClick={() => setStep(2)}
            >
              التالي — اختيار الخطة والأنظمة
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="rs-card wide">
            <h2>اختر خطة الاشتراك</h2>
            <div className="rs-plans">
              {LAW_RENT_PLANS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`rs-plan ${plan === p.id ? "selected" : ""}`}
                  onClick={() => setPlan(p.id)}
                >
                  <strong>{p.name}</strong>
                  <span className="price">{p.priceLabel}</span>
                  <em>{p.blurb}</em>
                  <ul>
                    {p.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <h2 style={{ marginTop: 22 }}>اختر أنظمتك القانونية</h2>
            <div className="rs-systems">
              {LAW_RENT_SYSTEMS.map((sys) => {
                const on = selectedSystems.has(sys.id);
                return (
                  <label key={sys.id} className={`rs-system ${on ? "on" : ""}`}>
                    <input type="checkbox" checked={on} onChange={() => toggleSystem(sys.id)} />
                    <div>
                      <strong>{sys.title}</strong>
                      <p>{sys.sub}</p>
                      <div className="chips">
                        {sys.pages.map((pg) => (
                          <span key={pg}>{pg}</span>
                        ))}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="rs-nav">
              <button type="button" className="rs-secondary" onClick={() => setStep(1)}>
                رجوع
              </button>
              <button type="button" className="rs-primary" disabled={selectedSystems.size === 0} onClick={() => setStep(3)}>
                التالي — إتمام الدفع
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="rs-card">
            <h2>إتمام الدفع</h2>
            <p className="hint">
              الخطة: <strong>{selectedPlan.name}</strong> — {selectedPlan.priceLabel}
              <br />
              الأنظمة المختارة: {selectedSystems.size}
            </p>
            <div className="rs-pay">
              {["بطاقة مدى / فيزا", "تحويل بنكي", "محفظة إلكترونية"].map((m, i) => (
                <label key={m} className="rs-pay-opt">
                  <input type="radio" name="pay" defaultChecked={i === 0} />
                  {m}
                </label>
              ))}
            </div>
            <div className="rs-nav">
              <button type="button" className="rs-secondary" onClick={() => setStep(2)}>
                رجوع
              </button>
              <button type="button" className="rs-primary" onClick={runProvisioning} disabled={busy}>
                تأكيد والدفع
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="rs-card center">
            <h2>جارٍ تجهيز مكتبك القانوني</h2>
            <p className="hint">إنشاء مساحة العمل، تفعيل الوحدات، وإعداد حساب المدير...</p>
            <div className="rs-progress">
              <div style={{ width: `${provisionPct}%` }} />
            </div>
            <strong>{provisionPct}%</strong>
          </div>
        )}

        {step === 5 && (
          <div className="rs-card center">
            <h2>مبروك! 🎉</h2>
            <p className="hint">
              تم تجهيز مساحة <strong>{company.companyName || "مكتبكم"}</strong>
              {company.subdomain ? ` على ${company.subdomain}.naioshlaw.app` : ""}.
            </p>
            <p className="hint">يمكنك الآن الدخول للمنظومة القانونية وبدء العمل.</p>
            <div className="rs-nav" style={{ justifyContent: "center" }}>
              <Link href="/login" className="rs-primary">
                تسجيل الدخول للنظام
              </Link>
              <Link href="/create-page" className="rs-secondary">
                أنشئ صفحتك المهنية
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .rs-page{min-height:100vh;background:linear-gradient(135deg,#fff1f2 0%,#f8fafc 45%,#ecfdf5 100%);font-family:var(--font);color:#0f172a;padding:24px 16px 48px}
        .rs-shell{width:min(720px,100%);margin:0 auto}
        .rs-shell.wide{width:min(980px,100%)}
        .rs-shell:has(.wide){width:min(980px,100%)}
        .rs-brand{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:1rem;flex-wrap:wrap}
        .rs-back{color:#be123c;font-weight:800;text-decoration:none}
        h1{margin:0 0 .35rem;font-size:1.85rem;font-weight:900}
        .rs-sub{margin:0 0 1.25rem;color:#64748b}
        .rs-steps{display:flex;align-items:center;gap:6px;margin-bottom:1.25rem;overflow:auto}
        .rs-step{display:flex;align-items:center;gap:6px;color:#64748b;font-size:.72rem;font-weight:700;white-space:nowrap}
        .rs-circle{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#e2e8f0;color:#64748b;font-weight:900}
        .rs-circle.on{background:#be123c;color:#fff}
        .rs-line{width:28px;height:2px;background:#e2e8f0}
        .rs-line.on{background:#be123c}
        .rs-card{background:#fff;border-radius:20px;box-shadow:0 4px 32px rgba(190,18,60,.08);padding:1.35rem}
        .rs-card.wide{max-width:none}
        .rs-card.center{text-align:center}
        .rs-card h2{margin:0 0 1rem;font-size:1.15rem;font-weight:900}
        .rs-fields{display:grid;gap:12px}
        .rs-fields label{display:grid;gap:6px;font-size:.85rem;font-weight:700;color:#334155}
        .rs-fields input{border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;font-family:inherit}
        .rs-subdomain{display:flex;border:1.5px solid #e2e8f0;border-radius:10px;overflow:hidden}
        .rs-subdomain input{border:0;flex:1}
        .rs-subdomain span{background:#f8fafc;padding:10px 12px;color:#94a3b8;font-weight:700;font-size:.8rem;border-inline-start:1.5px solid #e2e8f0}
        .rs-primary,.rs-secondary{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:800;border-radius:10px;padding:11px 22px;border:0;cursor:pointer;font-family:inherit;text-decoration:none}
        .rs-primary{background:#be123c;color:#fff}
        .rs-primary:disabled{opacity:.55;cursor:not-allowed}
        .rs-secondary{background:#f1f5f9;color:#475569}
        .rs-plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
        .rs-plan{text-align:right;border:2px solid #e2e8f0;border-radius:14px;padding:16px;background:#fff;cursor:pointer;font-family:inherit}
        .rs-plan.selected{border-color:#be123c;background:#fff1f2}
        .rs-plan strong{display:block;font-size:1rem;margin-bottom:4px}
        .rs-plan .price{display:block;color:#be123c;font-weight:900;margin-bottom:6px}
        .rs-plan em{display:block;font-style:normal;color:#64748b;font-size:.8rem;margin-bottom:8px}
        .rs-plan ul{margin:0;padding-inline-start:1.1rem;color:#475569;font-size:.8rem;line-height:1.7}
        .rs-systems{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:8px}
        .rs-system{display:flex;gap:10px;align-items:flex-start;border:2px solid #e2e8f0;border-radius:14px;padding:12px;background:#fff;cursor:pointer}
        .rs-system.on{border-color:#be123c;box-shadow:0 0 0 3px rgba(190,18,60,.12)}
        .rs-system strong{display:block;font-size:.92rem}
        .rs-system p{margin:2px 0 8px;color:#64748b;font-size:.78rem}
        .chips{display:flex;flex-wrap:wrap;gap:6px}
        .chips span{font-size:.68rem;font-weight:700;background:#f8fafc;border:1px solid #e2e8f0;border-radius:999px;padding:3px 8px;color:#475569}
        .rs-nav{display:flex;gap:10px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}
        .hint{color:#64748b;line-height:1.7}
        .rs-pay{display:grid;gap:8px;margin:12px 0}
        .rs-pay-opt{display:flex;gap:8px;align-items:center;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;font-weight:700}
        .rs-progress{height:10px;background:#ffe4e6;border-radius:999px;overflow:hidden;margin:16px 0 8px}
        .rs-progress div{height:100%;background:#be123c;transition:width .2s}
      `}</style>
    </div>
  );
}
