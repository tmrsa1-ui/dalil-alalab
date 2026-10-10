import { z } from "zod";
import { collectStrings, findForbiddenWord } from "../src/lib/forbidden-words";

export const AGREEMENT_QUESTION_IDS = ["when", "talk", "purchases"] as const;
export type AgreementQuestionId = (typeof AGREEMENT_QUESTION_IDS)[number];

export const agreementOptionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    labelAr: z.string().min(1),
    /** صياغة أبسط تظهر للطفل. */
    childLabelAr: z.string().min(1),
    /** صياغة البند النهائي في الاتفاق. */
    clauseAr: z.string().min(1),
    icon: z.string().min(1),
    /** 1 = الأكثر تقييدًا. يُستخدم لحساب البند الوسط. */
    rank: z.number().int().min(1),
  })
  .strict();
export type AgreementOption = z.infer<typeof agreementOptionSchema>;

export const agreementQuestionSchema = z
  .object({
    id: z.enum(AGREEMENT_QUESTION_IDS),
    textParentAr: z.string().min(1),
    textChildAr: z.string().min(1),
    options: z.array(agreementOptionSchema).min(2),
  })
  .strict()
  .superRefine((q, ctx) => {
    const ranks = q.options.map((o) => o.rank);
    if (new Set(ranks).size !== ranks.length) {
      ctx.addIssue({ code: "custom", message: `ranks مكررة في ${q.id}` });
    }
  });
export type AgreementQuestion = z.infer<typeof agreementQuestionSchema>;

export const midpointRuleSchema = z
  .object({
    questionId: z.enum(AGREEMENT_QUESTION_IDS),
    between: z.tuple([z.string(), z.string()]),
    clauseAr: z.string().min(1),
  })
  .strict();
export type MidpointRule = z.infer<typeof midpointRuleSchema>;

const listItem = z.object({ id: z.string().regex(/^[a-z0-9-]+$/), labelAr: z.string().min(1), icon: z.string().optional() }).strict();

export const agreementFileSchema = z
  .object({
    $schema: z.string().optional(),
    questions: z.array(agreementQuestionSchema).length(3),
    midpointRules: z.array(midpointRuleSchema),
    parentCommitments: z.array(listItem).min(3),
    teenSuggestions: z.array(listItem).min(3),
  })
  .strict()
  .superRefine((a, ctx) => {
    for (const r of a.midpointRules) {
      const q = a.questions.find((x) => x.id === r.questionId);
      const ids = new Set(q?.options.map((o) => o.id));
      if (!ids.has(r.between[0]) || !ids.has(r.between[1])) {
        ctx.addIssue({ code: "custom", message: `قاعدة وسط تشير لخيار غير موجود: ${r.between.join("|")}` });
      }
    }
    for (const { path, text } of collectStrings(a)) {
      const bad = findForbiddenWord(text);
      if (bad) ctx.addIssue({ code: "custom", message: `كلمة ممنوعة «${bad}» في ${path}` });
    }
  });
export type AgreementFile = z.infer<typeof agreementFileSchema>;
