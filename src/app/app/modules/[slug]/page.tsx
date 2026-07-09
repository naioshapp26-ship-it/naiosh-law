import { notFound } from "next/navigation";
import { ModuleShell } from "@/components/module-shell";
import { moduleConfigMap } from "@/data/module-configs";
import { operationalModules } from "@/data/modules";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;

  if (!moduleConfigMap[slug]) {
    notFound();
  }

  return <ModuleShell key={slug} slug={slug} />;
}

export function generateStaticParams() {
  return operationalModules.map((module) => ({ slug: module.slug }));
}
