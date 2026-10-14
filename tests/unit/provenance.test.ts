/**
 * تتبّع المصدر: كل قيمة آلية في data/titles لازم ترجع لنص محفوظ من مصدرها الرسمي —
 * لقطة الجلب الآلي (research/official_snapshot.json) أو ملف البحث المدموج (research/seed_titles_verified.json).
 * الاقتباسات المركّبة («Age Rating 13+») تُقسم لأجزاء، وكل جزء لازم يكون موجود في نص المصدر.
 */
import { readFileSync, readdirSync } from "node:fs";
import { normalizeQuote } from "@/lib/data/guide-text";
import { quoteTraced, snapshotTextByUrl } from "@/lib/data/stale";

type Src = { url: string; quote?: string };
const snapshot = JSON.parse(readFileSync("research/official_snapshot.json", "utf8")) as {
  titles: Record<string, Record<string, unknown>>;
};
const seedText = normalizeQuote(readFileSync("research/seed_titles_verified.json", "utf8")).replace(
  /\\"/g,
  '"',
);
// نص كل رابط في اللقطة (الصفحات اللي جُلبت بنجاح).
const byUrl = snapshotTextByUrl(snapshot);

function traced(src: Src): boolean {
  const text = byUrl.get(src.url);
  if (text && quoteTraced(text, src.quote)) return true;
  // ملف البحث: الرابط موجود فيه، والاقتباس (لو فيه) موجود حرفيًا.
  return seedText.includes(src.url) && (!src.quote || seedText.includes(normalizeQuote(src.quote)));
}

const all: Array<{ where: string; src: Src }> = [];
for (const f of readdirSync("data/titles")) {
  const t = JSON.parse(readFileSync(`data/titles/${f}`, "utf8"));
  for (const [k, r] of Object.entries(t.ratings) as Array<[string, Record<string, string>]>) {
    if (r.value && r.confidence === "auto")
      all.push({ where: `${t.slug}.ratings.${k}`, src: { url: r.sourceUrl!, quote: r.quote } });
  }
  for (const [k, p] of Object.entries(t.attentionPoints) as Array<[string, { sources: Src[] }]>) {
    for (const s of p.sources) all.push({ where: `${t.slug}.points.${k}`, src: s });
  }
  for (const [k, l] of Object.entries(t.familyLens) as Array<[string, { sources: Src[] }]>) {
    for (const s of l.sources) all.push({ where: `${t.slug}.lens.${k}`, src: s });
  }
}

describe("تتبّع مصدر كل قيمة آلية", () => {
  it("فيه قيم كثيرة نتحقق منها", () => {
    expect(all.length).toBeGreaterThan(150);
  });
  it("اقتباس مو موجود في المصدر ما يمر", () => {
    const real = all.find((x) => x.where.endsWith("ratings.appStore"))!;
    expect(traced(real.src)).toBe(true);
    expect(traced({ ...real.src, quote: "Age Rating 4+ Made Up" })).toBe(false);
  });
  it("كل قيمة ترجع لنص محفوظ من مصدرها الرسمي", () => {
    const untraced = all
      .filter((x) => !traced(x.src))
      .map((x) => `${x.where}: ${x.src.url} «${x.src.quote}»`);
    expect(untraced).toEqual([]);
  });
});
