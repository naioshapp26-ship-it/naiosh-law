import { ModuleShell } from "@/components/module-shell";
import { moduleConfigMap } from "@/data/module-configs";
import { moduleMap } from "@/data/modules";
import { canAccessModule } from "@/lib/module-routing";
import { decodeSessionToken, sessionCookieName } from "@/lib/session-token";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  if (slug === "dashboard") {
    redirect("/app/dashboard");
  }

  const cookieStore = await cookies();
  const user = await decodeSessionToken(cookieStore.get(sessionCookieName)?.value);
  if (!user || !canAccessModule(user.role, slug)) {
    redirect("/app/dashboard");
  }

  return (
    <ModuleShell
      key={slug}
      slug={slug}
      config={moduleConfigMap[slug] ?? null}
      moduleTitle={moduleMap[slug]?.title}
    />
  );
}
