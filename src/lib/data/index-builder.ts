import fs from "node:fs";
import path from "node:path";
import { titleSchema, type TitleIndexEntry } from "../../../schemas/title";

export function buildIndex(dataDir: string): TitleIndexEntry[] {
  const dir = path.join(dataDir, "titles");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => titleSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))))
    .map((t) => ({
      slug: t.slug,
      nameAr: t.nameAr,
      nameEn: t.nameEn,
      aliases: t.aliases,
      isDemo: t.isDemo,
      reviewStatus: t.reviewStatus,
    }));
}
