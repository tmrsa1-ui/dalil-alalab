import { ar } from "@/lib/i18n/ar";
import type { ConversationQuestion } from "@schemas/questions";

export function ConversationCard({ q, n }: { q: ConversationQuestion; n: number }) {
  const tag =
    q.pointKey === "friends" ? ar.talk.friendsTag : ar.talk.pointTag(ar.know.points[q.pointKey].title);
  return (
    <li className="card p-4" data-testid="conversation-card" data-point={q.pointKey}>
      <div className="mb-2 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="num flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft font-bold text-accent"
        >
          {n}
        </span>
        <span className="chip border border-line bg-surface-2">{tag}</span>
      </div>
      <p className="text-xl font-bold leading-relaxed">«{q.textAr}»</p>
      <details className="group mt-3 rounded-xl bg-surface-2 p-3">
        <summary className="flex min-h-[44px] cursor-pointer items-center font-semibold text-brand">
          {ar.talk.why}
        </summary>
        <p className="mt-1">{q.whyAr}</p>
        <p className="mt-2">
          <strong>{ar.talk.ifTheySay}</strong> {q.ifTheySayAr.replace(/^إذا (قال|قالت)\s*/, "")}
        </p>
      </details>
    </li>
  );
}
