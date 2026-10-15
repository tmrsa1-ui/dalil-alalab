import { z } from "zod";
import { ageBand, controlKey, platformId, slug } from "./common";

export const EVENT_TYPES = [
  "search",
  "card_viewed",
  "step_viewed",
  "control_step_done",
  "conversation_viewed",
  "agreement_completed",
  "agreement_printed",
  "title_requested",
  "feedback",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/**
 * حدث استخدام مجهول. لا IP، لا user agent، لا اسم، لا عمر دقيق (فقط الفئة العمرية).
 * strict: أي حقل إضافي يُرفض.
 */
export const eventSchema = z
  .object({
    type: z.enum(EVENT_TYPES),
    titleSlug: slug.optional(),
    ageBand: ageBand.optional(),
    platform: platformId.optional(),
    step: z.enum(["know", "setup", "talk", "agree"]).optional(),
    controlKey: controlKey.optional(),
    /** نتيجة البحث فقط (وُجد/لم يوجد) — لا نخزن نص البحث. */
    found: z.boolean().optional(),
    /** اسم العنوان المطلوب إضافته (title_requested فقط). */
    requestedName: z.string().trim().min(1).max(80).optional(),
    /** تقييم الأب (feedback فقط): اختيارات + نص اختياري من الأب فقط. */
    feedback: z
      .object({
        useful: z.enum(["yes", "somewhat", "no"]),
        talked: z.enum(["yes", "planned", "no"]),
        willUseAgain: z.enum(["yes", "maybe", "no"]),
        parentNote: z.string().trim().max(500).optional(),
      })
      .strict()
      .optional(),
    ts: z.number().int().positive(),
    sessionId: z.uuid(),
  })
  .strict()
  .superRefine((e, ctx) => {
    if (e.requestedName && e.type !== "title_requested") {
      ctx.addIssue({ code: "custom", message: "requestedName لـ title_requested فقط" });
    }
    if (e.feedback && e.type !== "feedback") {
      ctx.addIssue({ code: "custom", message: "feedback لنوع feedback فقط" });
    }
  });
export type AppEvent = z.infer<typeof eventSchema>;
