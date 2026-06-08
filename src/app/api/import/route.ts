import { NextRequest, NextResponse } from "next/server";
import { importFromFile } from "@/lib/import";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请上传 CSV 或 Excel 文件" }, { status: 400 });
    }

    const lower = file.name.toLowerCase();
    const supported =
      lower.endsWith(".csv") || lower.endsWith(".xlsx") || lower.endsWith(".xls");

    if (!supported) {
      return NextResponse.json(
        { error: "仅支持 .csv、.xlsx、.xls 格式" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importFromFile(buffer, file.name);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "导入失败" }, { status: 500 });
  }
}
