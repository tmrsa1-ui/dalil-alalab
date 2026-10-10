import { z } from "zod";
import { ageBand, pointKey } from "./common";
import { collectStrings, findForbiddenWord } from "../src/lib/forbidden-words";

export const conversationQuestionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    ageBand,
    pointKey: z.union([pointKey, z.literal("friends")]),
    textAr: z.string().min(5).max(160),
    whyAr: z.string().min(5).max(200),
    ifTheySayAr: z.string().min(5).max(260),
  })
  .strict();
export type ConversationQuestion = z.infer<typeof conversationQuestionSchema>;

export const questionsFileSchema = z
  .array(conversationQuestionSchema)
  .superRefine((qs, ctx) => {
    const ids = new Set<string>();
    qs.forEach((q, i) => {
      if (ids.has(q.id)) ctx.addIssue({ code: "custom", message: `id مكرر ${q.id}`, path: [i, "id"] });
      ids.add(q.id);
    });
    for (const band of ageBand.options) {
      for (const key of [...pointKey.options, "friends"] as const) {
        const n = qs.filter((q) => q.ageBand === band && q.pointKey === key).length;
        if (n < 6) {
          ctx.addIssue({ code: "custom", message: `أقل من 6 أسئلة لـ ${band} × ${key} (${n})` });
        }
      }
    }
    for (const { path, text } of collectStrings(qs)) {
      const bad = findForbiddenWord(text);
      if (bad) ctx.addIssue({ code: "custom", message: `كلمة ممنوعة «${bad}» في ${path}` });
    }
  });
