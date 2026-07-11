import { AppShell } from "@/components/app-shell";
import { ThemeDetailPageClient } from "@/components/theme-detail-page-client";
import { normalizeFeatureName } from "@/lib/feature-normalization";

export default async function ThemeDetailPage({
  params,
}: {
  params: Promise<{ feature: string }>;
}) {
  const { feature } = await params;
  const decoded = normalizeFeatureName(decodeURIComponent(feature));

  return (
    <AppShell
      title={decoded}
      description="主题层级下的网红成效泡泡图与历史发文明细"
    >
      <ThemeDetailPageClient feature={decoded} />
    </AppShell>
  );
}
