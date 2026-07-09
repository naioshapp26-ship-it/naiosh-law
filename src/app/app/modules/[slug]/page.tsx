import { ModulePageClient } from "@/components/module-page-client";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  if (slug === "dashboard") {
    redirect("/app/dashboard");
  }

  return <ModulePageClient slug={slug} />;
}
