import { redirect } from "next/navigation";

export default async function LegacyFeatureDetailPage({
  params,
}: {
  params: Promise<{ feature: string }>;
}) {
  const { feature } = await params;
  redirect(`/themes/${feature}`);
}
