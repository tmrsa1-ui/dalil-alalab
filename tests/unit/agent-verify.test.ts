import fs from "node:fs";
import path from "node:path";
import { quoteInSource, valueInQuote, verifyCard } from "@/lib/agent/verify";
import { generateCard, slugify } from "@/lib/agent/pipeline";
import { htmlToText, fetchSources } from "@/lib/agent/fetch";
import { isAllowedUrl } from "@/lib/agent/allowlist";
import type { AgentLlm, ExtractedCard, Identity, SourceDoc } from "@/lib/agent/types";

const fx = (n: string) => fs.readFileSync(path.join(process.cwd(), "tests/fixtures/agent", n), "utf8");
const ESRB_URL = "https://www.esrb.org/ratings/minecraft/";
const PUB_URL = "https://www.minecraft.net/en-us/help";
const docs: SourceDoc[] = [
  { url: ESRB_URL, title: "ESRB: Minecraft", text: fx("esrb.txt"), fetchedAt: "2026-10-10" },
  { url: PUB_URL, title: "Minecraft Help", text: fx("publisher.txt"), fetchedAt: "2026-10-10" },
];
const identity: Identity = {
  officialName: "Minecraft",
  nameAr: "ماين كرافت",
  kind: "game",
  platforms: ["pc"],
  publisherName: "Mojang",
  publisherUrl: "https://www.minecraft.net/",
  candidateUrls: [],
};

const nul = { value: null, quote: null, sourceUrl: null };
const unk = { status: "unknown" as const, summaryAr: "", quote: null, sourceUrl: null };
const lunk = { status: "unknown" as const, noteAr: "", quote: null, sourceUrl: null };
function card(over: Partial<ExtractedCard> = {}): ExtractedCard {
  return {
    ratings: { gcam: nul, esrb: nul, pegi: nul, appStore: nul, googlePlay: nul },
    attentionPoints: { strangerChat: unk, purchases: unk, content: unk, ads: unk, sessionPause: unk },
    familyLens: { gambling: lunk, mixedVoiceChat: lunk, magic: lunk, clothing: lunk, music: lunk },
    prayerPause: { status: "unknown", noteAr: "", quote: null, sourceUrl: null },
    ...over,
  };
}
const run = (c: ExtractedCard, judge?: (a: string, b: string) => Promise<boolean>) =>
  verifyCard({ slug: "minecraft", nameAr: "ماين كرافت", identity, extracted: c, docs }, judge);

describe("verifier (deterministic)", () => {
  it("quoteInSource يتسامح مع المسافات وحالة الأحرف فقط", () => {
    expect(quoteInSource("ESRB   rating: e10+", ESRB_URL, docs)).not.toBeNull();
    expect(quoteInSource("ESRB Rating: T", ESRB_URL, docs)).toBeNull();
    expect(quoteInSource("ESRB Rating: E10+", PUB_URL, docs)).toBeNull(); // مصدر غلط
    expect(quoteInSource(null, ESRB_URL, docs)).toBeNull();
  });
  it("valueInQuote ما يقبل رقم جزء من رقم أكبر", () => {
    expect(valueInQuote("E10+", "Rating: E10+ Content")).toBe(true);
    expect(valueInQuote("7", "PEGI 7")).toBe(true);
    expect(valueInQuote("7", "PEGI 17")).toBe(false);
    expect(valueInQuote("1", "PEGI 12")).toBe(false);
  });

  it("اقتباس موجود ⇐ مقبول بثقة «آلية بمصادر»", async () => {
    const { title, report } = await run(
      card({
        attentionPoints: {
          ...card().attentionPoints,
          strangerChat: {
            status: "configurable",
            summaryAr: "فيه محادثة نصية على السيرفرات، وتقدر تقفلها من إعدادات الحساب.",
            quote: "Parents can turn off chat in account settings.",
            sourceUrl: PUB_URL,
          },
        },
      }),
    );
    expect(title.attentionPoints.strangerChat.status).toBe("configurable");
    expect(title.attentionPoints.strangerChat.confidence).toBe("auto");
    expect(title.attentionPoints.strangerChat.sources[0]?.url).toBe(PUB_URL);
    expect(report.accepted).toContain("attentionPoints.strangerChat");
    expect(title.reviewStatus).toBe("auto_sourced");
  });

  it("اقتباس غير موجود ⇐ «ما لقيت»", async () => {
    const { title, report } = await run(
      card({
        attentionPoints: {
          ...card().attentionPoints,
          ads: { status: "present", summaryAr: "فيه إعلانات.", quote: "Contains ads everywhere", sourceUrl: PUB_URL },
        },
      }),
    );
    expect(title.attentionPoints.ads.status).toBe("unknown");
    expect(title.attentionPoints.ads.sources).toEqual([]);
    expect(report.rejected.map((r) => r.field)).toContain("attentionPoints.ads");
  });

  it("تصنيف بدون اقتباس ⇐ «غير متوفر»", async () => {
    const { title } = await run(
      card({ ratings: { ...card().ratings, esrb: { value: "E10+", quote: null, sourceUrl: ESRB_URL } } }),
    );
    expect(title.ratings.esrb.value).toBeNull();
  });

  it("تصنيف مقتبس من صفحة الجهة ⇐ مقبول مع المصدر والتاريخ", async () => {
    const { title } = await run(
      card({
        ratings: { ...card().ratings, esrb: { value: "E10+", quote: "ESRB Rating: E10+", sourceUrl: ESRB_URL } },
      }),
    );
    expect(title.ratings.esrb).toMatchObject({ value: "E10+", sourceUrl: ESRB_URL, verifiedAt: "2026-10-10" });
  });

  it("تصنيف من غير صفحة الجهة المصنفة ⇐ مرفوض حتى لو الاقتباس موجود", async () => {
    const { title } = await run(
      card({
        ratings: { ...card().ratings, pegi: { value: "E10+", quote: "ESRB Rating: E10+", sourceUrl: ESRB_URL } },
      }),
    );
    expect(title.ratings.pegi.value).toBeNull();
  });

  it("قيمة تصنيف مو موجودة في الاقتباس ⇐ مرفوضة", async () => {
    const { title } = await run(
      card({ ratings: { ...card().ratings, esrb: { value: "T", quote: "ESRB Rating: E10+", sourceUrl: ESRB_URL } } }),
    );
    expect(title.ratings.esrb.value).toBeNull();
  });

  it("المحقق الثاني يحكم «غير مدعوم» ⇐ «ما لقيت»", async () => {
    const judge = vi.fn(async () => false);
    const { title } = await run(
      card({
        attentionPoints: {
          ...card().attentionPoints,
          purchases: {
            status: "present",
            summaryAr: "فيه صناديق حظ.",
            quote: "The Marketplace sells add-ons for Minecoins.",
            sourceUrl: PUB_URL,
          },
        },
      }),
      judge,
    );
    expect(judge).toHaveBeenCalledOnce();
    expect(title.attentionPoints.purchases.status).toBe("unknown");
  });

  it("نص فيه كلمة ممنوعة ⇐ «ما لقيت»", async () => {
    const { title } = await run(
      card({
        attentionPoints: {
          ...card().attentionPoints,
          strangerChat: {
            status: "configurable",
            summaryAr: "المحادثة آمنة.",
            quote: "Parents can turn off chat in account settings.",
            sourceUrl: PUB_URL,
          },
        },
      }),
    );
    expect(title.attentionPoints.strangerChat.status).toBe("unknown");
  });

  it("بدون أي حقل مقبول ⇐ reviewStatus not_found", async () => {
    const { title } = await run(card());
    expect(title.reviewStatus).toBe("not_found");
  });
});

describe("agent pipeline (mock LLM، بدون API حقيقي)", () => {
  it("allowlist يرفض المنتديات ومحركات البحث", () => {
    expect(isAllowedUrl("https://www.esrb.org/x")).toBe(true);
    expect(isAllowedUrl("https://www.reddit.com/r/x")).toBe(false);
    expect(isAllowedUrl("https://www.google.com/search?q=x")).toBe(false);
    expect(isAllowedUrl("http://www.esrb.org/x")).toBe(false);
    expect(isAllowedUrl("https://help.minecraft.net/x", "https://www.minecraft.net/")).toBe(true);
  });

  it("htmlToText يشيل السكربتات والوسوم", () => {
    expect(htmlToText("<p>Hi <b>there</b></p><script>alert(1)</script>")).toBe("Hi there");
  });

  it("fetchSources يرفض redirect لخارج الـallowlist", async () => {
    const fake = vi.fn(async (url: string | URL | Request) => {
      const u = String(url);
      const res = new Response(u.includes("pegi") ? "<p>PEGI 7</p>" : "<p>x</p>", {
        headers: { "content-type": "text/html" },
      });
      Object.defineProperty(res, "url", { value: u.includes("esrb") ? "https://evil.example.com/" : u });
      return res;
    }) as unknown as typeof fetch;
    const out = await fetchSources(
      ["https://pegi.info/search-pegi?q=x", "https://www.esrb.org/search/?searchKeyword=x", "https://reddit.com/x"],
      null,
      fake,
    );
    expect(out.map((d) => d.url)).toEqual(["https://pegi.info/search-pegi?q=x"]);
  });

  it("generateCard: لا يُرسل للنموذج إلا اسم العنوان، والنتيجة تجتاز التحقق", async () => {
    const prompts: string[] = [];
    const llm: AgentLlm = {
      async json({ prompt, schema }) {
        prompts.push(prompt);
        if (prompts.length === 1) return schema.parse(identity);
        return schema.parse(
          card({
            ratings: { ...card().ratings, esrb: { value: "E10+", quote: "ESRB Rating: E10+", sourceUrl: ESRB_URL } },
          }),
        );
      },
    };
    const fake = vi.fn(async (url: string | URL | Request) => {
      const u = String(url);
      const body = u.includes("esrb") ? `<html><title>ESRB</title><body>${fx("esrb.txt")}</body></html>` : "";
      const res = new Response(body, { status: body ? 200 : 404, headers: { "content-type": "text/html" } });
      Object.defineProperty(res, "url", { value: u.includes("esrb") ? ESRB_URL : u });
      return res;
    }) as unknown as typeof fetch;

    const { title } = await generateCard("ماين كرافت", { llm, fetchImpl: fake });
    expect(prompts[0]).toContain("ماين كرافت");
    expect(prompts.join(" ")).not.toMatch(/age|عمر|سنوات/i);
    expect(title.ratings.esrb.value).toBe("E10+");
    expect(title.attentionPoints.ads.status).toBe("unknown");
    expect(title.isDemo).toBe(false);
    expect(slugify("Call of Duty: Mobile")).toBe("call-of-duty-mobile");
  });
});
