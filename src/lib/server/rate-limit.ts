import "server-only";

/**
 * حد طلبات بسيط في الذاكرة (لا يُخزن أي شي على القرص).
 * المفتاح hash قصير وغير قابل للاسترجاع، يُنسى عند إعادة التشغيل.
 */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

export function clientKey(req: Request, scope: string): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  let h = 0;
  for (const c of `${scope}|${fwd}`) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return `${scope}:${(h >>> 0).toString(36)}`;
}

let day = "";
let dayCount = 0;
/** حد تكلفة يومي للبطاقات الآلية. */
export function takeDailyBudget(max: number, now = new Date()): boolean {
  const d = now.toISOString().slice(0, 10);
  if (d !== day) {
    day = d;
    dayCount = 0;
  }
  if (dayCount >= max) return false;
  dayCount++;
  return true;
}
