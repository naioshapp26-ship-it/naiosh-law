import type { Metadata } from "next";
import AdsPage from "@/components/ads-page";

export const metadata: Metadata = {
  title: "الإعلانات | NAIOSH Law",
  description: "اكتشف أفضل الإعلانات المبوبة — منصة متكاملة لنشر الإعلانات باحترافية والوصول السريع إلى المهتمين.",
};

export default function Page() {
  return <AdsPage />;
}
