/**
 * يولّد ملفات العناوين الحقيقية العشرين كقوالب فاضية (كل شي «غير متوفر/ما لقيت»).
 * لا يكتب أي تصنيف أو نقطة انتباه: التعبئة تكون فقط من مصادر رسمية متحقق منها
 * (انظر docs/CONTENT_GUIDE.md و scripts/import-verified.ts).
 * لا يكتب فوق ملف موجود.
 */
import fs from "node:fs";
import path from "node:path";
import { emptyTitle } from "../src/lib/data/template";

type Seed = {
  slug: string;
  nameAr: string;
  nameEn: string;
  kind: "game" | "app";
  aliases: string[];
};

export const REAL_TITLES: Seed[] = [
  {
    slug: "roblox",
    nameAr: "روبلوكس",
    nameEn: "Roblox",
    kind: "game",
    aliases: ["روبلكس", "روبلس", "roblox"],
  },
  {
    slug: "minecraft",
    nameAr: "ماين كرافت",
    nameEn: "Minecraft",
    kind: "game",
    aliases: ["ماينكرافت", "ماين", "minecraft pe", "mc"],
  },
  {
    slug: "fortnite",
    nameAr: "فورتنايت",
    nameEn: "Fortnite",
    kind: "game",
    aliases: ["فورت نايت", "فورت"],
  },
  {
    slug: "among-us",
    nameAr: "أمونق أس",
    nameEn: "Among Us",
    kind: "game",
    aliases: ["امونج اس", "أمونغ أس", "امنق اس", "امونق اس"],
  },
  {
    slug: "pubg-mobile",
    nameAr: "ببجي موبايل",
    nameEn: "PUBG MOBILE",
    kind: "game",
    aliases: ["ببجي", "ببجى", "بابجي", "pubg", "pubgm"],
  },
  {
    slug: "free-fire",
    nameAr: "فري فاير",
    nameEn: "Free Fire",
    kind: "game",
    aliases: ["فريفاير", "garena free fire", "freefire"],
  },
  {
    slug: "brawl-stars",
    nameAr: "براول ستارز",
    nameEn: "Brawl Stars",
    kind: "game",
    aliases: ["براول", "براول ستار", "brawlstars"],
  },
  {
    slug: "clash-royale",
    nameAr: "كلاش رويال",
    nameEn: "Clash Royale",
    kind: "game",
    aliases: ["كلاش رويل", "كلاش رويالي"],
  },
  {
    slug: "tiktok",
    nameAr: "تيك توك",
    nameEn: "TikTok",
    kind: "app",
    aliases: ["تيكتوك", "تك توك", "tik tok"],
  },
  {
    slug: "snapchat",
    nameAr: "سناب شات",
    nameEn: "Snapchat",
    kind: "app",
    aliases: ["سناب", "سنابشات", "snap"],
  },
  {
    slug: "youtube-kids",
    nameAr: "يوتيوب كيدز",
    nameEn: "YouTube Kids",
    kind: "app",
    aliases: ["يوتيوب للأطفال", "يوتيوب كيدز", "youtubekids"],
  },
  {
    slug: "pokemon-go",
    nameAr: "بوكيمون قو",
    nameEn: "Pokémon GO",
    kind: "game",
    aliases: ["بوكيمون جو", "بوكيمون", "pokemon go", "pokemongo"],
  },
  {
    slug: "ea-sports-fc",
    nameAr: "إي إيه سبورتس إف سي",
    nameEn: "EA SPORTS FC",
    kind: "game",
    aliases: ["فيفا", "فيفا موبايل", "fifa", "ea fc", "fc mobile", "اف سي"],
  },
  {
    slug: "call-of-duty-mobile",
    nameAr: "كول أوف ديوتي موبايل",
    nameEn: "Call of Duty: Mobile",
    kind: "game",
    aliases: ["كود موبايل", "كول اوف ديوتي", "cod mobile", "codm"],
  },
  {
    slug: "subway-surfers",
    nameAr: "صب واي سيرفرس",
    nameEn: "Subway Surfers",
    kind: "game",
    aliases: ["صب واي", "سبواي", "سب واي سيرفر"],
  },
  {
    slug: "genshin-impact",
    nameAr: "قنشن إمباكت",
    nameEn: "Genshin Impact",
    kind: "game",
    aliases: ["قنشن", "جنشن", "genshin"],
  },
  {
    slug: "stumble-guys",
    nameAr: "ستمبل قايز",
    nameEn: "Stumble Guys",
    kind: "game",
    aliases: ["ستامبل قايز", "ستمبل"],
  },
  {
    slug: "discord",
    nameAr: "ديسكورد",
    nameEn: "Discord",
    kind: "app",
    aliases: ["دسكورد", "ديسكورد"],
  },
  {
    slug: "instagram",
    nameAr: "إنستقرام",
    nameEn: "Instagram",
    kind: "app",
    aliases: ["انستا", "انستغرام", "انستجرام", "insta"],
  },
  {
    slug: "rocket-league",
    nameAr: "روكيت ليق",
    nameEn: "Rocket League",
    kind: "game",
    aliases: ["روكت ليق", "روكيت ليج"],
  },
];

if (process.argv[1]?.endsWith("seed-real-titles.ts")) {
  const dir = path.resolve("data/titles");
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const s of REAL_TITLES) {
    const file = path.join(dir, `${s.slug}.json`);
    if (fs.existsSync(file)) continue;
    const t = emptyTitle(s.slug, s.nameAr, s.nameEn);
    t.$schema = "../../schemas/json/title.schema.json";
    t.kind = s.kind;
    t.aliases = s.aliases;
    fs.writeFileSync(file, JSON.stringify(t, null, 2) + "\n");
    n++;
  }
  console.log(`✓ seed-real-titles — ${n} ملف جديد`);
}
