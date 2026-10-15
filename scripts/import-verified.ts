/**
 * يدمج بيانات متحقق منها من ملف بحث (افتراضيًا research/seed_titles_verified.json)
 * داخل data/titles/<slug>.json، ثم يتحقق من كل عنوان بالـschema الكامل.
 *
 * الصيغة المتوقعة:
 * { "titles": [ { "slug": "roblox", ...أي حقول من schemas/title.ts (ratings, attentionPoints,
 *   familyLens, prayerPause, controls, platforms, publisher, conversationTags, reviewStatus,
 *   lastReviewedAt) } ] }
 * - الحقول غير المذكورة تبقى كما هي (غير متوفر/ما لقيت).
 * - ratings/attentionPoints/familyLens تُدمج مفتاح بمفتاح.
 * - أي عنوان يفشل التحقق ما يُكتب، ويطلع السبب، والسكربت يرجع خطأ.
 *
 * الاستخدام: npm run import:verified -- [path] [--dry]
 */
import fs from "node:fs";
import path from "node:path";
import { titleSchema, type Title } from "../schemas/title";
import { platformSchema } from "../schemas/platform";
import { applyResearch, researchFileSchema, type Decision } from "../src/lib/data/research-adapter";
import { hostOf } from "../src/lib/agent/allowlist";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const src = path.resolve(
  args.find((a) => !a.startsWith("--")) ?? "research/seed_titles_verified.json",
);

if (!fs.existsSync(src)) {
  console.error(`✗ الملف غير موجود: ${path.relative(process.cwd(), src)}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(src, "utf8")) as Record<string, unknown>;

/** صيغة ملف البحث (titles[].id + ratings[] كمصفوفة). */
if (
  Array.isArray(raw.titles) &&
  (raw.titles as Array<Record<string, unknown>>).some((t) => "id" in t)
) {
  importResearch(raw);
  process.exit(0);
}

function importResearch(json: unknown) {
  const parsed = researchFileSchema.safeParse(json);
  if (!parsed.success) {
    console.error("✗ صيغة ملف البحث غير مفهومة:");
    for (const i of parsed.error.issues.slice(0, 10))
      console.error(`    ${i.path.join(".")}: ${i.message}`);
    process.exit(1);
  }
  const file = parsed.data;
  const decisions: Decision[] = [];
  let written = 0;
  let failed = 0;
  for (const entry of file.titles) {
    const target = path.resolve("data/titles", `${entry.id}.json`);
    if (!/^[a-z0-9-]+$/.test(entry.id) || !fs.existsSync(target)) {
      decisions.push({
        slug: entry.id,
        field: "(عنوان)",
        accepted: false,
        reason: "ما فيه ملف في data/titles",
      });
      failed++;
      continue;
    }
    const current = titleSchema.parse(JSON.parse(fs.readFileSync(target, "utf8")));
    const { title, decisions: d } = applyResearch(current, entry, file._meta);
    decisions.push(...d);
    const r = titleSchema.safeParse(title);
    if (!r.success) {
      failed++;
      for (const i of r.error.issues.slice(0, 5)) {
        decisions.push({
          slug: entry.id,
          field: i.path.join("."),
          accepted: false,
          reason: `فشل التحقق: ${i.message}`,
        });
      }
      continue;
    }
    if (!dry) fs.writeFileSync(target, JSON.stringify(r.data, null, 2) + "\n");
    written++;
  }

  // أدلة الأجهزة: نحدّث رابط الدليل الرسمي + تاريخ الفحص الآلي فقط (verifiedAt البشري يبقى null).
  const DEVICE_HOSTS: Record<string, string> = {
    "support.apple.com": "ios",
    "families.google": "android",
  };
  for (const dc of file.device_controls ?? []) {
    const host = hostOf(dc.url) ?? "";
    const id = Object.entries(DEVICE_HOSTS).find(
      ([h]) => host === h || host.endsWith(`.${h}`),
    )?.[1];
    if (!id) {
      decisions.push({
        slug: "(أجهزة)",
        field: dc.url,
        accepted: false,
        reason: "ما عرفنا الجهاز",
      });
      continue;
    }
    const pfile = path.resolve("data/platforms", `${id}.json`);
    const p = JSON.parse(fs.readFileSync(pfile, "utf8"));
    p.officialGuideUrl = dc.url;
    p.officialGuideTitle = dc.label;
    p.linkCheckedAt = file._meta?.verified_on ?? p.linkCheckedAt;
    const r = platformSchema.safeParse(p);
    if (!r.success) {
      decisions.push({
        slug: `(${id})`,
        field: "officialGuideUrl",
        accepted: false,
        reason: r.error.issues[0]!.message,
      });
      continue;
    }
    if (!dry) fs.writeFileSync(pfile, JSON.stringify(r.data, null, 2) + "\n");
    decisions.push({ slug: `(${id})`, field: "officialGuideUrl", accepted: true, reason: dc.url });
  }

  const ok = decisions.filter((d) => d.accepted);
  const no = decisions.filter((d) => !d.accepted);
  const row = (d: Decision) => `| ${d.slug} | ${d.field} | ${d.reason.replace(/\|/g, "/")} |`;
  const report = `# تقرير دمج ملف البحث

- الملف: \`${path.relative(process.cwd(), src)}\`
- حالة الملف: ${file._meta?.status ?? "—"} — ${file._meta?.method ?? ""}
- تاريخ التحقق في الملف: ${file._meta?.verified_on ?? "—"}
- القيم المقبولة تظهر في الواجهة بحالة «بحاجة مراجعة بشرية» (confidence: auto). أي شي مرفوض أو ناقص يبقى «غير متوفر/ما لقيت».
- ${dry ? "**تجربة (--dry): ما انكتب شي.**" : `انكتب ${written} عنوان.`}

## المقبول (${ok.length})

| العنوان | الحقل | التفاصيل |
| --- | --- | --- |
${ok.map(row).join("\n")}

## المرفوض (${no.length})

| العنوان | الحقل | السبب |
| --- | --- | --- |
${no.map(row).join("\n")}
`;
  if (!dry) fs.writeFileSync(path.resolve("research/import-report.md"), report);
  console.log(report);
  console.log(
    `${failed ? "✗" : "✓"} import:verified (ملف بحث) — ${written} عنوان${dry ? " (تجربة بدون كتابة)" : ""}، ${ok.length} قيمة مقبولة، ${no.length} مرفوضة، ${failed} عنوان فشل`,
  );
  if (failed) process.exit(1);
}

const MERGE_KEYS = ["ratings", "attentionPoints", "familyLens"] as const;
const COPY_KEYS = [
  "prayerPause",
  "controls",
  "platforms",
  "publisher",
  "conversationTags",
  "reviewStatus",
  "lastReviewedAt",
  "kind",
] as const;

const input = JSON.parse(fs.readFileSync(src, "utf8")) as {
  titles?: Array<Record<string, unknown>>;
};
let ok = 0;
let failed = 0;
for (const patch of input.titles ?? []) {
  const slug = String(patch.slug ?? "");
  const file = path.resolve("data/titles", `${slug}.json`);
  if (!/^[a-z0-9-]+$/.test(slug) || !fs.existsSync(file)) {
    console.error(`✗ ${slug || "(بدون slug)"}: ما فيه ملف في data/titles`);
    failed++;
    continue;
  }
  const current = JSON.parse(fs.readFileSync(file, "utf8")) as Title & Record<string, unknown>;
  const next: Record<string, unknown> = { ...current, isDemo: false };
  for (const k of MERGE_KEYS) {
    if (patch[k] && typeof patch[k] === "object") {
      next[k] = { ...(current[k] as object), ...(patch[k] as object) };
    }
  }
  for (const k of COPY_KEYS) if (k in patch) next[k] = patch[k];
  if (Array.isArray(patch.aliases)) {
    next.aliases = [...new Set([...(current.aliases ?? []), ...(patch.aliases as string[])])];
  }
  const r = titleSchema.safeParse(next);
  if (!r.success) {
    console.error(`✗ ${slug}:`);
    for (const i of r.error.issues.slice(0, 10))
      console.error(`    ${i.path.join(".")}: ${i.message}`);
    failed++;
    continue;
  }
  if (!dry) fs.writeFileSync(file, JSON.stringify(r.data, null, 2) + "\n");
  ok++;
}
console.log(
  `${failed ? "✗" : "✓"} import:verified — ${ok} عنوان${dry ? " (تجربة بدون كتابة)" : ""}، ${failed} فشل`,
);
if (failed) process.exit(1);
