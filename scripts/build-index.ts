import fs from "node:fs";
import path from "node:path";
import { buildIndex } from "../src/lib/data/index-builder";

const dataDir = path.resolve("data");
const index = buildIndex(dataDir);
fs.writeFileSync(path.join(dataDir, "titles.index.json"), JSON.stringify(index, null, 2) + "\n");
console.log(`✓ build:index — ${index.length} عنوان`);
