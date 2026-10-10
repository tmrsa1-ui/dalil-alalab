/**
 * نص صفحات الأدلة الرسمية: تحويل HTML لنص، وتطبيع للمقارنة الحرفية.
 * التطبيع يوحّد المسافات وعلامات التنصيص والفواصل العليا فقط — ما يغيّر الكلمات.
 */
const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  ndash: "–",
  mdash: "—",
};

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|\/p|\/li|\/h\d|\/div)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n: string) => ENTITIES[n.toLowerCase()] ?? m)
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

export function normalizeQuote(s: string): string {
  return s
    .normalize("NFC") // ترتيب الحركات (شدة/كسرة) يختلف بين الصفحات
    .replace(/[‎‏‪-‮⁦-⁩]/g, "")
    .replace(/[“”«»„]/g, '"')
    .replace(/[‘’`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** هل الاقتباس موجود حرفيًا (بعد التطبيع) في نص الصفحة؟ */
export function quoteInText(quote: string, text: string): boolean {
  return normalizeQuote(text).includes(normalizeQuote(quote));
}
