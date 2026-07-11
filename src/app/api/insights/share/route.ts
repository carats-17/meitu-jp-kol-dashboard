import { NextRequest, NextResponse } from "next/server";
import { getFeatureShares } from "@/lib/insights-service";

export async function GET(request: NextRequest) {
  try {
    const granularity =
      request.nextUrl.searchParams.get("granularity") === "month"
        ? "month"
        : "week";
    const data = await getFeatureShares(granularity);
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch feature shares" },
      { status: 500 },
    );
  }
}
