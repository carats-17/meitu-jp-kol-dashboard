import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { LibraryHome } from "@/components/library-home";

export default function HomePage() {
  return (
    <AppShell
      title="达人汇总"
      description="从达人、单篇贴文、推广主题多角度查看日本 KOL 合作数据"
    >
      <Suspense fallback={<p className="text-sm text-zinc-500">加载达人检索...</p>}>
        <LibraryHome />
      </Suspense>
    </AppShell>
  );
}
