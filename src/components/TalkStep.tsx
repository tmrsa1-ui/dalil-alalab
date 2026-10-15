"use client";
import { useMemo, useState } from "react";
import { ar } from "@/lib/i18n/ar";
import { rankPoints, selectQuestions } from "@/lib/questions/select";
import type { AgeBand } from "@schemas/common";
import type { ConversationQuestion } from "@schemas/questions";
import type { Title } from "@schemas/title";
import { ConversationCard } from "./ConversationCard";

export function TalkStep({
  title,
  bank,
  ageBand,
}: {
  title: Title;
  bank: ConversationQuestion[];
  ageBand: AgeBand;
}) {
  const [variant, setVariant] = useState(0);
  const questions = useMemo(
    () => selectQuestions(bank, { slug: title.slug, ageBand, points: rankPoints(title), variant }),
    [bank, title, ageBand, variant],
  );
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted">{ar.talk.note}</p>
      <ol className="grid gap-3" aria-live="polite" data-testid="conversation-list">
        {questions.map((q, i) => (
          <ConversationCard key={q.id} q={q} n={i + 1} />
        ))}
      </ol>
      <button type="button" className="btn btn-secondary" onClick={() => setVariant((v) => v + 1)}>
        <span aria-hidden="true">↻</span>
        {ar.talk.another}
      </button>
    </div>
  );
}
