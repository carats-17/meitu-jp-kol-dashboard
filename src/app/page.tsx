import { DashboardClient } from "@/components/dashboard-client";
import { Nav } from "@/components/nav";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">达人资源看板</h1>
          <p className="mt-1 text-sm text-zinc-500">
            查看近 12 个月合作数据，快速筛选符合条件的 KOL 名单
          </p>
        </div>
        <DashboardClient />
      </main>
    </div>
  );
}
