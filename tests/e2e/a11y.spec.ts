import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectNoSeriousA11y, setConsent } from "./helpers";

const PAGES = [
  "/",
  "/title/minecraft?age=9",
  "/title/minecraft?age=9&step=setup",
  "/title/minecraft?age=9&step=talk",
  "/title/minecraft?age=9&step=agree",
  "/title/no-data-demo?age=9",
  "/request?q=xyz",
  "/charter",
  "/about",
  "/about/impact",
  "/privacy",
  "/sources",
  "/agreement/print",
  "/does-not-exist",
];

test.describe("8) axe + RTL + 360px", () => {
  for (const url of PAGES) {
    test(`a11y ${url}`, async ({ page }) => {
      await setConsent(page, "denied");
      await page.goto(url);
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(page.locator("html")).toHaveAttribute("lang", "ar");
      await expectNoSeriousA11y(page);
    });
  }

  test("شريط الموافقة نفسه بدون مخالفات", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("consent-notice")).toBeVisible();
    await expectNoSeriousA11y(page);
  });

  test("الوضع الداكن بدون مخالفات تباين", async ({ page }) => {
    await setConsent(page, "denied");
    await page.addInitScript(() => localStorage.setItem("dalil.theme", JSON.stringify("dark")));
    for (const url of ["/", "/title/minecraft?age=9"]) {
      await page.goto(url);
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expectNoSeriousA11y(page);
    }
  });

  test("360px بدون scroll أفقي في كل الصفحات", async ({ page }) => {
    await setConsent(page, "denied");
    await page.setViewportSize({ width: 360, height: 740 });
    for (const url of PAGES) {
      await page.goto(url);
      await expectNoHorizontalScroll(page);
    }
  });

  test("التنقل بالكيبورد: تخطَّ إلى المحتوى + الكومبوبوكس", async ({ page }) => {
    await setConsent(page, "denied");
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "تخطَّ إلى المحتوى" })).toBeFocused();
    const box = page.getByRole("combobox");
    await box.focus();
    await page.keyboard.type("روب");
    await expect(box).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(box).toHaveValue("روبلوكس");
  });
});

test.describe("9) معايير WCAG 2.2 اللي axe ما يغطيها", () => {
  test.beforeEach(async ({ page }) => setConsent(page, "denied"));

  test("أهداف اللمس ≥ 44px (2.5.8) في كل الصفحات والخطوات", async ({ page }) => {
    for (const url of PAGES) {
      await page.goto(url);
      const small = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("a, button, input, select, summary, [role=tab]")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height || el.classList.contains("sr-only")) return false;
            // روابط داخل فقرة نص مستثناة في المعيار (inline)
            if (el.tagName === "A" && getComputedStyle(el).display === "inline") return false;
            if (el instanceof HTMLInputElement && ["radio", "checkbox"].includes(el.type)) {
              const label = el.closest("label");
              return !label || label.getBoundingClientRect().height < 44;
            }
            return r.height < 44;
          })
          .map((el) => el.outerHTML.slice(0, 80)),
      );
      expect(small, url).toEqual([]);
    }
  });

  test("الفوكس ظاهر (2.4.7) بإطار 3px", async ({ page }) => {
    await page.goto("/title/minecraft?age=9");
    for (let i = 0; i < 6; i++) await page.keyboard.press("Tab");
    const style = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const s = getComputedStyle(el);
      return { tag: el.tagName, outline: s.outlineStyle, width: s.outlineWidth };
    });
    expect(style.tag).not.toBe("BODY");
    expect(style.outline).toBe("solid");
    expect(style.width).toBe("3px");
  });

  test("ترتيب العناوين بدون قفز، وh1 واحد (1.3.1)", async ({ page }) => {
    for (const url of ["/", "/title/minecraft?age=9", "/sources", "/privacy", "/about"]) {
      await page.goto(url);
      const levels = await page.evaluate(() =>
        [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")]
          .filter((h) => (h as HTMLElement).offsetParent !== null)
          .map((h) => Number(h.tagName[1])),
      );
      expect(
        levels.filter((l) => l === 1),
        url,
      ).toHaveLength(1);
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i]! - levels[i - 1]!, `${url}: ${levels.join(",")}`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("prefers-reduced-motion يوقف الحركة", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/title/minecraft?age=9");
    const durations = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("button, summary span, [role=tab]")].map((el) =>
        parseFloat(getComputedStyle(el).transitionDuration),
      ),
    );
    expect(Math.max(...durations)).toBeLessThan(0.01);
  });

  test("الرحلة بالكيبورد فقط: الخطوات تتنقل بـEnter، والمصادر المطوية تنفتح بـEnter", async ({
    page,
  }) => {
    await page.goto("/title/among-us?age=10");
    const point = page.getByTestId("point-content").locator("summary").first();
    await point.focus();
    await page.keyboard.press("Enter");
    const summary = page
      .getByTestId("point-content")
      .getByTestId("point-sources")
      .locator("summary");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByTestId("point-content").getByTestId("source-link").first(),
    ).toBeVisible();
    await page.getByRole("button", { name: /اضبط/ }).first().focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("step-setup")).toBeVisible();
    await page.getByRole("tab").first().focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("tab").nth(1)).toBeFocused();
    await expect(page.getByRole("tab").nth(1)).toHaveAttribute("aria-selected", "true");
  });
});
