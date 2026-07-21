import type { Metadata } from "next";
import PlatformsPage from "@/components/platforms-page";

export const metadata: Metadata = {
  title: "المنصات | NAIOSH Law",
  description:
    "منصتي — أقسام المنصة: العمليات اليومية، المبيعات، الاشتراكات، التدريب، خدمة العملاء، التقارير، الموارد البشرية، والمالية التشغيلية.",
};

export default function Page() {
  return <PlatformsPage />;
}
