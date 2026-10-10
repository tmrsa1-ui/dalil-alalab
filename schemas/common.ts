import { z } from "zod";

// بدون JIT: Zod 4 يجرّب `new Function` وهذا ينحجب بـCSP (script-src بدون unsafe-eval) ويطلع مخالفة في المتصفح.
z.config({ jitless: true });

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "التاريخ لازم يكون بصيغة YYYY-MM-DD");

export const httpsUrl = z.url({ protocol: /^https$/, message: "لازم رابط https كامل" });

export const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "الـslug حروف إنجليزية صغيرة وأرقام وشرطات فقط");

export const AGE_BANDS = ["under7", "7to12", "13plus"] as const;
export const ageBand = z.enum(AGE_BANDS);
export type AgeBand = z.infer<typeof ageBand>;

export const PLATFORM_IDS = ["ios", "android", "playstation", "xbox", "switch", "pc"] as const;
export const platformId = z.enum(PLATFORM_IDS);
export type PlatformId = z.infer<typeof platformId>;

/** النقاط الخمس الثابتة — بنفس الترتيب في كل بطاقة. */
export const POINT_KEYS = ["strangerChat", "purchases", "content", "ads", "sessionPause"] as const;
export const pointKey = z.enum(POINT_KEYS);
export type PointKey = z.infer<typeof pointKey>;

/** مفاتيح خطوات الضبط: النقاط الخمس + تصفية البحث ووضع الطفل في المتجر والمتصفح. */
export const CONTROL_KEYS = [...POINT_KEYS, "searchAndStore"] as const;
export const controlKey = z.enum(CONTROL_KEYS);
export type ControlKey = z.infer<typeof controlKey>;

export const sourceSchema = z
  .object({
    url: httpsUrl,
    title: z.string().min(1),
    quote: z.string().min(1, "كل مصدر لازم يحمل اقتباس حرفي"),
    verifiedAt: isoDate,
  })
  .strict();
export type Source = z.infer<typeof sourceSchema>;
