import { ModulePageClient } from "@/components/module-page-client";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  return <ModulePageClient slug={slug} />;
}
