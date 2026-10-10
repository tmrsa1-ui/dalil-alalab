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
  "among-us", "brawl-stars", "call-of-duty-mobile", "clash-royale", "discord", "ea-sports-fc",
  "fortnite", "free-fire", "genshin-impact", "instagram", "minecraft", "pokemon-go", "pubg-mobile",
  "roblox", "rocket-league", "snapchat", "stumble-guys", "subway-surfers", "tiktok", "youtube-kids",
];

describe("البيانات الحقيقية (data/titles)", () => {
  it("العناوين العشرين موجودة", () => {
    expect(titles.map((t) => t.slug).sort()).toEqual(EXPECTED);
  });
  it("ولا عنوان تجريبي ولا رابط example.org", () => {
    for (const t of titles) {
      expect(t.isDemo).toBe(false);
      const demoLinks = collectStrings(t).filter((s) => /^https?:/.test(s.text) && isDemoUrl(s.text));
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
