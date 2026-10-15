import { compactKey, normalizeArabic } from "@/lib/normalize-ar";

describe("normalizeArabic", () => {
  it("يوحّد الألف والتاء المربوطة والياء", () => {
    expect(normalizeArabic("أإآٱ")).toBe("اااا");
    expect(normalizeArabic("لعبة")).toBe("لعبه");
    expect(normalizeArabic("مستشفى")).toBe("مستشفي");
    expect(normalizeArabic("مؤشر")).toBe("موشر");
    expect(normalizeArabic("بيئة")).toBe("بييه");
  });
  it("يحذف التشكيل والتطويل", () => {
    expect(normalizeArabic("مَـــاينْ كْرَافْت")).toBe("ماين كرافت");
  });
  it("يحوّل الأرقام العربية ويصغّر الإنجليزي", () => {
    expect(normalizeArabic("FIFA ٢٤")).toBe("fifa 24");
  });
  it("يحذف الرموز ويطبّع المسافات", () => {
    expect(normalizeArabic("  Call   of Duty: Mobile! ")).toBe("call of duty mobile");
  });
  it("compactKey يحذف المسافات", () => {
    expect(compactKey("ماين كرافت")).toBe(compactKey("ماينكرافت"));
  });
});
