import type { Metadata } from "next";
import PlatformsPage from "@/components/platforms-page";

export const metadata: Metadata = {
  title: "المنصات | NAIOSH Law",
  description:
    "منصات تشغيلية ومكاتب إلكترونية ومراكز متخصصة وأكاديميات ضمن حاضنات إمبراطورية نايوش 360.",
};

export default function Page() {
  return <PlatformsPage />;
}
