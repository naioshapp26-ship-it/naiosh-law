import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "بوابة العميل | NAIOSH Law",
  description: "بوابة العميل القانونية 360 — قضايا، جلسات، مستندات، طلبات، ومالية شخصية.",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/newhome/portal.css?v=unify-page-hero-20261031" />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      {children}
    </>
  );
}
