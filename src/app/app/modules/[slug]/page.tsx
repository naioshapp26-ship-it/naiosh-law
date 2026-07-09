import { notFound } from "next/navigation";
import { ModuleShell } from "@/components/module-shell";
import { moduleConfigMap } from "@/data/module-configs";
import { moduleMap, operationalModules } from "@/data/modules";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  const config = moduleConfigMap[slug];

  if (!config) {
    notFound();
  }

  return <ModuleShell key={slug} slug={slug} config={config} title={moduleMap[slug]?.title} />;
}

export function generateStaticParams() {
  return operationalModules.map((module) => ({ slug: module.slug }));
}
