import { NextRequest, NextResponse } from "next/server";
import { getKolHistory } from "@/lib/analytics-service";
import type { Platform } from "@prisma/client";
import type { KolSortField } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const platform = searchParams.get("platform");
    const sortBy = searchParams.get("sortBy") as KolSortField | null;
    const data = await getKolHistory({
      q: searchParams.get("q") ?? undefined,
      platform: platform ? (platform as Platform) : undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      sortBy: sortBy ?? "avgEngagement",
      sortOrder: searchParams.get("sortOrder") === "asc" ? "asc" : "desc",
    });
    return NextResponse.json({ kols: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
