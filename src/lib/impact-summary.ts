import { EVENT_TYPES, type EventType } from "../../schemas/event";

export type FeedbackQuestion = "useful" | "talked" | "willUseAgain";
export type Impact = {
  /** من وين جات الأرقام: Supabase (الإنتاج)، ملف محلي (التطوير)، أو لا شي. */
  source: "supabase" | "file" | "none";
  events: Record<EventType, number>;
  sessions: number;
  /** أعداد إجابات التقييم لكل سؤال (null = ما فيه تقييمات). */
  feedback: Record<FeedbackQuestion, Record<string, number>> | null;
};

const emptyEvents = () =>
  Object.fromEntries(EVENT_TYPES.map((t) => [t, 0])) as Record<EventType, number>;

const isType = (t: unknown): t is EventType =>
  typeof t === "string" && (EVENT_TYPES as readonly string[]).includes(t);

/** يجمّع صفوف الأحداث والتقييم الخام (الملف المحلي) إلى أرقام فقط. */
export function summarize(
  events: Record<string, unknown>[],
  feedback: Record<string, unknown>[],
): Pick<Impact, "events" | "sessions" | "feedback"> {
  const counts = emptyEvents();
  const sessions = new Set<string>();
  for (const e of events) {
    if (isType(e.type)) counts[e.type]++;
    if (typeof e.session_id === "string") sessions.add(e.session_id);
  }
  const fb: Impact["feedback"] = { useful: {}, talked: {}, willUseAgain: {} };
  const cols: Array<[FeedbackQuestion, string]> = [
    ["useful", "useful"],
    ["talked", "talked"],
    ["willUseAgain", "will_use_again"],
  ];
  for (const f of feedback) {
    for (const [q, col] of cols) {
      const v = f[col];
      if (typeof v === "string") fb[q][v] = (fb[q][v] ?? 0) + 1;
    }
  }
  return { events: counts, sessions: sessions.size, feedback: feedback.length ? fb : null };
}

/** يحوّل صفوف العرضين (impact_summary, feedback_summary) من Supabase إلى نفس الشكل. */
export function fromSupabaseRows(
  impactRows: Array<{ type?: unknown; events?: unknown; sessions?: unknown }>,
  feedbackRows: Array<{ question?: unknown; answer?: unknown; n?: unknown }>,
): Pick<Impact, "events" | "sessions" | "feedback"> {
  const counts = emptyEvents();
  let sessions = 0;
  for (const r of impactRows) {
    if (isType(r.type)) counts[r.type] = Number(r.events) || 0;
    // كل صف يحمل عدد الجلسات المميزة لنوعه؛ نعرض أكبرها كحد أدنى للجلسات (مو مجموعها).
    sessions = Math.max(sessions, Number(r.sessions) || 0);
  }
  const fb: Impact["feedback"] = { useful: {}, talked: {}, willUseAgain: {} };
  let any = false;
  for (const r of feedbackRows) {
    const q = r.question;
    if (
      (q === "useful" || q === "talked" || q === "willUseAgain") &&
      typeof r.answer === "string"
    ) {
      fb[q][r.answer] = Number(r.n) || 0;
      any = true;
    }
  }
  return { events: counts, sessions, feedback: any ? fb : null };
}
