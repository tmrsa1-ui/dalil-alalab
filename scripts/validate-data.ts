import path from "node:path";
import { validateDataDir } from "../src/lib/data/validate";

const dir = path.resolve(process.argv[2] ?? "data");
const issues = validateDataDir(dir);
if (issues.length) {
  console.error(`✗ validate:data — ${issues.length} مشكلة:`);
  for (const i of issues) console.error(`  - ${path.relative(process.cwd(), i.file)}: ${i.message}`);
  process.exit(1);
}
console.log(`✓ validate:data — كل ملفات ${path.relative(process.cwd(), dir) || "."} سليمة`);
