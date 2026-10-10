"use client";
import { ar } from "@/lib/i18n/ar";

import { STEP_IDS, type StepId } from "@/lib/steps";

/** شريط التقدم: اعرف ← اضبط ← تحاور ← اتفق */
export function Stepper({ current, onChange }: { current: StepId; onChange: (s: StepId) => void }) {
  const idx = STEP_IDS.indexOf(current);
  return (
    <nav
      aria-label={ar.steps.progress}
      className="sticky top-0 z-10 -mx-4 bg-bg/95 px-4 py-2 backdrop-blur"
    >
      <ol className="grid grid-cols-4 gap-1" data-testid="stepper">
        {STEP_IDS.map((s, i) => {
          const state = i < idx ? "done" : i === idx ? "current" : "todo";
          return (
            <li key={s}>
              <button
                type="button"
                onClick={() => onChange(s)}
                aria-current={state === "current" ? "step" : undefined}
                aria-label={`${ar.steps.stepOf(i + 1, 4)}: ${ar.steps[s].label}`}
                className={`flex min-h-[52px] w-full flex-col items-center justify-center rounded-xl border-2 px-1 text-sm font-bold transition-colors ${
                  state === "current"
                    ? "border-brand bg-brand text-brand-ink"
                    : state === "done"
                      ? "border-brand/50 bg-brand-soft text-brand"
                      : "border-line bg-surface text-muted"
                }`}
              >
                <span aria-hidden="true" className="num text-xs font-semibold opacity-80">
                  {state === "done" ? "✓" : i + 1}
                </span>
                <span>{ar.steps[s].label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
