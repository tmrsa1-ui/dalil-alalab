/**
 * كل التخزين محلي على جهاز الأب فقط (localStorage / sessionStorage).
 * لا شي من هنا يُرسل لأي خادم.
 */
export const KEYS = {
  consent: "dalil.consent",
  charter: "dalil.charter",
  controlsPrefix: "dalil.controls.",
  session: "dalil.session",
  age: "dalil.age",
  theme: "dalil.theme",
} as const;

function ls(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}
function ss(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, fallback: T, store: "local" | "session" = "local"): T {
  try {
    const raw = (store === "local" ? ls() : ss())?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown, store: "local" | "session" = "local") {
  try {
    (store === "local" ? ls() : ss())?.setItem(key, JSON.stringify(value));
  } catch {
    // التخزين غير متاح (وضع خاص مثلًا) — نكمل بدونه.
  }
}

export function removeKey(key: string, store: "local" | "session" = "local") {
  try {
    (store === "local" ? ls() : ss())?.removeItem(key);
  } catch {
    // ignore
  }
}

export type Consent = "granted" | "denied" | null;
export const getConsent = (): Consent => readJSON<Consent>(KEYS.consent, null);
export const setConsent = (c: Exclude<Consent, null>) => writeJSON(KEYS.consent, c);

export function getDoneSteps(slug: string): string[] {
  return readJSON<string[]>(KEYS.controlsPrefix + slug, []);
}
export function setStepDone(slug: string, stepId: string, done: boolean): string[] {
  const set = new Set(getDoneSteps(slug));
  if (done) set.add(stepId);
  else set.delete(stepId);
  const arr = [...set];
  writeJSON(KEYS.controlsPrefix + slug, arr);
  return arr;
}

export type SavedAgreement = {
  id: string;
  titleSlug: string;
  titleNameAr: string;
  isDemo: boolean;
  clauses: Array<{ questionId: string; clauseAr: string; kind: string }>;
  teenClauses: string[];
  parentCommitments: string[];
  createdAt: string;
  reviewAt: string;
};

export const getCharter = (): SavedAgreement[] => readJSON<SavedAgreement[]>(KEYS.charter, []);
export function saveAgreement(a: SavedAgreement) {
  const list = getCharter().filter((x) => x.id !== a.id);
  writeJSON(KEYS.charter, [a, ...list]);
}
export function deleteAgreement(id: string) {
  writeJSON(
    KEYS.charter,
    getCharter().filter((x) => x.id !== id),
  );
}
export function clearCharter() {
  removeKey(KEYS.charter);
}

/** «امسح كل بياناتي من هذا الجهاز»: يحذف كل مفاتيح المنتج من التخزين المحلي والجلسة. */
export function clearAllLocalData() {
  for (const store of [ls(), ss()]) {
    if (!store) continue;
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && k.startsWith("dalil.")) keys.push(k);
    }
    keys.forEach((k) => store.removeItem(k));
  }
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
