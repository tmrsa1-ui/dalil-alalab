/**
 * يطبّق research/official_snapshot.json على data/titles/*.json ويكتب research/official-report.md.
 * كل قيمة تُكتب بحالة «بحاجة مراجعة بشرية» (confidence: auto) مع الرابط والاقتباس والتاريخ.
 *
 * الاستخدام: npm run apply:official [-- --dry]
 */
import fs from "node:fs";
import path from "node:path";
import { titleSchema } from "../schemas/title";
import {
  applyOfficial,
  type OfficialDecision,
  type SnapshotEntry,
} from "../src/lib/data/official-apply";

const dry = process.argv.includes("--dry");
const snap = JSON.parse(fs.readFileSync("research/official_snapshot.json", "utf8")) as {
  fetchedAt: string;
  titles: Record<string, SnapshotEntry>;
};

const all: OfficialDecision[] = [];
let failed = 0;
for (const [slug, entry] of Object.entries(snap.titles)) {
  const file = path.resolve("data/titles", `${slug}.json`);
  if (!fs.existsSync(file)) continue;
  const current = titleSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
  const { title, decisions } = applyOfficial(current, entry);
  const r = titleSchema.safeParse(title);
  if (!r.success) {
    failed++;
    all.push({
      slug,
      field: "(تحقق)",
      action: "skip",
      detail: r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    });
    continue;
  }
  all.push(...decisions);
  if (!dry) fs.writeFileSync(file, JSON.stringify(r.data, null, 2) + "\n");
}

const row = (d: OfficialDecision) =>
  `| ${d.slug} | ${d.field} | ${d.action} | ${d.detail.replace(/\|/g, "/")} |`;
const ACTION = { set: "أُضيف", replace: "استُبدل/دُمج", keep: "بقي", skip: "تُرك" } as const;
const counts = Object.fromEntries(
  (Object.keys(ACTION) as Array<keyof typeof ACTION>).map((a) => [
    a,
    all.filter((d) => d.action === a).length,
  ]),
);
const report = `# تقرير التحقق من المصادر الرسمية

- تاريخ الجلب: ${snap.fetchedAt}
- المصادر: صفحة التطبيق في App Store السعودي (\`apps.apple.com/sa\`) وصفحة Google Play بمنطقة السعودية (\`gl=SA\`).
- كل القيم مكتوبة بحالة **«بحاجة مراجعة بشرية»**: قُرئت آليًا من الصفحة الرسمية مع اقتباس حرفي ورابط وتاريخ، وما راجعها إنسان.
- ما قدرنا نوصل (رفض من بوابة الشبكة): \`esrb.org\` (يحوّل لـ\`www.esrb.org\`)، \`pegi.info\`، \`gcam.gov.sa\`، \`gmedia.gov.sa\`، وأغلب مواقع الناشرين. قيم ESRB الموجودة جاية من ملف البحث (بحاجة مراجعة بشرية) وما تحققنا منها بأنفسنا.
- Google Play في السعودية يعرض شارة **Gmedia** (التصنيف السعودي) لبعض العناوين بدل IARC؛ سُجّلت في خانة التصنيف السعودي مع «يعرضه: Google Play (السعودية)».
- ${dry ? "**تجربة (--dry): ما انكتب شي.**" : "انكتبت التعديلات في data/titles."}
- الملخص: ${(Object.keys(ACTION) as Array<keyof typeof ACTION>).map((a) => `${ACTION[a]} ${counts[a]}`).join("، ")}${failed ? `، فشل ${failed}` : ""}.

| العنوان | الحقل | الإجراء | التفاصيل |
| --- | --- | --- | --- |
${all.map(row).join("\n")}
`;
if (!dry) fs.writeFileSync("research/official-report.md", report);
console.log(report.split("\n").slice(0, 12).join("\n"));
console.log(`${failed ? "✗" : "✓"} apply:official — ${all.length} قرار${dry ? " (تجربة)" : ""}`);
if (failed) process.exit(1);
