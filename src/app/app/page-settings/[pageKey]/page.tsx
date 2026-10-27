"use client";

import { use } from "react";
import { PageSettingsEditor } from "@/components/page-settings/page-settings-editor";

export default function PageSettingsEditorRoute({
  params,
}: {
  params: Promise<{ pageKey: string }>;
}) {
  const { pageKey } = use(params);
  return <PageSettingsEditor pageKey={pageKey} />;
}
