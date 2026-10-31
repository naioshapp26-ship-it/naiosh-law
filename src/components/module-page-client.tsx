"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ModuleShell } from "@/components/module-shell";
import { RolesPermissionsPage } from "@/components/roles-permissions-page";

type Props = {
  slug: string;
};

export function ModulePageClient({ slug }: Props) {
  const router = useRouter();

  // moduleMap lists «لوحة التحكم» but the real dashboard lives at /app/dashboard
  useEffect(() => {
    if (slug === "dashboard") router.replace("/app/dashboard");
  }, [slug, router]);

  if (slug === "dashboard") {
    return null;
  }

  if (slug === "administration") {
    return <RolesPermissionsPage />;
  }
  return <ModuleShell slug={slug} />;
}
