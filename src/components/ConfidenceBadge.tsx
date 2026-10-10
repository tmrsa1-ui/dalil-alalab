import { ar } from "@/lib/i18n/ar";
import type { Confidence } from "@schemas/title";

const STYLE: Record<Confidence, string> = {
  human: "bg-ok-soft text-ok border-ok/40",
  auto: "bg-info-soft text-info border-info/40",
  none: "bg-surface-2 text-muted border-line",
};
const ICON: Record<Confidence, string> = { human: "✓", auto: "⚙", none: "—" };

export function ConfidenceBadge({ level, isDemo = false }: { level: Confidence; isDemo?: boolean }) {
  return (
    <span
      className={`chip border ${STYLE[level]}`}
      title={ar.confidence.explain[level]}
      data-testid={`confidence-${level}`}
    >
      <span aria-hidden="true">{ICON[level]}</span>
      {ar.confidence[level]}
      {isDemo && level !== "none" ? <span className="font-normal">· {ar.confidence.demoSuffix}</span> : null}
    </span>
  );
}
