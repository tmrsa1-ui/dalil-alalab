import type { Metadata } from "next";
import { ar } from "@/lib/i18n/ar";
import { EVENT_TYPES } from "@schemas/event";
import { readImpact } from "@/lib/server/impact";
import type { FeedbackQuestion } from "@/lib/impact-summary";
import { formatDateAr } from "@/lib/dates";

export const metadata: Metadata = { title: ar.impact.title };
export const dynamic = "force-dynamic";

const QUESTIONS: Array<[FeedbackQuestion, string, Record<string, string>]> = [
  ["useful", ar.feedback.useful, ar.feedback.options.useful],
  ["talked", ar.feedback.talked, ar.feedback.options.talked],
  ["willUseAgain", ar.feedback.again, ar.feedback.options.willUseAgain],
];

/**
 * أعداد مجمّعة فقط: من Supabase (العرضان المجمّعان بمفتاح الخدمة) في الإنتاج،
 * أو من الملف المحلي في التطوير. بدون أي صف خام ولا ملاحظات نصية.
 */
export default async function ImpactPage() {
  const impact = await readImpact();
  const total = Object.values(impact.events).reduce((a, b) => a + b, 0);
  const measured = impact.source !== "none" && (total > 0 || impact.feedback !== null);
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
          <p className="num mt-2 text-sm text-muted">
            {ar.impact.asOf(formatDateAr(new Date()))} · {ar.impact.sourceLabel[impact.source]}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="impact-events">
            <div className="card p-3">
              <dt className="text-sm text-muted">{ar.impact.sessions}</dt>
              <dd className="num text-2xl font-extrabold">{impact.sessions}</dd>
            </div>
            {EVENT_TYPES.map((t) => (
              <div key={t} className="card p-3">
                <dt className="text-sm text-muted">{ar.impact.eventLabels[t]}</dt>
                <dd className="num text-2xl font-extrabold">{impact.events[t]}</dd>
              </div>
            ))}
          </dl>
          {impact.feedback ? (
            <section aria-labelledby="fb-h" className="mt-6" data-testid="impact-feedback">
              <h2 id="fb-h" className="text-xl font-bold">
                {ar.impact.feedbackTitle}
              </h2>
              <p className="text-sm text-muted">{ar.impact.feedbackLead}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {QUESTIONS.map(([q, label, options]) => {
                  const answers = impact.feedback![q];
                  const n = Object.values(answers).reduce((a, b) => a + b, 0);
                  return (
                    <div key={q} className="card p-3">
                      <h3 className="font-bold">{label}</h3>
                      <p className="num text-xs text-muted">{ar.impact.answers(n)}</p>
                      <ul className="mt-2 grid gap-1">
                        {Object.entries(options).map(([k, text]) => (
                          <li key={k} className="flex justify-between gap-2">
                            <span>{text}</span>
                            <span className="num font-bold">{answers[k] ?? 0}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </>
      )}
    </article>
  );
}
