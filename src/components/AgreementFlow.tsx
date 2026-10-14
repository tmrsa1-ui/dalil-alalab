"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";
import { ar } from "@/lib/i18n/ar";
import { SUGGESTED, type AgreementStore } from "@/lib/agreement/store";
import { reviewDate } from "@/lib/agreement/merge";
import { newId, saveAgreement } from "@/lib/storage";
import { track } from "@/lib/events";
import type { AgreementFile, AgreementQuestion } from "@schemas/agreement";
import type { Title } from "@schemas/title";
import { HandoffScreen } from "./HandoffScreen";
import { ParentCommitments } from "./ParentCommitments";
import { Icon } from "@/components/Icon";

function OptionGroup({
  q,
  value,
  onChange,
  variant,
}: {
  q: AgreementQuestion;
  value: string | undefined;
  onChange: (id: string) => void;
  variant: "parent" | "child" | "picture";
}) {
  const name = `${variant}-${q.id}`;
  const big = variant !== "parent";
  return (
    <fieldset className="card p-4" data-testid={`${variant}-question-${q.id}`}>
      <legend className={`${big ? "text-2xl" : "text-lg"} mb-3 font-bold`}>
        {variant === "parent" ? q.textParentAr : q.textChildAr}
      </legend>
      <div className={big ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "grid gap-2"}>
        {q.options.map((o) => (
          <label
            key={o.id}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-line bg-surface px-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${
              big ? "min-h-[72px] text-xl font-bold" : "min-h-[52px]"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.id}
              checked={value === o.id}
              onChange={() => onChange(o.id)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={variant === "picture" ? "text-5xl" : big ? "text-3xl" : "text-xl"}
            >
              {o.icon}
            </span>
            <span>{variant === "parent" ? o.labelAr : o.childLabelAr}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function AgreementFlow({
  store,
  file,
  title,
}: {
  store: StoreApi<AgreementStore>;
  file: AgreementFile;
  title: Pick<Title, "slug" | "nameAr" | "isDemo">;
}) {
  const s = useStore(store);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  if (s.stage === "mode") {
    return (
      <div className="grid gap-3" data-testid="agree-mode">
        <p className="text-lg">{ar.agree.under7Lead}</p>
        <button
          type="button"
          className="btn btn-primary text-lg"
          onClick={() => s.chooseMode(false)}
        >
          {ar.agree.under7ParentOnly}
        </button>
        <button
          type="button"
          className="btn btn-secondary text-lg"
          onClick={() => s.chooseMode(true)}
        >
          <span aria-hidden="true">🖼️</span>
          {ar.agree.under7WithChild}
        </button>
      </div>
    );
  }

  if (s.stage === "parent") {
    return (
      <div className="grid gap-4" data-testid="agree-parent">
        <div>
          <h3 className="text-xl font-bold">{ar.agree.parentTurn}</h3>
          <p className="text-muted">{s.withChild ? ar.agree.parentLead : ar.agree.under7Lead}</p>
        </div>
        {file.questions.map((q) => (
          <OptionGroup
            key={q.id}
            q={q}
            variant="parent"
            value={s.parentAnswers[q.id]}
            onChange={(o) => s.setParent(q.id, o)}
          />
        ))}
        {error ? (
          <p role="alert" className="font-semibold text-warn">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="btn btn-primary text-lg"
          onClick={() => {
            if (file.questions.some((q) => !s.parentAnswers[q.id]))
              return setError(ar.agree.needAllAnswers);
            setError(null);
            s.finishParent();
          }}
        >
          {ar.steps.next}
        </button>
      </div>
    );
  }

  if (s.stage === "handoffChild") {
    return (
      <HandoffScreen
        testId="handoff-child"
        icon={<Icon name="handoff" className="h-16 w-16" />}
        title={ar.agree.handoffToChild}
        lead={ar.agree.handoffToChildLead}
        action={ar.agree.handoffReady}
        onReady={s.childReady}
      />
    );
  }

  if (s.stage === "child") {
    // واجهة الطفل: ما تستقبل اختيارات الأب إطلاقًا.
    const q = file.questions[s.childIndex]!;
    const last = s.childIndex === file.questions.length - 1 && s.ageBand !== "13plus";
    return (
      <div className="grid gap-4" data-testid="agree-child">
        <div>
          <p className="num text-sm text-muted">
            {ar.agree.questionOf(s.childIndex + 1, file.questions.length)}
          </p>
          <h3 className="text-2xl font-extrabold">{ar.agree.childTurn}</h3>
          <p className="text-lg">{ar.agree.childLead}</p>
        </div>
        <OptionGroup
          key={q.id}
          q={q}
          variant={s.ageBand === "under7" ? "picture" : "child"}
          value={s.childAnswers[q.id]}
          onChange={(o) => s.setChild(q.id, o)}
        />
        <button
          type="button"
          className="btn btn-primary text-xl"
          aria-disabled={!s.childAnswers[q.id]}
          onClick={s.childNext}
        >
          {last ? ar.agree.childDone : ar.agree.childNext}
        </button>
      </div>
    );
  }

  if (s.stage === "teen") {
    return (
      <div className="grid gap-4" data-testid="agree-teen">
        <fieldset className="card p-4">
          <legend className="text-2xl font-extrabold">{ar.agree.teenSuggestTitle}</legend>
          <p className="mb-3 text-muted">{ar.agree.teenSuggestLead}</p>
          <div className="grid gap-2">
            {file.teenSuggestions.map((t) => (
              <label
                key={t.id}
                className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border-2 border-line px-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[var(--color-brand)]"
                  checked={s.teenPicks.includes(t.id)}
                  onChange={() => s.toggleTeen(t.id)}
                />
                <span aria-hidden="true">{t.icon}</span>
                <span>{t.labelAr}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="button" className="btn btn-primary text-xl" onClick={s.finishChild}>
          {ar.agree.childDone}
        </button>
      </div>
    );
  }

  if (s.stage === "handoffParent") {
    return (
      <HandoffScreen
        testId="handoff-parent"
        icon={<Icon name="handoff" className="h-16 w-16 -scale-x-100" />}
        title={ar.agree.handoffToParent}
        lead={ar.agree.handoffToParentLead}
        action={ar.agree.handoffParentReady}
        onReady={s.parentReady}
      />
    );
  }

  // result
  const save = () => {
    if (s.commitments.length === 0) return setError(ar.agree.needCommitment);
    const now = new Date();
    const id = newId();
    saveAgreement({
      id,
      titleSlug: title.slug,
      titleNameAr: title.nameAr,
      isDemo: title.isDemo,
      clauses: s.clauses.map((c) => ({
        questionId: c.questionId,
        clauseAr: c.clauseAr,
        kind: c.kind,
      })),
      teenClauses: s.acceptedTeen
        .map((x) => file.teenSuggestions.find((t) => t.id === x)?.labelAr)
        .filter((x): x is string => !!x),
      parentCommitments: s.commitments
        .map((x) => file.parentCommitments.find((c) => c.id === x)?.labelAr)
        .filter((x): x is string => !!x),
      createdAt: now.toISOString(),
      reviewAt: reviewDate(now).toISOString(),
    });
    track({ type: "agreement_completed", titleSlug: title.slug, ageBand: s.ageBand });
    router.push(`/agreement/print?id=${encodeURIComponent(id)}`);
  };

  return (
    <div className="grid gap-4" data-testid="agree-result">
      <div>
        <h3 className="text-xl font-bold">{ar.agree.resultTitle}</h3>
        <p className="text-muted">{ar.agree.resultLead}</p>
      </div>
      <ol className="grid gap-3">
        {s.clauses.map((c) => {
          const q = file.questions.find((x) => x.id === c.questionId)!;
          const suggested = s.suggested.find((x) => x.questionId === c.questionId);
          const customSuggested = suggested && suggested.optionId === null;
          const selectId = `edit-${c.questionId}`;
          return (
            <li
              key={c.questionId}
              className="card p-4"
              data-testid={`clause-${c.questionId}`}
              data-kind={c.kind}
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted">{q.textParentAr}</span>
                <span
                  className={`chip border ${
                    c.kind === "agreed"
                      ? "border-ok/40 bg-ok-soft text-ok"
                      : c.kind === "midpoint"
                        ? "border-info/40 bg-info-soft text-info"
                        : "border-line bg-surface-2"
                  }`}
                >
                  {ar.agree.kind[c.kind]}
                </span>
              </div>
              <p className="text-lg font-bold" data-testid="clause-text">
                {c.clauseAr}
              </p>
              <label htmlFor={selectId} className="mt-2 block text-sm font-semibold">
                {ar.agree.editClause}
              </label>
              <select
                id={selectId}
                className="field mt-1"
                value={c.optionId ?? SUGGESTED}
                onChange={(e) => s.editClause(c.questionId, e.target.value)}
              >
                {customSuggested ? (
                  <option
                    value={SUGGESTED}
                  >{`${ar.agree.keepMidpoint}: ${suggested.clauseAr}`}</option>
                ) : null}
                {q.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.clauseAr}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ol>

      {s.teenProposals.length ? (
        <fieldset className="card p-4" data-testid="teen-proposals">
          <legend className="text-lg font-bold">{ar.agree.teenProposed}</legend>
          <div className="mt-2 grid gap-2">
            {s.teenProposals.map((id) => {
              const t = file.teenSuggestions.find((x) => x.id === id);
              if (!t) return null;
              return (
                <label key={id} className="flex min-h-[48px] cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[var(--color-brand)]"
                    checked={s.acceptedTeen.includes(id)}
                    onChange={() => s.toggleAcceptTeen(id)}
                  />
                  <span>
                    {t.labelAr} <span className="text-sm text-muted">— {ar.agree.acceptTeen}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <ParentCommitments
        items={file.parentCommitments}
        selected={s.commitments}
        onToggle={(id) => {
          setError(null);
          s.toggleCommitment(id);
        }}
        error={error}
      />

      <p className="rounded-xl bg-surface-2 p-3 text-sm">{ar.agree.privacyNote}</p>
      <button type="button" className="btn btn-primary text-lg" onClick={save}>
        <Icon name="print" className="h-5 w-5" />
        {ar.agree.save}
      </button>
      <button type="button" className="btn btn-ghost" onClick={s.reset}>
        {ar.agree.startOver}
      </button>
    </div>
  );
}
