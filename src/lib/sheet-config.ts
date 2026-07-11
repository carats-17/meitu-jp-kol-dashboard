/** 允许导入的排程 Sheet（2025.7 – 2026.6） */
export const ALLOWED_SCHEDULE_SHEETS = [
  "2026.6排程",
  "2026.5排程",
  "2026.4排程",
  "2026.3排程",
  "2026.2排程",
  "2026.1排程",
  "2025.12排程",
  "2025.11排程",
  "2025.10排程",
  "2025.9排程",
  "2025.8排程",
  "2025.7排程",
] as const;

export function normalizeSheetName(name: string): string {
  return name.trim().replace(/\s+/g, "");
}

export function isAllowedScheduleSheet(name: string): boolean {
  const n = normalizeSheetName(name);
  return ALLOWED_SCHEDULE_SHEETS.some((s) => normalizeSheetName(s) === n);
}
