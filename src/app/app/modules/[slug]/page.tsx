import { notFound, redirect } from "next/navigation";
import { ModulePageClient } from "@/components/module-page-client";
import { moduleMap } from "@/data/modules";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  if (slug === "dashboard") redirect("/app/dashboard");
  if (!moduleMap[slug]) notFound();

  return <ModulePageClient slug={slug} />;
}
