import "server-only";
import { readLocal } from "./sink";
import { fromSupabaseRows, summarize, type Impact } from "../impact-summary";

export type { Impact } from "../impact-summary";

async function fetchRows<T>(base: string, key: string, view: string): Promise<T[] | null> {
  try {
    const res = await fetch(`${base}/rest/v1/${view}?select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T[];
  } catch {
    return null;
  }
}

/** أرقام الأثر: Supabase بمفتاح الخدمة (قراءة العروض المجمّعة فقط)، وإلا الملف المحلي، وإلا لا شي. */
export async function readImpact(): Promise<Impact> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const [impactRows, feedbackRows] = await Promise.all([
      fetchRows<{ type: string; events: number; sessions: number }>(url, key, "impact_summary"),
      fetchRows<{ question: string; answer: string; n: number }>(url, key, "feedback_summary"),
    ]);
    if (impactRows)
      return { source: "supabase", ...fromSupabaseRows(impactRows, feedbackRows ?? []) };
  }
  const [events, feedback] = await Promise.all([readLocal("events"), readLocal("feedback")]);
  const s = summarize(events, feedback);
  return { source: events.length || feedback.length ? "file" : "none", ...s };
}
