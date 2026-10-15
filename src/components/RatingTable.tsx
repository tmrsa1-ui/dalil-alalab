"use client";
import { ar } from "@/lib/i18n/ar";
import { compareAge, type AgeComparison } from "@/lib/age";
import { type Title } from "@schemas/title";
import { RATING_KEYS } from "@schemas/keys";
import { SourceLink } from "./SourceLink";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { ratingGloss, translateTerm } from "@/lib/i18n/terms";

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

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
            {available && r.value && ratingGloss(r.value) ? (
              <p className="text-sm font-semibold" data-testid="rating-gloss">
                {ratingGloss(r.value)}
              </p>
            ) : null}
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
            {available && r.sourceUrl ? (
              <details className="group text-sm" data-testid="rating-source">
                <summary className="flex min-h-[44px] cursor-pointer flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-brand">
                    <span
                      aria-hidden="true"
                      className="inline-block transition-transform group-open:rotate-90 motion-reduce:transition-none"
                    >
                      ‹
                    </span>{" "}
                    {ar.know.sourceOf(hostOf(r.sourceUrl))}
                  </span>
                  {r.shownOn ? (
                    <span className="text-xs text-muted" dir="auto">
                      {ar.know.shownOn(r.shownOn)}
                    </span>
                  ) : null}
                  {r.confidence ? <ConfidenceBadge level={r.confidence} /> : null}
                </summary>
                <div className="mt-1 grid gap-1 border-s-2 border-line ps-3">
                  {r.edition ? (
                    <div className="text-xs text-muted" dir="auto">
                      {ar.know.edition(r.edition)}
                    </div>
                  ) : null}
                  <SourceLink
                    url={r.sourceUrl}
                    verifiedAt={r.verifiedAt}
                    quote={r.quote}
                    className="text-sm"
                  />
                </div>
              </details>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
