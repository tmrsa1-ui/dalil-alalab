"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ar } from "@/lib/i18n/ar";
import { formatDateAr } from "@/lib/dates";
import { getCharter, type SavedAgreement } from "@/lib/storage";
import { track } from "@/lib/events";
import { DemoBadge } from "./DemoBadge";
import { FeedbackForm } from "./FeedbackForm";

export function AgreementPrint({ id }: { id: string | null }) {
  const [a, setA] = useState<SavedAgreement | null | undefined>(undefined);
  const [qr, setQr] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const list = getCharter();
    const found = (id ? list.find((x) => x.id === id) : list[0]) ?? null;
    setA(found);
    if (found) {
      const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const link = `${base.replace(/\/$/, "")}/title/${found.titleSlug}`;
      setUrl(link);
      QRCode.toString(link, { type: "svg", margin: 0, errorCorrectionLevel: "M" })
        .then(setQr)
        .catch(() => setQr(null));
    }
  }, [id]);

  if (a === undefined) return <p role="status">{ar.loading}</p>;
  if (a === null) {
    return (
      <div className="grid gap-4 py-6 text-center" data-testid="print-not-found">
        <p>{ar.print.notFound}</p>
        <Link href="/charter" className="btn btn-primary mx-auto">
          {ar.print.toCharter}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="no-print flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-primary flex-1"
          onClick={() => {
            track({ type: "agreement_printed", titleSlug: a.titleSlug });
            window.print();
          }}
        >
          <span aria-hidden="true">🖨️</span>
          {ar.print.print}
        </button>
        <Link href={`/title/${a.titleSlug}`} className="btn btn-secondary">
          {ar.print.back}
        </Link>
      </div>

      <article className="print-sheet card p-5 sm:p-8" data-testid="print-sheet">
        <header className="flex items-start justify-between gap-4 border-b border-line pb-3">
          <div>
            <p className="text-sm font-semibold text-muted">{ar.app.name} — {ar.print.title}</p>
            <h1 className="text-2xl font-extrabold">{ar.print.heading(a.titleNameAr)}</h1>
            {a.isDemo ? <DemoBadge className="mt-1" /> : null}
            <p className="num mt-1 text-sm">{ar.print.createdAt(formatDateAr(a.createdAt))}</p>
            <p className="num text-sm font-bold" data-testid="review-date" data-iso={a.reviewAt}>
              {ar.print.reviewAt(formatDateAr(a.reviewAt))}
            </p>
          </div>
          {qr ? (
            <figure className="w-24 shrink-0 text-center">
              <div
                className="aspect-square w-24 bg-white p-1 text-black"
                role="img"
                aria-label={`${ar.print.qr}: ${url}`}
                dangerouslySetInnerHTML={{ __html: qr }}
              />
              <figcaption className="mt-1 text-[10px] leading-tight text-muted">{ar.print.qr}</figcaption>
            </figure>
          ) : null}
        </header>

        <section className="mt-4" aria-labelledby="pc-h">
          <h2 id="pc-h" className="text-lg font-bold">
            {ar.print.clauses}
          </h2>
          <ol className="mt-1 list-decimal ps-6" data-testid="print-clauses">
            {a.clauses.map((c) => (
              <li key={c.questionId} className="py-0.5">
                {c.clauseAr}
              </li>
            ))}
          </ol>
        </section>

        {a.teenClauses.length ? (
          <section className="mt-3" aria-labelledby="pt-h">
            <h2 id="pt-h" className="text-lg font-bold">
              {ar.print.teenClauses}
            </h2>
            <ul className="mt-1 list-disc ps-6">
              {a.teenClauses.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-3" aria-labelledby="pp-h">
          <h2 id="pp-h" className="text-lg font-bold">
            {ar.print.commitments}
          </h2>
          <ul className="mt-1 list-disc ps-6">
            {a.parentCommitments.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="mt-2">{ar.print.childCommitment}</p>
        </section>

        <section className="mt-6" aria-labelledby="ps-h">
          <h2 id="ps-h" className="sr-only">
            {ar.print.signatures}
          </h2>
          <div className="grid grid-cols-2 gap-6" data-testid="signatures">
            {[ar.print.parentSign, ar.print.childSign].map((who) => (
              <div key={who}>
                <p className="font-bold">{who}</p>
                <div className="print-sign-line mt-10 border-b-2 border-ink" />
                <p className="mt-1 text-xs text-muted">{ar.print.signatures}</p>
                <div className="print-sign-line mt-6 border-b border-ink/60" />
                <p className="mt-1 text-xs text-muted">{ar.print.date}</p>
              </div>
            ))}
          </div>
        </section>
        <footer className="mt-6 text-center text-xs text-muted">{ar.print.footer}</footer>
      </article>

      <div className="no-print">
        <FeedbackForm titleSlug={a.titleSlug} />
      </div>
    </div>
  );
}
