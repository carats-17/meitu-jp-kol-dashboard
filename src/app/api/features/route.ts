import { NextResponse } from "next/server";
import { getAllFeatures } from "@/lib/insights-service";

export async function GET() {
  try {
    const features = await getAllFeatures();
    return NextResponse.json({ features });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch features" }, { status: 500 });
  }
}
