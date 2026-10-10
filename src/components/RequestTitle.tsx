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
  age,
}: {
  query: string;
  aiEnabled: boolean;
  age: number | null;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
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
      setState(res.ok ? "sent" : "failed");
      // حدث مجهول للعدّ فقط (بعد الموافقة)، بدون الاسم.
      track({ type: "title_requested" });
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
          {state === "sent" ? ar.request.sent : state === "failed" ? ar.request.failed : ""}
        </p>
      </div>

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
