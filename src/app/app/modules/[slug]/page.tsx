import { ModuleShell } from "@/components/module-shell";
import { sessionCookieName } from "@/data/auth";
import { moduleConfigMap } from "@/data/module-configs";
import { canAccessModule, moduleMap } from "@/data/modules";
import { verifySessionToken } from "@/lib/session-token";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;

  if (slug === "dashboard") {
    redirect("/app/dashboard");
  }

  const config = moduleConfigMap[slug];
  if (!config) {
    notFound();
  }

  const cookieStore = await cookies();
  const user = await verifySessionToken(cookieStore.get(sessionCookieName)?.value);
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/app/modules/${slug}`)}`);
  }
  if (!canAccessModule(user.role, slug)) {
    redirect("/app/dashboard");
  }

  return <ModuleShell key={slug} slug={slug} title={moduleMap[slug]?.title ?? config.entityName} config={config} />;
}
