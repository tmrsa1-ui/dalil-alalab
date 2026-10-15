import { ar } from "@/lib/i18n/ar";
import type { Title } from "@schemas/title";
import type { Platform } from "@schemas/platform";
import { SourceLink } from "./SourceLink";
import { Icon } from "./Icon";
import { BidiText } from "./BidiText";

const STYLE = {
  pausable: "bg-ok-soft text-ok border-ok/40",
  not_pausable_in_match: "bg-accent-soft text-accent border-accent/40",
  unknown: "bg-surface-2 text-muted border-line",
} as const;

/** خطوة «وقت التوقف/الجدول» لكل جهاز من دليله الرسمي (أفضّل اللي فيها جدول أو توقف). */
function downtimeSteps(platforms: Platform[]) {
  return platforms.flatMap((p) => {
    const list = p.steps.filter((s) => !s.isDemo && s.pointKey === "sessionPause");
    const best = list.find((s) => /جدول|التوقّف|توقف|إيقاف/.test(s.stepAr)) ?? list[0];
    return best ? [{ platform: p, step: best }] : [];
  });
}

export function PrayerPause({
  data,
  platforms = [],
}: {
  data: Title["prayerPause"];
  platforms?: Platform[];
}) {
  const unknown = data.status === "unknown" || data.sources.length === 0;
  const tools = downtimeSteps(platforms);
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
      <div className="mt-3 rounded-xl bg-brand-soft p-3 text-sm">
        <p>{ar.prayer.tip}</p>
        {tools.length ? (
          <details className="group mt-1" data-testid="prayer-tools">
            <summary className="flex min-h-[44px] cursor-pointer items-center gap-1 font-semibold text-brand">
              <span
                aria-hidden="true"
                className="inline-block transition-transform group-open:rotate-90 motion-reduce:transition-none"
              >
                ‹
              </span>
              {ar.prayer.toolsTitle}
            </summary>
            <ul className="grid gap-2">
              {tools.map(({ platform, step }) => (
                <li key={step.id}>
                  <strong>{platform.nameAr}: </strong>
                  <BidiText text={step.stepAr} />
                  <SourceLink
                    url={step.sourceUrl}
                    verifiedAt={step.verifiedAt}
                    quote={step.quote}
                    className="text-xs"
                  />
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </section>
  );
}
