import { z } from "zod";
import {
  httpsUrl,
  isoDate,
  slug,
  platformId,
  sourceSchema,
  controlKey,
  PLATFORM_IDS,
} from "./common";
import { collectStrings, findForbiddenWord } from "../src/lib/forbidden-words";
import { isAllowedUrl, isDemoUrl } from "../src/lib/agent/allowlist";

export const RATING_KEYS = ["gcam", "esrb", "pegi", "appStore", "googlePlay"] as const;
export type RatingKey = (typeof RATING_KEYS)[number];

export const ratingSchema = z
  .object({
    value: z.string().min(1).nullable(),
    descriptors: z.array(z.string().min(1)).optional(),
    sourceUrl: httpsUrl.nullable(),
    verifiedAt: isoDate.nullable(),
    /** اقتباس حرفي من صفحة الجهة المصنفة (إلزامي لبطاقات الوكيل). */
    quote: z.string().min(1).optional(),
    /** النسخة اللي يخصها التصنيف لو تختلف (مثل «Battle Royale»). */
    edition: z.string().min(1).optional(),
    /** وين يظهر هذا التصنيف لو المصدر مو موقع الجهة نفسها (مثل تصنيف Gmedia كما يعرضه Google Play في السعودية). */
    shownOn: z.string().min(1).optional(),
    /** human = راجعها إنسان، auto = قُرئت آليًا وبحاجة مراجعة بشرية. */
    confidence: z.enum(["human", "auto"]).optional(),
  })
  .strict()
  .superRefine((r, ctx) => {
    if (r.value !== null) {
      if (!r.sourceUrl)
        ctx.addIssue({ code: "custom", message: "تصنيف بدون sourceUrl", path: ["sourceUrl"] });
      if (!r.verifiedAt)
        ctx.addIssue({ code: "custom", message: "تصنيف بدون verifiedAt", path: ["verifiedAt"] });
    }
  });
export type Rating = z.infer<typeof ratingSchema>;

export const confidence = z.enum(["human", "auto", "none"]);
export type Confidence = z.infer<typeof confidence>;

const pointBase = z.object({
  status: z.enum(["present", "absent", "configurable", "unknown"]),
  summaryAr: z.string().max(220, "النص طويل: سطرين كحد أقصى"),
  sources: z.array(sourceSchema),
  confidence,
});

function pointRules(
  p: { status: string; sources: unknown[]; confidence: string; summaryAr: string },
  ctx: z.RefinementCtx,
) {
  if (p.status !== "unknown" && p.sources.length < 1) {
    ctx.addIssue({ code: "custom", message: "نقطة لها حالة بدون أي مصدر", path: ["sources"] });
  }
  if (p.status !== "unknown" && p.confidence === "none") {
    ctx.addIssue({ code: "custom", message: "نقطة معروفة بثقة none", path: ["confidence"] });
  }
  if (p.status === "unknown" && p.confidence !== "none") {
    ctx.addIssue({ code: "custom", message: "نقطة unknown لازم ثقتها none", path: ["confidence"] });
  }
  if (p.status !== "unknown" && p.summaryAr.trim().length === 0) {
    ctx.addIssue({ code: "custom", message: "نقطة معروفة بدون نص", path: ["summaryAr"] });
  }
}

export const attentionPointSchema = pointBase.strict().superRefine(pointRules);
export const sessionPausePointSchema = pointBase
  .extend({
    hasRecommendationFeed: z.boolean().nullable(),
    autoplay: z.boolean().nullable(),
  })
  .strict()
  .superRefine(pointRules);
export type AttentionPoint = z.infer<typeof attentionPointSchema>;

export const FAMILY_LENS_KEYS = [
  "gambling",
  "mixedVoiceChat",
  "magic",
  "clothing",
  "music",
] as const;
export type FamilyLensKey = (typeof FAMILY_LENS_KEYS)[number];

export const familyLensItemSchema = z
  .object({
    status: z.enum(["present", "absent", "unknown"]),
    noteAr: z.string().max(220),
    sources: z.array(sourceSchema),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (p.status !== "unknown" && p.sources.length < 1) {
      ctx.addIssue({ code: "custom", message: "بند في عدسة الأسرة بدون مصدر", path: ["sources"] });
    }
  });
export type FamilyLensItem = z.infer<typeof familyLensItemSchema>;

export const prayerPauseSchema = z
  .object({
    status: z.enum(["pausable", "not_pausable_in_match", "unknown"]),
    noteAr: z.string().max(220),
    sources: z.array(sourceSchema),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (p.status !== "unknown" && p.sources.length < 1) {
      ctx.addIssue({ code: "custom", message: "«تتوقف وقت الصلاة؟» بدون مصدر", path: ["sources"] });
    }
  });

export const controlStepSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    pointKey: controlKey,
    stepAr: z.string().min(1).max(220),
    sourceUrl: httpsUrl,
    verifiedAt: isoDate,
  })
  .strict();
export type TitleControlStep = z.infer<typeof controlStepSchema>;

const platformOverrides = z
  .object(
    Object.fromEntries(
      PLATFORM_IDS.map((p) => [p, z.array(controlStepSchema).optional()]),
    ) as Record<(typeof PLATFORM_IDS)[number], z.ZodOptional<z.ZodArray<typeof controlStepSchema>>>,
  )
  .strict();

export const titleSchema = z
  .object({
    $schema: z.string().optional(),
    slug,
    nameAr: z.string().min(1),
    nameEn: z.string().min(1),
    aliases: z.array(z.string().min(1)),
    kind: z.enum(["game", "app"]).default("game"),
    platforms: z.array(platformId),
    publisher: z
      .object({ name: z.string().min(1), url: httpsUrl.nullable() })
      .strict()
      .nullable(),
    isDemo: z.boolean(),
    reviewStatus: z.enum(["human_reviewed", "auto_sourced", "not_found"]),
    lastReviewedAt: isoDate.nullable(),
    ratings: z
      .object({
        gcam: ratingSchema,
        esrb: ratingSchema,
        pegi: ratingSchema,
        appStore: ratingSchema,
        googlePlay: ratingSchema,
      })
      .strict(),
    attentionPoints: z
      .object({
        strangerChat: attentionPointSchema,
        purchases: attentionPointSchema,
        content: attentionPointSchema,
        ads: attentionPointSchema,
        sessionPause: sessionPausePointSchema,
      })
      .strict(),
    familyLens: z
      .object({
        gambling: familyLensItemSchema,
        mixedVoiceChat: familyLensItemSchema,
        magic: familyLensItemSchema,
        clothing: familyLensItemSchema,
        music: familyLensItemSchema,
      })
      .strict(),
    prayerPause: prayerPauseSchema,
    controls: z
      .object({
        inGame: z.array(controlStepSchema),
        platformOverrides,
        /** رابط صفحة الرقابة الأبوية الرسمية من الناشر (رابط فقط، بدون خطوات مكتوبة). */
        officialGuide: z
          .object({
            url: httpsUrl,
            labelAr: z.string().min(1).max(160),
            verifiedAt: isoDate,
            confidence: z.enum(["human", "auto"]),
          })
          .strict()
          .optional(),
      })
      .strict(),
    conversationTags: z.array(
      z.enum(["strangerChat", "purchases", "content", "ads", "sessionPause"]),
    ),
  })
  .strict()
  .superRefine((t, ctx) => {
    // ثقة «راجعها إنسان» تتطلب مراجعة بشرية للعنوان كله.
    const points = Object.values(t.attentionPoints);
    const anyHuman =
      points.some((p) => p.confidence === "human") ||
      Object.values(t.ratings).some((r) => r.confidence === "human") ||
      t.controls.officialGuide?.confidence === "human";
    if (anyHuman && t.reviewStatus !== "human_reviewed") {
      ctx.addIssue({
        code: "custom",
        message: "confidence: human يتطلب reviewStatus: human_reviewed",
        path: ["reviewStatus"],
      });
    }
    if (t.reviewStatus === "human_reviewed" && !t.lastReviewedAt) {
      ctx.addIssue({
        code: "custom",
        message: "عنوان مراجع بدون lastReviewedAt",
        path: ["lastReviewedAt"],
      });
    }

    // سياسة الروابط.
    for (const { path, text } of collectStrings(t)) {
      if (!/^https?:\/\//.test(text) || path === "$.$schema") continue;
      if (t.isDemo && !isDemoUrl(text)) {
        ctx.addIssue({
          code: "custom",
          message: `عنوان تجريبي لازم روابطه على example.org: ${text}`,
          path: [path],
        });
      }
      if (!t.isDemo && (isDemoUrl(text) || !isAllowedUrl(text, t.publisher?.url))) {
        ctx.addIssue({
          code: "custom",
          message: `رابط خارج الـallowlist ونطاق الناشر: ${text}`,
          path: [path],
        });
      }
    }

    // الكلمات الممنوعة.
    for (const { path, text } of collectStrings(t)) {
      const bad = findForbiddenWord(text);
      if (bad) ctx.addIssue({ code: "custom", message: `كلمة ممنوعة «${bad}»`, path: [path] });
    }
  });

export type Title = z.infer<typeof titleSchema>;

export const titleIndexEntrySchema = z
  .object({
    slug,
    nameAr: z.string(),
    nameEn: z.string(),
    aliases: z.array(z.string()),
    isDemo: z.boolean(),
    reviewStatus: z.enum(["human_reviewed", "auto_sourced", "not_found"]),
  })
  .strict();
export type TitleIndexEntry = z.infer<typeof titleIndexEntrySchema>;
export const titleIndexSchema = z.array(titleIndexEntrySchema);
