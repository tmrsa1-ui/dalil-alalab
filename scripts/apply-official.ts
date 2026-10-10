/**
 * يطبّق research/official_snapshot.json على data/titles/*.json ويكتب research/official-report.md.
 * كل قيمة تُكتب بحالة «بحاجة مراجعة بشرية» (confidence: auto) مع الرابط والاقتباس والتاريخ.
 *
 * الاستخدام: npm run apply:official [-- --dry]
 */
import fs from "node:fs";
import path from "node:path";
import { titleSchema } from "../schemas/title";
import { platformSchema } from "../schemas/platform";
import { findForbiddenWord } from "../src/lib/forbidden-words";
import {
  applyOfficial,
  type OfficialDecision,
  type SnapshotEntry,
} from "../src/lib/data/official-apply";

const dry = process.argv.includes("--dry");
type GuideSnap = {
  url: string;
  fetchedAt?: string;
  status: number;
  finalUrl?: string;
  finalAllowed?: boolean;
  pageTitle?: string;
  metaDescription?: string | null;
};
const snap = JSON.parse(fs.readFileSync("research/official_snapshot.json", "utf8")) as {
  fetchedAt: string;
  titles: Record<string, SnapshotEntry>;
  platformGuides?: Record<string, GuideSnap>;
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

// أدلة الأجهزة: رابط رسمي فُتح فعلًا + عنوانه/وصفه الحرفي + تاريخ الفحص.
// verifiedAt (المراجعة البشرية) يبقى كما هو.
for (const [id, g] of Object.entries(snap.platformGuides ?? {})) {
  const file = path.resolve("data/platforms", `${id}.json`);
  if (!fs.existsSync(file)) continue;
  if (g.status !== 200 || !g.finalAllowed || !g.finalUrl || !g.pageTitle) {
    all.push({
      slug: `(${id})`,
      field: "officialGuideUrl",
      action: "skip",
      detail: `ما انفتح (${g.status}): ${g.url}`,
    });
    continue;
  }
  const p = JSON.parse(fs.readFileSync(file, "utf8"));
  const clean = (x: string | null | undefined) =>
    x && !findForbiddenWord(x, { english: true }) ? x : null;
  const quote = clean(g.metaDescription) ?? clean(g.pageTitle);
  p.officialGuideUrl = g.finalUrl;
  if (clean(g.pageTitle)) p.officialGuideTitle = g.pageTitle;
  p.linkCheckedAt = g.fetchedAt ?? snap.fetchedAt;
  if (quote) p.guideQuote = quote.slice(0, 300);
  else delete p.guideQuote;
  const r = platformSchema.safeParse(p);
  if (!r.success) {
    all.push({
      slug: `(${id})`,
      field: "officialGuideUrl",
      action: "skip",
      detail: r.error.issues[0]!.message,
    });
    continue;
  }
  if (!dry) fs.writeFileSync(file, JSON.stringify(r.data, null, 2) + "\n");
  all.push({
    slug: `(${id})`,
    field: "officialGuideUrl",
    action: "set",
    detail: `${g.finalUrl}${p.guideQuote ? ` — «${String(p.guideQuote).slice(0, 80)}»` : " (بدون اقتباس: النص فيه كلمة ممنوعة)"}`,
  });
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
- المصادر: App Store السعودي (\`apps.apple.com/sa\`)، Google Play بمنطقة السعودية (\`gl=SA\`)، صفحات الألعاب في PlayStation السعودية (\`playstation.com/en-sa\`)، ومتجر Xbox السعودي (\`xbox.com/ar-SA\`)، وأدلة الرقابة الأبوية الرسمية للأجهزة.
- كل القيم مكتوبة بحالة **«بحاجة مراجعة بشرية»**: قُرئت آليًا من الصفحة الرسمية مع اقتباس حرفي ورابط وتاريخ، وما راجعها إنسان.
- ما قدرنا نوصل (رفض من بوابة الشبكة): \`www.esrb.org\`، \`pegi.info\`، \`gcam.gov.sa\`، \`gmedia.gov.sa\`، \`www.nintendo.com\`، وأغلب مواقع الناشرين. قيم ESRB الموجودة جاية من ملف البحث (بحاجة مراجعة بشرية) وما تحققنا منها بأنفسنا.
- التصنيف السعودي (GCAM/Gmedia/GAMR) كما يعرضه: PlayStation (السعودية) بـ\`authority: GCAM\`، أو Xbox (السعودية) بلوحة \`GAMR\`، أو شارة Gmedia في Google Play (السعودية). يُكتب بجانبه «يعرضه: …».\n- تصنيف IARC العام اللي يعرضه PlayStation لبعض العناوين ما له خانة من الجهات الخمس، فما انكتب.
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
