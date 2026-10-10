"use client";
import { useId } from "react";
import { ar } from "@/lib/i18n/ar";
import type { ControlKey } from "@schemas/common";
import { SourceLink } from "./SourceLink";
import { DemoBadge } from "./DemoBadge";

export function ControlStep({
  n,
  stepAr,
  pointKey,
  sourceUrl,
  verifiedAt,
  isDemo,
  done,
  onToggle,
}: {
  n: number;
  stepAr: string;
  pointKey: ControlKey;
  sourceUrl: string;
  verifiedAt: string | null;
  isDemo: boolean;
  done: boolean;
  onToggle: (done: boolean) => void;
}) {
  const id = useId();
  return (
    <li className={`card p-3 ${done ? "border-ok/60 bg-ok-soft/40" : ""}`} data-testid="control-step">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-bold"
        >
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="chip bg-brand-soft text-brand">{ar.setup.controlKeys[pointKey]}</span>
            {isDemo ? <DemoBadge /> : null}
          </div>
          <p id={`${id}-text`}>{stepAr}</p>
          <SourceLink url={sourceUrl} verifiedAt={verifiedAt} className="text-sm" />
          <label className="mt-1 inline-flex min-h-[44px] cursor-pointer items-center gap-2 font-bold">
            <input
              type="checkbox"
              className="h-6 w-6 accent-[var(--color-brand)]"
              checked={done}
              onChange={(e) => onToggle(e.target.checked)}
              aria-describedby={`${id}-text`}
            />
            {ar.setup.done}
          </label>
        </div>
      </div>
    </li>
  );
}
