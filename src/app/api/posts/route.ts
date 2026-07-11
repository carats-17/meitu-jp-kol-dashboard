import { NextRequest, NextResponse } from "next/server";
import { getPostPerformance } from "@/lib/analytics-service";
import type { Platform } from "@prisma/client";
import type { PostSortField } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const platform = searchParams.get("platform");
    const data = await getPostPerformance({
      q: searchParams.get("q") ?? undefined,
      platform: platform ? (platform as Platform) : undefined,
      feature: searchParams.get("feature") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      kolId: searchParams.get("kolId") ?? undefined,
      sortBy: (searchParams.get("sortBy") as PostSortField) ?? undefined,
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") ?? undefined,
      applyDefaultDateRange: searchParams.get("all") !== "1",
    });
    return NextResponse.json({ posts: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
