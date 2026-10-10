"use client";
import { useEffect, useState } from "react";
import { ar } from "@/lib/i18n/ar";
import { track } from "@/lib/events";
import { getConsent } from "@/lib/storage";

type Answers = {
  useful?: "yes" | "somewhat" | "no";
  talked?: "yes" | "planned" | "no";
  willUseAgain?: "yes" | "maybe" | "no";
};

/** تقييم اختياري للأب فقط، يحتاج موافقة صريحة على الأحداث المجهولة. */
export function FeedbackForm({ titleSlug }: { titleSlug?: string }) {
  const [consent, setConsentState] = useState<string | null>(null);
  const [a, setA] = useState<Answers>({});
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  useEffect(() => {
    setConsentState(getConsent());
    const f = () => setConsentState(getConsent());
    window.addEventListener("dalil:consent", f);
    return () => window.removeEventListener("dalil:consent", f);
  }, []);

  const groups = [
    ["useful", ar.feedback.useful, ar.feedback.options.useful],
    ["talked", ar.feedback.talked, ar.feedback.options.talked],
    ["willUseAgain", ar.feedback.again, ar.feedback.options.willUseAgain],
  ] as const;
  const complete = a.useful && a.talked && a.willUseAgain;

  return (
    <section className="card p-4" aria-labelledby="fb-h" data-testid="feedback">
      <h2 id="fb-h" className="text-lg font-bold">
        {ar.feedback.title}
      </h2>
      <p className="text-sm text-muted">{ar.feedback.lead}</p>
      {consent !== "granted" ? (
        <p className="mt-2 text-sm">{ar.feedback.needConsent}</p>
      ) : sent ? (
        <p role="status" className="mt-2 font-semibold text-ok">
          {ar.feedback.sent}
        </p>
      ) : (
        <form
          className="mt-3 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!complete) return;
            track({
              type: "feedback",
              titleSlug,
              feedback: {
                useful: a.useful!,
                talked: a.talked!,
                willUseAgain: a.willUseAgain!,
                parentNote: note.trim() ? note.trim().slice(0, 500) : undefined,
              },
            });
            setSent(true);
          }}
        >
          {groups.map(([key, label, opts]) => (
            <fieldset key={key}>
              <legend className="font-semibold">{label}</legend>
              <div className="mt-1 flex flex-wrap gap-2">
                {Object.entries(opts).map(([v, l]) => (
                  <label
                    key={v}
                    className="btn btn-secondary cursor-pointer has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name={key}
                      value={v}
                      checked={a[key] === v}
                      onChange={() => setA((x) => ({ ...x, [key]: v }))}
                    />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <label className="grid gap-1">
            <span className="font-semibold">{ar.feedback.note}</span>
            <textarea
              className="field min-h-24 py-2"
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={!complete}>
            {ar.feedback.send}
          </button>
        </form>
      )}
    </section>
  );
}
