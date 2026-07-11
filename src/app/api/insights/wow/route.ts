import { NextRequest, NextResponse } from "next/server";
import { getWeekOverWeek } from "@/lib/insights-service";

export async function GET(request: NextRequest) {
  try {
    const period =
      request.nextUrl.searchParams.get("period") === "month" ? "month" : "week";
    const data = await getWeekOverWeek(
      request.nextUrl.searchParams.get("anchorDate") ?? undefined,
      period,
      request.nextUrl.searchParams.get("compareDate") ?? undefined,
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch week comparison" }, { status: 500 });
  }
}
