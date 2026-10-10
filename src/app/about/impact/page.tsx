import type { Metadata } from "next";
import { ar } from "@/lib/i18n/ar";
import { EVENT_TYPES } from "@schemas/event";
import { readLocal } from "@/lib/server/sink";
import { formatDateAr } from "@/lib/dates";

export const metadata: Metadata = { title: ar.impact.title };
export const dynamic = "force-dynamic";

/**
 * أعداد مجمّعة فقط. المصدر: ملف الأحداث المحلي (dev) — مع Supabase تُقرأ الأرقام
 * من لوحة Supabase أو استعلام SQL (RLS يمنع القراءة بالمفتاح العام عمدًا).
 */
export default async function ImpactPage() {
  const events = await readLocal("events");
  const counts = Object.fromEntries(EVENT_TYPES.map((t) => [t, 0])) as Record<string, number>;
  const sessions = new Set<string>();
  for (const e of events) {
    if (typeof e.type === "string" && e.type in counts) counts[e.type]!++;
    if (typeof e.session_id === "string") sessions.add(e.session_id);
  }
  const measured = events.length > 0;
  return (
    <article>
      <h1 className="text-3xl font-extrabold">{ar.impact.title}</h1>
      <p className="mt-2 text-muted">{ar.impact.lead}</p>
      {!measured ? (
        <div className="card mt-4 p-4" data-testid="impact-empty">
          <p className="text-xl font-bold">{ar.impact.notMeasured}</p>
          <p className="mt-1 text-muted">{ar.impact.notMeasuredLead}</p>
        </div>
      ) : (
        <>
          <p className="num mt-2 text-sm">{ar.impact.asOf(formatDateAr(new Date()))}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="card p-3">
              <dt className="text-sm text-muted">{ar.impact.sessions}</dt>
              <dd className="num text-2xl font-extrabold">{sessions.size}</dd>
            </div>
            {EVENT_TYPES.map((t) => (
              <div key={t} className="card p-3">
                <dt className="text-sm text-muted">{ar.impact.eventLabels[t]}</dt>
                <dd className="num text-2xl font-extrabold">{counts[t]}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </article>
  );
}
