import file from "@data/agreement.json";
import { mergeAll, mergeQuestion, reviewDate } from "@/lib/agreement/merge";
import { agreementFileSchema } from "@schemas/agreement";

const a = agreementFileSchema.parse(file);
const q = (id: string) => a.questions.find((x) => x.id === id)!;

describe("merge (البند الوسط)", () => {
  it("تطابق ⇐ البند نفسه", () => {
    const c = mergeQuestion(q("when"), a.midpointRules, "when-1h", "when-1h");
    expect(c.kind).toBe("agreed");
    expect(c.optionId).toBe("when-1h");
  });
  it("مثال المواصفات: ساعة × ثلاث ساعات ⇐ ساعتين في الويكند وساعة أيام الدراسة", () => {
    const c = mergeQuestion(q("when"), a.midpointRules, "when-1h", "when-3h");
    expect(c.kind).toBe("midpoint");
    expect(c.clauseAr).toContain("ساعتين في الويكند");
    expect(c.clauseAr).toContain("ساعة في أيام الدراسة");
  });
  it("القاعدة متماثلة (ترتيب الأب/الطفل ما يفرق)", () => {
    const x = mergeQuestion(q("when"), a.midpointRules, "when-3h", "when-1h");
    const y = mergeQuestion(q("when"), a.midpointRules, "when-1h", "when-3h");
    expect(x).toEqual(y);
  });
  it("كل أزواج rank لكل سؤال تعطي بند صالح بين الطرفين (أو قاعدة مخصصة)", () => {
    for (const question of a.questions) {
      for (const p of question.options) {
        for (const ch of question.options) {
          const c = mergeQuestion(question, a.midpointRules, p.id, ch.id);
          expect(c.clauseAr.length).toBeGreaterThan(0);
          if (p.id === ch.id) expect(c.kind).toBe("agreed");
          else expect(c.kind).toBe("midpoint");
          if (c.optionId) {
            const r = question.options.find((o) => o.id === c.optionId)!.rank;
            expect(r).toBeGreaterThanOrEqual(Math.min(p.rank, ch.rank));
            expect(r).toBeLessThanOrEqual(Math.max(p.rank, ch.rank));
            expect(r).toBe(Math.floor((p.rank + ch.rank) / 2));
          }
        }
      }
    }
  });
  it("بدون قاعدة مخصصة: floor المتوسط (يميل للأكثر تقييدًا)", () => {
    // when-30m(1) × when-2h(4) ⇐ floor(2.5)=2 ⇐ when-1h
    const c = mergeQuestion(q("when"), a.midpointRules, "when-30m", "when-2h");
    expect(c.optionId).toBe("when-1h");
    // talk-none(1) × talk-all-approved(4) ⇐ 2
    expect(mergeQuestion(q("talk"), a.midpointRules, "talk-all-approved", "talk-none").optionId).toBe(
      "talk-known-text",
    );
    // buy-none(1) × buy-allowance(3) ⇐ 2
    expect(mergeQuestion(q("purchases"), a.midpointRules, "buy-none", "buy-allowance").optionId).toBe("buy-ask");
  });
  it("أقل من 7 ⇐ قرار الأب", () => {
    const all = mergeAll(a, { when: "when-30m", talk: "talk-none", purchases: "buy-none" }, null);
    expect(all.every((c) => c.kind === "parent_only")).toBe(true);
  });
  it("خيار غير معروف يرمي خطأ", () => {
    expect(() => mergeQuestion(q("when"), a.midpointRules, "x", "when-1h")).toThrow();
  });
  it("تاريخ المراجعة = اليوم + 14 يوم", () => {
    const d = reviewDate(new Date(2026, 9, 10));
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(24);
  });
});
