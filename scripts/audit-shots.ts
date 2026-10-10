/**
 * لقطات التدقيق (AUDIT.md): يمشي رحلة ولي الأمر على نسخة الإنتاج (بيانات حقيقية فقط)
 * ويحفظ لقطات + نتائج axe (كل المستويات) + فحص التمرير الأفقي على 360px.
 *
 * الاستخدام: (بعد npm run build && npx next start -p 3300)
 *   AUDIT_URL=http://localhost:3300 tsx scripts/audit-shots.ts <round>
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, devices, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.AUDIT_URL ?? "http://localhost:3300";
const round = process.argv[2] ?? "r0";
const OUT = join("docs", "audit", round);
mkdirSync(OUT, { recursive: true });

type Row = {
  shot: string;
  url: string;
  axe: Record<string, number>;
  axeIds: string[];
  hScroll: boolean;
  smallTargets: number;
};
const rows: Row[] = [];

async function audit(page: Page, shot: string, fullPage = true) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(700); // انتقالات الخطوات
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: join(OUT, `${shot}.jpg`), fullPage, type: "jpeg", quality: 62 });
  const res = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .analyze();
  const axe: Record<string, number> = {};
  for (const v of res.violations)
    axe[v.impact ?? "unknown"] = (axe[v.impact ?? "unknown"] ?? 0) + 1;
  const { hScroll, smallTargets } = await page.evaluate(() => {
    const els = [
      ...document.querySelectorAll<HTMLElement>("a, button, input, select, summary, [role=tab]"),
    ];
    const small = els.filter((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || el.classList.contains("sr-only")) return false;
      // روابط داخل فقرة نص مستثناة في WCAG 2.5.8 (inline)
      if (el.tagName === "A" && getComputedStyle(el).display === "inline") return false;
      if (el instanceof HTMLInputElement && (el.type === "radio" || el.type === "checkbox")) {
        const label = el.closest("label") ?? document.querySelector(`label[for="${el.id}"]`);
        if (label) {
          const lr = label.getBoundingClientRect();
          return lr.height < 44;
        }
      }
      return r.height < 44 || r.width < 24;
    });
    return {
      hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      smallTargets: small.length,
    };
  });
  rows.push({
    shot,
    url: page.url().replace(BASE, ""),
    axe,
    axeIds: res.violations.map((v) => `${v.impact}:${v.id}`),
    hScroll,
    smallTargets,
  });
  console.log(shot, JSON.stringify(axe), hScroll ? "H-SCROLL" : "", smallTargets);
}

async function pick(page: Page, text: string) {
  await page.locator("label", { hasText: text }).first().click();
}

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices["Pixel 7"], locale: "ar-SA" });
  await ctx.addInitScript(() => {
    if (!localStorage.getItem("dalil.consent"))
      localStorage.setItem("dalil.consent", JSON.stringify("denied"));
  });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/`);
  await audit(page, "01-home");
  await page.getByRole("combobox", { name: "اسم اللعبة أو التطبيق" }).fill("ماين");
  await page.waitForTimeout(400);
  await audit(page, "02-search", false);
  await page.getByRole("combobox", { name: "اسم اللعبة أو التطبيق" }).fill("ماين كرافت");
  await page.getByRole("radio", { name: /^9 / }).check({ force: true });
  await page.getByRole("button", { name: /^ابدأ/ }).click();
  await page.waitForURL(/\/title\/minecraft/);
  await audit(page, "03-know");
  await page.getByTestId("family-lens").getByRole("button").click();
  await audit(page, "04-know-lens", false);
  await page.getByRole("button", { name: /التالي: اضبط/ }).click();
  await audit(page, "05-setup");
  await page.getByRole("button", { name: /التالي: تحاور/ }).click();
  await audit(page, "06-talk");
  await page.getByRole("button", { name: /التالي: اتفق/ }).click();
  await audit(page, "07-agree-parent");
  await pick(page, "ساعة يوميًا بعد الواجبات");
  await pick(page, "لا أحد — المحادثة مقفلة");
  await pick(page, "بإذن، كل مرة");
  await page.getByTestId("agree-parent").getByRole("button", { name: "التالي" }).click();
  await audit(page, "08-handoff", false);
  await page.getByRole("button", { name: "أنا الطفل، جاهز" }).click();
  await audit(page, "09-agree-child", false);
  await pick(page, "ثلاث ساعات كل يوم");
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await pick(page, "ما أكلم أحد");
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await pick(page, "أستأذن كل مرة");
  await page.getByRole("button", { name: "خلصت" }).click();
  await page.getByRole("button", { name: "أنا ولي الأمر، جاهز" }).click();
  await audit(page, "10-agree-result");
  await pick(page, "أجرب اللعبة معك مرة على الأقل");
  await page.getByRole("button", { name: /احفظ الاتفاق/ }).click();
  await page.waitForURL(/\/agreement\/print/);
  await page.getByTestId("print-sheet").waitFor();
  await audit(page, "11-print");
  await page.goto(`${BASE}/charter`);
  await audit(page, "12-charter");
  await page.goto(`${BASE}/title/fortnite?age=10`);
  await audit(page, "13-know-fortnite");
  await page.goto(`${BASE}/title/youtube-kids?age=6`);
  await audit(page, "14-know-youtube-kids");
  await page.goto(`${BASE}/sources`);
  await audit(page, "15-sources");
  await page.goto(`${BASE}/privacy`);
  await audit(page, "16-privacy");
  await page.goto(`${BASE}/about`);
  await audit(page, "17-about");
  await page.goto(`${BASE}/`);
  await page.getByRole("combobox", { name: "اسم اللعبة أو التطبيق" }).fill("لعبة ما لها وجود");
  await page.waitForTimeout(400);
  await audit(page, "18-not-found", false);

  const narrow = await browser.newContext({
    viewport: { width: 360, height: 780 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: "ar-SA",
  });
  const n = await narrow.newPage();
  await n.goto(`${BASE}/title/genshin-impact?age=12`);
  await audit(n, "19-360-genshin");
  const desk = await browser.newContext({ ...devices["Desktop Chrome"], locale: "ar-SA" });
  const d = await desk.newPage();
  await d.goto(`${BASE}/`);
  await audit(d, "20-desktop-home", false);
  await d.goto(`${BASE}/title/among-us?age=10`);
  await audit(d, "21-desktop-among-us");

  const dark = await browser.newContext({
    ...devices["Pixel 7"],
    locale: "ar-SA",
    colorScheme: "dark",
  });
  await dark.addInitScript(() => {
    if (!localStorage.getItem("dalil.consent"))
      localStorage.setItem("dalil.consent", JSON.stringify("denied"));
  });
  const k = await dark.newPage();
  await k.goto(`${BASE}/`);
  await audit(k, "22-dark-home", false);
  await k.goto(`${BASE}/title/among-us?age=10`);
  await audit(k, "23-dark-among-us");
  await k.goto(`${BASE}/title/among-us?age=10&step=setup`);
  await audit(k, "24-dark-setup", false);

  writeFileSync(join(OUT, "results.json"), JSON.stringify(rows, null, 2) + "\n");
  await browser.close();
  console.log(`✓ audit-shots — ${rows.length} لقطة في ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
