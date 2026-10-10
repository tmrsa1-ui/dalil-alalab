"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ar } from "@/lib/i18n/ar";
import { formatDateAr, isDue } from "@/lib/dates";
import { clearCharter, deleteAgreement, getCharter, type SavedAgreement } from "@/lib/storage";
import { DemoBadge } from "./DemoBadge";

export function CharterList() {
  const [list, setList] = useState<SavedAgreement[] | null>(null);
  useEffect(() => setList(getCharter()), []);
  if (list === null) return <p role="status">{ar.loading}</p>;
  if (list.length === 0) {
    return (
      <div className="card p-4 text-center" data-testid="charter-empty">
        <p>{ar.charter.empty}</p>
        <Link href="/" className="btn btn-primary mt-3">
          {ar.nav.home}
        </Link>
      </div>
    );
  }
  return (
    <div className="grid gap-3" data-testid="charter-list">
      <p className="num text-sm font-semibold">{ar.charter.count(list.length)}</p>
      <ul className="grid gap-3">
        {list.map((a) => (
          <li key={a.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">{a.titleNameAr}</h2>
              <div className="flex items-center gap-2">
                {a.isDemo ? <DemoBadge /> : null}
                {isDue(a.reviewAt) ? <span className="chip bg-accent-soft text-accent">{ar.charter.due}</span> : null}
              </div>
            </div>
            <ul className="mt-2 list-disc ps-5 text-sm">
              {a.clauses.map((c) => (
                <li key={c.questionId}>{c.clauseAr}</li>
              ))}
            </ul>
            <p className="num mt-2 text-sm text-muted">{ar.charter.review(formatDateAr(a.reviewAt))}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/agreement/print?id=${encodeURIComponent(a.id)}`} className="btn btn-secondary">
                {ar.charter.open}
              </Link>
              <button
                type="button"
                className="btn btn-ghost text-warn"
                onClick={() => {
                  if (!window.confirm(ar.charter.removeConfirm)) return;
                  deleteAgreement(a.id);
                  setList(getCharter());
                }}
              >
                {ar.charter.remove}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-secondary text-warn"
        onClick={() => {
          if (!window.confirm(ar.charter.clearConfirm)) return;
          clearCharter();
          setList([]);
        }}
      >
        {ar.charter.clearAll}
      </button>
    </div>
  );
}
