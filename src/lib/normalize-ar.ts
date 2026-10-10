/**
 * تطبيع النص العربي للبحث والمقارنة:
 * إزالة التشكيل والتطويل، توحيد الألف (أ/إ/آ/ٱ → ا)، ة → ه، ى → ي، ؤ → و، ئ → ي،
 * تحويل الأرقام العربية-الهندية إلى لاتينية، وتصغير الحروف اللاتينية.
 */
const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;

export function normalizeArabic(input: string): string {
  return input
    .normalize("NFKC")
    .replace(DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** نفس التطبيع مع حذف المسافات (عشان «ماين كرافت» = «ماينكرافت»). */
export function compactKey(input: string): string {
  return normalizeArabic(input).replace(/\s+/g, "");
}
