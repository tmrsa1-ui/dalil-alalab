import { RATING_KEYS, FAMILY_LENS_KEYS, type Title } from "../../../schemas/title";
import { POINT_KEYS } from "../../../schemas/common";
import { isAllowedUrl, isRatingAuthorityUrl } from "./allowlist";

export type EvalRow = {
  slug: string;
  ratingsCorrect: number;
  ratingsTotal: number;
  pointsCorrect: number;
  pointsTotal: number;
  sourcesValid: number;
  sourcesTotal: number;
  notFound: number;
  fieldsTotal: number;
};

/** يقارن بطاقة الوكيل بالبطاقة المرجعية (راجعها إنسان). مقاييس بسيطة وقابلة للتفسير. */
export function compareCards(reference: Title, agent: Title): EvalRow {
  let ratingsCorrect = 0;
  for (const k of RATING_KEYS) {
    const a = agent.ratings[k].value?.trim().toUpperCase() ?? null;
    const r = reference.ratings[k].value?.trim().toUpperCase() ?? null;
    if (a === r) ratingsCorrect++;
  }
  let pointsCorrect = 0;
  for (const k of POINT_KEYS) {
    if (agent.attentionPoints[k].status === reference.attentionPoints[k].status) pointsCorrect++;
  }
  const sources = [
    ...RATING_KEYS.flatMap((k) =>
      agent.ratings[k].sourceUrl ? [{ url: agent.ratings[k].sourceUrl!, authority: k }] : [],
    ),
    ...POINT_KEYS.flatMap((k) =>
      agent.attentionPoints[k].sources.map((s) => ({ url: s.url, authority: null })),
    ),
    ...FAMILY_LENS_KEYS.flatMap((k) =>
      agent.familyLens[k].sources.map((s) => ({ url: s.url, authority: null })),
    ),
  ];
  const sourcesValid = sources.filter((s) =>
    s.authority
      ? isRatingAuthorityUrl(s.url, s.authority)
      : isAllowedUrl(s.url, agent.publisher?.url),
  ).length;
  const unknowns =
    RATING_KEYS.filter((k) => agent.ratings[k].value === null).length +
    POINT_KEYS.filter((k) => agent.attentionPoints[k].status === "unknown").length;
  return {
    slug: reference.slug,
    ratingsCorrect,
    ratingsTotal: RATING_KEYS.length,
    pointsCorrect,
    pointsTotal: POINT_KEYS.length,
    sourcesValid,
    sourcesTotal: sources.length,
    notFound: unknowns,
    fieldsTotal: RATING_KEYS.length + POINT_KEYS.length,
  };
}

const pct = (a: number, b: number) => (b === 0 ? "—" : `${Math.round((a / b) * 1000) / 10}%`);

export function summarize(rows: EvalRow[]) {
  const sum = (k: keyof Omit<EvalRow, "slug">) => rows.reduce((n, r) => n + r[k], 0);
  return {
    titles: rows.length,
    ratingAccuracy: pct(sum("ratingsCorrect"), sum("ratingsTotal")),
    pointAccuracy: pct(sum("pointsCorrect"), sum("pointsTotal")),
    sourceValidity: pct(sum("sourcesValid"), sum("sourcesTotal")),
    notFoundRate: pct(sum("notFound"), sum("fieldsTotal")),
  };
}
