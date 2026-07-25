import type { Metadata } from "next";
import IncubatorsPage from "@/components/incubators-page";

export const metadata: Metadata = {
  title: "الحاضنات | NAIOSH Law",
  description:
    "الحاضنات المقترحة لإمبراطورية نايوش — التقنية والتعليم والصناعة والطاقة والإعلام والعقار والسياحة والصحة والمال والمجتمع.",
};

export default function Page() {
  return <IncubatorsPage />;
}
