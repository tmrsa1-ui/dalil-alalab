import { titleSchema, type Title, RATING_KEYS, FAMILY_LENS_KEYS } from "../../../schemas/title";
import { POINT_KEYS } from "../../../schemas/common";
import { findForbiddenWord } from "../forbidden-words";
import { emptyTitle } from "../data/template";
import { isAllowedUrl, isRatingAuthorityUrl } from "./allowlist";
import type { ExtractedCard, Identity, Judge, SourceDoc } from "./types";

const squash = (s: string) => s.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();

/** (أ) تحقق deterministic: الاقتباس موجود حرفيًا في نص المصدر المجلوب؟ */
export function quoteInSource(
  quote: string | null,
  sourceUrl: string | null,
  docs: SourceDoc[],
): SourceDoc | null {
  if (!quote || !sourceUrl) return null;
  const q = squash(quote);
  if (q.length < 2) return null;
  const doc = docs.find((d) => d.url === sourceUrl);
  if (!doc) return null;
  return squash(doc.text).includes(q) ? doc : null;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** قيمة التصنيف لازم تظهر حرفيًا داخل الاقتباس (وما تكون جزء من رقم أكبر). */
export function valueInQuote(value: string, quote: string): boolean {
  const re = new RegExp(`(^|[^0-9a-z])${escapeRe(value.trim().toLowerCase())}(?![0-9a-z])`, "i");
  return re.test(quote.toLowerCase());
}

export type VerifyReport = {
  accepted: string[];
  rejected: Array<{ field: string; reason: string }>;
};

/**
 * المرحلة 4: التحقق المستقل.
 * أي حقل يفشل يتحول إلى «ما لقيت» (unknown) أو «غير متوفر» (null).
 */
export async function verifyCard(
  input: { slug: string; nameAr: string; identity: Identity; extracted: ExtractedCard; docs: SourceDoc[] },
  judge?: Judge,
): Promise<{ title: Title; report: VerifyReport }> {
  const { identity, extracted, docs } = input;
  const report: VerifyReport = { accepted: [], rejected: [] };
  const reject = (field: string, reason: string) => report.rejected.push({ field, reason });
  const publisherUrl = identity.publisherUrl;
  const title = emptyTitle(input.slug, input.nameAr, identity.officialName);
  title.kind = identity.kind;
  title.platforms = identity.platforms;
  title.publisher = identity.publisherName
    ? { name: identity.publisherName, url: publisherUrl && isAllowedUrl(publisherUrl, publisherUrl) ? publisherUrl : null }
    : null;
  title.reviewStatus = "auto_sourced";
  title.aliases = [...new Set([input.nameAr, identity.nameAr].filter((x): x is string => !!x && x !== input.nameAr))];

  const sourceOf = (doc: SourceDoc, quote: string) => [
    { url: doc.url, title: doc.title.slice(0, 200) || doc.url, quote: quote.trim(), verifiedAt: doc.fetchedAt },
  ];

  async function supported(field: string, claim: string, quote: string): Promise<boolean> {
    if (findForbiddenWord(claim)) {
      reject(field, "كلمة ممنوعة في النص");
      return false;
    }
    if (!judge) return true;
    try {
      const ok = await judge(claim, quote);
      if (!ok) reject(field, "المحقق: غير مدعوم");
      return ok;
    } catch {
      reject(field, "تعذّر التحقق");
      return false;
    }
  }

  // التصنيفات: لا تُقبل أبدًا إلا لو الرقم مقتبس حرفيًا من صفحة الجهة المصنفة نفسها.
  for (const key of RATING_KEYS) {
    const r = extracted.ratings[key];
    if (!r.value) continue;
    const field = `ratings.${key}`;
    const doc = quoteInSource(r.quote, r.sourceUrl, docs);
    if (!doc || !r.quote) {
      reject(field, "اقتباس غير موجود في المصدر");
      continue;
    }
    if (!isRatingAuthorityUrl(doc.url, key)) {
      reject(field, "المصدر مو صفحة جهة التصنيف");
      continue;
    }
    if (!valueInQuote(r.value, r.quote)) {
      reject(field, "قيمة التصنيف مو موجودة في الاقتباس");
      continue;
    }
    title.ratings[key] = { value: r.value.trim(), sourceUrl: doc.url, verifiedAt: doc.fetchedAt, quote: r.quote.trim() };
    report.accepted.push(field);
  }

  for (const key of POINT_KEYS) {
    const p = extracted.attentionPoints[key];
    const field = `attentionPoints.${key}`;
    if (p.status === "unknown") continue;
    const doc = quoteInSource(p.quote, p.sourceUrl, docs);
    if (!doc || !p.quote || !isAllowedUrl(doc.url, publisherUrl)) {
      reject(field, "اقتباس غير موجود في المصدر");
      continue;
    }
    const summary = p.summaryAr.trim().slice(0, 220);
    if (!summary || !(await supported(field, summary, p.quote))) continue;
    Object.assign(title.attentionPoints[key], {
      status: p.status,
      summaryAr: summary,
      sources: sourceOf(doc, p.quote),
      confidence: "auto",
    });
    report.accepted.push(field);
  }

  for (const key of FAMILY_LENS_KEYS) {
    const l = extracted.familyLens[key];
    const field = `familyLens.${key}`;
    if (l.status === "unknown") continue;
    const doc = quoteInSource(l.quote, l.sourceUrl, docs);
    if (!doc || !l.quote || !isAllowedUrl(doc.url, publisherUrl)) {
      reject(field, "اقتباس غير موجود في المصدر");
      continue;
    }
    const note = l.noteAr.trim().slice(0, 220);
    if (!(await supported(field, note || l.quote, l.quote))) continue;
    title.familyLens[key] = { status: l.status, noteAr: note, sources: sourceOf(doc, l.quote) };
    report.accepted.push(field);
  }

  {
    const pp = extracted.prayerPause;
    const field = "prayerPause";
    if (pp.status !== "unknown") {
      const doc = quoteInSource(pp.quote, pp.sourceUrl, docs);
      if (!doc || !pp.quote || !isAllowedUrl(doc.url, publisherUrl)) reject(field, "اقتباس غير موجود في المصدر");
      else {
        const note = pp.noteAr.trim().slice(0, 220);
        if (await supported(field, note || pp.quote, pp.quote)) {
          title.prayerPause = { status: pp.status, noteAr: note, sources: sourceOf(doc, pp.quote) };
          report.accepted.push(field);
        }
      }
    }
  }

  if (report.accepted.length === 0) title.reviewStatus = "not_found";
  const parsed = titleSchema.safeParse(title);
  if (!parsed.success) {
    throw new Error(`البطاقة الآلية ما اجتازت الـschema: ${parsed.error.issues[0]?.message}`);
  }
  return { title: parsed.data, report };
}
