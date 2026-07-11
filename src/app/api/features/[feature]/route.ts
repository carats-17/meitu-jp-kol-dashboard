import { NextRequest, NextResponse } from "next/server";
import { getFeatureInsights } from "@/lib/insights-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feature: string }> },
) {
  try {
    const { feature } = await params;
    const { searchParams } = request.nextUrl;
    const data = await getFeatureInsights(
      decodeURIComponent(feature),
      searchParams.get("dateFrom") ?? undefined,
      searchParams.get("dateTo") ?? undefined,
    );
    return NextResponse.json({ feature: decodeURIComponent(feature), collabs: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch feature data" }, { status: 500 });
  }
}
