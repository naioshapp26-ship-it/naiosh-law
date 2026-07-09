import { notFound } from "next/navigation";
import { ModuleShell } from "@/components/module-shell";
import { moduleConfigMap } from "@/data/module-configs";
import { moduleMap, operationalModules } from "@/data/modules";
import { getServerSessionUser } from "@/lib/server-session";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  const config = moduleConfigMap[slug];

  if (!config) {
    notFound();
  }

  const initialUser = await getServerSessionUser();

  return (
    <ModuleShell
      key={slug}
      slug={slug}
      config={config}
      title={moduleMap[slug]?.title}
      initialUser={initialUser}
    />
  );
}

export function generateStaticParams() {
  return operationalModules.map((module) => ({ slug: module.slug }));
}
