import { render, screen, fireEvent } from "@testing-library/react";
import { readFileSync, readdirSync } from "node:fs";
import amongUs from "@data/titles/among-us.json";
import minecraftDemo from "@data/demo/titles/minecraft.json";
import { PlatformTabs } from "@/components/PlatformTabs";
import { platformSchema, type Platform } from "@schemas/platform";
import type { Title } from "@schemas/title";

const platforms: Platform[] = readdirSync("data/platforms").map((f) =>
  platformSchema.parse(JSON.parse(readFileSync(`data/platforms/${f}`, "utf8"))),
);
const real = amongUs as unknown as Title;
const demo = minecraftDemo as unknown as Title;
const hrefs = () => screen.getAllByTestId("source-link").map((a) => a.getAttribute("href") ?? "");

describe("PlatformTabs — الخطوات التجريبية ما تظهر أبدًا لعنوان حقيقي", () => {
  it("عنوان حقيقي غير مراجع: خطوات الجهاز الرسمية فقط، والمهمة لهذي اللعبة أول", () => {
    render(<PlatformTabs title={real} platforms={platforms} ageBand="7to12" />);
    fireEvent.click(screen.getByRole("tab", { name: "iPhone / iPad" }));
    expect(screen.getByTestId("generic-steps-note")).toBeInTheDocument();
    expect(hrefs().some((h) => h.includes("example.org"))).toBe(false);
    const steps = screen.getAllByTestId("control-step");
    expect(steps.length).toBeGreaterThanOrEqual(5);
    expect(steps[0]!.querySelector('[data-testid="step-relevant"]')).not.toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "PC / Steam" }));
    expect(screen.getByTestId("not-reviewed-note")).toBeInTheDocument();
    expect(screen.queryAllByTestId("control-step")).toHaveLength(0);
  });

  it("عنوان حقيقي بعد المراجعة البشرية: نفس الشي — بدون أي خطوة example.org", () => {
    const reviewed: Title = {
      ...real,
      reviewStatus: "human_reviewed",
      lastReviewedAt: "2026-10-14",
    };
    render(<PlatformTabs title={reviewed} platforms={platforms} ageBand="7to12" />);
    for (const name of ["iPhone / iPad", "Android", "PlayStation", "Xbox", "Nintendo Switch"]) {
      fireEvent.click(screen.getByRole("tab", { name }));
      expect(
        hrefs().some((h) => h.includes("example.org")),
        name,
      ).toBe(false);
      expect(screen.getAllByTestId("control-step").length, name).toBeGreaterThan(0);
    }
  });

  it("عنوان تجريبي: الخطوات التجريبية مسموحة ومعلّمة «تجريبي»", () => {
    render(<PlatformTabs title={demo} platforms={platforms} ageBand="7to12" />);
    fireEvent.click(screen.getByRole("tab", { name: "PC / Steam" }));
    expect(hrefs().some((h) => h.includes("example.org"))).toBe(true);
    expect(screen.getAllByTestId("demo-badge").length).toBeGreaterThan(0);
  });
});
