import minecraft from "@data/demo/titles/minecraft.json";
import { compareCards, summarize } from "@/lib/agent/eval";
import { emptyTitle } from "@/lib/data/template";
import type { Title } from "@schemas/title";

describe("eval-agent metrics", () => {
  it("بطاقة فاضية مقابل مرجع", () => {
    const ref = minecraft as unknown as Title;
    const row = compareCards(ref, emptyTitle("minecraft", "ماين كرافت", "Minecraft"));
    expect(row.ratingsCorrect).toBe(3); // gcam, appStore, googlePlay = null في الطرفين
    expect(row.pointsCorrect).toBe(0);
    expect(row.notFound).toBe(10);
    const s = summarize([row]);
    expect(s.ratingAccuracy).toBe("60%");
    expect(s.sourceValidity).toBe("—");
  });
});
