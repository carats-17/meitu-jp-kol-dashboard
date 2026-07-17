"use client";

import { useState } from "react";
import { CSV_TEMPLATE } from "@/lib/import";

type ImportResult = {
  rowsTotal: number;
  rowsAdded: number;
  rowsUpdated: number;
  rowsDeleted?: number;
  errors: string[];
  followerBackfill?: {
    namesProcessed: number;
    scraped: number;
    propagated: number;
    failed: number;
    errors: string[];
  };
  sheetSummary?: {
    name: string;
    rows: number;
    imported: number;
    added: number;
    updated: number;
    failed: number;
    headerRow: number;
    skipped?: boolean;
  }[];
  debug?: {
    fileName?: string;
    fileSize?: number;
    sheetName?: string;
    sheetsTried?: string[];
    headerRow?: number;
    headersFound?: string[];
    message?: string;
  };
};

export function ImportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [backfillResult, setBackfillResult] = useState<ImportResult["followerBackfill"] | null>(null);

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

  async function handleBackfillFollowers() {
    setBackfillLoading(true);
    setBackfillResult(null);
    try {
      const res = await fetch("/api/kols/backfill-followers", { method: "POST" });
      const data = await res.json();
      setBackfillResult(data);
    } finally {
      setBackfillLoading(false);
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
          支持直接上传 <strong>.xlsx / .xls / .xlsm</strong> 或 .csv 文件。每次导入会<strong>清空旧数据</strong>，
          仅保留本次上传文件中的记录。粉丝数优先用表格里的值；缺失时可在导入后再点「联网补全粉丝数」。
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
          accept=".csv,.xlsx,.xls,.xlsm,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-3 block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-rose-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-rose-700 hover:file:bg-rose-100"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleImport}
            disabled={!file || loading}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "导入中…" : "开始导入"}
          </button>
          <button
            type="button"
            onClick={handleBackfillFollowers}
            disabled={backfillLoading || loading}
            className="rounded-lg border border-mint-200 bg-mint-50 px-4 py-2 text-sm font-medium text-mint-700 transition hover:bg-mint-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {backfillLoading ? "联网补全中…" : "仅补全粉丝数"}
          </button>
        </div>
        {loading && (
          <p className="mt-2 text-xs text-zinc-500">
            导入后会对缺失粉丝数的达人联网抓取，约需 2–3 分钟，请勿关闭页面。
          </p>
        )}
      </div>

      {result && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-zinc-700">导入结果</h3>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
            <p>
              总行数：<span className="font-medium">{result.rowsTotal}</span>
            </p>
            {result.rowsDeleted != null && (
              <p>
                清除旧数据：<span className="font-medium text-zinc-700">{result.rowsDeleted}</span>
              </p>
            )}
            <p>
              新增：<span className="font-medium text-emerald-600">{result.rowsAdded}</span>
            </p>
            <p>
              更新：<span className="font-medium text-blue-600">{result.rowsUpdated}</span>
            </p>
          </div>
          {(result.followerBackfill || backfillResult) && (
            <div className="mt-4 rounded-lg bg-mint-50 p-3">
              <p className="text-xs font-medium text-mint-800">粉丝数联网补全</p>
              {(() => {
                const fb = result.followerBackfill ?? backfillResult!;
                return (
                  <div className="mt-2 grid gap-2 text-sm sm:grid-cols-4">
                    <p>处理达人数：<span className="font-medium">{fb.namesProcessed}</span></p>
                    <p>联网抓取：<span className="font-medium text-emerald-700">{fb.scraped}</span></p>
                    <p>表内复用：<span className="font-medium">{fb.propagated}</span></p>
                    <p>失败：<span className="font-medium text-amber-700">{fb.failed}</span></p>
                  </div>
                );
              })()}
              {(result.followerBackfill ?? backfillResult)!.errors.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-amber-700">
                  {(result.followerBackfill ?? backfillResult)!.errors.slice(0, 5).map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {result.sheetSummary && result.sheetSummary.length > 0 && (
            <div className="mt-4 rounded-lg bg-zinc-50 p-3">
              <p className="text-xs font-medium text-zinc-700">
                各 Sheet 读取情况（共 {result.sheetSummary.length} 个）
              </p>
              <div className="mt-2 max-h-64 overflow-y-auto">
                <table className="min-w-full text-left text-xs text-zinc-600">
                  <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
                    <tr>
                      <th className="py-1 pr-3">Sheet</th>
                      <th className="py-1 pr-3">原表行</th>
                      <th className="py-1 pr-3">成功</th>
                      <th className="py-1 pr-3">新增</th>
                      <th className="py-1 pr-3">更新</th>
                      <th className="py-1 pr-3">失败</th>
                      <th className="py-1">表头</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                {result.sheetSummary.map((s) => (
                  <tr key={s.name} className={s.skipped ? "text-zinc-400" : ""}>
                    <td className="py-1 pr-3">
                      {s.name}
                      {s.skipped ? "（已忽略）" : ""}
                    </td>
                    <td className="py-1 pr-3">{s.rows}</td>
                    <td className="py-1 pr-3 text-emerald-700">{s.imported}</td>
                    <td className="py-1 pr-3">{s.added}</td>
                    <td className="py-1 pr-3">{s.updated}</td>
                    <td className={`py-1 pr-3 ${s.failed > 0 ? "font-medium text-amber-700" : ""}`}>
                      {s.failed}
                    </td>
                    <td className="py-1">{s.headerRow || "—"}</td>
                  </tr>
                ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {(result.errors.length > 0 || result.debug) && (
            <div className="mt-4 space-y-3">
              {result.debug && (
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs font-medium text-blue-900">解析诊断</p>
                  {result.debug.message && (
                    <p className="mt-1 text-xs text-blue-800">{result.debug.message}</p>
                  )}
                  {result.debug.fileName && (
                    <p className="mt-1 text-xs text-blue-700">
                      文件：{result.debug.fileName}
                      {typeof result.debug.fileSize === "number"
                        ? `（${(result.debug.fileSize / 1024).toFixed(1)} KB）`
                        : ""}
                    </p>
                  )}
                  {result.debug.sheetName && (
                    <p className="mt-1 text-xs text-blue-700">
                      工作表：{result.debug.sheetName}
                      {result.debug.sheetsTried && result.debug.sheetsTried.length > 1
                        ? `（共 ${result.debug.sheetsTried.length} 个）`
                        : ""}
                    </p>
                  )}
                  {result.debug.headerRow && (
                    <p className="mt-1 text-xs text-blue-700">
                      表头行：第 {result.debug.headerRow} 行
                    </p>
                  )}
                  {result.debug.headersFound && result.debug.headersFound.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-blue-700">识别到的列：</p>
                      <ul className="mt-1 space-y-0.5 text-xs text-blue-600">
                        {result.debug.headersFound.slice(0, 12).map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="rounded-lg bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-800">
                    {result.rowsTotal === 0 ? "导入失败：" : "部分行导入失败："}
                  </p>
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
              <p>合作价格(JPY) — 日元单价（唯一价格字段）</p>
            </div>
          </div>
          <div>
            <p className="font-medium text-zinc-700">次要列（有则自动导入）</p>
            <div className="mt-1 grid gap-1 sm:grid-cols-2">
              <p>自然量曝光数</p>
              <p>点赞 / 留言 / 保存 / 转发</p>
              <p>总互动数</p>
              <p>自然量 CPM（日元/美金）</p>
              <p>自然量 CPE（日元/美金）</p>
              <p>缩略图 / 封面图 URL</p>
              <p>粉丝数、分类、邮箱、备注等</p>
            </div>
          </div>
          <div>
            <p className="font-medium text-zinc-700">忽略列（不会导入）</p>
            <p className="mt-1">联络状态、付款方式、投放 code、是否填星光</p>
          </div>
        </div>
      </div>
    </div>
  );
}
