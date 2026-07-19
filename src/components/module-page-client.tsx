"use client";

import { ModuleShell } from "@/components/module-shell";
import { RolesPermissionsPage } from "@/components/roles-permissions-page";

type Props = {
  slug: string;
};

export function ModulePageClient({ slug }: Props) {
  if (slug === "administration") {
    return <RolesPermissionsPage />;
  }
  return <ModuleShell slug={slug} />;
}
