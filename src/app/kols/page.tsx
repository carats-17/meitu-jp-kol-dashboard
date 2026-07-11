import Link from "next/link";
import { KolsListClient } from "@/components/kols-list-client";
import { Nav } from "@/components/nav";

export default async function KolsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Link href="/" className="text-sm text-rose-600 hover:underline">
          ← 返回看板
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">达人列表</h1>
        <p className="mt-1 text-sm text-zinc-500">
          全部达人明细，支持排序与筛选
        </p>
        <div className="mt-6">
          <KolsListClient
            initialFilters={{
              q: params.q ?? "",
              platform: params.platform ?? "",
              feature: params.feature ?? "",
            }}
          />
        </div>
      </main>
    </div>
  );
}
