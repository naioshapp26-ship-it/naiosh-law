"use client";

import { ModuleShell } from "@/components/module-shell";
import type { ModuleConfig } from "@/data/module-configs";

type Props = {
  slug: string;
  config: ModuleConfig;
  moduleTitle: string;
};

export function ModulePageClient({ slug, config, moduleTitle }: Props) {
  return <ModuleShell key={slug} slug={slug} config={config} moduleTitle={moduleTitle} />;
}
