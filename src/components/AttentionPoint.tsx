import { ar } from "@/lib/i18n/ar";
import type { PointKey } from "@schemas/common";
import type { Title } from "@schemas/title";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { SourceLink } from "./SourceLink";

type Point = Title["attentionPoints"][PointKey];

const STATUS_STYLE = {
  present: "bg-accent-soft text-accent border-accent/40",
  configurable: "bg-info-soft text-info border-info/40",
  absent: "bg-ok-soft text-ok border-ok/40",
  unknown: "bg-surface-2 text-muted border-line",
} as const;

export function AttentionPoint({
  pointKey,
  point,
  index,
  isDemo,
}: {
  pointKey: PointKey;
  point: Point;
  index: number;
  isDemo: boolean;
}) {
  const meta = ar.know.points[pointKey];
  const statusLabel =
    pointKey === "sessionPause"
      ? ar.know.sessionStatus[point.status]
      : ar.know.status[point.status];
  const unknown = point.status === "unknown" || point.sources.length === 0;
  const headingId = `point-${pointKey}`;
  const extras =
    pointKey === "sessionPause" && "hasRecommendationFeed" in point
      ? [
          [ar.know.feed, point.hasRecommendationFeed],
          [ar.know.autoplay, point.autoplay],
        ]
      : null;

  return (
    <li className="card p-4" aria-labelledby={headingId} data-testid={`point-${pointKey}`}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="num mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand"
        >
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 id={headingId} className="text-base font-bold">
              {meta.title}
            </h4>
            <span className={`chip border ${STATUS_STYLE[unknown ? "unknown" : point.status]}`}>
              {unknown ? ar.know.notFound : statusLabel}
            </span>
          </div>
          <p className="text-sm text-muted">{meta.hint}</p>

          {unknown ? (
            <p className="mt-2 text-sm" data-testid="not-found">
              <strong>{ar.know.notFound}.</strong> {ar.know.notFoundHint}
            </p>
          ) : (
            <>
              <p className="mt-2 line-clamp-3">{point.summaryAr}</p>
              {extras ? (
                <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                  {extras.map(([label, v]) => (
                    <li
                      key={String(label)}
                      className="chip border border-line bg-surface-2 font-semibold"
                    >
                      {String(label)}:{" "}
                      {v === null ? ar.know.unknownShort : v ? ar.know.yes : ar.know.no}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ConfidenceBadge level={point.confidence} isDemo={isDemo} />
              </div>
              <div className="mt-1 text-sm">
                <span className="sr-only">{ar.know.sourcesLabel}: </span>
                {point.sources.map((s) => (
                  <SourceLink key={s.url} url={s.url} label={s.title} verifiedAt={s.verifiedAt} />
                ))}
              </div>
            </>
          )}
          {unknown ? (
            <div className="mt-2">
              <ConfidenceBadge level="none" />
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
