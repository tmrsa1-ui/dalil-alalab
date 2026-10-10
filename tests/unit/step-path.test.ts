import { splitStepPath } from "@/lib/step-path";

describe("splitStepPath", () => {
  it("يفصل المسار عن التعليمة", () => {
    expect(splitStepPath("الإعدادات ← Screen Time ← App Limits: حط حد يومي.")).toEqual({
      path: ["الإعدادات", "Screen Time", "App Limits"],
      rest: "حط حد يومي.",
    });
  });
  it("نص بدون مسار يرجع كما هو", () => {
    expect(splitStepPath("اقفل المحادثة.")).toEqual({ path: [], rest: "اقفل المحادثة." });
  });
});
