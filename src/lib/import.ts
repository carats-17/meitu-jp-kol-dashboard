import type { Platform } from "@prisma/client";
import * as XLSX from "xlsx";
import { prisma } from "./prisma";

const COLUMN_MAP: Record<string, string> = {
  // 必填列（与运营表格一致）
  发文日期: "publishedAt",
  發文日期: "publishedAt",
  publishedat: "publishedAt",
  date: "publishedAt",
  日期: "publishedAt",
  推广功能: "feature",
  推廣功能: "feature",
  feature: "feature",
  機能: "feature",
  平台: "platform",
  プラットフォーム: "platform",
  platform: "platform",
  内容形式: "contentTheme",
  內容形式: "contentTheme",
  内容主题: "contentTheme",
  內容主題: "contentTheme",
  contenttheme: "contentTheme",
  contentform: "contentTheme",
  テーマ: "contentTheme",
  达人账号名: "handle",
  達人賬號名: "handle",
  达人账号: "handle",
  账号: "handle",
  帳號: "handle",
  handle: "handle",
  アカウント: "handle",
  发布链接: "postUrl",
  發布鏈接: "postUrl",
  发文链接: "postUrl",
  發文連結: "postUrl",
  posturl: "postUrl",
  url: "postUrl",
  リンク: "postUrl",
  合作价格: "price",
  合作價格: "price",
  合作单价: "price",
  合作單價: "price",
  合作价格日元: "price",
  合作价格jpy: "price",
  price: "price",
  単価: "price",
  合作价格美元: "priceUsd",
  合作价格usd: "priceUsd",
  priceusd: "priceUsd",
  // 次要列（有则导入，无则跳过）
  达人名: "name",
  达人名称: "name",
  name: "name",
  名前: "name",
  点赞: "likes",
  點讚: "likes",
  likes: "likes",
  いいね: "likes",
  评论: "comments",
  評論: "comments",
  comments: "comments",
  コメント: "comments",
  转发: "shares",
  轉發: "shares",
  分享: "shares",
  shares: "shares",
  シェア: "shares",
  播放: "views",
  瀏覽: "views",
  浏览量: "views",
  views: "views",
  再生: "views",
  收藏: "shares",
  粉丝数: "followers",
  粉絲數: "followers",
  followers: "followers",
  フォロワー: "followers",
  分类: "category",
  分類: "category",
  category: "category",
  カテゴリ: "category",
  邮箱: "email",
  郵箱: "email",
  email: "email",
  メール: "email",
  备注: "notes",
  備註: "notes",
  notes: "notes",
};

const PLATFORM_MAP: Record<string, Platform> = {
  x: "X",
  twitter: "X",
  tiktok: "TIKTOK",
  instagram: "INSTAGRAM",
  ig: "INSTAGRAM",
  threads: "THREADS",
};

function normalizeHeader(h: string): string {
  const compact = h.trim().toLowerCase().replace(/\s+/g, "");
  if (COLUMN_MAP[compact]) return COLUMN_MAP[compact];

  if (/合作价格|合作单价|合作價格|合作單價/.test(compact)) {
    if (/美元|usd|\$|ドル/.test(compact)) return "priceUsd";
    return "price";
  }

  const stripped = compact.replace(/[（(].*?[）)]/g, "");
  return COLUMN_MAP[stripped] ?? stripped;
}

function resolvePrice(row: Record<string, string>): { price: number; currency: string } {
  const jpy = parseIntSafe(row.price);
  const usd = parseIntSafe(row.priceusd);
  if (jpy > 0) return { price: jpy, currency: "JPY" };
  if (usd > 0) return { price: usd, currency: "USD" };
  return { price: 0, currency: "JPY" };
}

function cellToString(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

function rowsFromSheetData(data: unknown[][]): Record<string, string>[] {
  if (data.length < 2) return [];

  const headers = data[0].map((h) => normalizeHeader(cellToString(h)));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < data.length; i++) {
    const values = data[i];
    if (!values?.length || values.every((v) => cellToString(v) === "")) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cellToString(values[idx]);
    });
    rows.push(row);
  }

  return rows;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const data = lines.map((line) => parseCSVLine(line));
  return rowsFromSheetData(data);
}

function parseXLSX(buffer: Buffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  return rowsFromSheetData(data);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parsePlatform(raw: string): Platform | null {
  const key = raw.trim().toLowerCase();
  return PLATFORM_MAP[key] ?? null;
}

function parseIntSafe(raw: string | undefined, fallback = 0): number {
  if (!raw) return fallback;
  const n = parseInt(raw.replace(/[,，]/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseDate(raw: string): Date | null {
  if (!raw) return null;

  const excelSerial = Number(raw);
  if (/^\d+(\.\d+)?$/.test(raw) && excelSerial > 30000 && excelSerial < 60000) {
    const utcDays = Math.floor(excelSerial - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const normalized = raw.replace(/\//g, "-");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type ImportResult = {
  rowsTotal: number;
  rowsAdded: number;
  rowsUpdated: number;
  errors: string[];
};

async function importRows(rows: Record<string, string>[], source: string): Promise<ImportResult> {
  let rowsAdded = 0;
  let rowsUpdated = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 2;

    const handle = row.handle?.replace(/^@/, "");
    const name = row.name || handle;
    const platform = parsePlatform(row.platform ?? "");
    const postUrl = row.posturl ?? row.postUrl;
    const publishedAt = parseDate(row.publishedat ?? row.publishedAt ?? "");
    const feature = row.feature;
    const contentTheme = row.contenttheme ?? row.contentTheme;
    const { price, currency } = resolvePrice(row);

    if (!handle || !platform || !postUrl || !publishedAt || !feature || !contentTheme) {
      errors.push(
        `第 ${line} 行：缺少必填字段（达人账号名/平台/发布链接/发文日期/推广功能/内容形式）`,
      );
      continue;
    }

    try {
      const kol = await prisma.kol.upsert({
        where: { handle_platform: { handle, platform } },
        create: {
          name,
          handle,
          platform,
          category: row.category || null,
          followers: row.followers ? parseIntSafe(row.followers) : null,
          email: row.email || null,
        },
        update: {
          name,
          ...(row.category ? { category: row.category } : {}),
          ...(row.followers ? { followers: parseIntSafe(row.followers) } : {}),
          ...(row.email ? { email: row.email } : {}),
        },
      });

      const existing = await prisma.collaboration.findFirst({
        where: { kolId: kol.id, postUrl },
      });

      const data = {
        platform,
        postUrl,
        publishedAt,
        feature,
        contentTheme,
        likes: parseIntSafe(row.likes),
        comments: parseIntSafe(row.comments),
        shares: parseIntSafe(row.shares),
        views: parseIntSafe(row.views),
        price,
        currency,
        notes: row.notes || null,
      };

      if (existing) {
        await prisma.collaboration.update({ where: { id: existing.id }, data });
        rowsUpdated++;
      } else {
        await prisma.collaboration.create({ data: { ...data, kolId: kol.id } });
        rowsAdded++;
      }
    } catch (e) {
      errors.push(`第 ${line} 行：${e instanceof Error ? e.message : "导入失败"}`);
    }
  }

  await prisma.importLog.create({
    data: {
      source,
      rowsTotal: rows.length,
      rowsAdded,
      rowsUpdated,
    },
  });

  return { rowsTotal: rows.length, rowsAdded, rowsUpdated, errors };
}

export async function importFromCSV(text: string, source: string): Promise<ImportResult> {
  return importRows(parseCSV(text), source);
}

export async function importFromXLSX(buffer: Buffer, source: string): Promise<ImportResult> {
  return importRows(parseXLSX(buffer), source);
}

export async function importFromFile(
  content: string | Buffer,
  fileName: string,
): Promise<ImportResult> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
    return importFromXLSX(buffer, fileName);
  }
  const text = Buffer.isBuffer(content) ? content.toString("utf-8") : content;
  return importFromCSV(text, fileName);
}

export const CSV_TEMPLATE = `发文日期,推广功能,平台,内容形式,达人账号名,发布链接,合作价格（日元）,合作价格（美元）,点赞,评论,转发,播放,粉丝数
2025-03-15,AI美颜,Instagram,短视频,yamada_beauty,https://instagram.com/p/example1,80000,520,1200,85,42,15000,52000
2025-05-20,AI消除,X,图文,sato_photo,https://x.com/sato_photo/status/example2,65000,420,890,56,120,0,45000`;
