import { ModuleShell } from "@/components/module-shell";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  return <ModuleShell slug={slug} />;
}
