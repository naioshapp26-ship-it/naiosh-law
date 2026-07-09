import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ModuleShell } from "@/components/module-shell";
import { moduleConfigMap } from "@/data/module-configs";
import { moduleMap } from "@/data/modules";
import { canAccessModule } from "@/lib/module-routing";
import { readSessionToken, sessionCookieName } from "@/lib/session-shared";

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
  const user = await readSessionToken(cookieStore.get(sessionCookieName)?.value);

  if (!user) {
    redirect(`/login?next=/app/modules/${slug}`);
  }

  if (!canAccessModule(slug, user.role)) {
    redirect("/app/dashboard");
  }

  return (
    <ModuleShell
      key={slug}
      slug={slug}
      config={config}
      moduleTitle={moduleMap[slug]?.title ?? config.entityName}
    />
  );
}
