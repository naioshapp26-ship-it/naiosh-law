import type { Metadata } from "next";
import NaioshOwnershipPage from "@/components/naiosh-ownership-page";

export const metadata: Metadata = {
  title: "ملكية نايوش | NAIOSH Law",
  description:
    "صفحة ملكية نايوش — إضافة ملكية جديدة وأنواع الملكية والتوثيق ضمن منظومة نايوش القانونية 360.",
};

export default function Page() {
  return <NaioshOwnershipPage />;
}
