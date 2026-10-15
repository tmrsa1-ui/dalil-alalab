import fs from "node:fs";
import path from "node:path";
import { buildIndex } from "../src/lib/data/index-builder";

// الفهرس المحفوظ دائمًا للبيانات الحقيقية فقط (بدون التجريبية).
const dataDir = path.resolve("data");
const index = buildIndex(dataDir, false);
fs.writeFileSync(path.join(dataDir, "titles.index.json"), JSON.stringify(index, null, 2) + "\n");
console.log(`✓ build:index — ${index.length} عنوان`);
