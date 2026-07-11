import type { KolSortField } from "./types";
import type { FilterState } from "@/components/kol-filters";
import { defaultFilters } from "@/components/kol-filters";

const FILTER_KEYS: (keyof FilterState)[] = [
  "q",
  "platform",
  "feature",
  "minFollowers",
  "maxPrice",
  "minEngagement",
  "dateFrom",
  "dateTo",
];

export function filtersFromSearchParams(params: URLSearchParams): FilterState {
  const filters = { ...defaultFilters };
  for (const key of FILTER_KEYS) {
    const value = params.get(key);
    if (value) (filters as Record<string, string>)[key] = value;
  }
  return filters;
}

export function sortFromSearchParams(params: URLSearchParams): {
  sortBy: KolSortField;
  sortOrder: "asc" | "desc";
} {
  const sortBy = (params.get("sortBy") as KolSortField) || "avgEngagement";
  const sortOrder = params.get("sortOrder") === "asc" ? "asc" : "desc";
  return { sortBy, sortOrder };
}

export function libraryStateToSearchParams(
  filters: FilterState,
  sortBy: KolSortField,
  sortOrder: "asc" | "desc",
): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  if (sortBy !== "avgEngagement") params.set("sortBy", sortBy);
  if (sortOrder !== "desc") params.set("sortOrder", sortOrder);
  return params;
}

export function libraryListHref(
  filters: FilterState,
  sortBy: KolSortField,
  sortOrder: "asc" | "desc",
): string {
  const qs = libraryStateToSearchParams(filters, sortBy, sortOrder).toString();
  return qs ? `/?${qs}` : "/";
}
