"use client";

import { useState } from "react";
import { CSV_TEMPLATE } from "@/lib/import";

type ImportResult = {
  rowsTotal: number;
  rowsAdded: number;
  rowsUpdated: number;
  errors: string[];
};

export function ImportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kol-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">从表格导入</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          支持直接上传 <strong>.xlsx</strong> 或 .csv 文件。如果 Google Sheets 导出 CSV
          提示损坏，可以下载为 Excel (.xlsx) 后直接上传。相同发文链接会自动更新，新链接会新增记录。
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className="mt-4 text-sm font-medium text-rose-600 hover:text-rose-700"
        >
          下载 CSV 模板 →
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-medium text-zinc-700">上传表格文件</h3>
        <input
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-3 block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-rose-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-rose-700 hover:file:bg-rose-100"
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={!file || loading}
          className="mt-4 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "导入中..." : "开始导入"}
        </button>
      </div>

      {result && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-700">导入结果</h3>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <p>
              总行数：<span className="font-medium">{result.rowsTotal}</span>
            </p>
            <p>
              新增：<span className="font-medium text-emerald-600">{result.rowsAdded}</span>
            </p>
            <p>
              更新：<span className="font-medium text-blue-600">{result.rowsUpdated}</span>
            </p>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 rounded-lg bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-800">部分行导入失败：</p>
              <ul className="mt-1 space-y-1 text-xs text-amber-700">
                {result.errors.slice(0, 10).map((err) => (
                  <li key={err}>{err}</li>
                ))}
                {result.errors.length > 10 && (
                  <li>...还有 {result.errors.length - 10} 条错误</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
        <h3 className="text-sm font-medium text-zinc-700">列名说明（与运营表格一致）</h3>
        <div className="mt-3 space-y-3 text-xs text-zinc-600">
          <div>
            <p className="font-medium text-zinc-700">必填列</p>
            <div className="mt-1 grid gap-1 sm:grid-cols-2">
              <p>发文日期</p>
              <p>推广功能</p>
              <p>平台（X / TikTok / Instagram / Threads）</p>
              <p>内容形式</p>
              <p>达人账号名（不含 @）</p>
              <p>发布链接</p>
            </div>
          </div>
          <div>
            <p className="font-medium text-zinc-700">价格列（至少填一列）</p>
            <div className="mt-1 grid gap-1 sm:grid-cols-2">
              <p>合作价格（日元）— 优先使用</p>
              <p>合作价格（美元）— 日元为空时使用</p>
            </div>
          </div>
          <div>
            <p className="font-medium text-zinc-700">次要列（有则自动导入）</p>
            <p className="mt-1">点赞、评论、转发、播放、粉丝数、分类、邮箱、备注等</p>
          </div>
        </div>
      </div>
    </div>
  );
}
