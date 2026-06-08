import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/kol-service";

export async function GET() {
  try {
    const metrics = await getDashboardMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
