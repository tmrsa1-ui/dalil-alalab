/**
 * قاعدة صارمة: ممنوع وصف أي عنوان بأنه «آمن/آمنة/غير آمن» في المنتج كله.
 * نستخدم «نقاط انتباه» بدلها. هذا الفاحص يُستخدم في الـschemas وفي الاختبارات.
 */
const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;

// الصيغ الممنوعة بعد إزالة التشكيل والسوابق (و/ف/ب/ل/ك + ال).
export const FORBIDDEN_LIST = [
  "آمن",
  "آمنة",
  "آمنه",
  "آمنا",
  "آمنين",
  "آمنات",
  "أمان",
  "امان",
  "مأمون",
  "مأمونة",
] as const;
const FORBIDDEN_STEMS = new Set<string>(FORBIDDEN_LIST);

const PREFIXES = ["وبال", "فبال", "وال", "فال", "بال", "كال", "لل", "ال", "و", "ف", "ب", "ل", "ك"];

const ENGLISH = /\b(un)?safe(r|st|ty|ly)?\b/i;

function stripPrefixes(token: string): string[] {
  const out = [token];
  for (const p of PREFIXES) {
    if (token.startsWith(p) && token.length - p.length >= 3) out.push(token.slice(p.length));
  }
  return out;
}

/** يرجع أول كلمة ممنوعة لقاها في النص، أو null. */
export function findForbiddenWord(text: string, { english = false } = {}): string | null {
  const clean = text.replace(DIACRITICS, "");
  const tokens = clean.split(/[^ء-ي]+/).filter(Boolean);
  for (const t of tokens) {
    for (const candidate of stripPrefixes(t)) {
      if (FORBIDDEN_STEMS.has(candidate)) return t;
    }
  }
  if (english) {
    const m = clean.match(ENGLISH);
    if (m) return m[0];
  }
  return null;
}

/** يمشي على أي كائن ويرجع كل النصوص فيه مع مساراتها. */
export function collectStrings(value: unknown, path = "$"): Array<{ path: string; text: string }> {
  if (typeof value === "string") return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => collectStrings(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => collectStrings(v, `${path}.${k}`));
  }
  return [];
}
