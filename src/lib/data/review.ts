/**
 * المراجعة البشرية للقيم الآلية (تُستخدم من scripts/review-data.ts).
 * المراجع يشوف القيمة ومصدرها واقتباسها، ويقرر: صح ⇐ «راجعها إنسان»، غلط ⇐ تُمسح وتصير «غير متوفر/ما لقيت».
 * ما نعدّل أي قيمة من عندنا؛ فقط نرفع الثقة أو نمسح.
 */
import type { Title, RatingKey } from "../../../schemas/title";
import type { PointKey } from "../../../schemas/common";
import { POINT_KEYS, RATING_KEYS } from "../../../schemas/keys";

export type Decision = "correct" | "wrong";
export type PendingItem =
  | { kind: "rating"; key: RatingKey; label: string; value: string; sources: Source[] }
  | { kind: "point"; key: PointKey; label: string; value: string; sources: Source[] }
  | { kind: "guide"; key: "officialGuide"; label: string; value: string; sources: Source[] };
export type Source = { url: string; quote?: string; verifiedAt: string | null };

/** كل القيم اللي ما زالت «بحاجة مراجعة بشرية» في بطاقة. */
export function listPending(t: Title): PendingItem[] {
  const out: PendingItem[] = [];
  for (const key of RATING_KEYS) {
    const r = t.ratings[key];
    if (r.value !== null && r.confidence === "auto") {
      out.push({
        kind: "rating",
        key,
        label: `ratings.${key}`,
        value: [r.value, r.descriptors?.join(", "), r.edition, r.shownOn]
          .filter(Boolean)
          .join(" · "),
        sources: [{ url: r.sourceUrl!, quote: r.quote, verifiedAt: r.verifiedAt }],
      });
    }
  }
  for (const key of POINT_KEYS) {
    const p = t.attentionPoints[key];
    if (p.status !== "unknown" && p.confidence === "auto") {
      out.push({
        kind: "point",
        key,
        label: `attentionPoints.${key}`,
        value: `${p.status}: ${p.summaryAr}`,
        sources: p.sources.map((s) => ({ url: s.url, quote: s.quote, verifiedAt: s.verifiedAt })),
      });
    }
  }
  const g = t.controls.officialGuide;
  if (g && g.confidence === "auto") {
    out.push({
      kind: "guide",
      key: "officialGuide",
      label: "controls.officialGuide",
      value: g.labelAr,
      sources: [{ url: g.url, verifiedAt: g.verifiedAt }],
    });
  }
  return out;
}

/** يطبّق قرار المراجع على نسخة من البطاقة ويرجعها (بدون كتابة ملفات). */
export function applyDecision(
  t: Title,
  item: PendingItem,
  decision: Decision,
  today: string,
): Title {
  const next: Title = structuredClone(t);
  if (item.kind === "rating") {
    if (decision === "correct") {
      next.ratings[item.key] = {
        ...next.ratings[item.key],
        confidence: "human",
        verifiedAt: today,
      };
    } else {
      next.ratings[item.key] = { value: null, sourceUrl: null, verifiedAt: null };
    }
  } else if (item.kind === "point") {
    const p = next.attentionPoints[item.key];
    if (decision === "correct") {
      p.confidence = "human";
    } else {
      Object.assign(p, { status: "unknown", summaryAr: "", sources: [], confidence: "none" });
    }
  } else if (decision === "correct") {
    next.controls.officialGuide = {
      ...next.controls.officialGuide!,
      confidence: "human",
      verifiedAt: today,
    };
  } else {
    delete next.controls.officialGuide;
  }
  // الـschema: أي قيمة human تتطلب human_reviewed + lastReviewedAt.
  const anyHuman =
    RATING_KEYS.some((k) => next.ratings[k].confidence === "human") ||
    POINT_KEYS.some((k) => next.attentionPoints[k].confidence === "human") ||
    next.controls.officialGuide?.confidence === "human";
  if (anyHuman) {
    next.reviewStatus = "human_reviewed";
    next.lastReviewedAt = today;
  }
  return next;
}

/** هل كل القيم المتوفرة في البطاقة راجعها إنسان؟ (لشارة العنوان في أعلى الصفحة.) */
export function allAvailableHuman(t: Title): boolean {
  const ratings = RATING_KEYS.filter((k) => t.ratings[k].value !== null);
  const points = POINT_KEYS.filter((k) => t.attentionPoints[k].status !== "unknown");
  if (!ratings.length && !points.length) return false;
  return (
    ratings.every((k) => t.ratings[k].confidence === "human") &&
    points.every((k) => t.attentionPoints[k].confidence === "human") &&
    (!t.controls.officialGuide || t.controls.officialGuide.confidence === "human")
  );
}
