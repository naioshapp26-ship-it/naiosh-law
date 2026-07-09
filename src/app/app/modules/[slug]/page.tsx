import { ModuleShell } from "@/components/module-shell";
import { moduleConfigMap } from "@/data/module-configs";
import { moduleMap } from "@/data/modules";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  if (slug === "dashboard") {
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
