import { z } from "zod";
import { controlKey, httpsUrl, isoDate, platformId } from "./common";
import { collectStrings, findForbiddenWord } from "../src/lib/forbidden-words";
import { isAllowedUrl, isDemoUrl } from "../src/lib/agent/allowlist";

export const platformStepSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    pointKey: controlKey,
    stepAr: z.string().min(1).max(220),
    sourceUrl: httpsUrl,
    verifiedAt: isoDate.nullable(),
    isDemo: z.boolean(),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (s.isDemo && !isDemoUrl(s.sourceUrl)) {
      ctx.addIssue({ code: "custom", message: "خطوة تجريبية لازم رابطها example.org", path: ["sourceUrl"] });
    }
    if (!s.isDemo && (!isAllowedUrl(s.sourceUrl) || !s.verifiedAt)) {
      ctx.addIssue({
        code: "custom",
        message: "خطوة مراجعة لازم رابط رسمي وتاريخ تحقق",
        path: ["sourceUrl"],
      });
    }
  });
export type PlatformStep = z.infer<typeof platformStepSchema>;

export const platformSchema = z
  .object({
    $schema: z.string().optional(),
    id: platformId,
    nameAr: z.string().min(1),
    nameEn: z.string().min(1),
    toolNameEn: z.string().min(1),
    officialGuideUrl: httpsUrl.nullable(),
    officialGuideTitle: z.string().nullable(),
    /** آخر مراجعة بشرية لمحتوى الدليل. null = لم يُراجع بشريًا بعد. */
    verifiedAt: isoDate.nullable(),
    /** آخر مرة تأكدنا آليًا إن الرابط يفتح (بدون قراءة محتواه). */
    linkCheckedAt: isoDate.nullable(),
    steps: z.array(platformStepSchema),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (p.officialGuideUrl && !isAllowedUrl(p.officialGuideUrl)) {
      ctx.addIssue({ code: "custom", message: "رابط الدليل مو من نطاق رسمي", path: ["officialGuideUrl"] });
    }
    for (const { path, text } of collectStrings(p)) {
      const bad = findForbiddenWord(text);
      if (bad) ctx.addIssue({ code: "custom", message: `كلمة ممنوعة «${bad}»`, path: [path] });
    }
  });
export type Platform = z.infer<typeof platformSchema>;
