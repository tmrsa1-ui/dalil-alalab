"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ar } from "@/lib/i18n/ar";
import { getConsent, setConsent } from "@/lib/storage";

/** إشعار الموافقة: بدون «موافق» صريح ما يُرسل أي حدث. */
export function ConsentNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(getConsent() === null);
    const onChange = () => setShow(getConsent() === null);
    window.addEventListener("dalil:consent", onChange);
    return () => window.removeEventListener("dalil:consent", onChange);
  }, []);
  if (!show) return null;
  const choose = (c: "granted" | "denied") => {
    setConsent(c);
    setShow(false);
    window.dispatchEvent(new Event("dalil:consent"));
  };
  return (
    <section
      role="region"
      aria-label={ar.consent.label}
      className="no-print fixed inset-x-0 bottom-0 z-40 p-3"
      data-testid="consent-notice"
    >
      <div className="card mx-auto max-w-2xl p-4 shadow-2xl">
        <h2 className="text-lg font-bold">{ar.consent.title}</h2>
        <ul className="mt-2 grid gap-1 text-sm">
          <li>✅ {ar.consent.collect}</li>
          <li>🚫 {ar.consent.notCollect}</li>
          <li>🤖 {ar.consent.llm}</li>
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={() => choose("granted")}
          >
            {ar.consent.accept}
          </button>
          <button
            type="button"
            className="btn btn-secondary flex-1"
            onClick={() => choose("denied")}
          >
            {ar.consent.decline}
          </button>
          <Link href="/privacy" className="btn btn-ghost w-full text-sm sm:w-auto">
            {ar.consent.more}
          </Link>
        </div>
      </div>
    </section>
  );
}
