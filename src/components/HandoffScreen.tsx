"use client";
import { useEffect, useRef } from "react";

/** شاشة تسليم الجوال: تخفي كل شي قبلها وتطلب تأكيد صريح. */
export function HandoffScreen({
  icon,
  title,
  lead,
  action,
  onReady,
  testId,
}: {
  icon: string;
  title: string;
  lead: string;
  action: string;
  onReady: () => void;
  testId: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <div
      className="card flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-brand-soft p-6 text-center"
      data-testid={testId}
    >
      <span aria-hidden="true" className="text-7xl">
        {icon}
      </span>
      <h3 ref={ref} tabIndex={-1} className="text-2xl font-extrabold">
        {title}
      </h3>
      <p className="max-w-sm text-lg">{lead}</p>
      <button type="button" className="btn btn-primary w-full max-w-xs text-lg" onClick={onReady}>
        {action}
      </button>
    </div>
  );
}
