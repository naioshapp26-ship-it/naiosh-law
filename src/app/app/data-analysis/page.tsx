import { redirect } from "next/navigation";

/** Legacy admin path → public site entry */
export default function LegacyAppDataAnalysisRedirect() {
  redirect("/data-analysis");
}
