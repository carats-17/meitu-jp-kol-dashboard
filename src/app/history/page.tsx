import { AppShell } from "@/components/app-shell";
import { HistoryPageClient } from "@/components/history-page-client";

export default function HistoryPage() {
  return (
    <AppShell
      title="历史合作记录"
      description="按达人维度汇总历史合作价格与发文成效，辅助判断后续合作人选"
    >
      <HistoryPageClient />
    </AppShell>
  );
}
