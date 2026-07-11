/** Friday-anchored Mon–Sun weeks for KOL posting comparison (Fri–Sun posts). */

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function getMondayOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function formatShortDateYmd(date: Date, referenceYear = new Date().getFullYear()): string {
  const y = date.getFullYear();
  if (y !== referenceYear) {
    return `${y}/${date.getMonth() + 1}/${date.getDate()}`;
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatWeekRangeLabel(
  start: Date,
  end: Date,
  referenceYear = new Date().getFullYear(),
): string {
  return `${formatShortDateYmd(start, referenceYear)} – ${formatShortDateYmd(end, referenceYear)}`;
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getPreviousWeekMonday(date = new Date()): Date {
  const thisMonday = getMondayOfWeek(startOfDay(date));
  return addDays(thisMonday, -7);
}

export function getDefaultWeeklyCompareAnchor(date = new Date()): string {
  return toDateInputValue(getPreviousWeekMonday(date));
}

export { startOfDay, endOfDay, addDays };

export type ComparisonWeekRange = {
  start: Date;
  end: Date;
  label: string;
};

export type ComparisonWeekPair = {
  thisWeek: ComparisonWeekRange;
  lastWeek: ComparisonWeekRange;
};

/**
 * Before this week's Friday, use the previous complete posting week (Mon–Sun).
 * On/after Friday, use the week containing the most recent Friday.
 *
 * e.g. 2026-06-25 → this week 6/15–6/21, last week 6/8–6/14
 */
export function getFridayAnchoredComparisonWeeks(
  anchorDate = new Date(),
): ComparisonWeekPair {
  const today = startOfDay(anchorDate);
  const thisMonday = getMondayOfWeek(today);
  const thisFriday = addDays(thisMonday, 4);

  let referenceFriday: Date;
  if (today < thisFriday) {
    referenceFriday = addDays(thisFriday, -7);
  } else {
    const day = today.getDay();
    referenceFriday = addDays(today, 5 - day);
  }

  const thisWeekStart = getMondayOfWeek(referenceFriday);
  const thisWeekEnd = endOfDay(addDays(thisWeekStart, 6));
  const lastWeekStart = addDays(thisWeekStart, -7);
  const lastWeekEnd = endOfDay(addDays(lastWeekStart, 6));

  const refYear = startOfDay(anchorDate).getFullYear();

  return {
    thisWeek: {
      start: thisWeekStart,
      end: thisWeekEnd,
      label: formatWeekRangeLabel(thisWeekStart, addDays(thisWeekStart, 6), refYear),
    },
    lastWeek: {
      start: lastWeekStart,
      end: lastWeekEnd,
      label: formatWeekRangeLabel(lastWeekStart, addDays(lastWeekStart, 6), refYear),
    },
  };
}
