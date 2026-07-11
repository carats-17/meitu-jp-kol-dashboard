import { AppShell } from "@/components/app-shell";
import { ImportClient } from "@/components/import-client";

export default function ImportPage() {
  return (
    <AppShell
      title="数据导入"
      description="支持 .xlsx / .csv，批量导入合作记录"
    >
      <ImportClient />
    </AppShell>
  );
}
