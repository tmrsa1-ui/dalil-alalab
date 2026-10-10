"use client";
import { ar } from "@/lib/i18n/ar";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid gap-4 py-8 text-center" role="alert">
      <h1 className="text-2xl font-extrabold">{ar.error.title}</h1>
      <button type="button" className="btn btn-primary mx-auto" onClick={reset}>
        {ar.error.retry}
      </button>
    </div>
  );
}
