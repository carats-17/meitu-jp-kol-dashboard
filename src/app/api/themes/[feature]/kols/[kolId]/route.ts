import { NextRequest, NextResponse } from "next/server";
import { getKolThemeCollabs } from "@/lib/analytics-service";
import type { Platform } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feature: string; kolId: string }> },
) {
  try {
    const { feature, kolId } = await params;
    const { searchParams } = request.nextUrl;
    const platform = searchParams.get("platform");
    const minFollowers = searchParams.get("minFollowers");
    const maxPrice = searchParams.get("maxPrice");
    const collabs = await getKolThemeCollabs(
      decodeURIComponent(feature),
      kolId,
      {
        q: searchParams.get("q") ?? undefined,
        platform: platform ? (platform as Platform) : undefined,
        dateFrom: searchParams.get("dateFrom") ?? undefined,
        dateTo: searchParams.get("dateTo") ?? undefined,
        minFollowers: minFollowers ? Number(minFollowers) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      },
    );
    return NextResponse.json({
      feature: decodeURIComponent(feature),
      kolId,
      collabs,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch KOL theme history" }, { status: 500 });
  }
}
