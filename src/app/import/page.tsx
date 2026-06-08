import { ImportClient } from "@/components/import-client";
import { Nav } from "@/components/nav";

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">数据导入</h1>
          <p className="mt-1 text-sm text-zinc-500">
            支持 .xlsx / .csv，批量导入合作记录
          </p>
        </div>
        <ImportClient />
      </main>
    </div>
  );
}
