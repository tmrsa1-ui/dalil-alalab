import { ratingGloss, translateList, translateTerm } from "@/lib/i18n/terms";
import { findForbiddenWord } from "@/lib/forbidden-words";
import { readFileSync, readdirSync } from "node:fs";

describe("ترجمة المصطلحات الرسمية", () => {
  it("يترجم المصطلح والتكرار، وما يخمّن مصطلح مجهول", () => {
    expect(translateTerm("Fantasy Violence")).toBe("عنف خيالي");
    expect(translateTerm("Infrequent: Guns or Other Weapons")).toBe("أسلحة (قليل)");
    expect(translateTerm("Something New")).toBeNull();
    expect(translateTerm("عنف متوسط")).toBeNull();
  });

  it("يقسم القوائم ويحافظ على الترتيب حتى مع فاصلة داخل المصطلح", () => {
    expect(
      translateList(
        "Frequent: Horror/Fear Themes, Infrequent: Alcohol, Tobacco, Drug Use or References, Infrequent: Contests",
      ),
    ).toEqual(["رعب وخوف (متكرر)", "كحول أو تبغ أو مخدرات (قليل)", "مسابقات (قليل)"]);
    expect(translateList("Fantasy Violence, Unknown Thing")).toBeNull();
  });

  it("كل مصطلح في البيانات الحقيقية له ترجمة، وما فيها كلمة ممنوعة", () => {
    const dir = "data/titles";
    const quotes = new Set<string>();
    for (const f of readdirSync(dir)) {
      const t = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
      for (const r of Object.values(t.ratings) as Array<{ descriptors?: string[] }>)
        for (const d of r.descriptors ?? []) quotes.add(d);
      for (const k of ["strangerChat", "purchases", "content", "ads"])
        for (const s of t.attentionPoints[k].sources) quotes.add(s.quote);
    }
    const missing = [...quotes].filter(
      (q) => !/[؀-ۿ]/.test(q) && !/[.!?]$/.test(q) && translateList(q) === null,
    );
    expect(missing).toEqual([]);
    for (const q of quotes) {
      for (const tr of translateList(q) ?? []) expect(findForbiddenWord(tr)).toBeNull();
    }
  });

  it("شرح قيمة التصنيف بالعربي بدون تحويل", () => {
    expect(ratingGloss("Everyone 10+")).toBe("للجميع من 10 سنوات فأكثر");
    expect(ratingGloss("12+")).toBe("من 12 سنة فأكثر");
    expect(ratingGloss("7")).toBe("من 7 سنوات فأكثر");
    expect(ratingGloss("الإرشاد الأبوي المستحسن")).toBeNull();
  });
});
