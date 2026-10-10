import fs from "node:fs";
import path from "node:path";
import { emptyTitle } from "../src/lib/data/template";

const [slug, nameAr, nameEn] = process.argv.slice(2);
if (!slug || !nameAr || !nameEn) {
  console.error('الاستخدام: npm run new-title -- <slug> "<الاسم العربي>" "<English Name>"');
  process.exit(1);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error("الـslug حروف إنجليزية صغيرة وأرقام وشرطات فقط");
  process.exit(1);
}
const file = path.resolve("data/titles", `${slug}.json`);
if (fs.existsSync(file)) {
  console.error(`الملف موجود: ${file}`);
  process.exit(1);
}
fs.writeFileSync(file, JSON.stringify(emptyTitle(slug, nameAr, nameEn), null, 2) + "\n");
console.log(
  `✓ أُنشئ ${path.relative(process.cwd(), file)} — عبّه حسب docs/CONTENT_GUIDE.md ثم شغّل npm run validate:data`,
);
