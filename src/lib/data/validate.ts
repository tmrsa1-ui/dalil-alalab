import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";
import { titleSchema } from "../../../schemas/title";
import { platformSchema } from "../../../schemas/platform";
import { questionsFileSchema } from "../../../schemas/questions";
import { agreementFileSchema } from "../../../schemas/agreement";
import { compactKey } from "../normalize-ar";

export type DataIssue = { file: string; message: string };

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function zodIssues(file: string, error: z.ZodError): DataIssue[] {
  return error.issues.map((i) => ({
    file,
    message: `${i.path.join(".") || "(root)"}: ${i.message}`,
  }));
}

export function validateTitleFile(file: string): DataIssue[] {
  let raw: unknown;
  try {
    raw = readJson(file);
  } catch (e) {
    return [{ file, message: `JSON غير صالح: ${(e as Error).message}` }];
  }
  const r = titleSchema.safeParse(raw);
  if (!r.success) return zodIssues(file, r.error);
  const expected = path.basename(file, ".json");
  if (r.data.slug !== expected) {
    return [{ file, message: `الـslug (${r.data.slug}) لازم يطابق اسم الملف (${expected})` }];
  }
  return [];
}

/** يتحقق من مجلد data كامل. يرجع قائمة مشاكل (فاضية = سليم). */
export function validateDataDir(dataDir: string): DataIssue[] {
  const issues: DataIssue[] = [];
  const titlesDir = path.join(dataDir, "titles");
  const realFiles = fs.existsSync(titlesDir)
    ? fs.readdirSync(titlesDir).filter((f) => f.endsWith(".json"))
    : [];
  if (realFiles.length === 0) issues.push({ file: titlesDir, message: "ما فيه عناوين" });

  // كل مجموعة تُفحص لحالها: الحقيقية، والتجريبية (اللي تغطي الحقيقية في وضع العرض).
  for (const [dir, mustBeDemo] of [
    [titlesDir, false],
    [path.join(dataDir, "demo", "titles"), true],
  ] as const) {
    if (!fs.existsSync(dir)) continue;
    const keys = new Map<string, string>();
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      const file = path.join(dir, f);
      const fileIssues = validateTitleFile(file);
      issues.push(...fileIssues);
      if (fileIssues.length) continue;
      const t = titleSchema.parse(readJson(file));
      if (t.isDemo !== mustBeDemo) {
        issues.push({
          file,
          message: mustBeDemo
            ? "ملفات data/demo لازم isDemo: true"
            : "البيانات التجريبية مكانها data/demo/titles وليس data/titles",
        });
      }
      for (const name of [t.nameAr, t.nameEn, ...t.aliases]) {
        const k = compactKey(name);
        const prev = keys.get(k);
        if (prev && prev !== t.slug) {
          issues.push({ file, message: `الاسم/المرادف «${name}» مكرر مع ${prev}` });
        }
        keys.set(k, t.slug);
      }
    }
  }

  const platformsDir = path.join(dataDir, "platforms");
  if (fs.existsSync(platformsDir)) {
    for (const f of fs.readdirSync(platformsDir).filter((x) => x.endsWith(".json"))) {
      const file = path.join(platformsDir, f);
      const r = platformSchema.safeParse(readJson(file));
      if (!r.success) issues.push(...zodIssues(file, r.error));
      else if (r.data.id !== path.basename(f, ".json")) {
        issues.push({ file, message: "id المنصة لازم يطابق اسم الملف" });
      }
    }
  }

  for (const [name, schema] of [
    ["questions.json", questionsFileSchema],
    ["agreement.json", agreementFileSchema],
  ] as const) {
    const file = path.join(dataDir, name);
    if (!fs.existsSync(file)) {
      issues.push({ file, message: "الملف مفقود" });
      continue;
    }
    const r = (schema as z.ZodType).safeParse(readJson(file));
    if (!r.success) issues.push(...zodIssues(file, r.error));
  }
  return issues;
}
