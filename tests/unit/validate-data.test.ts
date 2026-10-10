import fs from "node:fs";
import path from "node:path";
import { validateDataDir, validateTitleFile } from "@/lib/data/validate";
import { titleSchema } from "@schemas/title";
import { platformSchema } from "@schemas/platform";
import { emptyTitle } from "@/lib/data/template";

const root = process.cwd();
const fx = (n: string) => path.join(root, "tests/fixtures/invalid-titles", `${n}.json`);

describe("validate:data", () => {
  it("البيانات الحالية (البذور + البنوك + المنصات) سليمة", () => {
    expect(validateDataDir(path.join(root, "data"))).toEqual([]);
  });

  it.each([
    ["rating-without-source", /sourceUrl/],
    ["rating-without-verified-at", /verifiedAt/],
    ["forbidden-word", /كلمة ممنوعة/],
    ["demo-with-real-link", /example\.org/],
    ["point-without-source", /بدون أي مصدر/],
    ["human-confidence-not-reviewed", /human_reviewed/],
    ["real-with-example-links", /allowlist/],
  ])("يرفض fixture غلط: %s", (name, re) => {
    const issues = validateTitleFile(fx(name));
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.map((i) => i.message).join("\n")).toMatch(re);
  });

  it("السكربت يفشل على مجلد فيه fixture غلط", () => {
    const tmp = fs.mkdtempSync(path.join(root, "test-results-tmp-"));
    try {
      fs.cpSync(path.join(root, "data"), tmp, { recursive: true });
      fs.copyFileSync(fx("rating-without-source"), path.join(tmp, "titles", "rating-without-source.json"));
      const issues = validateDataDir(tmp);
      expect(issues.some((i) => i.file.endsWith("rating-without-source.json"))).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("الـslug لازم يطابق اسم الملف", () => {
    const tmp = fs.mkdtempSync(path.join(root, "test-results-tmp-"));
    try {
      const t = JSON.parse(fs.readFileSync(path.join(root, "data/titles/minecraft.json"), "utf8"));
      fs.writeFileSync(path.join(tmp, "other.json"), JSON.stringify(t));
      expect(validateTitleFile(path.join(tmp, "other.json"))[0]?.message).toMatch(/slug/);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("قالب new-title يجتاز الـschema وكل شي فيه «غير متوفر/ما لقيت»", () => {
    const t = titleSchema.parse(emptyTitle("new-game", "لعبة جديدة", "New Game"));
    expect(Object.values(t.ratings).every((r) => r.value === null)).toBe(true);
    expect(Object.values(t.attentionPoints).every((p) => p.status === "unknown")).toBe(true);
  });

  it("عنوان حقيقي يقبل روابط الـallowlist ونطاق الناشر فقط", () => {
    const t = emptyTitle("real-game", "لعبة", "Real Game");
    t.publisher = { name: "Pub", url: "https://www.publisher.example.com/" };
    t.ratings.esrb = { value: "E", sourceUrl: "https://www.esrb.org/ratings/1/", verifiedAt: "2026-10-01" };
    expect(titleSchema.safeParse(t).success).toBe(true);
    t.ratings.pegi = { value: "3", sourceUrl: "https://random-blog.com/pegi", verifiedAt: "2026-10-01" };
    expect(titleSchema.safeParse(t).success).toBe(false);
  });

  it("خطوة منصة تجريبية لازم رابطها example.org", () => {
    const p = JSON.parse(fs.readFileSync(path.join(root, "data/platforms/ios.json"), "utf8"));
    p.steps[0].sourceUrl = "https://support.apple.com/x";
    expect(platformSchema.safeParse(p).success).toBe(false);
  });
});
