import index from "@data/titles.index.json";
import { createSearcher, resolveTitle } from "@/lib/search";
import type { TitleIndexEntry } from "@schemas/title";

const idx = index as TitleIndexEntry[];

describe("search", () => {
  it.each(["ماين كرافت", "ماينكرافت", "minecraft", "Minecraft", "مَاين كرافت", "MC"])(
    "«%s» يوصل لماين كرافت",
    (q) => {
      expect(resolveTitle(idx, q)?.slug).toBe("minecraft");
    },
  );
  it.each([
    ["ببجي", "pubg-mobile"],
    ["PUBG", "pubg-mobile"],
    ["روبلكس", "roblox"],
    ["فورت نايت", "fortnite"],
    ["تك توك", "tiktok"],
  ])("«%s» ⇐ %s", (q, slug) => {
    expect(resolveTitle(idx, q)?.slug).toBe(slug);
  });
  it("إكمال تلقائي أثناء الكتابة", () => {
    const r = createSearcher(idx)("ماي");
    expect(r[0]?.entry.slug).toBe("minecraft");
  });
  it("عنوان غير موجود يرجع null", () => {
    expect(resolveTitle(idx, "لعبة ما لها وجود إطلاقا xyzzy")).toBeNull();
  });
  it("نص فاضي ما يرجع شي", () => {
    expect(createSearcher(idx)("   ")).toEqual([]);
  });
});
