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

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const src = path.resolve(
  args.find((a) => !a.startsWith("--")) ?? "research/seed_titles_verified.json",
);

if (!fs.existsSync(src)) {
  console.error(`✗ الملف غير موجود: ${path.relative(process.cwd(), src)}`);
  process.exit(1);
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
