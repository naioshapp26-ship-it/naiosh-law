"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export function LandingPromoBar() {
  const reduce = useReducedMotion();

  return (
    <div
      className="landing-promo-bar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 110,
        background: "linear-gradient(90deg, #7f1d1d 0%, #450a0a 50%, #7f1d1d 100%)",
        color: "#fff",
        fontSize: "0.8rem",
        fontWeight: 700,
        padding: "0.55rem 1rem",
        textAlign: "center",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    >
      {!reduce && <span className="landing-promo-shimmer" aria-hidden />}
      <motion.span
        initial={reduce ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        ابدأ الآن | عروض محدودة على منظومة نايوش القانونية 360 —{" "}
      </motion.span>
      <motion.span
        animate={reduce ? undefined : { opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ display: "inline-block" }}
      >
        <Link href="/login" style={{ color: "#fecaca", fontWeight: 900, textDecoration: "underline" }}>
          سجّل مجانًا
        </Link>
      </motion.span>

      <style>{`
        .landing-promo-shimmer {
          position: absolute;
          inset-block: 0;
          width: 38%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
          transform: skewX(-18deg);
          animation: promo-shimmer 4.5s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes promo-shimmer {
          0% { inset-inline-start: -40%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { inset-inline-start: 110%; opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .landing-promo-shimmer { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/** Promo bar (~36px) + compact single-row navbar (~64px). */
export const LANDING_HEADER_OFFSET = 100;
