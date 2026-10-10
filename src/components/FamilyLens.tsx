"use client";
import { useId, useState } from "react";
import { ar } from "@/lib/i18n/ar";
import { FAMILY_LENS_KEYS, type Title } from "@schemas/title";
import { SourceLink } from "./SourceLink";

const STYLE = {
  present: "bg-accent-soft text-accent border-accent/40",
  absent: "bg-ok-soft text-ok border-ok/40",
  unknown: "bg-surface-2 text-muted border-line",
} as const;

export function FamilyLens({ lens }: { lens: Title["familyLens"] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <section
      className="card overflow-hidden"
      aria-labelledby={`${panelId}-h`}
      data-testid="family-lens"
    >
      <h3 id={`${panelId}-h`} className="m-0">
        <button
          type="button"
          className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 text-start text-lg font-bold hover:bg-surface-2"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true">🔍</span>
            {ar.lens.title}
          </span>
          <span aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
            ▾
          </span>
          <span className="sr-only">{open ? ar.lens.close : ar.lens.open}</span>
        </button>
      </h3>
      <div id={panelId} hidden={!open} className="border-t border-line px-4 pb-4">
        <p className="mt-3 text-sm text-muted">{ar.lens.lead}</p>
        <ul className="mt-3 grid gap-3">
          {FAMILY_LENS_KEYS.map((k) => {
            const item = lens[k];
            const unknown = item.status === "unknown" || item.sources.length === 0;
            return (
              <li key={k} className="rounded-xl bg-surface-2 p-3" data-testid={`lens-${k}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{ar.lens.items[k]}</span>
                  <span className={`chip border ${STYLE[unknown ? "unknown" : item.status]}`}>
                    {unknown ? ar.lens.status.unknown : ar.lens.status[item.status]}
                  </span>
                </div>
                {!unknown ? (
                  <>
                    {item.noteAr ? <p className="mt-1 text-sm">{item.noteAr}</p> : null}
                    <div className="text-sm">
                      {item.sources.map((s) => (
                        <SourceLink
                          key={s.url}
                          url={s.url}
                          label={s.title}
                          verifiedAt={s.verifiedAt}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
