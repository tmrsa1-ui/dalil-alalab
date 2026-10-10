import fs from "node:fs";
import { titleSchema, type TitleIndexEntry } from "../../../schemas/title";
import { titleFileMap } from "./title-files";

export function buildIndex(dataDir: string, demo?: boolean): TitleIndexEntry[] {
  return [...titleFileMap(dataDir, demo).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, file]) => titleSchema.parse(JSON.parse(fs.readFileSync(file, "utf8"))))
    .map((t) => ({
      slug: t.slug,
      nameAr: t.nameAr,
      nameEn: t.nameEn,
      aliases: t.aliases,
      isDemo: t.isDemo,
      reviewStatus: t.reviewStatus,
    }));
}
