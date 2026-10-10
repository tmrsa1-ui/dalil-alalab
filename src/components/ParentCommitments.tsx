"use client";
import { ar } from "@/lib/i18n/ar";
import type { AgreementFile } from "@schemas/agreement";

export function ParentCommitments({
  items,
  selected,
  onToggle,
  error,
}: {
  items: AgreementFile["parentCommitments"];
  selected: string[];
  onToggle: (id: string) => void;
  error?: string | null;
}) {
  return (
    <fieldset className="card p-4" data-testid="parent-commitments">
      <legend className="sr-only">{ar.agree.commitmentsTitle}</legend>
      <h4 className="text-lg font-bold" aria-hidden="true">
        {ar.agree.commitmentsTitle}
      </h4>
      <p className="mb-3 text-sm text-muted">{ar.agree.commitmentsLead}</p>
      <div className="grid gap-2">
        {items.map((c) => (
          <label
            key={c.id}
            className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border-2 border-line px-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
          >
            <input
              type="checkbox"
              className="h-5 w-5 accent-[var(--color-brand)]"
              checked={selected.includes(c.id)}
              onChange={() => onToggle(c.id)}
            />
            <span aria-hidden="true">{c.icon}</span>
            <span>{c.labelAr}</span>
          </label>
        ))}
      </div>
      {error ? <p className="mt-2 font-semibold text-warn">{error}</p> : null}
    </fieldset>
  );
}
