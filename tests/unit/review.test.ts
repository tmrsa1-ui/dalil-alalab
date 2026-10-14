import { readFileSync } from "node:fs";
import { titleSchema, type Title } from "@schemas/title";
import { allAvailableHuman, applyDecision, listPending } from "@/lib/data/review";

const load = (slug: string) =>
  titleSchema.parse(JSON.parse(readFileSync(`data/titles/${slug}.json`, "utf8"))) as Title;

describe("المراجعة البشرية (review:data)", () => {
  it("يسرد كل القيم الآلية المتوفرة فقط", () => {
    const t = load("among-us");
    const items = listPending(t);
    expect(items.map((i) => i.label)).toContain("ratings.gcam");
    expect(items.map((i) => i.label)).not.toContain("ratings.googlePlay.unavailable");
    expect(
      items.every((i) => i.sources.length > 0 && i.sources[0]!.url.startsWith("https://")),
    ).toBe(true);
  });

  it("«صح» ⇐ راجعها إنسان + human_reviewed + تاريخ، والبطاقة تمر على الـschema", () => {
    const t = load("among-us");
    const item = listPending(t).find((i) => i.label === "ratings.gcam")!;
    const next = applyDecision(t, item, "correct", "2026-10-14");
    expect(next.ratings.gcam.confidence).toBe("human");
    expect(next.ratings.gcam.verifiedAt).toBe("2026-10-14");
    expect(next.reviewStatus).toBe("human_reviewed");
    expect(next.lastReviewedAt).toBe("2026-10-14");
    expect(titleSchema.safeParse(next).success).toBe(true);
    expect(t.ratings.gcam.confidence).toBe("auto"); // الأصل ما يتغير
    expect(allAvailableHuman(next)).toBe(false);
  });

  it("«غلط» ⇐ القيمة تُمسح وتصير غير متوفر/ما لقيت (ما نصحح من عندنا)", () => {
    const t = load("among-us");
    const rating = listPending(t).find((i) => i.label === "ratings.esrb")!;
    const point = listPending(t).find((i) => i.label === "attentionPoints.purchases")!;
    let next = applyDecision(t, rating, "wrong", "2026-10-14");
    next = applyDecision(next, point, "wrong", "2026-10-14");
    expect(next.ratings.esrb).toEqual({ value: null, sourceUrl: null, verifiedAt: null });
    expect(next.attentionPoints.purchases.status).toBe("unknown");
    expect(next.attentionPoints.purchases.sources).toEqual([]);
    expect(next.reviewStatus).toBe("auto_sourced");
    expect(titleSchema.safeParse(next).success).toBe(true);
  });

  it("كل القيم المتوفرة human ⇐ allAvailableHuman", () => {
    let t = load("subway-surfers");
    for (const item of listPending(t)) t = applyDecision(t, item, "correct", "2026-10-14");
    expect(listPending(t)).toEqual([]);
    expect(allAvailableHuman(t)).toBe(true);
    expect(titleSchema.safeParse(t).success).toBe(true);
  });
});
