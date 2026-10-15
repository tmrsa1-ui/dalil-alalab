"use client";
import { ar } from "@/lib/i18n/ar";
import { compareAge } from "@/lib/age";
import { POINT_KEYS } from "@schemas/keys";
import { type Title } from "@schemas/title";
import { RATING_KEYS } from "@schemas/keys";

/**
 * «الصورة باختصار»: سطرين فوق صفحة «اعرف» يلخصون الموجود فقط (بدون حكم ولا تحويل بين الجهات).
 * كل سطر هنا مأخوذ من نفس البيانات اللي تحت بمصادرها.
 */
export function KnowGlance({
  title,
  age,
  pending = false,
}: {
  title: Title;
  age: number | null;
  /** العمر ما انقرى بعد (قبل hydration): نحجز مكان المقارنة عشان ما يتحرك التخطيط. */
  pending?: boolean;
}) {
  const rows = RATING_KEYS.map((key) => {
    const r = title.ratings[key];
    const available = r.value !== null && !!r.sourceUrl && !!r.verifiedAt;
    const cmp = available && age !== null ? compareAge(key, r.value, age) : "unavailable";
    return { key, value: r.value, available, cmp };
  });
  const gcam = rows[0]!;
  const others = rows.slice(1).filter((x) => x.available);
  const present = POINT_KEYS.filter(
    (k) =>
      k !== "sessionPause" &&
      title.attentionPoints[k].status !== "unknown" &&
      title.attentionPoints[k].status !== "absent" &&
      title.attentionPoints[k].sources.length > 0,
  );
  const unknown = POINT_KEYS.filter(
    (k) =>
      title.attentionPoints[k].status === "unknown" ||
      title.attentionPoints[k].sources.length === 0,
  );
  const loot = title.familyLens.gambling.status === "present";
  const allAuto =
    !title.isDemo &&
    rows.every((x) => !x.available || title.ratings[x.key].confidence !== "human") &&
    POINT_KEYS.every((k) => title.attentionPoints[k].confidence !== "human");
  const g = ar.know.glance;
  // اكتمال البيانات: 5 تصنيفات + 5 نقاط، وآخر تاريخ تحقق من أي مصدر.
  const filled =
    rows.filter((x) => x.available).length + POINT_KEYS.filter((k) => !unknown.includes(k)).length;
  const dates = [
    ...RATING_KEYS.map((k) => title.ratings[k].verifiedAt),
    ...POINT_KEYS.flatMap((k) => title.attentionPoints[k].sources.map((s) => s.verifiedAt)),
  ].filter((d): d is string => !!d);
  const lastChecked = dates.length && !title.isDemo ? dates.sort().at(-1)! : null;
  const name = (k: (typeof POINT_KEYS)[number]) => ar.know.points[k].title;

  return (
    <section
      aria-labelledby="glance-h"
      className="card border-brand/30 bg-brand-soft/40 p-4"
      data-testid="know-glance"
    >
      <h3 id="glance-h" className="text-lg font-bold">
        {g.title}
      </h3>
      <ul className="mt-2 grid gap-2">
        <li data-testid="glance-saudi">
          <strong>{g.saudi}: </strong>
          {gcam.available ? (
            <>
              <span className="num font-bold" dir="ltr">
                {gcam.value}
              </span>
              {pending ? (
                <span className="invisible" aria-hidden="true">
                  {" "}
                  — {g.within}
                </span>
              ) : gcam.cmp !== "unavailable" ? (
                <span className={gcam.cmp === "above" ? "font-semibold text-warn" : "text-ok"}>
                  {" "}
                  — {gcam.cmp === "above" ? g.above : g.within}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-muted">{g.saudiMissing}</span>
          )}
        </li>
        {others.length ? (
          <li data-testid="glance-others">
            <strong>{g.otherRatings}: </strong>
            {others.map((x, i) => (
              <span key={x.key}>
                {i ? "، " : ""}
                <bdi dir="ltr" className="whitespace-nowrap">
                  {ar.know.systems[x.key].short} {x.value}
                </bdi>
              </span>
            ))}
          </li>
        ) : null}
        {present.length ? (
          <li data-testid="glance-present">
            <strong>{g.present}: </strong>
            {present.map(name).join("، ")}.{loot ? ` ${g.lootBoxes}` : ""}
          </li>
        ) : null}
        {unknown.length ? (
          <li className="text-muted" data-testid="glance-unknown">
            {g.unknown}: {unknown.map(name).join("، ")}.
          </li>
        ) : null}
      </ul>
      <p className="mt-2 text-sm" data-testid="glance-coverage">
        <span className="num">{g.coverage(filled, 10)}</span>
        {lastChecked ? (
          <span className="num text-muted"> · {g.lastChecked(lastChecked)}</span>
        ) : null}
      </p>
      {allAuto ? <p className="mt-1 text-sm text-info">{g.allAuto}</p> : null}
      <p className="mt-1 text-sm text-muted">{g.details}</p>
    </section>
  );
}
