import { ar } from "@/lib/i18n/ar";
import { POINT_KEYS } from "@schemas/keys";
import type { Title } from "@schemas/title";
import type { Platform } from "@schemas/platform";
import { RatingTable } from "./RatingTable";
import { AttentionPoint } from "./AttentionPoint";
import { FamilyLens } from "./FamilyLens";
import { PrayerPause } from "./PrayerPause";
import { KnowGlance } from "./KnowGlance";

export function KnowStep({
  title,
  age,
  reserveSummary = false,
  platforms = [],
}: {
  title: Title;
  platforms?: Platform[];
  age: number | null;
  /** يحجز مكان سطر الملخص قبل ما نعرف العمر (يمنع إزاحة التخطيط). */
  reserveSummary?: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      {/* على الشاشات العريضة: «الصورة باختصار» عمود جانبي ثابت، والتفاصيل في العمود الرئيسي. */}
      <div className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-4 lg:row-start-1">
        <KnowGlance title={title} age={age} pending={reserveSummary} />
      </div>
      <section aria-labelledby="ratings-h" className="lg:col-start-1">
        <h3 id="ratings-h" className="text-xl font-bold">
          {ar.know.ratingsTitle}
        </h3>
        <p className="mb-3 text-sm text-muted">{ar.know.ratingsLead}</p>
        <RatingTable ratings={title.ratings} age={age} reserveSummary={reserveSummary} />
      </section>
      <section aria-labelledby="points-h" className="lg:col-start-1">
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
      <div className="lg:col-start-1">
        <FamilyLens lens={title.familyLens} />
      </div>
      <div className="lg:col-start-1">
        <PrayerPause data={title.prayerPause} platforms={platforms} />
      </div>
    </div>
  );
}
