import file from "@data/agreement.json";
import { agreementFileSchema } from "@schemas/agreement";
import { createAgreementStore, SUGGESTED } from "@/lib/agreement/store";

const a = agreementFileSchema.parse(file);
const parent = { when: "when-1h", talk: "talk-none", purchases: "buy-ask" };
const child = { when: "when-3h", talk: "talk-known", purchases: "buy-ask" };

function runFlow(band: "7to12" | "13plus") {
  const s = createAgreementStore(a, band);
  for (const [k, v] of Object.entries(parent)) s.getState().setParent(k, v);
  s.getState().finishParent();
  expect(s.getState().stage).toBe("handoffChild");
  s.getState().childReady();
  for (const [k, v] of Object.entries(child)) {
    s.getState().setChild(k, v);
    s.getState().childNext();
  }
  return s;
}

describe("agreement store", () => {
  it("اختيارات الطفل الخام تُمسح بمجرد توليد البنود", () => {
    const s = runFlow("7to12");
    const st = s.getState();
    expect(st.stage).toBe("handoffParent");
    expect(st.clauses).toHaveLength(3);
    expect(st.childAnswers).toEqual({});
    expect(st.teenPicks).toEqual([]);
    // لا يوجد أي حقل في الحالة يحمل خريطة اختيارات الطفل.
    const json = JSON.stringify({ ...st, clauses: [], suggested: [] });
    expect(json).not.toContain("when-3h");
    expect(json).not.toContain("talk-known\"");
  });
  it("13+: شاشة «أقترح بند» ثم تُمسح الاختيارات الخام وتبقى المقترحات كبنود", () => {
    const s = runFlow("13plus");
    expect(s.getState().stage).toBe("teen");
    s.getState().toggleTeen("choose-time");
    s.getState().finishChild();
    const st = s.getState();
    expect(st.stage).toBe("handoffParent");
    expect(st.teenPicks).toEqual([]);
    expect(st.teenProposals).toEqual(["choose-time"]);
  });
  it("أقل من 7 والأب وحده: بدون تسليم الجوال", () => {
    const s = createAgreementStore(a, "under7");
    expect(s.getState().stage).toBe("mode");
    s.getState().chooseMode(false);
    for (const [k, v] of Object.entries(parent)) s.getState().setParent(k, v);
    s.getState().finishParent();
    expect(s.getState().stage).toBe("result");
    expect(s.getState().clauses.every((c) => c.kind === "parent_only")).toBe(true);
  });
  it("الأب يعدّل البند ويرجع للبند الوسط", () => {
    const s = runFlow("7to12");
    s.getState().parentReady();
    const before = s.getState().clauses.find((c) => c.questionId === "when")!;
    expect(before.optionId).toBeNull(); // قاعدة وسط مخصصة
    s.getState().editClause("when", "when-30m");
    expect(s.getState().clauses.find((c) => c.questionId === "when")!.optionId).toBe("when-30m");
    s.getState().editClause("when", SUGGESTED);
    expect(s.getState().clauses.find((c) => c.questionId === "when")).toEqual(before);
  });
  it("ما ينتقل من أسئلة الأب بدون إجابات كاملة", () => {
    const s = createAgreementStore(a, "7to12");
    s.getState().setParent("when", "when-1h");
    s.getState().finishParent();
    expect(s.getState().stage).toBe("parent");
  });
});
