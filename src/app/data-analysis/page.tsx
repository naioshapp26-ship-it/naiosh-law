import type { Metadata } from "next";
import { DataAnalysisPublicShell } from "@/components/data-analysis/public-shell";
import { DataAnalysisLanding } from "@/components/data-analysis/landing";

export const metadata: Metadata = {
  title: "نايوش لتحليل البيانات | NAIOSH Law",
  description:
    "نايوش لتحليل البيانات داخل المنظومة القانونية — تحليل القضايا والجلسات والموكلين والمحاسبة القانونية بهوية NAIOSH LAW.",
};

export default function PublicDataAnalysisPage() {
  return (
    <DataAnalysisPublicShell>
      <DataAnalysisLanding />
    </DataAnalysisPublicShell>
  );
}
