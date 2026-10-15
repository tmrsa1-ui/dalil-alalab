import type { TrackInput } from "./event-build";
import { KEYS, getConsent, newId, readJSON, writeJSON } from "./storage";

export type { TrackInput };

/** معرّف جلسة عشوائي في sessionStorage فقط — يختفي بإغلاق التبويب ولا يرتبط بشخص. */
export function getSessionId(): string {
  let id = readJSON<string | null>(KEYS.session, null, "session");
  if (!id) {
    id = newId();
    writeJSON(KEYS.session, id, "session");
  }
  return id;
}

function send(body: string) {
  try {
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        "/api/events",
        new Blob([body], { type: "application/json" }),
      );
      if (ok) return;
    }
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
    }).catch(() => {});
  } catch {
    /* لا شي */
  }
}

/**
 * يرسل حدث استخدام مجهول — فقط بعد موافقة صريحة.
 * بدون موافقة: لا طلب شبكة إطلاقًا، وحتى مكتبة التحقق ما تنحمل.
 * التحقق (strict) يصير قبل الإرسال؛ الحدث اللي فيه حقل زايد ما يُرسل.
 * يرجع Promise بنتيجة الإرسال (true = انرسل).
 */
export function track(input: TrackInput): Promise<boolean> | false {
  if (typeof window === "undefined") return false;
  if (getConsent() !== "granted") return false;
  const now = Date.now();
  const sessionId = getSessionId();
  return import("./event-build").then(({ buildEvent }) => {
    const event = buildEvent(input, now, sessionId);
    if (!event) return false;
    send(JSON.stringify(event));
    return true;
  });
}
