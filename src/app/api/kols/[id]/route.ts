import { NextRequest, NextResponse } from "next/server";
import { getKolById } from "@/lib/kol-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const kol = await getKolById(id);

    if (!kol) {
      return NextResponse.json({ error: "KOL not found" }, { status: 404 });
    }

    return NextResponse.json(kol);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch KOL" }, { status: 500 });
  }
}
