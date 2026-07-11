import { NextRequest, NextResponse } from "next/server";
import { getThemeBubbles } from "@/lib/analytics-service";
import type { Platform } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const platform = searchParams.get("platform");
    const minFollowers = searchParams.get("minFollowers");
    const maxPrice = searchParams.get("maxPrice");
    const data = await getThemeBubbles({
      q: searchParams.get("q") ?? undefined,
      platform: platform ? (platform as Platform) : undefined,
      feature: searchParams.get("feature") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      minFollowers: minFollowers ? Number(minFollowers) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
    return NextResponse.json({ themes: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch themes" }, { status: 500 });
  }
}
