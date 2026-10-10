"use client";
import { useEffect, useState } from "react";
import { ar } from "@/lib/i18n/ar";
import { clearAllLocalData, getConsent, setConsent, type Consent } from "@/lib/storage";

export function PrivacyControls() {
  const [consent, setC] = useState<Consent | undefined>(undefined);
  const [cleared, setCleared] = useState(false);
  useEffect(() => setC(getConsent()), []);
  const update = (c: "granted" | "denied") => {
    setConsent(c);
    setC(c);
    window.dispatchEvent(new Event("dalil:consent"));
  };
  return (
    <section className="card mt-6 grid gap-3 p-4" aria-label={ar.privacy.clearAll} data-testid="privacy-controls">
      <p className="font-semibold" role="status">
        {consent === "granted"
          ? ar.privacy.consentState.granted
          : consent === "denied"
            ? ar.privacy.consentState.denied
            : ar.privacy.consentState.none}
      </p>
      <div className="flex flex-wrap gap-2">
        {consent === "granted" ? (
          <button type="button" className="btn btn-secondary" onClick={() => update("denied")}>
            {ar.privacy.withdraw}
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={() => update("granted")}>
            {ar.privacy.grant}
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (!window.confirm(ar.privacy.clearConfirm)) return;
            clearAllLocalData();
            setC(null);
            setCleared(true);
            window.dispatchEvent(new Event("dalil:consent"));
          }}
        >
          {ar.privacy.clearAll}
        </button>
      </div>
      {cleared ? (
        <p role="alert" className="font-semibold text-ok">
          {ar.privacy.cleared}
        </p>
      ) : null}
    </section>
  );
}
