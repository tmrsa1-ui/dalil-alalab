import fs from "node:fs";
import path from "node:path";

/**
 * البيانات الحقيقية في data/titles. البطاقات التجريبية في data/demo/titles
 * وتُحمَّل فقط لما يكون DALIL_DEMO=1 (الاختبارات والعرض التجريبي)، وتغطي العنوان الحقيقي بنفس الـslug.
 */
export function includeDemo(): boolean {
  return process.env.DALIL_DEMO === "1";
}

export function titleDirs(dataDir: string, demo = includeDemo()): string[] {
  const dirs = [path.join(dataDir, "titles")];
  if (demo) dirs.push(path.join(dataDir, "demo", "titles"));
  return dirs.filter((d) => fs.existsSync(d));
}

/** slug ⇐ مسار الملف (التجريبي يغطي الحقيقي لو تكرر الـslug). */
export function titleFileMap(dataDir: string, demo = includeDemo()): Map<string, string> {
  const map = new Map<string, string>();
  for (const dir of titleDirs(dataDir, demo)) {
    for (const f of fs
      .readdirSync(dir)
      .filter((x) => x.endsWith(".json"))
      .sort()) {
      map.set(path.basename(f, ".json"), path.join(dir, f));
    }
  }
  return map;
}
