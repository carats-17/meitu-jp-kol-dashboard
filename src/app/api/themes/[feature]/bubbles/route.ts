import { NextRequest, NextResponse } from "next/server";
import { getKolBubblesForTheme } from "@/lib/analytics-service";
import type { Platform } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feature: string }> },
) {
  try {
    const { feature } = await params;
    const { searchParams } = request.nextUrl;
    const platform = searchParams.get("platform");
    const data = await getKolBubblesForTheme(decodeURIComponent(feature), {
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      platform: platform ? (platform as Platform) : undefined,
    });
    return NextResponse.json({ feature: decodeURIComponent(feature), kols: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch theme kols" }, { status: 500 });
  }
}
