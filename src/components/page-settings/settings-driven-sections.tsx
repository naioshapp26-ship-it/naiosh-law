"use client";

import { useSession, canWriteRole } from "@/lib/session";
import { usePageSettings } from "@/lib/page-settings/use-page-settings";
import { PageDynamicSections } from "@/components/page-settings/page-dynamic-sections";
import type { CustomFieldDef, PageSectionDef } from "@/lib/page-settings/custom-field-types";
import type { SectionDataMap } from "@/components/page-settings/page-dynamic-sections";

/** Drop-in No-Code section panels for any staff page that has page settings. */
export function SettingsDrivenSections({ pageKey }: { pageKey: string }) {
  const { user } = useSession(true);
  const settings = usePageSettings(pageKey);
  if (settings.loading) return null;
  return (
    <PageDynamicSections
      pageKey={pageKey}
      sections={settings.sections as PageSectionDef[] | undefined}
      customFields={settings.customFields as CustomFieldDef[] | undefined}
      sectionData={settings.sectionData as SectionDataMap | undefined}
      canWrite={user ? canWriteRole(user.role) : false}
      includeBuiltins={false}
    />
  );
}
