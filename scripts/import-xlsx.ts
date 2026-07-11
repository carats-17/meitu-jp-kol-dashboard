import fs from "fs";
import path from "path";
import { importFromFile } from "../src/lib/import";

const fileArg = process.argv[2];

if (!fileArg) {
  console.error("用法: npx tsx scripts/import-xlsx.ts <Excel文件路径>");
  console.error("示例: npx tsx scripts/import-xlsx.ts ~/Desktop/整合.xlsx");
  process.exit(1);
}

const resolved = path.resolve(fileArg.replace(/^~/, process.env.HOME ?? ""));

if (!fs.existsSync(resolved)) {
  console.error(`找不到文件: ${resolved}`);
  process.exit(1);
}

const buf = fs.readFileSync(resolved);
const result = await importFromFile(buf, path.basename(resolved));
console.log(JSON.stringify(result, null, 2));
