"use client";
import { ar } from "@/lib/i18n/ar";
import { compareAge, type AgeComparison } from "@/lib/age";
import { RATING_KEYS, type Title } from "@schemas/title";
import { SourceLink } from "./SourceLink";

const CMP_STYLE: Record<AgeComparison, string> = {
  above: "bg-warn-soft text-warn border-warn/40",
  within: "bg-ok-soft text-ok border-ok/40",
  unavailable: "bg-surface-2 text-muted border-line",
};
const CMP_LABEL: Record<AgeComparison, string> = {
  above: ar.know.above,
  within: ar.know.within,
  unavailable: ar.know.noRating,
};

/** الترتيب ثابت: GCAM أولًا ثم ESRB ثم PEGI ثم App Store ثم Google Play. */
export function RatingTable({ ratings, age }: { ratings: Title["ratings"]; age: number | null }) {
  const rows = RATING_KEYS.map((key) => {
    const r = ratings[key];
    const available = r.value !== null && !!r.sourceUrl && !!r.verifiedAt;
    const cmp: AgeComparison = available && age !== null ? compareAge(key, r.value, age) : "unavailable";
    return { key, r, available, cmp };
  });
  const anyAbove = rows.some((x) => x.cmp === "above");
  const anyWithin = rows.some((x) => x.cmp === "within");
  const summary = anyAbove ? ar.know.summaryAbove : anyWithin ? ar.know.summaryWithin : ar.know.summaryNone;

  return (
    <div>
      {age !== null ? (
        <p className="mb-3 font-semibold" data-testid="rating-summary" role="status">
          {summary}
        </p>
      ) : null}
      <ul className="grid gap-2" aria-label={ar.know.ratingsTitle} data-testid="rating-table">
        {rows.map(({ key, r, available, cmp }) => (
          <li
            key={key}
            className="card flex flex-wrap items-center justify-between gap-x-3 gap-y-1 p-3"
            data-testid={`rating-${key}`}
          >
            <div className="min-w-0">
              <div className="font-bold">{ar.know.systems[key].name}</div>
              {available && r.sourceUrl ? (
                <SourceLink url={r.sourceUrl} verifiedAt={r.verifiedAt} className="text-sm" />
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {available ? (
                <span className="num rounded-lg border-2 border-ink px-2 py-0.5 text-lg font-extrabold" dir="ltr">
                  {r.value}
                </span>
              ) : (
                <span className="font-semibold text-muted" data-testid="rating-unavailable">
                  {ar.know.unavailable}
                </span>
              )}
              {available && age !== null ? (
                <span className={`chip border ${CMP_STYLE[cmp]}`}>{CMP_LABEL[cmp]}</span>
              ) : null}
            </div>
            {available && r.descriptors?.length ? (
              <p className="w-full text-sm text-muted">
                {ar.know.descriptors}: <span dir="ltr">{r.descriptors.join("، ")}</span>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
