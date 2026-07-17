import type { Platform } from "@prisma/client";
import { normalizeFeatureName } from "./feature-normalization";
import { inferInstagramFormat, isViewsHidden } from "./platform-display";
import { prisma } from "./prisma";

const XLSX: typeof import("xlsx") = require("xlsx");
type WorkBook = import("xlsx").WorkBook;
type WorkSheet = import("xlsx").WorkSheet;

const COLUMN_ALIASES: Record<string, string[]> = {
  publishedAt: ["发文日期", "發文日期", "发布日期", "发布时间", "date", "日期"],
  feature: ["推广功能", "推廣功能", "機能", "feature", "推广产品"],
  platform: ["平台", "媒体平台", "媒體平台", "プラットフォーム", "platform", "sns", "社媒"],
  contentTheme: ["内容形式", "內容形式", "内容主题", "內容主題", "内容类型", "形式"],
  handle: [
    "达人账号名",
    "達人賬號名",
    "达人账号",
    "达人帐号名",
    "帳號名",
    "账号名",
    "账号",
    "帳號",
    "handle",
    "アカウント",
    "网红账号",
    "網紅賬號",
  ],
  postUrl: [
    "发布链接",
    "發布鏈接",
    "发布连结",
    "发文链接",
    "發文連結",
    "稿件链接",
    "稿件連結",
    "链接",
    "連結",
    "url",
    "posturl",
  ],
  price: [
    "合作价格jpy",
    "合作价格日元",
    "合作价格（日元）",
    "合作费用",
    "合作費用",
    "合作单价",
    "合作單價",
    "日元价格",
    "日币价格",
  ],
  priceUsd: ["合作价格usd", "合作价格美元", "合作价格（美元）", "美元价格", "美金价格"],
  organicViews: ["自然量曝光数", "自然量曝光", "曝光数", "曝光量", "浏览量", "浏览"],
  likes: ["点赞", "點讚", "likes", "いいね", "赞数"],
  comments: ["留言", "评论", "評論", "comments", "コメント"],
  saves: ["保存", "收藏", "saves"],
  shares: ["转发", "轉發", "分享", "shares", "シェア"],
  totalEngagement: ["总互动数", "總互動數", "互动总数", "总互动", "互动数"],
  er: ["er", "互动率", "engagementrate"],
  metricShiftSource: ["是否授权", "是否授權"],
  cpmJpy: ["自然量cpm日币", "cpm日币", "cpm日元", "cpm"],
  cpmUsd: ["自然量cpm美金", "cpm美金", "cpm美元"],
  cpeJpy: ["自然量cpe日币", "cpe日币", "cpe日元"],
  cpeUsd: ["自然量cpe美金", "cpe美金", "cpe美元"],
  thumbnailUrl: ["缩略图", "缩略图url", "封面", "封面图", "封面图url", "thumbnail", "thumbnailurl"],
  name: ["达人名", "达人名称", "name", "名前", "网红名"],
  followers: ["粉丝数", "粉絲數", "followers", "フォロワー"],
  category: ["分类", "分類", "category", "カテゴリ"],
  email: ["邮箱", "郵箱", "email", "メール"],
  notes: ["备注", "備註", "notes"],
};

const IGNORE_HEADER_PATTERN =
  /联络状态|聯絡狀態|付款方式|投放code|是否填星光/;

const REQUIRED_FIELDS = [
  "publishedAt",
  "handle",
  "platform",
  "postUrl",
  "feature",
] as const;

const PLATFORM_MAP: Record<string, Platform> = {
  x: "X",
  twitter: "X",
  "𝕏": "X",
  tiktok: "TIKTOK",
  "tik tok": "TIKTOK",
  instagram: "INSTAGRAM",
  ig: "INSTAGRAM",
  "インスタ": "INSTAGRAM",
  threads: "THREADS",
};

function toHalfWidth(s: string): string {
  return s.replace(/[\uff01-\uff5e]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
  );
}

function compactHeader(h: string): string {
  const raw = toHalfWidth(h)
    .trim()
    .replace(/^\ufeff/, "")
    .toLowerCase();

  const paren = raw.match(/[（(]([^）)]+)[）)]/);
  const suffix = paren ? paren[1].replace(/\s+/g, "") : "";

  return raw
    .replace(/[（(].*?[）)]/g, "")
    .replace(/[_\-/\\]/g, "")
    .replace(/\s+/g, "")
    .replace(/帐/g, "账")
    .replace(/连结/g, "链接")
    .replace(/鏈接/g, "链接")
    .replace(/連結/g, "链接") + suffix;
}

function normalizeHeader(h: string): string | null {
  const raw = toHalfWidth(h).trim().toLowerCase();
  const compact = compactHeader(h);
  if (!compact || IGNORE_HEADER_PATTERN.test(compact)) return null;

  if (/合作价格|合作单价|合作價格|合作單價/.test(compact) || /合作价格|合作单价/.test(raw)) {
    if (/美元|美金|usd|\$|ドル/.test(compact) || /usd|美元|美金/.test(raw)) return "priceUsd";
    return "price";
  }

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some((a) => compact === compactHeader(a))) return field;
  }

  if (/自然量.*cpm|cpm.*自然量|^cpm/.test(compact)) {
    if (/美金|美元|usd|\$|ドル/.test(compact)) return "cpmUsd";
    if (/日币|日元|jpy|円/.test(compact)) return "cpmJpy";
  }

  if (/自然量.*cpe|cpe.*自然量|^cpe/.test(compact)) {
    if (/美金|美元|usd|\$|ドル/.test(compact)) return "cpeUsd";
    if (/日币|日元|jpy|円/.test(compact)) return "cpeJpy";
  }

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (
      compact.length >= 3 &&
      aliases.some(
        (a) =>
          compact.includes(compactHeader(a)) || compactHeader(a).includes(compact),
      )
    ) {
      return field;
    }
  }

  return null;
}

function cellToString(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function padRow(values: unknown[] | undefined, length: number): unknown[] {
  const row = [...(values ?? [])];
  while (row.length < length) row.push("");
  return row;
}

function findHeaderRowIndex(data: unknown[][]): number {
  let bestIdx = -1;
  let bestScore = 0;

  for (let i = 0; i < Math.min(data.length, 30); i++) {
    const row = data[i];
    if (!row?.length) continue;
    const normalized = row
      .map((cell) => normalizeHeader(cellToString(cell)))
      .filter((h): h is string => Boolean(h));
    const score = normalized.filter((h) =>
      (REQUIRED_FIELDS as readonly string[]).includes(h),
    ).length;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return bestScore >= 3 ? bestIdx : data.length >= 2 ? 0 : -1;
}

type ParsedSheet = {
  rows: Record<string, string>[];
  dataRows: number;
  headerRowIndex: number;
  headerLabels: string[];
  sheetName: string;
};

function rowsFromSheetData(data: unknown[][], sheetName: string): ParsedSheet {
  if (data.length < 1) {
    return { rows: [], dataRows: 0, headerRowIndex: -1, headerLabels: [], sheetName };
  }

  const headerRowIndex = findHeaderRowIndex(data);
  if (headerRowIndex < 0) {
    return { rows: [], dataRows: 0, headerRowIndex: -1, headerLabels: [], sheetName };
  }

  const headerRow = padRow(data[headerRowIndex], data[headerRowIndex]?.length ?? 0);
  const headerLen = Math.max(
    headerRow.length,
    ...data.slice(headerRowIndex + 1, headerRowIndex + 50).map((row) => row?.length ?? 0),
  );
  const headers = padRow(headerRow, headerLen).map((h) => normalizeHeader(cellToString(h)));
  const headerLabels = padRow(headerRow, headerLen).map((h) => cellToString(h));
  const rows: Record<string, string>[] = [];
  let dataRows = 0;

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const values = padRow(data[i], headerLen);
    if (values.every((v) => cellToString(v) === "")) continue;
    dataRows++;

    const row: Record<string, string> = {
      __line: String(i + 1),
      __sheet: sheetName,
    };
    headers.forEach((h, idx) => {
      if (!h) return;
      const val = cellToString(values[idx]);
      if (val) row[h] = val;
    });

    rows.push(row);
  }

  return { rows, dataRows, headerRowIndex, headerLabels, sheetName };
}

function cellValue(sheet: WorkSheet, row: number, col: number): unknown {
  const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
  return cell?.v ?? "";
}

function sheetToMatrix(sheet: WorkSheet): unknown[][] {
  const ref = sheet["!ref"];
  if (!ref) return [];

  const range = XLSX.utils.decode_range(ref);
  const data: unknown[][] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: unknown[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      row.push(cellValue(sheet, r, c));
    }
    data.push(row);
  }

  // xlsx keeps only the top-left cell value for merged ranges.
  // Backfill the master value so vertically merged KOL/platform/price cells
  // are available on every post row.
  for (const merge of sheet["!merges"] ?? []) {
    const master = cellValue(sheet, merge.s.r, merge.s.c);
    for (let r = merge.s.r; r <= merge.e.r; r++) {
      for (let c = merge.s.c; c <= merge.e.c; c++) {
        const rr = r - range.s.r;
        const cc = c - range.s.c;
        if (data[rr]?.[cc] == null || data[rr][cc] === "") {
          data[rr][cc] = master;
        }
      }
    }
  }

  return data.filter((row) => row.some((v) => cellToString(v) !== ""));
}

function parseXLSX(buffer: Buffer): {
  rows: Record<string, string>[];
  sheets: ParsedSheet[];
  workbookSheetNames: string[];
} {
  const readOptions = {
    cellDates: true,
  };
  const workbookCandidates = [
    () => XLSX.read(buffer, { ...readOptions, type: "buffer" }),
    () =>
      XLSX.read(new Uint8Array(buffer).buffer, {
        ...readOptions,
        type: "array",
      }),
    () => XLSX.read(buffer.toString("binary"), { ...readOptions, type: "binary" }),
    () => XLSX.read(buffer.toString("base64"), { ...readOptions, type: "base64" }),
  ];
  let workbook: WorkBook | null = null;
  const workbookSheetNames: string[] = [];
  for (const readWorkbook of workbookCandidates) {
    try {
      const candidate = readWorkbook();
      workbookSheetNames.push(...candidate.SheetNames);
      if (candidate.SheetNames.length > 0) {
        workbook = candidate;
        break;
      }
    } catch {
      // Try the next mode. Some Excel exports parse only with a specific input type.
    }
  }

  if (!workbook) return { rows: [], sheets: [], workbookSheetNames };

  const sheets: ParsedSheet[] = [];
  const allRows: Record<string, string>[] = [];

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;

    const data = sheetToMatrix(sheet);
    const parsed = rowsFromSheetData(data, name);
    sheets.push(parsed);
    allRows.push(...parsed.rows);
  }

  return { rows: allRows, sheets, workbookSheetNames };
}

function parseCSV(text: string): { rows: Record<string, string>[]; sheets: ParsedSheet[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { rows: [], sheets: [] };

  const data = lines.map((line) => parseCSVLine(line));
  const parsed = rowsFromSheetData(data, "CSV");
  return { rows: parsed.rows, sheets: [parsed] };
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

function getRowField(row: Record<string, string>, field: string): string {
  if (row[field]) return row[field];
  const compact = field.toLowerCase();
  for (const [k, v] of Object.entries(row)) {
    if (k.startsWith("__")) continue;
    if (k.toLowerCase() === compact) return v;
  }
  return "";
}

function splitLinks(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizePostUrl(raw: string): string {
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const parts = url.pathname.split("/").filter(Boolean);

    if (host.includes("instagram.com")) {
      const idx = parts.findIndex((p) => ["p", "reel", "tv"].includes(p));
      if (idx >= 0 && parts[idx + 1]) {
        return `https://instagram.com/${parts[idx]}/${parts[idx + 1]}`;
      }
    }

    if (host.includes("x.com") || host.includes("twitter.com")) {
      const statusIdx = parts.findIndex((p) => p === "status");
      if (statusIdx > 0 && parts[statusIdx + 1]) {
        return `https://x.com/${parts[statusIdx - 1]}/status/${parts[statusIdx + 1]}`;
      }
    }

    if (host.includes("tiktok.com")) {
      const mediaIdx = parts.findIndex((p) => ["video", "photo"].includes(p));
      const handleIdx = parts.findIndex((p) => p.startsWith("@"));
      if (handleIdx >= 0 && mediaIdx > handleIdx && parts[mediaIdx + 1]) {
        return `https://tiktok.com/${parts[handleIdx]}/${parts[mediaIdx]}/${parts[mediaIdx + 1]}`;
      }
    }

    return `https://${host}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return raw.trim();
  }
}

function expandMultiLinkRows(rows: Record<string, string>[]): Record<string, string>[] {
  const expanded: Record<string, string>[] = [];
  for (const row of rows) {
    const links = splitLinks(getRowField(row, "postUrl"));
    if (links.length <= 1) {
      expanded.push(row);
      continue;
    }
    links.forEach((link, idx) => {
      const postUrl = normalizePostUrl(link);
      expanded.push({
        ...row,
        __line: `${row.__line}.${idx + 1}`,
        postUrl,
        platform: inferPlatformFromUrl(postUrl) ?? getRowField(row, "platform"),
        handle: getRowField(row, "handle") || extractHandleFromUrl(postUrl),
      });
    });
  }
  return expanded;
}

function duplicateRowScore(row: Record<string, string>): number {
  const metrics = metricSnapshot(row);
  const price = parseIntSafe(getRowField(row, "price"));
  const feature = getRowField(row, "feature").trim();
  let score = metrics.organicViews;
  if (price > 0) score += 10_000_000;
  if (feature && feature !== "-") score += 1_000_000;
  score += metrics.totalEngagement;
  return score;
}

function dedupeRowsByPostUrl(rows: Record<string, string>[]): Record<string, string>[] {
  const groups = new Map<string, Record<string, string>[]>();

  for (const row of rows) {
    const postUrl = normalizePostUrl(getRowField(row, "postUrl"));
    if (!postUrl) {
      groups.set(`__missing__:${row.__line}`, [row]);
      continue;
    }
    const bucket = groups.get(postUrl) ?? [];
    bucket.push(row);
    groups.set(postUrl, bucket);
  }

  const deduped: Record<string, string>[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      deduped.push(group[0]);
      continue;
    }
    deduped.push(
      [...group].sort((a, b) => duplicateRowScore(b) - duplicateRowScore(a))[0],
    );
  }

  return deduped;
}

function extractHandleFromUrl(raw: string): string {
  try {
    const url = new URL(raw.trim());
    const parts = url.pathname.split("/").filter(Boolean);
    if (url.hostname.includes("tiktok.com")) {
      return parts.find((p) => p.startsWith("@"))?.replace(/^@/, "") ?? "";
    }
    if (url.hostname.includes("x.com") || url.hostname.includes("twitter.com")) {
      return parts[0] ?? "";
    }
    return "";
  } catch {
    return "";
  }
}

function inferPlatformFromUrl(raw: string): string | null {
  try {
    const host = new URL(raw.trim()).hostname.toLowerCase();
    if (host.includes("tiktok.com")) return "TIKTOK";
    if (host.includes("instagram.com")) return "INSTAGRAM";
    if (host.includes("threads.net")) return "THREADS";
    if (host.includes("x.com") || host.includes("twitter.com")) return "X";
    return null;
  } catch {
    return null;
  }
}

function parsePlatform(raw: string): Platform | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (PLATFORM_MAP[key]) return PLATFORM_MAP[key];
  for (const [alias, platform] of Object.entries(PLATFORM_MAP)) {
    if (key.includes(alias)) return platform;
  }
  return null;
}

function parseIntSafe(raw: string | undefined, fallback = 0): number {
  if (!raw) return fallback;
  const value = parseMetricNumber(raw);
  if (value == null) return fallback;
  return Math.round(value);
}

function parseMetricNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const normalized = raw
    .trim()
    .replace(/[，,]/g, "")
    .replace(/約|约|approximately|approx\.?/gi, "")
    .toLowerCase();
  if (!normalized || normalized === "-" || normalized === "ー") return null;

  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  if (!Number.isFinite(n)) return null;
  if (/万|萬/.test(normalized)) return n * 10_000;
  if (/千/.test(normalized)) return n * 1_000;
  if (/\d\s*k\b|k$/.test(normalized)) return n * 1_000;
  if (/\d\s*m\b|m$/.test(normalized)) return n * 1_000_000;
  return n;
}

function parseFloatSafe(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = parseFloat(raw.replace(/[,，%％]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseErPercent(raw: string | undefined): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "-" || trimmed === "ー") return null;

  if (trimmed.includes("%")) {
    const n = parseFloat(trimmed.replace(/[,，%％]/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  const n = parseFloat(trimmed.replace(/[,，]/g, ""));
  if (!Number.isFinite(n)) return null;
  // Excel often stores 0.86% as the decimal 0.0086
  if (n > 0 && n < 1) return n * 100;
  return n;
}

function resolveTotalEngagement(row: Record<string, string>): number {
  const stored = parseIntSafe(getRowField(row, "totalEngagement"));
  if (stored > 0) return stored;
  return (
    parseIntSafe(getRowField(row, "likes")) +
    parseIntSafe(getRowField(row, "comments")) +
    parseIntSafe(getRowField(row, "saves")) +
    parseIntSafe(getRowField(row, "shares"))
  );
}

function metricSnapshot(row: Record<string, string>) {
  const shiftedViews = parseIntSafe(getRowField(row, "metricShiftSource"));
  const organicViews = parseIntSafe(getRowField(row, "organicViews"));
  const likes = parseIntSafe(getRowField(row, "likes"));
  const comments = parseIntSafe(getRowField(row, "comments"));
  const saves = parseIntSafe(getRowField(row, "saves"));
  const shares = parseIntSafe(getRowField(row, "shares"));
  const storedTotal = parseIntSafe(getRowField(row, "totalEngagement"));

  const looksShifted =
    shiftedViews >= 1000 &&
    organicViews > 0 &&
    organicViews < 1000 &&
    (shares >= shiftedViews || storedTotal === 0 || storedTotal >= shiftedViews);

  if (looksShifted) {
    const shiftedLikes = organicViews;
    const shiftedComments = likes;
    const shiftedSaves = comments;
    const shiftedShares = saves;
    const shiftedTotal =
      shiftedLikes + shiftedComments + shiftedSaves + shiftedShares;
    return {
      organicViews: shiftedViews,
      likes: shiftedLikes,
      comments: shiftedComments,
      saves: shiftedSaves,
      shares: shiftedShares,
      totalEngagement: shiftedTotal,
    };
  }

  return {
    organicViews,
    likes,
    comments,
    saves,
    shares,
    totalEngagement:
      storedTotal > 0 ? storedTotal : likes + comments + saves + shares,
  };
}

function isPlaceholderRow(row: Record<string, string>): boolean {
  const postUrl = getRowField(row, "postUrl");
  const feature = getRowField(row, "feature");
  const name = getRowField(row, "name") || getRowField(row, "handle");
  const metrics = metricSnapshot(row);
  const hasNoMetrics =
    metrics.organicViews === 0 &&
    metrics.totalEngagement === 0 &&
    metrics.likes === 0 &&
    metrics.comments === 0 &&
    metrics.saves === 0 &&
    metrics.shares === 0;
  const looksLikeProfileUrl =
    /tiktok\.com\/@[^/]+\/?(\?|$)/i.test(postUrl) ||
    /instagram\.com\/[^/]+\/?(\?|$)/i.test(postUrl) ||
    /x\.com\/[^/]+\/?(\?|$)/i.test(postUrl);

  return (
    !getRowField(row, "publishedAt") &&
    hasNoMetrics &&
    (feature === "-" || name === "-" || looksLikeProfileUrl)
  );
}

function resolvePrice(row: Record<string, string>): { price: number; currency: string } {
  const jpy = parseIntSafe(getRowField(row, "price"));
  return { price: jpy, currency: "JPY" };
}

function parseDate(raw: string): Date | null {
  if (!raw) return null;

  const excelSerial = Number(raw);
  if (/^\d+(\.\d+)?$/.test(raw) && excelSerial > 30000 && excelSerial < 60000) {
    const utcDays = Math.floor(excelSerial - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const monthDay = raw.trim().match(/^(\d{1,2})[\/.-](\d{1,2})$/);
  if (monthDay) {
    const month = Number(monthDay[1]);
    const day = Number(monthDay[2]);
    const year = month >= 7 ? 2025 : 2026;
    const d = new Date(year, month - 1, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const normalized = raw.replace(/\//g, "-").replace(/\./g, "-");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type ImportResult = {
  rowsTotal: number;
  rowsAdded: number;
  rowsUpdated: number;
  rowsDeleted: number;
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

async function importRows(rows: Record<string, string>[], source: string): Promise<ImportResult> {
  rows = dedupeRowsByPostUrl(expandMultiLinkRows(rows));

  const followerByName = new Map<string, number>();
  for (const row of rows) {
    const name = getRowField(row, "name") || getRowField(row, "handle");
    const f = parseIntSafe(getRowField(row, "followers"));
    if (name && f > 0) {
      followerByName.set(name, Math.max(followerByName.get(name) ?? 0, f));
    }
  }

  const deleted = await prisma.collaboration.deleteMany();
  await prisma.kol.deleteMany();

  let rowsAdded = 0;
  let rowsUpdated = 0;
  const errors: string[] = [];
  const sheetStats = new Map<
    string,
    { imported: number; added: number; updated: number; failed: number }
  >();

  function statsFor(sheet: string) {
    const key = sheet || "CSV";
    if (!sheetStats.has(key)) {
      sheetStats.set(key, { imported: 0, added: 0, updated: 0, failed: 0 });
    }
    return sheetStats.get(key)!;
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (isPlaceholderRow(row)) continue;

    const line = Number(row.__line) || i + 2;
    const sheet = row.__sheet || "";

    const postUrl = normalizePostUrl(getRowField(row, "postUrl"));
    const nameFromSheet = getRowField(row, "name");
    const handle =
      getRowField(row, "handle").replace(/^@/, "") ||
      extractHandleFromUrl(postUrl) ||
      nameFromSheet ||
      `unknown-${sheet || "sheet"}-${line}`;
    const name = nameFromSheet || handle;
    const platform = parsePlatform(
      inferPlatformFromUrl(postUrl) ?? getRowField(row, "platform"),
    );
    const publishedAt = parseDate(getRowField(row, "publishedAt"));
    const feature = normalizeFeatureName(getRowField(row, "feature"));

    const missing: string[] = [];
    if (!platform) missing.push("平台");
    if (!postUrl) missing.push("发布链接");
    if (!publishedAt) missing.push("发文日期");
    if (!feature) missing.push("推广功能");

    if (missing.length > 0) {
      const prefix = sheet ? `[${sheet}] ` : "";
      errors.push(`${prefix}第 ${line} 行：缺少 ${missing.join("、")}`);
      statsFor(sheet).failed++;
      continue;
    }

    let contentTheme = getRowField(row, "contentTheme");
    if (!contentTheme || contentTheme === "-") {
      contentTheme =
        platform === "INSTAGRAM" ? inferInstagramFormat(postUrl) : "未填写";
    }
    const { price, currency } = resolvePrice(row);
    const metrics = metricSnapshot(row);
    const viewsHiddenFlag = isViewsHidden(
      platform as Platform,
      metrics.organicViews,
      metrics.totalEngagement,
    );
    const followersFromSheet = parseIntSafe(getRowField(row, "followers"));
    const followers =
      followersFromSheet > 0
        ? followersFromSheet
        : followerByName.get(name) ?? followerByName.get(nameFromSheet) ?? 0;

    try {
      const kol = await prisma.kol.upsert({
        where: { handle_platform: { handle, platform: platform! } },
        create: {
          name,
          handle,
          platform: platform!,
          category: getRowField(row, "category") || null,
          followers: followers > 0 ? followers : null,
          email: getRowField(row, "email") || null,
        },
        update: {
          name,
          ...(getRowField(row, "category") ? { category: getRowField(row, "category") } : {}),
          ...(followers > 0 ? { followers } : {}),
          ...(getRowField(row, "email") ? { email: getRowField(row, "email") } : {}),
        },
      });

      const existing = await prisma.collaboration.findFirst({
        where: { postUrl },
      });

      const data = {
        kolId: kol.id,
        platform: platform!,
        postUrl,
        thumbnailUrl: getRowField(row, "thumbnailUrl") || null,
        publishedAt: publishedAt!,
        feature,
        contentTheme,
        likes: metrics.likes,
        comments: metrics.comments,
        saves: metrics.saves,
        shares: metrics.shares,
        totalEngagement: metrics.totalEngagement,
        organicViews: metrics.organicViews,
        er: parseErPercent(getRowField(row, "er")),
        views: parseIntSafe(getRowField(row, "views")),
        cpmJpy: parseFloatSafe(getRowField(row, "cpmJpy")),
        cpmUsd: parseFloatSafe(getRowField(row, "cpmUsd")),
        cpeJpy: parseFloatSafe(getRowField(row, "cpeJpy")),
        cpeUsd: parseFloatSafe(getRowField(row, "cpeUsd")),
        price,
        currency,
        viewsHidden: viewsHiddenFlag,
        sourceSheet: sheet || null,
        notes: getRowField(row, "notes") || null,
      };

      if (existing) {
        await prisma.collaboration.update({ where: { id: existing.id }, data });
        rowsUpdated++;
        const stats = statsFor(sheet);
        stats.updated++;
        stats.imported++;
      } else {
        await prisma.collaboration.create({ data: { ...data, kolId: kol.id } });
        rowsAdded++;
        const stats = statsFor(sheet);
        stats.added++;
        stats.imported++;
      }
    } catch (e) {
      const prefix = sheet ? `[${sheet}] ` : "";
      errors.push(`${prefix}第 ${line} 行：${e instanceof Error ? e.message : "导入失败"}`);
      statsFor(sheet).failed++;
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

  // Follower scraping is slow and often times out on serverless (Vercel).
  // Keep it as a separate manual action via /api/kols/backfill-followers.
  return {
    rowsTotal: rows.length,
    rowsAdded,
    rowsUpdated,
    rowsDeleted: deleted.count,
    errors,
    sheetSummary: [...sheetStats.entries()].map(([name, stats]) => ({
      name,
      rows: stats.imported + stats.failed,
      imported: stats.imported,
      added: stats.added,
      updated: stats.updated,
      failed: stats.failed,
      headerRow: 0,
    })),
  };
}

function buildEmptyResult(sheets: ParsedSheet[]): ImportResult {
  const sheetSummary = sheets.map((s) => ({
    name: s.sheetName,
    rows: s.dataRows,
    imported: 0,
    added: 0,
    updated: 0,
    failed: s.rows.length,
    headerRow: s.headerRowIndex + 1,
    skipped: s.sheetName.includes("已忽略"),
  }));

  const firstWithHeader = sheets.find((s) => s.headerRowIndex >= 0);
  const recognized = (firstWithHeader?.headerLabels ?? [])
    .map((label) => {
      const key = normalizeHeader(label);
      return label ? `${label}${key ? ` → ${key}` : "（未识别）"}` : null;
    })
    .filter(Boolean) as string[];

  return {
    rowsTotal: 0,
    rowsAdded: 0,
    rowsUpdated: 0,
    rowsDeleted: 0,
    sheetSummary,
    errors: ["未能从文件中读取到数据行。"],
    debug: {
      sheetsTried: sheets.map((s) => s.sheetName),
      headerRow: firstWithHeader ? firstWithHeader.headerRowIndex + 1 : undefined,
      headersFound: recognized,
      message:
        sheets.length === 0
          ? "没有检测到任何工作表。请确认上传的是标准 Excel 文件（.xlsx / .xls / .xlsm），不是 Numbers 文件、网页快捷方式、受保护/加密文件或空白文件。"
          : `已扫描 ${sheets.length} 个工作表，未找到有效数据。请确认表头行包含发文日期、推广功能、平台、内容形式、达人账号名、发布链接等列。`,
    },
  };
}

function attachSheetSummary(result: ImportResult, sheets: ParsedSheet[]): ImportResult {
  const importedBySheet = new Map(
    (result.sheetSummary ?? []).map((s) => [s.name, s]),
  );

  result.sheetSummary = sheets.map((s) => {
    const imported = importedBySheet.get(s.sheetName);
    const skipped = s.sheetName.includes("已忽略");
    return {
      name: s.sheetName,
      rows: s.dataRows,
      imported: imported?.imported ?? 0,
      added: imported?.added ?? 0,
      updated: imported?.updated ?? 0,
      failed: skipped ? 0 : (imported?.failed ?? Math.max(s.dataRows - (imported?.imported ?? 0), 0)),
      headerRow: s.headerRowIndex >= 0 ? s.headerRowIndex + 1 : 0,
      skipped,
    };
  });
  result.rowsTotal = result.sheetSummary
    .filter((s) => !s.skipped)
    .reduce((sum, s) => sum + s.rows, 0);

  return result;
}

export async function importFromCSV(text: string, source: string): Promise<ImportResult> {
  const { rows, sheets } = parseCSV(text);
  if (rows.length === 0) return buildEmptyResult(sheets);
  const result = await importRows(rows, source);
  return attachSheetSummary(result, sheets);
}

export async function importFromXLSX(buffer: Buffer, source: string): Promise<ImportResult> {
  const { rows, sheets } = parseXLSX(buffer);
  if (rows.length === 0) return buildEmptyResult(sheets);
  const result = await importRows(rows, source);
  return attachSheetSummary(result, sheets);
}

export async function importFromFile(
  content: string | Buffer,
  fileName: string,
): Promise<ImportResult> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".xlsm")) {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const result = await importFromXLSX(buffer, fileName);
    result.debug = {
      ...result.debug,
      fileName,
      fileSize: buffer.length,
    };
    return result;
  }
  const text = Buffer.isBuffer(content) ? content.toString("utf-8") : content;
  const result = await importFromCSV(text, fileName);
  result.debug = {
    ...result.debug,
    fileName,
    fileSize: Buffer.byteLength(text),
  };
  return result;
}

export const CSV_TEMPLATE = `发文日期,推广功能,平台,内容形式,达人账号名,发布链接,合作价格(JPY),自然量曝光数,点赞,留言,保存,转发,总互动数
2025-03-15,AI美颜,Instagram,短视频,yamada_beauty,https://instagram.com/p/example1,80000,15000,1200,85,30,42,1357`;
