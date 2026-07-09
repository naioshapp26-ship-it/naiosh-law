import { ModuleShell } from "@/components/module-shell";
import { moduleConfigMap } from "@/data/module-configs";
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

  return <ModuleShell key={slug} slug={slug} config={config} />;
}
