import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** يحدد الموافقة قبل تحميل الصفحة عشان شريط الموافقة ما يغطي المحتوى. */
export async function setConsent(page: Page, value: "granted" | "denied" | null) {
  await page.addInitScript((v) => {
    if (v === null) return;
    if (!localStorage.getItem("dalil.consent")) localStorage.setItem("dalil.consent", JSON.stringify(v));
  }, value);
}

export async function expectNoSeriousA11y(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    serious.map((v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`),
  ).toEqual([]);
}

export async function expectNoHorizontalScroll(page: Page) {
  const { sw, cw } = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sw).toBeLessThanOrEqual(cw);
}

export async function searchAndStart(page: Page, query: string, age: number) {
  await page.goto("/");
  await page.getByRole("combobox", { name: "اسم اللعبة أو التطبيق" }).fill(query);
  await page.getByRole("radio", { name: new RegExp(`^${age} `) }).check({ force: true });
  await page.getByRole("button", { name: /^ابدأ/ }).click();
}

/** يختار خيار في مجموعة راديو حسب النص الظاهر. */
export async function pick(page: Page, text: string) {
  await page.locator("label", { hasText: text }).first().click();
}
