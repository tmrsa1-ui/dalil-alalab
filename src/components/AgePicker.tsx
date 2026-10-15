"use client";
import { useId } from "react";
import { ar } from "@/lib/i18n/ar";
import { MAX_AGE, MIN_AGE } from "@/lib/age";

const AGES = Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i);

/** مجموعة أزرار راديو للأعمار من 3 إلى 17 (أهداف لمس ≥ 44px). */
export function AgePicker({
  value,
  onChange,
  error,
  legend = ar.home.ageLabel,
}: {
  value: number | null;
  onChange: (age: number) => void;
  error?: string | null;
  legend?: string;
}) {
  const name = useId();
  return (
    <fieldset aria-describedby={`${name}-hint${error ? ` ${name}-err` : ""}`}>
      <legend className="mb-1 font-bold">{legend}</legend>
      <p id={`${name}-hint`} className="mb-2 text-sm text-muted">
        {ar.home.ageHint}
      </p>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8" data-testid="age-picker">
        {AGES.map((n) => (
          <label key={n} className="relative">
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label={ar.home.ageOption(n)}
            />
            <span
              aria-hidden="true"
              className="num flex min-h-[48px] items-center justify-center rounded-xl border-2 border-line bg-surface text-lg font-bold peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-ink peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
            >
              {n}
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p id={`${name}-err`} className="mt-1 text-sm font-semibold text-warn">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
