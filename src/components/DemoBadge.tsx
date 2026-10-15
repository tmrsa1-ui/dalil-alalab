import { ar } from "@/lib/i18n/ar";

export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`chip bg-demo-soft text-demo border border-demo/40 ${className}`}
      title={ar.demo.explain}
      data-testid="demo-badge"
    >
      <span aria-hidden="true">◇</span>
      {ar.demo.badge}
      <span className="sr-only"> — {ar.demo.explain}</span>
    </span>
  );
}
