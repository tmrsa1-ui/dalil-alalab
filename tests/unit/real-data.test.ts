import fs from "node:fs";
import path from "node:path";
import { titleSchema } from "@schemas/title";
import { RATING_KEYS } from "@schemas/title";
import { POINT_KEYS } from "@schemas/common";
import { isDemoUrl } from "@/lib/agent/allowlist";
import { collectStrings } from "@/lib/forbidden-words";

const dir = path.join(process.cwd(), "data/titles");
const titles = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => titleSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))));

const EXPECTED = [
  "among-us",
  "brawl-stars",
  "call-of-duty-mobile",
  "clash-royale",
  "discord",
  "ea-sports-fc",
  "fortnite",
  "free-fire",
  "genshin-impact",
  "instagram",
  "minecraft",
  "pokemon-go",
  "pubg-mobile",
  "roblox",
  "rocket-league",
  "snapchat",
  "stumble-guys",
  "subway-surfers",
  "tiktok",
  "youtube-kids",
];

describe("البيانات الحقيقية (data/titles)", () => {
  it("العناوين العشرين موجودة", () => {
    expect(titles.map((t) => t.slug).sort()).toEqual(EXPECTED);
  });
  it("ولا عنوان تجريبي ولا رابط example.org", () => {
    for (const t of titles) {
      expect(t.isDemo).toBe(false);
      const demoLinks = collectStrings(t).filter(
        (s) => /^https?:/.test(s.text) && isDemoUrl(s.text),
      );
      expect(demoLinks).toEqual([]);
    }
  });
  it("أي تصنيف له مصدر وتاريخ تحقق، وأي نقطة معروفة لها مصدر (وإلا غير متوفر/ما لقيت)", () => {
    for (const t of titles) {
      for (const k of RATING_KEYS) {
        const r = t.ratings[k];
        if (r.value !== null) {
          expect(r.sourceUrl, `${t.slug}.${k}`).toBeTruthy();
          expect(r.verifiedAt, `${t.slug}.${k}`).toBeTruthy();
        }
      }
      for (const k of POINT_KEYS) {
        const p = t.attentionPoints[k];
        if (p.status !== "unknown") expect(p.sources.length, `${t.slug}.${k}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("القيم المستوردة (ملف البحث + المصادر الرسمية)", () => {
  it("ولا قيمة معلّمة «راجعها إنسان» (الملف ما راجعه إنسان)", () => {
    for (const t of titles) {
      expect(t.reviewStatus).not.toBe("human_reviewed");
      for (const k of RATING_KEYS) expect(t.ratings[k].confidence).not.toBe("human");
      for (const k of POINT_KEYS) expect(t.attentionPoints[k].confidence).not.toBe("human");
      // التصنيف السعودي فقط لو ظهر صراحة في متجر سعودي رسمي (Gmedia/GCAM/GAMR).
      if (t.ratings.gcam.value !== null) {
        expect(["Google Play (السعودية)", "PlayStation (السعودية)", "Xbox (السعودية)"]).toContain(
          t.ratings.gcam.shownOn,
        );
        expect(t.ratings.gcam.quote).toMatch(/Gmedia|GCAM|GMEDIA|GAMR/i);
      }
    }
  });
  it("كل قيمة مقبولة معلّمة «بحاجة مراجعة بشرية» ومعها رابط وتاريخ", () => {
    for (const t of titles) {
      for (const k of RATING_KEYS) {
        if (t.ratings[k].value) expect(t.ratings[k].confidence, `${t.slug}.${k}`).toBe("auto");
      }
      if (t.controls.officialGuide) expect(t.controls.officialGuide.confidence).toBe("auto");
    }
  });
});
