import { NextRequest, NextResponse } from "next/server";
import { getTwoWeeksCompare, getWeeklyInsights } from "@/lib/insights-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    if (searchParams.get("compare") === "2" || searchParams.get("latest") === "2") {
      const data = await getTwoWeeksCompare({
        anchor: searchParams.get("anchor") ?? undefined,
        thisWeekStart: searchParams.get("thisWeekStart") ?? undefined,
        thisWeekEnd: searchParams.get("thisWeekEnd") ?? undefined,
        lastWeekStart: searchParams.get("lastWeekStart") ?? undefined,
        lastWeekEnd: searchParams.get("lastWeekEnd") ?? undefined,
      });
      return NextResponse.json(data);
    }
    const data = await getWeeklyInsights(
      searchParams.get("dateFrom") ?? undefined,
      searchParams.get("dateTo") ?? undefined,
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch weekly insights" }, { status: 500 });
  }
}
