import { buildEvent, track } from "@/lib/events";
import { eventSchema } from "@schemas/event";
import { KEYS } from "@/lib/storage";

const SID = "6f1c1f9e-6a8b-4d55-9c55-1f0f7a1d2b3c";

describe("events", () => {
  it("حدث صالح بالحد الأدنى من الحقول", () => {
    const e = buildEvent({ type: "card_viewed", titleSlug: "minecraft", ageBand: "7to12" }, 1, SID);
    expect(e).toEqual({
      type: "card_viewed",
      titleSlug: "minecraft",
      ageBand: "7to12",
      ts: 1,
      sessionId: SID,
    });
  });
  it("ما فيه أي حقل عن الطفل غير ageBand (strict)", () => {
    for (const extra of [
      { age: 9 },
      { childName: "x" },
      { childAnswers: {} },
      { ip: "1.2.3.4" },
      { userAgent: "x" },
    ]) {
      const r = eventSchema.safeParse({ type: "search", ts: 1, sessionId: SID, ...extra });
      expect(r.success).toBe(false);
    }
  });
  it("الحقول المسموحة كلها معروفة", () => {
    const ok = eventSchema.safeParse({
      type: "control_step_done",
      titleSlug: "minecraft",
      ageBand: "13plus",
      platform: "ios",
      controlKey: "purchases",
      ts: 5,
      sessionId: SID,
    });
    expect(ok.success).toBe(true);
  });
  it("requestedName و feedback مقصورة على أنواعها", () => {
    expect(
      eventSchema.safeParse({ type: "search", requestedName: "x", ts: 1, sessionId: SID }).success,
    ).toBe(false);
  });
  it("track ما يرسل شي بدون موافقة", () => {
    const fetchSpy = vi.fn(() => Promise.resolve(new Response(null)));
    vi.stubGlobal("fetch", fetchSpy);
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
    expect(track({ type: "search" })).toBe(false);
    localStorage.setItem(KEYS.consent, JSON.stringify("denied"));
    expect(track({ type: "search" })).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
    localStorage.setItem(KEYS.consent, JSON.stringify("granted"));
    expect(track({ type: "search", found: true })).toBe(true);
    expect(beacon).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
