import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { BRAND } from "@/lib/brand";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Naiosh Law — النظام القانوني المتكامل",
  description: "منصة احترافية لإدارة القضايا والموكلين والجلسات والمحاسبة القانونية",
  icons: {
    icon: BRAND.logoPath,
    apple: BRAND.logoPath,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} style={{ fontVariantNumeric: "lining-nums tabular-nums" }}>
      <head>
        {/* Owned by the root layout so client navigations never unload ERP landing CSS (FOUC on /login → /). */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          data-erp-home="1"
        />
        <link rel="stylesheet" href="/newhome/styles.css?v=sidebar-white-text-20260721" data-erp-home="1" />
        <link
          rel="stylesheet"
          href="/newhome/homepage-premium.css?v=erp-copy-20260721-flashfix2"
          data-erp-home="1"
        />
        <link rel="stylesheet" href="/newhome/dark-mode.css?v=erp-copy-20260721-flashfix2" data-erp-home="1" />
        <link
          rel="stylesheet"
          href="/newhome/homepage-dark-fix.css?v=erp-copy-20260721-flashfix2"
          data-erp-home="1"
        />
        <link
          rel="stylesheet"
          href="/newhome/mobile-header.css?v=erp-copy-20260721-flashfix2"
          data-erp-home="1"
        />
        <link
          rel="stylesheet"
          href="/newhome/landing-shared.css?v=services-cards-side-20260721"
          data-erp-home="1"
        />
        <link
          rel="stylesheet"
          href="/newhome/branches-page.css?v=erp-branches-copy-20260721"
          data-erp-home="1"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark-mode');document.documentElement.style.colorScheme='dark'}}catch(_){}`,
          }}
        />
      </head>
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='dark')document.body.classList.add('dark-mode')}catch(_){}`,
          }}
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
