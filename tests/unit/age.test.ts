import { ageBandOf, compareAge, minAgeFromRating, parseAge } from "@/lib/age";

describe("age", () => {
  it("الفئات العمرية", () => {
    expect(ageBandOf(3)).toBe("under7");
    expect(ageBandOf(6)).toBe("under7");
    expect(ageBandOf(7)).toBe("7to12");
    expect(ageBandOf(12)).toBe("7to12");
    expect(ageBandOf(13)).toBe("13plus");
    expect(ageBandOf(17)).toBe("13plus");
  });
  it("parseAge يقبل 3–17 فقط", () => {
    expect(parseAge("9")).toBe(9);
    expect(parseAge("2")).toBeNull();
    expect(parseAge("18")).toBeNull();
    expect(parseAge("abc")).toBeNull();
    expect(parseAge(null)).toBeNull();
  });
  it("يقرأ قيمة كل جهة بدون تحويل بين الجهات", () => {
    expect(minAgeFromRating("esrb", "E10+")).toBe(10);
    expect(minAgeFromRating("esrb", "T")).toBe(13);
    expect(minAgeFromRating("esrb", "RP")).toBeNull();
    expect(minAgeFromRating("pegi", "7")).toBe(7);
    expect(minAgeFromRating("appStore", "12+")).toBe(12);
    expect(minAgeFromRating("googlePlay", "Teen")).toBe(13);
    expect(minAgeFromRating("gcam", null)).toBeNull();
    expect(minAgeFromRating("gcam", "غير مفهوم")).toBeNull();
  });
  it("مقارنة العمر", () => {
    expect(compareAge("esrb", "E10+", 9)).toBe("above");
    expect(compareAge("pegi", "7", 9)).toBe("within");
    expect(compareAge("pegi", null, 9)).toBe("unavailable");
  });
});
