"use client";
import { useId } from "react";
import { ar } from "@/lib/i18n/ar";
import type { ControlKey } from "@schemas/common";
import { SourceLink } from "./SourceLink";
import { DemoBadge } from "./DemoBadge";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { BidiText } from "./BidiText";
import { splitStepPath } from "@/lib/step-path";

export function ControlStep({
  n,
  stepAr,
  pointKey,
  sourceUrl,
  verifiedAt,
  isDemo,
  quote,
  confidence,
  done,
  onToggle,
}: {
  n: number;
  stepAr: string;
  pointKey: ControlKey;
  sourceUrl: string;
  verifiedAt: string | null;
  isDemo: boolean;
  quote?: string;
  confidence?: "human" | "auto";
  done: boolean;
  onToggle: (done: boolean) => void;
}) {
  const id = useId();
  const { path, rest } = splitStepPath(stepAr);
  return (
    <li
      className={`card p-3 ${done ? "border-ok/60 bg-ok-soft/40" : ""}`}
      data-testid="control-step"
    >
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
          <p id={`${id}-text`} className="sr-only">
            {stepAr}
          </p>
          <div aria-hidden="true">
            {path.length ? (
              <ol className="mb-1 flex flex-wrap items-center gap-1 text-sm">
                {path.map((seg, i) => (
                  <li key={i} className="flex items-center gap-1">
                    {i > 0 ? <span className="text-muted">←</span> : null}
                    <bdi className="rounded-md bg-surface-2 px-1.5 py-0.5 font-semibold">{seg}</bdi>
                  </li>
                ))}
              </ol>
            ) : null}
            {rest ? (
              <p>
                <BidiText text={rest} />
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-2">
            <SourceLink url={sourceUrl} verifiedAt={verifiedAt} quote={quote} className="text-sm" />
            {confidence ? <ConfidenceBadge level={confidence} /> : null}
          </div>
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
