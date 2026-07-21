import type { Metadata } from "next";
import ServicesPage from "@/components/services-page";

export const metadata: Metadata = {
  title: "خدماتنا | NAIOSH Law",
  description:
    "إمبراطورية نايوش تقدم أكثر من 40 نظامًا تشغيليًا — منح الفروع والحاضنات والمنصات والمكاتب الإلكترونية والشراكات والتوكيلات وسلاسل الإمداد والتسويق والحوكمة والذكاء الاصطناعي والتعليم والسلامة والامتثال.",
};

export default function Page() {
  return <ServicesPage />;
}
