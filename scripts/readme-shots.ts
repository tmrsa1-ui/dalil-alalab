/**
 * لقطات README (docs/screenshots): رحلة ولي الأمر على نسخة الإنتاج (بيانات حقيقية فقط).
 * لقطات بحجم الشاشة (مو الصفحة كاملة) عشان تنعرض بوضوح في README.
 *
 * الاستخدام: (بعد npm run build && npx next start -p 3300)
 *   AUDIT_URL=http://localhost:3300 npm run readme:shots
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, devices, type BrowserContext, type Page } from "@playwright/test";

const BASE = process.env.AUDIT_URL ?? "http://localhost:3300";
const OUT = join("docs", "screenshots");
mkdirSync(OUT, { recursive: true });

const taken: string[] = [];

async function shot(page: Page, name: string, fullPage = false) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600); // انتقالات الخطوات
  await page.screenshot({ path: join(OUT, `${name}.jpg`), fullPage, type: "jpeg", quality: 86 });
  taken.push(name);
  console.log("✓", name);
}

/** يمرّر لأول عنوان يطابق النص (أو بمسافة ثابتة لو ما لقاه) ثم يلتقط الشاشة. */
async function scrollTo(page: Page, heading: RegExp, fallbackPx: number) {
  const h = page.locator("h2, h3").filter({ hasText: heading }).first();
  if (await h.count()) {
    await h.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -16));
  } else {
    await page.evaluate((y) => window.scrollTo(0, y), fallbackPx);
  }
}

async function pick(page: Page, text: string) {
  await page.locator("label", { hasText: text }).first().click();
}

function denyConsent(ctx: BrowserContext) {
  return ctx.addInitScript(() => {
    if (!localStorage.getItem("dalil.consent"))
      localStorage.setItem("dalil.consent", JSON.stringify("denied"));
  });
}

async function main() {
  const browser = await chromium.launch();
  const phone = { ...devices["Pixel 7"], deviceScaleFactor: 2, locale: "ar-SA" };

  const ctx = await browser.newContext(phone);
  await denyConsent(ctx);
  const page = await ctx.newPage();

  await page.goto(`${BASE}/`);
  await shot(page, "01-home");
  await page.getByRole("combobox", { name: "اسم اللعبة أو التطبيق" }).fill("ماين");
  await page.waitForTimeout(400);
  await shot(page, "02-search");
  await page.getByRole("combobox", { name: "اسم اللعبة أو التطبيق" }).fill("ماين كرافت");
  await page.getByRole("radio", { name: /^9 / }).check({ force: true });
  await page.getByRole("button", { name: /^ابدأ/ }).click();
  await page.waitForURL(/\/title\/minecraft/);
  await shot(page, "03-know");
  await scrollTo(page, /التصنيف/, 700);
  await shot(page, "04-know-ratings");
  await scrollTo(page, /نقاط الانتباه/, 1500);
  await shot(page, "05-know-points");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: /التالي: اضبط/ }).click();
  await shot(page, "06-setup");
  await page.getByRole("button", { name: /التالي: تحاور/ }).click();
  await shot(page, "07-talk");
  await page.getByRole("button", { name: /التالي: اتفق/ }).click();
  await shot(page, "08-agree-parent");
  await pick(page, "ساعة يوميًا بعد الواجبات");
  await pick(page, "لا أحد — المحادثة مقفلة");
  await pick(page, "بإذن، كل مرة");
  await page.getByTestId("agree-parent").getByRole("button", { name: "التالي" }).click();
  await shot(page, "09-handoff");
  await page.getByRole("button", { name: "أنا الطفل، جاهز" }).click();
  await shot(page, "10-agree-child");
  await pick(page, "ثلاث ساعات كل يوم");
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await pick(page, "ما أكلم أحد");
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await pick(page, "أستأذن كل مرة");
  await page.getByRole("button", { name: "خلصت" }).click();
  await page.getByRole("button", { name: "أنا ولي الأمر، جاهز" }).click();
  await shot(page, "11-agree-result");
  await pick(page, "أجرب اللعبة معك مرة على الأقل");
  await page.getByRole("button", { name: /احفظ الاتفاق/ }).click();
  await page.waitForURL(/\/agreement\/print/);
  await page.getByTestId("print-sheet").waitFor();
  await shot(page, "12-print");
  await page.goto(`${BASE}/charter`);
  await shot(page, "13-charter");
  await ctx.close();

  const dark = await browser.newContext({ ...phone, colorScheme: "dark" });
  await denyConsent(dark);
  const k = await dark.newPage();
  await k.goto(`${BASE}/title/among-us?age=10`);
  await shot(k, "14-dark-know");
  await dark.close();

  const narrow = await browser.newContext({
    viewport: { width: 360, height: 780 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: "ar-SA",
  });
  await denyConsent(narrow);
  const n = await narrow.newPage();
  await n.goto(`${BASE}/title/genshin-impact?age=12`);
  await shot(n, "15-360-genshin");
  await narrow.close();

  const desk = await browser.newContext({ ...devices["Desktop Chrome"], locale: "ar-SA" });
  await denyConsent(desk);
  const d = await desk.newPage();
  await d.goto(`${BASE}/title/among-us?age=10`);
  await shot(d, "16-desktop-know");
  await desk.close();

  await browser.close();
  console.log(`✓ readme-shots — ${taken.length} لقطة في ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
