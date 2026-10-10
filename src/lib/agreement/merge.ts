import type {
  AgreementFile,
  AgreementQuestion,
  AgreementQuestionId,
} from "../../../schemas/agreement";

export type MergeKind = "agreed" | "midpoint" | "parent_only";

export type Clause = {
  questionId: AgreementQuestionId;
  kind: MergeKind;
  /** خيار يقابل البند (للتعديل لاحقًا)؛ null لو البند من قاعدة وسط مخصصة. */
  optionId: string | null;
  clauseAr: string;
};

/**
 * يحسب البند لسؤال واحد بقواعد deterministic:
 * - تطابق ⇒ البند نفسه.
 * - اختلاف ⇒ قاعدة وسط مخصصة إن وُجدت (بأي ترتيب)، وإلا الخيار اللي rank حقه
 *   = floor(متوسط الرتبتين) — يعني عند التساوي نميل للأكثر تقييدًا.
 * - بدون اختيار الطفل (أقل من 7) ⇒ اختيار الأب.
 */
export function mergeQuestion(
  question: AgreementQuestion,
  rules: AgreementFile["midpointRules"],
  parentOptionId: string,
  childOptionId: string | null,
): Clause {
  const parent = question.options.find((o) => o.id === parentOptionId);
  if (!parent) throw new Error(`خيار غير معروف: ${parentOptionId}`);
  if (childOptionId === null) {
    return { questionId: question.id, kind: "parent_only", optionId: parent.id, clauseAr: parent.clauseAr };
  }
  const child = question.options.find((o) => o.id === childOptionId);
  if (!child) throw new Error(`خيار غير معروف: ${childOptionId}`);
  if (child.id === parent.id) {
    return { questionId: question.id, kind: "agreed", optionId: parent.id, clauseAr: parent.clauseAr };
  }
  const rule = rules.find(
    (r) =>
      r.questionId === question.id &&
      ((r.between[0] === parent.id && r.between[1] === child.id) ||
        (r.between[0] === child.id && r.between[1] === parent.id)),
  );
  if (rule) {
    return { questionId: question.id, kind: "midpoint", optionId: null, clauseAr: rule.clauseAr };
  }
  const target = Math.floor((parent.rank + child.rank) / 2);
  const sorted = [...question.options].sort((a, b) => a.rank - b.rank);
  // أقرب خيار رتبته ≤ الهدف (الأكثر تقييدًا عند عدم وجود رتبة مطابقة).
  const mid =
    [...sorted].reverse().find((o) => o.rank <= target) ?? sorted[0] ?? parent;
  return { questionId: question.id, kind: "midpoint", optionId: mid.id, clauseAr: mid.clauseAr };
}

export function mergeAll(
  file: AgreementFile,
  parentAnswers: Record<string, string>,
  childAnswers: Record<string, string> | null,
): Clause[] {
  return file.questions.map((q) => {
    const p = parentAnswers[q.id];
    if (!p) throw new Error(`ناقص اختيار الأب لـ ${q.id}`);
    return mergeQuestion(q, file.midpointRules, p, childAnswers ? (childAnswers[q.id] ?? null) : null);
  });
}

export function reviewDate(from: Date, days = 14): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}
