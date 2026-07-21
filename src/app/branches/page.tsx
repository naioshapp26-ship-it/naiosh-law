import type { Metadata } from "next";
import BranchesPage from "@/components/branches-page";

export const metadata: Metadata = {
  title: "الفروع | NAIOSH Law",
  description: "فروعنا حول العالم — شبكة الفروع العالمية لتجربة موحدة واحترافية عبر مواقع نايوش المختلفة.",
};

export default function Page() {
  return <BranchesPage />;
}
