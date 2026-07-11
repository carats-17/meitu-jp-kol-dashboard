import Link from "next/link";
import { Nav } from "@/components/nav";
import { WeeklyInsightsFull } from "@/components/weekly-insights-full";

export default function WeeklyInsightsPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Link href="/" className="text-sm text-rose-600 hover:underline">
          ← 返回看板
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">每周成效明细</h1>
        <p className="mt-1 text-sm text-zinc-500">
          浏览所有周数据，选择任意两周进行对比
        </p>
        <div className="mt-6">
          <WeeklyInsightsFull />
        </div>
      </main>
    </div>
  );
}
