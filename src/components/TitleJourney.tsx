"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ar } from "@/lib/i18n/ar";
import { ageBandOf, parseAge } from "@/lib/age";
import { createAgreementStore } from "@/lib/agreement/store";
import { track } from "@/lib/events";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import type { Platform } from "@schemas/platform";
import type { ConversationQuestion } from "@schemas/questions";
import type { AgreementFile } from "@schemas/agreement";
import type { Title } from "@schemas/title";
import { Stepper } from "./Stepper";
import { STEP_IDS, type StepId } from "@/lib/steps";
import { KnowStep } from "./KnowStep";
import dynamic from "next/dynamic";

// خطوات «اضبط» و«تحاور» و«اتفق» تنحمل كحزم منفصلة عند أول زيارة لها (ما تثقّل «اعرف»).
const loading = () => (
  <p role="status" className="text-muted">
    {ar.loading}
  </p>
);
const PlatformTabs = dynamic(() => import("./PlatformTabs").then((m) => m.PlatformTabs), {
  loading,
});
const TalkStep = dynamic(() => import("./TalkStep").then((m) => m.TalkStep), { loading });
const AgreementFlow = dynamic(() => import("./AgreementFlow").then((m) => m.AgreementFlow), {
  loading,
});
import { AgePicker } from "./AgePicker";

export function TitleJourney({
  title,
  platforms,
  agreement,
}: {
  title: Title;
  platforms: Platform[];
  agreement: AgreementFile;
}) {
  const router = useRouter();
  // undefined = لسا ما قرينا الرابط (أول رسم من الخادم): نعرض البطاقة بدون مقارنة العمر.
  // بنك الأسئلة ينحمل بعد ما تجهز الصفحة (وقت الفراغ)، ويتخزن للاستخدام بدون إنترنت.
  const [bank, setBank] = useState<ConversationQuestion[] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/questions.json")
        .then((r) => (r.ok ? r.json() : null))
        .then((q: ConversationQuestion[] | null) => {
          if (alive && q) setBank(q);
        })
        .catch(() => {});
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(load);
    else setTimeout(load, 300);
    return () => {
      alive = false;
    };
  }, []);
  const [age, setAge] = useState<number | null | undefined>(undefined);
  const [pendingAge, setPendingAge] = useState<number | null>(null);
  const [step, setStep] = useState<StepId>("know");
  // «اتفق» ما ينحمل إلا عند أول زيارة، وبعدها يبقى mounted عشان ما تضيع حالة التسليم.
  const [agreeVisited, setAgreeVisited] = useState(false);
  useEffect(() => {
    if (step === "agree") setAgreeVisited(true);
  }, [step]);
  const band = typeof age === "number" ? ageBandOf(age) : undefined;
  const [store, setStore] = useState(() => createAgreementStore(agreement, band ?? "7to12"));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const viewed = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlStep = params.get("step");
    if (urlStep && (STEP_IDS as readonly string[]).includes(urlStep)) setStep(urlStep as StepId);
    const urlAge = parseAge(params.get("age"));
    if (urlAge !== null) {
      writeJSON(KEYS.age, String(urlAge), "session");
      setAge(urlAge);
    } else {
      setAge(parseAge(readJSON<string | null>(KEYS.age, null, "session")));
    }
  }, []);

  useEffect(() => {
    if (band) setStore(createAgreementStore(agreement, band));
  }, [band, agreement]);

  useEffect(() => {
    if (typeof age !== "number" || viewed.current) return;
    viewed.current = true;
    track({ type: "card_viewed", titleSlug: title.slug, ageBand: ageBandOf(age) });
  }, [age, title.slug]);

  const go = useCallback(
    (s: StepId, focus = true) => {
      setStep(s);
      const url = new URL(window.location.href);
      url.searchParams.set("step", s);
      if (typeof age === "number") url.searchParams.set("age", String(age));
      window.history.replaceState(null, "", url.toString());
      track({ type: "step_viewed", step: s, titleSlug: title.slug, ageBand: band });
      if (s === "talk")
        track({ type: "conversation_viewed", titleSlug: title.slug, ageBand: band });
      if (focus) {
        requestAnimationFrame(() => {
          headingRef.current?.focus();
          headingRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
        });
      }
    },
    [age, band, title.slug],
  );

  if (age === null) {
    return (
      <div className="card grid gap-4 p-4" data-testid="age-gate">
        <h2 className="text-xl font-bold">{ar.title.pickAgeTitle}</h2>
        <p className="text-muted">{ar.title.pickAgeLead}</p>
        <AgePicker value={pendingAge} onChange={setPendingAge} />
        <button
          type="button"
          className="btn btn-primary"
          disabled={pendingAge === null}
          onClick={() => {
            if (pendingAge === null) return;
            writeJSON(KEYS.age, String(pendingAge), "session");
            setAge(pendingAge);
            setStore(createAgreementStore(agreement, ageBandOf(pendingAge)));
            router.replace(`/title/${title.slug}?age=${pendingAge}`, { scroll: false });
          }}
        >
          {ar.title.continue}
        </button>
      </div>
    );
  }

  const idx = STEP_IDS.indexOf(step);
  const prev = STEP_IDS[idx - 1];
  const next = STEP_IDS[idx + 1];

  return (
    <div>
      <div className="mb-2 flex min-h-[44px] flex-wrap items-center gap-2 text-sm">
        {typeof age === "number" ? (
          <>
            <span className="chip border border-line bg-surface" data-testid="age-chip">
              {ar.title.forAge(age)}
            </span>
            <button
              type="button"
              className="btn btn-ghost min-h-[44px] px-2 text-sm"
              onClick={() => {
                setPendingAge(age);
                setAge(null);
              }}
            >
              {ar.title.changeAge}
            </button>
          </>
        ) : null}
      </div>
      <Stepper current={step} onChange={(s) => go(s)} />
      <section aria-labelledby="step-h" className="mt-4" data-testid={`step-${step}`}>
        <p className="num text-sm text-muted">{ar.steps.stepOf(idx + 1, 4)}</p>
        <h2
          id="step-h"
          ref={headingRef}
          tabIndex={-1}
          className="scroll-mt-24 text-2xl font-extrabold"
        >
          {ar.steps[step].title}
        </h2>
        <p className="mb-4 text-muted">
          {step === "setup"
            ? ar.setup.lead
            : step === "talk"
              ? ar.talk.lead
              : step === "agree"
                ? ar.agree.lead
                : ar.steps.know.short}
        </p>

        <div hidden={step !== "know"}>
          {step === "know" ? (
            <KnowStep
              title={title}
              age={age ?? null}
              reserveSummary={age === undefined}
              platforms={platforms}
            />
          ) : null}
        </div>
        <div className="lg:max-w-3xl" hidden={step !== "setup"}>
          {step === "setup" ? (
            <PlatformTabs title={title} platforms={platforms} ageBand={band} />
          ) : null}
        </div>
        <div className="lg:max-w-3xl" hidden={step !== "talk"}>
          {step === "talk" && band ? (
            bank ? (
              <TalkStep title={title} bank={bank} ageBand={band} />
            ) : (
              <p role="status" className="text-muted">
                {ar.loading}
              </p>
            )
          ) : null}
        </div>
        {/* «اتفق» يبقى mounted بعد أول زيارة عشان ما تضيع حالة التسليم لو تنقّل أحد بين الخطوات. */}
        <div className="lg:max-w-3xl" hidden={step !== "agree"}>
          {agreeVisited ? <AgreementFlow store={store} file={agreement} title={title} /> : null}
        </div>
      </section>

      <div className="mt-6 flex gap-3 lg:max-w-3xl">
        {prev ? (
          <button type="button" className="btn btn-secondary flex-1" onClick={() => go(prev)}>
            <span aria-hidden="true">→</span> {ar.steps.prev}: {ar.steps[prev].label}
          </button>
        ) : null}
        {next ? (
          <button type="button" className="btn btn-primary flex-1" onClick={() => go(next)}>
            {ar.steps.next}: {ar.steps[next].label} <span aria-hidden="true">←</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
