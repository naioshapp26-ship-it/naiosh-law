import { redirect } from "next/navigation";

/** Legacy admin workspace path → public workspace (still session-gated) */
export default function LegacyAppDataAnalysisWorkspaceRedirect() {
  redirect("/data-analysis/workspace");
}
