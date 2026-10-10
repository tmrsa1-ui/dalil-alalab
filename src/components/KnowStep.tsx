import { ar } from "@/lib/i18n/ar";
import { POINT_KEYS } from "@schemas/common";
import type { Title } from "@schemas/title";
import { RatingTable } from "./RatingTable";
import { AttentionPoint } from "./AttentionPoint";
import { FamilyLens } from "./FamilyLens";
import { PrayerPause } from "./PrayerPause";
import { KnowGlance } from "./KnowGlance";

export function KnowStep({
  title,
  age,
  reserveSummary = false,
}: {
  title: Title;
  age: number | null;
  /** يحجز مكان سطر الملخص قبل ما نعرف العمر (يمنع إزاحة التخطيط). */
  reserveSummary?: boolean;
}) {
  return (
    <div className="grid gap-6">
      <KnowGlance title={title} age={age} pending={reserveSummary} />
      <section aria-labelledby="ratings-h">
        <h3 id="ratings-h" className="text-xl font-bold">
          {ar.know.ratingsTitle}
        </h3>
        <p className="mb-3 text-sm text-muted">{ar.know.ratingsLead}</p>
        <RatingTable ratings={title.ratings} age={age} reserveSummary={reserveSummary} />
      </section>
      <section aria-labelledby="points-h">
        <h3 id="points-h" className="text-xl font-bold">
          {ar.know.pointsTitle}
        </h3>
        <p className="mb-3 text-sm text-muted">{ar.know.pointsLead}</p>
        <ol className="grid gap-3" data-testid="attention-points">
          {POINT_KEYS.map((k, i) => (
            <AttentionPoint
              key={k}
              pointKey={k}
              index={i + 1}
              point={title.attentionPoints[k]}
              isDemo={title.isDemo}
            />
          ))}
        </ol>
      </section>
      <FamilyLens lens={title.familyLens} />
      <PrayerPause data={title.prayerPause} />
    </div>
  );
}
