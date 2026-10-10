"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ar } from "@/lib/i18n/ar";
import { CONTROL_KEYS, PLATFORM_IDS, type PlatformId } from "@schemas/common";
import type { Platform } from "@schemas/platform";
import type { Title } from "@schemas/title";
import { getDoneSteps, setStepDone } from "@/lib/storage";
import { track } from "@/lib/events";
import type { AgeBand } from "@schemas/common";
import { ControlStep } from "./ControlStep";
import { SourceLink } from "./SourceLink";
import { ConfidenceBadge } from "./ConfidenceBadge";

type TabId = PlatformId | "inGame";

type StepView = {
  id: string;
  pointKey: (typeof CONTROL_KEYS)[number];
  stepAr: string;
  sourceUrl: string;
  verifiedAt: string | null;
  isDemo: boolean;
};

const byKey = (a: StepView, b: StepView) =>
  CONTROL_KEYS.indexOf(a.pointKey) - CONTROL_KEYS.indexOf(b.pointKey);

export function PlatformTabs({
  title,
  platforms,
  ageBand,
}: {
  title: Title;
  platforms: Platform[];
  ageBand: AgeBand | undefined;
}) {
  const reviewed = title.reviewStatus === "human_reviewed";
  const tabs: TabId[] = useMemo(() => {
    const list: TabId[] = title.platforms.length ? [...title.platforms] : [...PLATFORM_IDS];
    if ((reviewed && title.controls.inGame.length) || title.controls.officialGuide)
      list.push("inGame");
    return list;
  }, [title, reviewed]);

  const [active, setActive] = useState<TabId>(tabs[0] ?? "ios");
  const [done, setDone] = useState<string[]>([]);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => setDone(getDoneSteps(title.slug)), [title.slug]);

  function stepsFor(tab: TabId): StepView[] {
    if (tab === "inGame") {
      return title.controls.inGame.map((s) => ({ ...s, isDemo: title.isDemo })).sort(byKey);
    }
    const override = title.controls.platformOverrides[tab];
    if (override?.length) return override.map((s) => ({ ...s, isDemo: title.isDemo })).sort(byKey);
    const p = platforms.find((x) => x.id === tab);
    return (p?.steps ?? []).slice().sort(byKey);
  }

  function onKey(e: React.KeyboardEvent, i: number) {
    // RTL: السهم الأيسر = التالي.
    const delta = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
    let next = -1;
    if (delta) next = (i + delta + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;
    if (next >= 0) {
      e.preventDefault();
      const t = tabs[next]!;
      setActive(t);
      tabRefs.current[t]?.focus();
    }
  }

  const label = (t: TabId) => (t === "inGame" ? ar.setup.inGame : ar.setup.platforms[t]);
  const platform = active === "inGame" ? null : platforms.find((p) => p.id === active);
  const steps = reviewed ? stepsFor(active) : [];
  const doneCount = steps.filter((s) => done.includes(s.id)).length;

  return (
    <div>
      {!title.platforms.length ? (
        <p className="mb-2 text-sm text-muted">{ar.setup.noPlatforms}</p>
      ) : null}
      <div
        role="tablist"
        aria-label={ar.setup.tabsLabel}
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2"
        data-testid="platform-tabs"
      >
        {tabs.map((t, i) => (
          <button
            key={t}
            ref={(el) => {
              tabRefs.current[t] = el;
            }}
            role="tab"
            type="button"
            id={`tab-${t}`}
            aria-selected={active === t}
            aria-controls={`panel-${t}`}
            tabIndex={active === t ? 0 : -1}
            onClick={() => setActive(t)}
            onKeyDown={(e) => onKey(e, i)}
            className={`btn shrink-0 whitespace-nowrap text-sm ${
              active === t ? "btn-primary" : "btn-secondary"
            }`}
          >
            {label(t)}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        tabIndex={0}
        className="mt-2"
      >
        {platform ? (
          <div className="card mb-3 p-3">
            <div className="text-sm text-muted">
              {ar.setup.tool}:{" "}
              <span dir="ltr" className="font-semibold text-ink">
                {platform.toolNameEn}
              </span>
            </div>
            {platform.officialGuideUrl ? (
              <>
                <SourceLink
                  url={platform.officialGuideUrl}
                  label={ar.setup.officialGuideFor(platform.nameAr)}
                  verifiedAt={platform.verifiedAt}
                />
                {!platform.verifiedAt ? (
                  <p className="text-xs text-muted">
                    {platform.linkCheckedAt
                      ? ar.setup.guideLinkChecked(platform.linkCheckedAt)
                      : ar.setup.guidePending}
                  </p>
                ) : null}
              </>
            ) : (
              <p>
                {ar.setup.officialGuide}: <strong>{ar.setup.guideUnavailable}</strong>
              </p>
            )}
          </div>
        ) : null}

        {active === "inGame" && title.controls.officialGuide ? (
          <div className="card mb-3 p-3" data-testid="publisher-guide">
            <p className="text-sm text-muted">{ar.setup.publisherGuide}</p>
            <SourceLink
              url={title.controls.officialGuide.url}
              label={title.controls.officialGuide.labelAr}
              verifiedAt={title.controls.officialGuide.verifiedAt}
            />
            <div className="mt-1">
              <ConfidenceBadge level={title.controls.officialGuide.confidence} />
            </div>
          </div>
        ) : null}

        {reviewed ? (
          steps.length ? (
            <>
              <p className="num mb-2 text-sm font-semibold" role="status" data-testid="done-count">
                {ar.setup.doneCount(doneCount, steps.length)}
              </p>
              <ol className="grid gap-2">
                {steps.map((s, i) => (
                  <ControlStep
                    key={s.id}
                    n={i + 1}
                    {...s}
                    done={done.includes(s.id)}
                    onToggle={(v) => {
                      setDone(setStepDone(title.slug, s.id, v));
                      if (v) {
                        track({
                          type: "control_step_done",
                          titleSlug: title.slug,
                          ageBand,
                          platform: active === "inGame" ? undefined : active,
                          controlKey: s.pointKey,
                        });
                      }
                    }}
                  />
                ))}
              </ol>
            </>
          ) : (
            <p className="text-muted">{ar.setup.guideUnavailable}</p>
          )
        ) : (
          <p className="rounded-xl bg-surface-2 p-3 text-sm" data-testid="not-reviewed-note">
            {ar.setup.noStepsReviewed}
          </p>
        )}
      </div>
      <p className="mt-4 rounded-xl bg-brand-soft p-3 text-sm">{ar.setup.tip}</p>
    </div>
  );
}
