import { z } from "zod";
import { PLATFORM_IDS } from "../../../schemas/common";

/** مخرجات مرحلة identify. */
export const identitySchema = z
  .object({
    officialName: z.string().min(1),
    nameAr: z.string().nullable(),
    kind: z.enum(["game", "app"]),
    platforms: z.array(z.enum(PLATFORM_IDS)),
    publisherName: z.string().nullable(),
    publisherUrl: z.string().nullable(),
    /** روابط مقترحة — تُفلتر لاحقًا بالـallowlist. */
    candidateUrls: z.array(z.string()),
  })
  .strict();
export type Identity = z.infer<typeof identitySchema>;

const cited = { quote: z.string().nullable(), sourceUrl: z.string().nullable() };

export const extractedRatingSchema = z.object({ value: z.string().nullable(), ...cited }).strict();
export const extractedPointSchema = z
  .object({
    status: z.enum(["present", "absent", "configurable", "unknown"]),
    summaryAr: z.string(),
    ...cited,
  })
  .strict();
export const extractedLensSchema = z
  .object({ status: z.enum(["present", "absent", "unknown"]), noteAr: z.string(), ...cited })
  .strict();

/** مخرجات مرحلة extract: كل حقل يحمل اقتباس حرفي + رابط مصدره. */
export const extractedCardSchema = z
  .object({
    ratings: z
      .object({
        gcam: extractedRatingSchema,
        esrb: extractedRatingSchema,
        pegi: extractedRatingSchema,
        appStore: extractedRatingSchema,
        googlePlay: extractedRatingSchema,
      })
      .strict(),
    attentionPoints: z
      .object({
        strangerChat: extractedPointSchema,
        purchases: extractedPointSchema,
        content: extractedPointSchema,
        ads: extractedPointSchema,
        sessionPause: extractedPointSchema,
      })
      .strict(),
    familyLens: z
      .object({
        gambling: extractedLensSchema,
        mixedVoiceChat: extractedLensSchema,
        magic: extractedLensSchema,
        clothing: extractedLensSchema,
        music: extractedLensSchema,
      })
      .strict(),
    prayerPause: z
      .object({
        status: z.enum(["pausable", "not_pausable_in_match", "unknown"]),
        noteAr: z.string(),
        ...cited,
      })
      .strict(),
  })
  .strict();
export type ExtractedCard = z.infer<typeof extractedCardSchema>;

export type SourceDoc = { url: string; title: string; text: string; fetchedAt: string };

/** واجهة النموذج — تُحقن عشان الاختبارات تستخدم mock بدون أي API حقيقي. */
export interface AgentLlm {
  json<T>(args: { system: string; prompt: string; schema: z.ZodType<T>; maxTokens?: number }): Promise<T>;
}

/** المحقق المستقل: هل الاقتباس يدعم الادعاء؟ */
export type Judge = (claim: string, quote: string) => Promise<boolean>;
