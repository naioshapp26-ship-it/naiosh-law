"use client";

import { ModuleShell } from "@/components/module-shell";

type Props = {
  slug: string;
};

export function ModulePageClient({ slug }: Props) {
  return <ModuleShell slug={slug} />;
}
