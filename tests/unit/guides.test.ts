import { readFileSync, readdirSync } from "node:fs";
import { normalizeQuote, quoteInText, htmlToText } from "@/lib/data/guide-text";
import { platformSchema } from "@schemas/platform";

const snap = JSON.parse(readFileSync("research/guides_snapshot.json", "utf8")) as Record<
  string,
  { fetchedAt: string; status: number; text: string }
>;

describe("خطوات الأجهزة من الأدلة الرسمية", () => {
  it("التطبيع يوحّد التنصيص والحركات والمسافات بس", () => {
    expect(normalizeQuote("“مرِّر”  لأسفل")).toBe(normalizeQuote('"مرِّر" لأسفل'));
    expect(quoteInText("the time’s up", "when the time's up.")).toBe(true);
    expect(quoteInText("time is up", "when the time's up.")).toBe(false);
    expect(htmlToText("<p>A&amp;B</p><script>x</script><li>C</li>")).toBe("A&B\nC");
  });

  it("كل خطوة غير تجريبية: اقتباسها موجود حرفيًا في نص صفحتها المحفوظ، وتاريخها تاريخ الجلب", () => {
    let checked = 0;
    for (const f of readdirSync("data/platforms")) {
      const p = platformSchema.parse(JSON.parse(readFileSync(`data/platforms/${f}`, "utf8")));
      for (const s of p.steps.filter((x) => !x.isDemo)) {
        const page = snap[s.sourceUrl];
        expect(page, s.id).toBeDefined();
        expect(s.quote, s.id).toBeTruthy();
        expect(quoteInText(s.quote!, page!.text), s.id).toBe(true);
        expect(s.verifiedAt).toBe(page!.fetchedAt);
        expect(s.confidence).toBe("auto");
        checked++;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(20);
  });
});
