import { ModuleShell } from "@/components/module-shell";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  if (slug === "dashboard") {
    redirect("/app/dashboard");
  }

  return <ModuleShell slug={slug} />;
}
