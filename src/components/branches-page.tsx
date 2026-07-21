"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { LandingPromoBar } from "@/components/landing-promo-bar";
import { BrandLogo } from "@/components/brand-logo";
import { ensureErpHomepageStylesheets, setHomepageMode } from "@/components/homepage-route-chrome";
import {
  LAW_BRANCHES,
  LAW_BRANCHES_INTRO,
  type LawBranchType,
} from "@/data/law-branches";

const BRANCHES_CSS = "/newhome/branches-page.css?v=erp-branches-copy-20260721";

function branchWord(count: number) {
  if (count === 1) return "فرع";
  if (count === 2) return "فرعين";
  return "فروع";
}

export default function BranchesPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<LawBranchType | "all">("all");

  useEffect(() => {
    ensureErpHomepageStylesheets();
    setHomepageMode(true);
    if (!document.querySelector(`link[href="${BRANCHES_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = BRANCHES_CSS;
      link.setAttribute("data-erp-home", "1");
      document.head.appendChild(link);
    }
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LAW_BRANCHES.filter((b) => {
      const matchesSearch = !q || b.searchText.toLowerCase().includes(q);
      const matchesType = type === "all" || b.type === type;
      return matchesSearch && matchesType;
    });
  }, [query, type]);

  const resetFilters = () => {
    setQuery("");
    setType("all");
  };

  return (
    <>
      <LandingPromoBar />
      <Navbar variant="landing" />

      <main className="container" style={{ paddingTop: 24 }}>
        <section className="branches-showcase">
          <header className="branches-head">
            <h1>فروعنا حول العالم</h1>
            <p>{LAW_BRANCHES_INTRO}</p>
          </header>

          <div className="branches-toolbar">
            <input
              id="branchSearch"
              type="search"
              placeholder="ابحث عن الفرع أو الدولة..."
              aria-label="بحث الفروع"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              id="branchTypeFilter"
              aria-label="تصفية نوع الفرع"
              value={type}
              onChange={(e) => setType(e.target.value as LawBranchType | "all")}
            >
              <option value="all">كل الأنواع</option>
              <option value="مكاتب خاصة">مكاتب خاصة</option>
              <option value="حاضنة أعمال">حاضنة أعمال</option>
              <option value="مسرعة أعمال">مسرعة أعمال</option>
            </select>
            <button type="button" id="branchFilterAll" className="branches-filter-all" onClick={resetFilters}>
              الكل
            </button>
          </div>

          <p id="branchFilterStatus" className="sr-only" aria-live="polite">
            تم عرض {visible.length} {branchWord(visible.length)}
          </p>

          <section className="branch-grid" id="branchGrid" aria-label="قائمة الفروع">
            {visible.map((branch) => (
              <article
                key={branch.id}
                className="branch-card"
                data-branch={branch.searchText}
                data-type={branch.type}
              >
                <div className="branch-card-top">
                  <span className="branch-badge">{branch.type}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="branch-flag" alt={branch.flagAlt} src={branch.flagSrc} />
                </div>
                <div className="branch-content">
                  <h3 className="branch-title">
                    {branch.nameAr} <span>{branch.nameEn}</span>
                  </h3>
                  <p className="branch-hours">
                    <i className="fas fa-clock" aria-hidden="true" /> {branch.hours}
                  </p>
                  <div className="branch-actions">
                    <Link
                      href="/rent-system"
                      className="branch-btn primary"
                      aria-label={`احجز زيارة - ${branch.nameAr}`}
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                    >
                      احجز زيارة
                    </Link>
                    <Link
                      href={`#${branch.id}`}
                      className="branch-btn"
                      aria-label={`عرض الفرع - ${branch.nameAr}`}
                      id={branch.id}
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                    >
                      عرض الفرع
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {visible.length === 0 ? (
            <p style={{ textAlign: "center", marginTop: 28, color: "#5f6672", fontWeight: 700 }}>
              لا توجد فروع مطابقة لبحثك.
            </p>
          ) : null}
        </section>
      </main>

      <nav className="floating-actions" aria-label="أزرار جانبية عائمة">
        <Link href="/app/dashboard" title="إضافة" aria-label="إضافة">
          <i className="fas fa-plus" />
        </Link>
        <Link href="/branches" title="الفروع" aria-label="الفروع">
          <i className="fas fa-heart" />
        </Link>
        <Link href="/#footer-support" title="رسائل" aria-label="رسائل">
          <i className="fas fa-envelope" />
        </Link>
        <button
          type="button"
          id="to-top"
          title="الصعود للأعلى"
          aria-label="الصعود للأعلى"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <i className="fas fa-arrow-up" />
        </button>
      </nav>

      <footer className="site-footer" id="footer-support" aria-label="تذييل الصفحة">
        <div className="container site-footer-inner">
          <section className="site-footer-brand" aria-label="هوية نايوش">
            <BrandLogo href="/" size={56} showText={false} variant="dark" />
            <p>إدارة القضايا والموكلين بذكاء لا مثيل له</p>
          </section>
          <section className="site-footer-col" aria-label="روابط سريعة">
            <h3>روابط سريعة</h3>
            <Link href="/">الرئيسية</Link>
            <Link href="/services">خدماتنا</Link>
            <Link href="/branches">الفروع</Link>
            <Link href="/rent-system">استأجر نظام الآن</Link>
          </section>
          <section className="site-footer-col" aria-label="خدمة العملاء">
            <h3>خدمة العملاء</h3>
            <Link href="/#footer-support">اتصل بنا</Link>
            <Link href="/register">سجل معنا</Link>
            <Link href="/login">سياسة الخصوصية</Link>
            <Link href="/login">الشروط والأحكام</Link>
          </section>
          <section className="site-footer-col" id="contact" aria-label="تواصل معنا">
            <h3>تواصل معنا</h3>
            <p>
              <i className="fas fa-location-dot" aria-hidden="true" /> الرياض، المملكة العربية السعودية
            </p>
            <p>
              <i className="fas fa-envelope" aria-hidden="true" /> info@naiosh.com
            </p>
            <p>
              <i className="fas fa-phone" aria-hidden="true" /> 920003456
            </p>
          </section>
        </div>
        <div className="site-footer-bottom">
          <div className="container site-footer-bottom-inner">
            <span>© {new Date().getFullYear()} NAIOSH Law — جميع الحقوق محفوظة</span>
          </div>
        </div>
      </footer>
    </>
  );
}
