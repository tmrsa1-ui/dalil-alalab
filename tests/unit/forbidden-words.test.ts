import fs from "node:fs";
import path from "node:path";
import { collectStrings, findForbiddenWord } from "@/lib/forbidden-words";
import { ar } from "@/lib/i18n/ar";
import { pages } from "@/lib/i18n/pages";

const root = process.cwd();

function walk(dir: string, exts: string[]): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p, exts);
    return exts.some((e) => p.endsWith(e)) ? [p] : [];
  });
}

describe("ممنوع «آمن/آمنة» في المنتج كله", () => {
  it("الفاحص يلتقط الصيغ والسوابق", () => {
    for (const t of ["آمن", "آمنة", "غير آمن", "الآمنة", "وآمن", "بأمان", "الأمان", "آمِنة"]) {
      expect(findForbiddenWord(t)).not.toBeNull();
    }
    expect(findForbiddenWord("Safe mode", { english: true })).not.toBeNull();
  });
  it("الفاحص ما يلتقط كلمات بريئة", () => {
    for (const t of ["أمن المعلومات", "آمنت", "أمانة", "مأمونية", "الأمن", "يؤمن"]) {
      expect(findForbiddenWord(t)).toBeNull();
    }
  });
  it("نصوص الواجهة ar.ts و pages.ts نظيفة (عربي وإنجليزي)", () => {
    const strings = [
      ...collectStrings(ar),
      ...collectStrings(pages),
      // الدوال في ar.ts: نجربها بمدخلات نموذجية
      ...Object.values(ar).flatMap((g) =>
        typeof g === "object"
          ? Object.values(g)
              .filter((v): v is (...a: never[]) => string => typeof v === "function")
              .map((f) => ({ path: "fn", text: String((f as (...a: unknown[]) => string)(1, 2)) }))
          : [],
      ),
    ];
    const bad = strings.filter((s) => findForbiddenWord(s.text, { english: true }));
    expect(bad).toEqual([]);
  });
  it("كل ملفات data/ نظيفة", () => {
    const files = walk(path.join(root, "data"), [".json"]);
    expect(files.length).toBeGreaterThan(5);
    const bad = files.flatMap((f) =>
      collectStrings(JSON.parse(fs.readFileSync(f, "utf8")))
        .filter((s) => findForbiddenWord(s.text))
        .map((s) => `${path.relative(root, f)} ${s.path}`),
    );
    expect(bad).toEqual([]);
  });
  it("كل ملفات src/ نظيفة (نص عربي)", () => {
    const files = walk(path.join(root, "src"), [".ts", ".tsx"]).filter((f) => !f.endsWith("forbidden-words.ts"));
    const bad = files.filter((f) => findForbiddenWord(fs.readFileSync(f, "utf8")));
    expect(bad).toEqual([]);
  });
});
