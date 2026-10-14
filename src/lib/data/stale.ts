/**
 * تتبّع المصدر ومعالجة التغيّر (drift):
 * كل قيمة آلية لازم يكون اقتباسها موجودًا في نص صفحتها الرسمية كما جُلبت آخر مرة.
 * لو الصفحة جُلبت بنجاح اليوم وما عاد فيها الاقتباس ⇐ القيمة صارت قديمة وتُمسح (تصير «غير متوفر/ما لقيت»)،
 * ثم يضيف apply:official ما تعرضه الصفحة اليوم. القيم اللي راجعها إنسان ما تُمسح؛ تُعلَّم للمراجع.
 */
import type { Title } from "../../../schemas/title";
import { FAMILY_LENS_KEYS, POINT_KEYS, RATING_KEYS } from "../../../schemas/keys";
import { normalizeQuote } from "./guide-text";
import type { OfficialDecision } from "./official-apply";

export type SnapshotLike = { titles: Record<string, Record<string, unknown>> };

/** نص كل صفحة جُلبت بنجاح (status 200) في اللقطة، مطبّعًا للمقارنة، مفتاحه الرابط. */
export function snapshotTextByUrl(snapshot: SnapshotLike): Map<string, string> {
  const byUrl = new Map<string, string>();
  for (const entry of Object.values(snapshot.titles)) {
    for (const part of Object.values(entry)) {
      if (part && typeof part === "object" && "url" in part) {
        const p = part as { url: string; status?: number };
        if (p.status !== 200) continue;
        byUrl.set(
          p.url,
          normalizeQuote(JSON.stringify(part).replace(/\\n/g, " ").replace(/\\"/g, '"')),
        );
      }
    }
  }
  return byUrl;
}

// تسميات القوالب اللي يضيفها apply:official حول القيمة الحرفية («Age Rating 13+»).
const LABELS = /^(Age Rating|In-App Purchases|Frequent|Infrequent|GAMR|GCAM|PEGI|Contains ads)$/;

export function quoteParts(quote: string): string[] {
  return normalizeQuote(quote)
    .split(/,\s*|\s+—\s+|:\s+/)
    .map((p) => p.trim().replace(/^(Age Rating|GAMR|GCAM|PEGI)\s+/, ""))
    .filter((p) => p && !LABELS.test(p));
}

/** هل كل أجزاء الاقتباس موجودة في نص الصفحة؟ */
export function quoteTraced(text: string, quote: string | undefined): boolean {
  if (!quote) return true;
  return quoteParts(quote).every((p) => text.includes(p));
}

export function pruneStale(
  current: Title,
  textByUrl: Map<string, string>,
): { title: Title; decisions: OfficialDecision[] } {
  const t: Title = structuredClone(current);
  const decisions: OfficialDecision[] = [];
  const log = (field: string, action: OfficialDecision["action"], detail: string) =>
    decisions.push({ slug: t.slug, field, action, detail });
  const stale = (url: string | null | undefined, quote: string | undefined) => {
    if (!url || !quote) return false;
    const text = textByUrl.get(url);
    return !!text && !quoteTraced(text, quote);
  };

  for (const key of RATING_KEYS) {
    const r = t.ratings[key];
    if (r.value === null || !stale(r.sourceUrl, r.quote)) continue;
    if (r.confidence === "human") {
      log(
        `ratings.${key}`,
        "skip",
        `راجعها إنسان لكن الصفحة ما عادت تحتوي «${r.quote}» — تحتاج مراجعة`,
      );
      continue;
    }
    log(`ratings.${key}`, "replace", `قديمة: الصفحة ما عادت تحتوي «${r.quote}» ⇐ غير متوفر`);
    t.ratings[key] = { value: null, sourceUrl: null, verifiedAt: null };
  }

  for (const key of POINT_KEYS) {
    const p = t.attentionPoints[key];
    if (p.status === "unknown" || !p.sources.length) continue;
    const gone = p.sources.filter((s) => stale(s.url, s.quote));
    if (!gone.length) continue;
    if (p.confidence === "human") {
      log(
        `attentionPoints.${key}`,
        "skip",
        `راجعها إنسان لكن مصدرًا ما عاد يحتوي اقتباسه — تحتاج مراجعة`,
      );
      continue;
    }
    p.sources = p.sources.filter((s) => !gone.includes(s));
    if (!p.sources.length) {
      Object.assign(p, { status: "unknown", summaryAr: "", sources: [], confidence: "none" });
      log(`attentionPoints.${key}`, "replace", `كل مصادرها قديمة ⇐ ما لقيت`);
    } else {
      log(
        `attentionPoints.${key}`,
        "replace",
        `حُذف ${gone.length} مصدر قديم: ${gone.map((s) => s.quote).join(" | ")}`,
      );
    }
  }

  for (const key of FAMILY_LENS_KEYS) {
    const l = t.familyLens[key];
    if (l.status === "unknown" || !l.sources.length) continue;
    const gone = l.sources.filter((s) => stale(s.url, s.quote));
    if (!gone.length) continue;
    l.sources = l.sources.filter((s) => !gone.includes(s));
    if (!l.sources.length) {
      t.familyLens[key] = { status: "unknown", noteAr: "", sources: [] };
      log(`familyLens.${key}`, "replace", `كل مصادرها قديمة ⇐ ما لقيت`);
    } else {
      log(`familyLens.${key}`, "replace", `حُذف ${gone.length} مصدر قديم`);
    }
  }
  return { title: t, decisions };
}
