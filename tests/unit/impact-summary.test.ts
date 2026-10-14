import { fromSupabaseRows, summarize } from "@/lib/impact-summary";

describe("ملخص الأثر — أعداد فقط", () => {
  it("يجمّع الأحداث والجلسات والتقييم من الصفوف الخام بدون أي نص", () => {
    const s = summarize(
      [
        { type: "card_viewed", session_id: "a" },
        { type: "card_viewed", session_id: "b" },
        { type: "agreement_completed", session_id: "a" },
        { type: "bogus", session_id: "c" },
      ],
      [
        { useful: "yes", talked: "planned", will_use_again: "yes", parent_note: "سري" },
        { useful: "yes", talked: "no", will_use_again: "maybe" },
      ],
    );
    expect(s.events.card_viewed).toBe(2);
    expect(s.events.agreement_completed).toBe(1);
    expect(s.events.search).toBe(0);
    expect(s.sessions).toBe(3);
    expect(s.feedback).toEqual({
      useful: { yes: 2 },
      talked: { planned: 1, no: 1 },
      willUseAgain: { yes: 1, maybe: 1 },
    });
    expect(JSON.stringify(s)).not.toContain("سري");
  });

  it("بدون تقييمات ⇐ feedback null", () => {
    expect(summarize([], []).feedback).toBeNull();
  });

  it("يقرأ عرضي Supabase المجمّعين", () => {
    const s = fromSupabaseRows(
      [
        { type: "search", events: 10, sessions: 7 },
        { type: "agreement_completed", events: 3, sessions: 3 },
      ],
      [
        { question: "useful", answer: "yes", n: 2 },
        { question: "willUseAgain", answer: "no", n: 1 },
        { question: "hack", answer: "x", n: 9 },
      ],
    );
    expect(s.events.search).toBe(10);
    expect(s.sessions).toBe(7);
    expect(s.feedback).toEqual({ useful: { yes: 2 }, talked: {}, willUseAgain: { no: 1 } });
  });
});
