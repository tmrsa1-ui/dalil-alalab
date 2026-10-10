import bank from "@data/questions.json";
import minecraft from "@data/titles/minecraft.json";
import tiktok from "@data/titles/tiktok.json";
import nodata from "@data/titles/no-data-demo.json";
import { rankPoints, selectQuestions } from "@/lib/questions/select";
import type { ConversationQuestion } from "@schemas/questions";
import type { Title } from "@schemas/title";
import { AGE_BANDS } from "@schemas/common";

const qs = bank as ConversationQuestion[];

describe("selectQuestions", () => {
  for (const t of [minecraft, tiktok, nodata] as unknown as Title[]) {
    for (const band of AGE_BANDS) {
      it(`${t.slug} × ${band}: 3 أسئلة بالضبط وواحد عن الأصحاب`, () => {
        const r = selectQuestions(qs, { slug: t.slug, ageBand: band, points: rankPoints(t) });
        expect(r).toHaveLength(3);
        expect(r.filter((q) => q.pointKey === "friends")).toHaveLength(1);
        expect(r.every((q) => q.ageBand === band)).toBe(true);
        expect(new Set(r.map((q) => q.id)).size).toBe(3);
      });
    }
  }
  it("deterministic: نفس المدخلات = نفس النتيجة", () => {
    const t = minecraft as unknown as Title;
    const a = selectQuestions(qs, { slug: t.slug, ageBand: "7to12", points: rankPoints(t) });
    const b = selectQuestions(qs, { slug: t.slug, ageBand: "7to12", points: rankPoints(t) });
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
  });
  it("يختلف حسب الفئة العمرية", () => {
    const t = minecraft as unknown as Title;
    const a = selectQuestions(qs, { slug: t.slug, ageBand: "under7", points: rankPoints(t) });
    const b = selectQuestions(qs, { slug: t.slug, ageBand: "13plus", points: rankPoints(t) });
    expect(a.map((q) => q.id)).not.toEqual(b.map((q) => q.id));
  });
  it("الأسئلة مرتبطة بأعلى نقاط الانتباه", () => {
    const t = minecraft as unknown as Title; // conversationTags: strangerChat, purchases
    const r = selectQuestions(qs, { slug: t.slug, ageBand: "7to12", points: rankPoints(t) });
    expect(r.map((q) => q.pointKey)).toEqual(["friends", "strangerChat", "purchases"]);
  });
  it("«أسئلة غيرها» يغيّر الاختيار", () => {
    const t = minecraft as unknown as Title;
    const ids = new Set(
      [0, 1, 2, 3].map((v) =>
        selectQuestions(qs, { slug: t.slug, ageBand: "7to12", points: rankPoints(t), variant: v })
          .map((q) => q.id)
          .join(),
      ),
    );
    expect(ids.size).toBeGreaterThan(1);
  });
  it("rankPoints بدون وسوم يرتب حسب الحالة", () => {
    const t = { ...(tiktok as unknown as Title), conversationTags: [] };
    expect(rankPoints(t)[0]).toBe("purchases"); // أول نقطة present بالترتيب الثابت
  });
});
