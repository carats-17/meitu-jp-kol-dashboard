import { NextResponse } from "next/server";
import { getLibraryOverview } from "@/lib/analytics-service";

export async function GET() {
  try {
    const data = await getLibraryOverview();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch overview" }, { status: 500 });
  }
}
