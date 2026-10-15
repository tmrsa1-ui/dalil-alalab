import { z } from "zod";
import { AGE_BANDS, CONTROL_KEYS, PLATFORM_IDS, POINT_KEYS } from "./keys";

export { AGE_BANDS, CONTROL_KEYS, PLATFORM_IDS, POINT_KEYS };

// بدون JIT: Zod 4 يجرّب `new Function` وهذا ينحجب بـCSP (script-src بدون unsafe-eval) ويطلع مخالفة في المتصفح.
z.config({ jitless: true });

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "التاريخ لازم يكون بصيغة YYYY-MM-DD");

export const httpsUrl = z.url({ protocol: /^https$/, message: "لازم رابط https كامل" });

export const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "الـslug حروف إنجليزية صغيرة وأرقام وشرطات فقط");

export const ageBand = z.enum(AGE_BANDS);
export type AgeBand = z.infer<typeof ageBand>;

export const platformId = z.enum(PLATFORM_IDS);
export type PlatformId = z.infer<typeof platformId>;

export const pointKey = z.enum(POINT_KEYS);
export type PointKey = z.infer<typeof pointKey>;

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
