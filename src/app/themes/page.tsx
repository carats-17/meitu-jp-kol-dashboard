import { AppShell } from "@/components/app-shell";
import { ThemesPageClient } from "@/components/themes-page-client";

export default function ThemesPage() {
  return (
    <AppShell
      title="推广主题"
      description="从历史合作主题中分析发布数量、互动占比与主题层级成效"
    >
      <ThemesPageClient />
    </AppShell>
  );
}
