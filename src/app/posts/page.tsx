import { AppShell } from "@/components/app-shell";
import { PostPerformanceClient } from "@/components/post-performance-client";

export default function PostsPage() {
  return (
    <AppShell
      title="贴文成效分析"
      description="以自然月为单位查看单篇贴文成效，默认按 ER 从高到低排序"
    >
      <PostPerformanceClient />
    </AppShell>
  );
}
