/**
 * المراجعة البشرية التفاعلية للقيم الآلية في data/titles.
 *   npm run review:data                 كل العناوين، قيمة قيمة
 *   npm run review:data -- --title fortnite
 *   npm run review:data -- --status     أعداد القيم المعلّقة فقط (بدون أسئلة)
 * لكل قيمة: المصدر الرسمي واقتباسه، والقرار: y صح (تصير «راجعها إنسان») · n غلط (تُمسح) · s تخطي · q حفظ وخروج.
 * كل قرار يُسجّل في research/review-log.ndjson (الحقل والقرار والتاريخ فقط).
 */
import { readFileSync, writeFileSync, appendFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { titleSchema } from "../schemas/title";
import { applyDecision, listPending } from "../src/lib/data/review";

const DIR = join(process.cwd(), "data", "titles");
const LOG = join(process.cwd(), "research", "review-log.ndjson");
const today = new Date().toISOString().slice(0, 10);
const args = process.argv.slice(2);
const only = args.includes("--title") ? args[args.indexOf("--title") + 1] : null;
const statusOnly = args.includes("--status");

const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".json") && (!only || f === `${only}.json`))
  .sort();
if (!files.length) {
  console.error("ما لقيت عناوين.");
  process.exit(1);
}

let totalPending = 0;
for (const f of files) {
  const t = titleSchema.parse(JSON.parse(readFileSync(join(DIR, f), "utf8")));
  const n = listPending(t).length;
  totalPending += n;
  if (statusOnly)
    console.log(`${t.slug.padEnd(22)} ${String(n).padStart(3)} قيمة معلّقة  (${t.reviewStatus})`);
}
if (statusOnly) {
  console.log(`\nالمجموع: ${totalPending} قيمة بحاجة مراجعة بشرية.`);
  process.exit(0);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
let reviewed = 0;
outer: for (const f of files) {
  let t = titleSchema.parse(JSON.parse(readFileSync(join(DIR, f), "utf8")));
  const pending = listPending(t);
  if (!pending.length) continue;
  console.log(`\n══════ ${t.nameAr} (${t.slug}) — ${pending.length} قيمة ══════`);
  for (const item of pending) {
    console.log(`\n▸ ${item.label}\n  القيمة: ${item.value}`);
    for (const s of item.sources) {
      console.log(`  المصدر: ${s.url}  (${s.verifiedAt ?? "—"})`);
      if (s.quote) console.log(`  الاقتباس: «${s.quote}»`);
    }
    let answer = "";
    while (!["y", "n", "s", "q"].includes(answer)) {
      answer = (await rl.question("  [y] صح  [n] غلط (تُمسح)  [s] تخطي  [q] حفظ وخروج › "))
        .trim()
        .toLowerCase();
    }
    if (answer === "q") break outer;
    if (answer === "s") continue;
    t = applyDecision(t, item, answer === "y" ? "correct" : "wrong", today);
    const parsed = titleSchema.safeParse(t);
    if (!parsed.success) {
      console.error("✗ البطاقة ما عادت تمر على الـschema:", parsed.error.issues);
      process.exit(1);
    }
    writeFileSync(join(DIR, f), JSON.stringify(parsed.data, null, 2) + "\n");
    appendFileSync(
      LOG,
      JSON.stringify({
        slug: t.slug,
        field: item.label,
        decision: answer === "y" ? "correct" : "wrong",
        date: today,
      }) + "\n",
    );
    reviewed++;
  }
}
rl.close();
console.log(
  `\n✓ review:data — ${reviewed} قرار محفوظ. شغّل الآن: npm run validate:data && npm test`,
);
