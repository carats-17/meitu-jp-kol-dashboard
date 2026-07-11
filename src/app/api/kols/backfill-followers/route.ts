import { NextResponse } from "next/server";
import { backfillFollowers } from "@/lib/follower-backfill";

export async function POST() {
  try {
    const result = await backfillFollowers();
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "粉丝数补全失败" }, { status: 500 });
  }
}
