"use client";

import { ModuleShell } from "@/components/module-shell";
import type { ModuleConfig } from "@/data/module-configs";
import type { SessionUser } from "@/lib/session";

type Props = {
  slug: string;
  config: ModuleConfig;
  moduleTitle: string;
  initialUser: SessionUser;
};

export function ModulePageClient({ slug, config, moduleTitle, initialUser }: Props) {
  return (
    <ModuleShell
      key={slug}
      slug={slug}
      config={config}
      moduleTitle={moduleTitle}
      initialUser={initialUser}
    />
  );
}
