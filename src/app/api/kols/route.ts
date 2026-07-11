import { NextRequest, NextResponse } from "next/server";
import type { Platform } from "@prisma/client";
import { getFilterOptions, getKolsWithStats } from "@/lib/kol-service";
import type { KolFilters } from "@/lib/types";

function parseFilters(searchParams: URLSearchParams): KolFilters {
  const platform = searchParams.get("platform");
  return {
    q: searchParams.get("q") ?? undefined,
    platform: platform ? (platform as Platform) : undefined,
    feature: searchParams.get("feature") ?? undefined,
    minFollowers: searchParams.get("minFollowers")
      ? Number(searchParams.get("minFollowers"))
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined,
    minEngagement: searchParams.get("minEngagement")
      ? Number(searchParams.get("minEngagement"))
      : undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    sortBy: (searchParams.get("sortBy") as KolFilters["sortBy"]) ?? undefined,
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") ?? undefined,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const filters = parseFilters(request.nextUrl.searchParams);
    const withOptions = request.nextUrl.searchParams.get("withOptions") === "1";

    const [allKols, options] = await Promise.all([
      getKolsWithStats(filters),
      withOptions ? getFilterOptions() : Promise.resolve(null),
    ]);

    const kols = filters.limit ? allKols.slice(0, filters.limit) : allKols;

    return NextResponse.json({ kols, total: allKols.length, options });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch KOLs" }, { status: 500 });
  }
}
