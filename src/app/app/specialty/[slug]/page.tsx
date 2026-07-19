import { SpecialtyWorkspace } from "@/components/specialty-workspace";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function SpecialtyPage({ params }: Props) {
  const { slug } = await params;
  return <SpecialtyWorkspace slug={slug} />;
}
