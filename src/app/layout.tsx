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
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
