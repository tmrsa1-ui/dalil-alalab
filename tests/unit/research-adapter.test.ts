import { applyResearch, researchFileSchema, verbatimQuotes } from "@/lib/data/research-adapter";
import { emptyTitle } from "@/lib/data/template";
import { titleSchema } from "@schemas/title";

const meta = { status: "تجريبي", verified_on: "2026-10-10" };
const base = () => emptyTitle("minecraft", "ماين كرافت", "Minecraft");
const ESRB = "https://www.esrb.org/ratings/39862/minecraft/";

function run(entry: Record<string, unknown>, m: Record<string, unknown> = meta) {
  const file = researchFileSchema.parse({ _meta: m, titles: [{ id: "minecraft", ...entry }] });
  return applyResearch(base(), file.titles[0]!, file._meta);
}

describe("research adapter (import:verified لملف البحث)", () => {
  it("يقبل تصنيف من نطاق الجهة نفسها مع تاريخ التحقق، ويعلّمه «بحاجة مراجعة بشرية»", () => {
    const { title, decisions } = run({
      ratings: [
        {
          system: "App Store (السعودية)",
          value: "9+",
          url: "https://apps.apple.com/sa/app/id479516143",
        },
        { system: "ESRB", value: "Everyone 10+", url: ESRB },
      ],
    });
    expect(title.ratings.appStore).toMatchObject({
      value: "9+",
      verifiedAt: "2026-10-10",
      confidence: "auto",
    });
    expect(title.ratings.appStore.edition).toBeUndefined(); // «(السعودية)» منطقة متجر مو نسخة
    expect(title.ratings.esrb.value).toBe("Everyone 10+");
    expect(title.reviewStatus).toBe("auto_sourced");
    expect(title.isDemo).toBe(false);
    expect(decisions.every((d) => d.accepted)).toBe(true);
    expect(titleSchema.safeParse(title).success).toBe(true);
  });

  it("يرفض تصنيف من نطاق ثاني (حتى لو رسمي) أو بدون تاريخ تحقق", () => {
    const wrongDomain = run({ ratings: [{ system: "PEGI", value: "7", url: ESRB }] });
    expect(wrongDomain.title.ratings.pegi.value).toBeNull();
    const noDate = run({ ratings: [{ system: "ESRB", value: "E", url: ESRB }] }, { status: "x" });
    expect(noDate.title.ratings.esrb.value).toBeNull();
    expect(noDate.decisions[0]?.reason).toMatch(/تاريخ/);
    expect(noDate.title.reviewStatus).toBe("not_found");
  });

  it("يحفظ نسخة التصنيف من القوسين لـESRB", () => {
    const { title } = run({
      ratings: [{ system: "ESRB (Battle Royale)", value: "Teen", url: ESRB }],
    });
    expect(title.ratings.esrb.edition).toBe("Battle Royale");
  });

  it("نقطة انتباه تُقبل فقط مع اقتباس حرفي بين «» ورابط رسمي", () => {
    const { title } = run({
      watch: {
        chat: { text: "ESRB تذكر «Users Interact»: اللاعبون يتواصلون مع بعض.", url: ESRB },
        ads: { text: "فيها إعلانات كثيرة.", url: ESRB },
        purchases: { text: "«In-Game Purchases»", url: "https://random-blog.com/x" },
      },
    });
    expect(title.attentionPoints.strangerChat).toMatchObject({
      status: "present",
      confidence: "auto",
    });
    expect(title.attentionPoints.strangerChat.sources[0]).toMatchObject({
      url: ESRB,
      quote: "Users Interact",
    });
    expect(title.attentionPoints.ads.status).toBe("unknown");
    expect(title.attentionPoints.purchases.status).toBe("unknown");
  });

  it("واصفات ESRB تُستخرج من اقتباس نوع المحتوى لنفس صفحة التصنيف", () => {
    const { title } = run({
      ratings: [{ system: "ESRB", value: "Teen", url: ESRB }],
      watch: { content: { text: "ESRB: «Violence, Suggestive Themes, Lyrics» وصف.", url: ESRB } },
    });
    expect(title.ratings.esrb.descriptors).toEqual(["Violence", "Suggestive Themes", "Lyrics"]);
  });

  it("عدسة الأسرة بدون اقتباس حرفي ⇐ مرفوضة، والبنود تبقى «ما لقيت»", () => {
    const { title, decisions } = run({
      lens: { text: "اللبس والموسيقى: حسب وصف ESRB أعلاه.", url: ESRB },
    });
    expect(Object.values(title.familyLens).every((l) => l.status === "unknown")).toBe(true);
    expect(decisions.find((d) => d.field === "familyLens")?.accepted).toBe(false);
  });

  it("رابط رقابة أبوية مكتوب عليه إنه يحتاج تأكيد يدوي ⇐ مرفوض", () => {
    const { title } = run({
      controls: {
        url: "https://www.epicgames.com/x",
        label: "الرقابة (الرابط يحجب الفحص الآلي، يحتاج تأكيد يدوي)",
      },
    });
    expect(title.controls.officialGuide).toBeUndefined();
    const ok = run({
      controls: { url: "https://www.xbox.com/en-US/family-hub", label: "إعدادات العائلة في Xbox" },
    });
    expect(ok.title.controls.officialGuide).toMatchObject({
      confidence: "auto",
      verifiedAt: "2026-10-10",
    });
  });

  it("ما يكتب فوق قيمة موجودة", () => {
    const t = base();
    t.ratings.esrb = { value: "E", sourceUrl: ESRB, verifiedAt: "2026-01-01", confidence: "human" };
    const file = researchFileSchema.parse({
      _meta: meta,
      titles: [{ id: "minecraft", ratings: [{ system: "ESRB", value: "T", url: ESRB }] }],
    });
    const { title } = applyResearch(t, file.titles[0]!, file._meta);
    expect(title.ratings.esrb.value).toBe("E");
  });

  it("verbatimQuotes يلتقط النص اللاتيني بين «» فقط", () => {
    expect(verbatimQuotes("ESRB تذكر «Users Interact» و«عربي»")).toEqual(["Users Interact"]);
  });
});
