import { eventSchema, type AppEvent } from "../../schemas/event";
import { KEYS, getConsent, newId, readJSON, writeJSON } from "./storage";

export type TrackInput = Omit<AppEvent, "ts" | "sessionId">;

/** معرّف جلسة عشوائي في sessionStorage فقط — يختفي بإغلاق التبويب ولا يرتبط بشخص. */
export function getSessionId(): string {
  let id = readJSON<string | null>(KEYS.session, null, "session");
  if (!id) {
    id = newId();
    writeJSON(KEYS.session, id, "session");
  }
  return id;
}

/** يبني الحدث ويتحقق منه (strict: أي حقل زايد يُرفض). */
export function buildEvent(
  input: TrackInput,
  now = Date.now(),
  sessionId = getSessionId(),
): AppEvent | null {
  const r = eventSchema.safeParse({ ...input, ts: now, sessionId });
  return r.success ? r.data : null;
}

/**
 * يرسل حدث استخدام مجهول — فقط بعد موافقة صريحة.
 * بدون موافقة: لا طلب شبكة إطلاقًا.
 */
export function track(input: TrackInput): boolean {
  if (typeof window === "undefined") return false;
  if (getConsent() !== "granted") return false;
  const event = buildEvent(input);
  if (!event) return false;
  const body = JSON.stringify(event);
  try {
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        "/api/events",
        new Blob([body], { type: "application/json" }),
      );
      if (ok) return true;
    }
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}
