"use client";
import { useState } from "react";
import { ar } from "@/lib/i18n/ar";
import { track } from "@/lib/events";
import type { Title } from "@schemas/title";
import { KnowStep } from "./KnowStep";
import { ConfidenceBadge } from "./ConfidenceBadge";

export function RequestTitle({
  query,
  aiEnabled,
  requestsEnabled = true,
  age,
}: {
  query: string;
  aiEnabled: boolean;
  /** الخادم يعرف إن فيه مكان يحفظ الطلب؛ بدونه ما نعرض زر يوعد بشي ما يصير. */
  requestsEnabled?: boolean;
  age: number | null;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "unstored" | "failed">("idle");
  const [ai, setAi] = useState<{
    status: "idle" | "loading" | "error";
    message?: string;
    title?: Title;
  }>({
    status: "idle",
  });

  async function request() {
    setState("sending");
    try {
      const res = await fetch("/api/request-title", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: query }),
        credentials: "omit",
      });
      const json = (await res.json().catch(() => ({}))) as { stored?: boolean };
      // الخادم يقول بصراحة لو ما انحفظ الطلب (تخزين غير مفعّل) — ما نقول «وصل» وهو ما وصل.
      setState(!res.ok ? "failed" : json.stored === false ? "unstored" : "sent");
      // حدث مجهول للعدّ فقط (بعد الموافقة)، بدون الاسم.
      if (res.ok && json.stored !== false) track({ type: "title_requested" });
    } catch {
      setState("failed");
    }
  }

  async function generate() {
    setAi({ status: "loading" });
    try {
      const res = await fetch("/api/generate-card", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: query }),
        credentials: "omit",
      });
      const json = (await res.json().catch(() => ({}))) as { title?: Title; message?: string };
      if (res.ok && json.title) setAi({ status: "idle", title: json.title });
      else setAi({ status: "error", message: json.message ?? ar.request.aiError });
    } catch {
      setAi({ status: "error", message: ar.request.aiError });
    }
  }

  return (
    <div className="grid gap-4">
      {requestsEnabled ? (
        <div className="card p-4">
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={request}
            disabled={state === "sending" || state === "sent" || !query}
          >
            {ar.request.cta}
          </button>
          <p className="mt-2 text-sm text-muted">{ar.request.ctaNote}</p>
          <p role="status" className="mt-2 font-semibold" data-testid="request-status">
            {state === "sent"
              ? ar.request.sent
              : state === "unstored"
                ? ar.request.notStored
                : state === "failed"
                  ? ar.request.failed
                  : ""}
          </p>
        </div>
      ) : (
        <p className="card p-4 text-sm text-muted" data-testid="request-disabled">
          {ar.request.disabled}
        </p>
      )}

      {aiEnabled && query ? (
        <div className="card p-4">
          <button
            type="button"
            className="btn btn-secondary w-full"
            onClick={generate}
            disabled={ai.status === "loading"}
          >
            <span aria-hidden="true">⚙</span>
            {ar.request.aiCta}
          </button>
          <p className="mt-2 text-sm text-muted">{ar.request.aiNote}</p>
          <p role="status" aria-live="polite" className="mt-2">
            {ai.status === "loading"
              ? ar.request.aiLoading
              : ai.status === "error"
                ? ai.message
                : ""}
          </p>
        </div>
      ) : null}

      {ai.title ? (
        <section aria-labelledby="ai-h" className="grid gap-3">
          <h2 id="ai-h" className="text-2xl font-extrabold">
            {ai.title.nameAr}{" "}
            <span className="text-lg text-muted" dir="ltr">
              {ai.title.nameEn}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <ConfidenceBadge level="auto" />
            <span className="text-sm text-muted">{ar.request.aiResultNote}</span>
          </div>
          <KnowStep title={ai.title} age={age} />
        </section>
      ) : null}
    </div>
  );
}
