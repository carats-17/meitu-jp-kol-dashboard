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
    theme: searchParams.get("theme") ?? undefined,
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
  };
}

export async function GET(request: NextRequest) {
  try {
    const filters = parseFilters(request.nextUrl.searchParams);
    const withOptions = request.nextUrl.searchParams.get("withOptions") === "1";

    const [kols, options] = await Promise.all([
      getKolsWithStats(filters),
      withOptions ? getFilterOptions() : Promise.resolve(null),
    ]);

    return NextResponse.json({ kols, options });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch KOLs" }, { status: 500 });
  }
}
