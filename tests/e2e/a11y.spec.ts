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
