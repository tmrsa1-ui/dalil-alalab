/**
 * فيديو العرض (للمحكّمين): رحلة ولي أمر كاملة على نسخة الإنتاج بالبيانات الحقيقية، بمقاس Pixel 7.
 * الاستخدام: (بعد npm run build && npx next start -p 3300)
 *   AUDIT_URL=http://localhost:3300 tsx scripts/demo-video.ts
 * الناتج: docs/audit/demo-journey.webm
 */
import { mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { chromium, devices, type Page } from "@playwright/test";

const BASE = process.env.AUDIT_URL ?? "http://localhost:3300";
const TMP = join("docs", "audit", ".video-tmp");
const OUT = join("docs", "audit", "demo-journey.webm");

const pause = (p: Page, ms = 1200) => p.waitForTimeout(ms);
async function scrollTo(p: Page, testId: string) {
  await p.getByTestId(testId).first().scrollIntoViewIfNeeded();
  await pause(p, 1600);
}
async function pick(p: Page, text: string) {
  await p.locator("label", { hasText: text }).first().click();
  await pause(p, 500);
}

async function main() {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    ...devices["Pixel 7"],
    locale: "ar-SA",
    recordVideo: { dir: TMP, size: { width: 412, height: 839 } },
  });
  await ctx.addInitScript(() => {
    if (!localStorage.getItem("dalil.consent"))
      localStorage.setItem("dalil.consent", JSON.stringify("denied"));
  });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`);
  await pause(p, 1500);
  await p.getByRole("combobox", { name: "اسم اللعبة أو التطبيق" }).pressSequentially("أمونق", {
    delay: 120,
  });
  await pause(p);
  await p.getByRole("radio", { name: /^10 / }).check({ force: true });
  await pause(p, 600);
  await p.getByRole("button", { name: /^ابدأ/ }).click();
  await p.waitForURL(/\/title\//);
  await pause(p, 2500); // «الصورة باختصار»
  await scrollTo(p, "rating-table");
  await p.getByTestId("rating-gcam").getByTestId("rating-source").locator("summary").click();
  await pause(p, 1800);
  await scrollTo(p, "point-content");
  await p.getByTestId("point-content").locator("summary").first().click();
  await pause(p, 1200);
  await p.getByTestId("point-content").getByTestId("point-sources").locator("summary").click();
  await pause(p, 2200);
  await p.getByTestId("family-lens").getByRole("button").click();
  await scrollTo(p, "family-lens");
  await p.getByRole("button", { name: /التالي: اضبط/ }).click();
  await pause(p, 1500);
  await p.getByRole("tab", { name: "iPhone / iPad" }).click();
  await scrollTo(p, "control-step");
  const step = p.getByTestId("control-step").filter({ hasText: "طلب الموافقة على الشراء" }).first();
  await step.scrollIntoViewIfNeeded();
  await pause(p, 1500);
  await step.getByRole("checkbox", { name: "سويتها" }).check();
  await pause(p, 1200);
  await p.getByRole("tab", { name: "PlayStation" }).click();
  await pause(p, 1800);
  await p.getByRole("button", { name: /التالي: تحاور/ }).click();
  await pause(p, 2500);
  await p.getByRole("button", { name: /التالي: اتفق/ }).click();
  await pause(p, 1200);
  await pick(p, "ساعة يوميًا بعد الواجبات");
  await pick(p, "لا أحد — المحادثة مقفلة");
  await pick(p, "بإذن، كل مرة");
  await p.getByTestId("agree-parent").getByRole("button", { name: "التالي" }).click();
  await pause(p, 1800);
  await p.getByRole("button", { name: "أنا الطفل، جاهز" }).click();
  await pause(p, 1000);
  await pick(p, "ثلاث ساعات كل يوم");
  await p.getByRole("button", { name: "التالي", exact: true }).click();
  await pick(p, "ما أكلم أحد");
  await p.getByRole("button", { name: "التالي", exact: true }).click();
  await pick(p, "أستأذن كل مرة");
  await p.getByRole("button", { name: "خلصت" }).click();
  await pause(p, 1500);
  await p.getByRole("button", { name: "أنا ولي الأمر، جاهز" }).click();
  await pause(p, 2500);
  await pick(p, "أجرب اللعبة معك مرة على الأقل");
  await p.getByRole("button", { name: /احفظ الاتفاق/ }).click();
  await p.getByTestId("print-sheet").waitFor();
  await pause(p, 3000);
  const video = p.video();
  await ctx.close();
  await browser.close();
  renameSync((await video!.path())!, OUT);
  rmSync(TMP, { recursive: true, force: true });
  console.log(`✓ demo-video — ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
