"use client";
import { useId, useMemo, useState } from "react";
import { ar } from "@/lib/i18n/ar";
import { createSearcher } from "@/lib/search";
import type { TitleIndexEntry } from "@schemas/title";

/** Combobox حسب نمط ARIA 1.2 (إكمال تلقائي بقائمة). */
export function SearchBox({
  index,
  value,
  onChange,
  onPick,
  error,
}: {
  index: TitleIndexEntry[];
  value: string;
  onChange: (v: string) => void;
  onPick: (entry: TitleIndexEntry) => void;
  error?: string | null;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const search = useMemo(() => createSearcher(index), [index]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const results = useMemo(() => (value.trim() ? search(value, 6) : []), [search, value]);
  const expanded = open && results.length > 0;

  function pick(i: number) {
    const r = results[i];
    if (!r) return;
    onChange(r.entry.nameAr);
    onPick(r.entry);
    setOpen(false);
    setActive(-1);
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1 block font-bold">
        {ar.home.titleLabel}
      </label>
      <input
        id={id}
        type="text"
        role="combobox"
        className="field text-lg"
        placeholder={ar.home.titlePlaceholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        dir="auto"
        value={value}
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        aria-describedby={`${hintId}${error ? ` ${errId}` : ""}`}
        aria-invalid={error ? true : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && expanded && active >= 0) {
            e.preventDefault();
            pick(active);
          } else if (e.key === "Escape") {
            setOpen(false);
            setActive(-1);
          }
        }}
      />
      <p id={hintId} className="mt-1 text-sm text-muted">
        {ar.home.titleHint}
      </p>
      {error ? (
        <p id={errId} className="mt-1 text-sm font-semibold text-warn">
          {error}
        </p>
      ) : null}
      <ul
        id={listId}
        role="listbox"
        aria-label={ar.search.suggestions}
        hidden={!expanded}
        className="card absolute inset-x-0 top-[5.2rem] z-20 max-h-80 overflow-auto p-1 shadow-lg"
      >
        {results.map((r, i) => (
          <li
            key={r.entry.slug}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            className={`flex min-h-[48px] cursor-pointer items-center justify-between gap-2 rounded-lg px-3 ${
              i === active ? "bg-brand-soft" : "hover:bg-surface-2"
            }`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(i)}
          >
            <span>
              <span className="font-bold">{r.entry.nameAr}</span>{" "}
              <span className="text-sm text-muted" dir="ltr">
                {r.entry.nameEn}
              </span>
            </span>
            {r.entry.isDemo ? <span className="chip bg-demo-soft text-demo">{ar.search.demo}</span> : null}
          </li>
        ))}
      </ul>
      <p className="sr-only" role="status" aria-live="polite">
        {open && value.trim() ? ar.search.resultsCount(results.length) : ""}
      </p>
    </div>
  );
}
