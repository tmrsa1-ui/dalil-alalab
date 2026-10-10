import { ar } from "@/lib/i18n/ar";
import type { Title } from "@schemas/title";
import { SourceLink } from "./SourceLink";
import { Icon } from "./Icon";

const STYLE = {
  pausable: "bg-ok-soft text-ok border-ok/40",
  not_pausable_in_match: "bg-accent-soft text-accent border-accent/40",
  unknown: "bg-surface-2 text-muted border-line",
} as const;

export function PrayerPause({ data }: { data: Title["prayerPause"] }) {
  const unknown = data.status === "unknown" || data.sources.length === 0;
  return (
    <section className="card p-4" aria-labelledby="prayer-h" data-testid="prayer-pause">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="prayer-h" className="flex items-center gap-2 text-lg font-bold">
          <Icon name="prayer" className="h-6 w-6 text-brand" />
          {ar.prayer.title}
        </h3>
        <span className={`chip border ${STYLE[unknown ? "unknown" : data.status]}`}>
          {unknown ? ar.prayer.status.unknown : ar.prayer.status[data.status]}
        </span>
      </div>
      <p className="text-sm text-muted">{ar.prayer.lead}</p>
      {!unknown ? (
        <>
          {data.noteAr ? <p className="mt-2">{data.noteAr}</p> : null}
          <div className="text-sm">
            {data.sources.map((s) => (
              <SourceLink
                key={`${s.url}|${s.quote}`}
                url={s.url}
                label={s.title}
                quote={s.quote}
                verifiedAt={s.verifiedAt}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm">{ar.know.notFound}.</p>
      )}
      <p className="mt-3 rounded-xl bg-brand-soft p-3 text-sm">{ar.prayer.tip}</p>
    </section>
  );
}
