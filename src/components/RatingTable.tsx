"use client";
import { ar } from "@/lib/i18n/ar";
import { compareAge, type AgeComparison } from "@/lib/age";
import { RATING_KEYS, type Title } from "@schemas/title";
import { SourceLink } from "./SourceLink";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { translateTerm } from "@/lib/i18n/terms";

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
export function RatingTable({
  ratings,
  age,
  reserveSummary = false,
}: {
  ratings: Title["ratings"];
  age: number | null;
  reserveSummary?: boolean;
}) {
  const rows = RATING_KEYS.map((key) => {
    const r = ratings[key];
    const available = r.value !== null && !!r.sourceUrl && !!r.verifiedAt;
    const cmp: AgeComparison =
      available && age !== null ? compareAge(key, r.value, age) : "unavailable";
    return { key, r, available, cmp };
  });
  const anyAbove = rows.some((x) => x.cmp === "above");
  const anyWithin = rows.some((x) => x.cmp === "within");
  const summary = anyAbove
    ? ar.know.summaryAbove
    : anyWithin
      ? ar.know.summaryWithin
      : ar.know.summaryNone;

  return (
    <div>
      {age !== null ? (
        <p className="mb-3 font-semibold" data-testid="rating-summary" role="status">
          {summary}
        </p>
      ) : reserveSummary ? (
        <p className="mb-3 min-h-[1.75em]" aria-hidden="true" />
      ) : null}
      <ul className="grid gap-2" aria-label={ar.know.ratingsTitle} data-testid="rating-table">
        {rows.map(({ key, r, available, cmp }) => (
          <li key={key} className="card grid gap-1 p-3" data-testid={`rating-${key}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold">{ar.know.systems[key].name}</div>
              <div className="flex flex-wrap items-center gap-2">
                {available && age !== null ? (
                  <span className={`chip border ${CMP_STYLE[cmp]}`}>{CMP_LABEL[cmp]}</span>
                ) : available && reserveSummary ? (
                  <span className="chip invisible border" aria-hidden="true">
                    {CMP_LABEL.within}
                  </span>
                ) : null}
                {available ? (
                  <span
                    className="num rounded-lg border-2 border-ink px-2 py-0.5 text-lg font-extrabold"
                    dir="ltr"
                  >
                    {r.value}
                  </span>
                ) : (
                  <span className="font-semibold text-muted" data-testid="rating-unavailable">
                    {ar.know.unavailable}
                  </span>
                )}
              </div>
            </div>
            {available && r.descriptors?.length ? (
              <p className="text-sm text-muted">
                {ar.know.descriptors}:{" "}
                <span className="font-semibold text-ink">
                  {r.descriptors.map((d) => translateTerm(d) ?? d).join("، ")}
                </span>
                {r.descriptors.some((d) => translateTerm(d)) ? (
                  <>
                    {" "}
                    (<bdi dir="ltr">{r.descriptors.join(", ")}</bdi>)
                  </>
                ) : null}
              </p>
            ) : null}
            {available && (r.shownOn || r.edition) ? (
              <div className="text-xs text-muted" dir="auto">
                {r.shownOn ? ar.know.shownOn(r.shownOn) : null}
                {r.shownOn && r.edition ? " · " : null}
                {r.edition ? ar.know.edition(r.edition) : null}
              </div>
            ) : null}
            {available && r.sourceUrl ? (
              <div className="flex flex-wrap items-center gap-x-2">
                <SourceLink url={r.sourceUrl} verifiedAt={r.verifiedAt} className="text-sm" />
                {r.confidence ? <ConfidenceBadge level={r.confidence} /> : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
