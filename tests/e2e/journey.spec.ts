import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, pick, searchAndStart, setConsent } from "./helpers";

test.beforeEach(async ({ page }) => setConsent(page, "denied"));

test("1) بحث «ماين كرافت» + عمر 9 ⇐ بطاقة فيها 5 نقاط وتصنيفات ومصادر وشارة تجريبي", async ({
  page,
}) => {
  await searchAndStart(page, "ماين كرافت", 9);
  await expect(page).toHaveURL(/\/title\/minecraft\?age=9/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ماين كرافت");
  await expect(page.getByTestId("demo-badge").first()).toBeVisible();
  const points = page.getByTestId("attention-points").locator(":scope > li");
  await expect(points).toHaveCount(5);
  await expect(page.getByTestId("rating-table").locator(":scope > li")).toHaveCount(5);
  await expect(page.getByTestId("rating-gcam")).toContainText("غير متوفر");
  await expect(page.getByTestId("rating-esrb")).toContainText("E10+");
  const links = page.getByTestId("source-link");
  expect(await links.count()).toBeGreaterThan(5);
  for (const l of await links.all()) {
    await expect(l).toHaveAttribute("rel", "noopener noreferrer");
    await expect(l).toHaveAttribute("target", "_blank");
  }
  // عدسة الأسرة قابلة للطي
  const lensBtn = page.getByTestId("family-lens").getByRole("button");
  await expect(lensBtn).toHaveAttribute("aria-expanded", "false");
  await lensBtn.click();
  await expect(lensBtn).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("lens-music")).toContainText("ما لقيت");
  await expect(page.getByTestId("prayer-pause")).toContainText("تتوقف بسهولة");
  await expectNoHorizontalScroll(page);
  expect(await page.locator("body").innerText()).not.toMatch(/آمن|أمان/);
});

test("2) الخطوات الأربع كاملة ⇐ اتفاق ⇐ صفحة طباعة بالبنود والتوقيعين وتاريخ المراجعة", async ({
  page,
}) => {
  await page.goto("/title/minecraft?age=9");
  // اضبط
  await page.getByRole("button", { name: /التالي: اضبط/ }).click();
  await expect(page.getByTestId("step-setup")).toBeVisible();
  await page.getByRole("tab", { name: "iPhone / iPad" }).click();
  const firstStep = page
    .getByTestId("control-step")
    .first()
    .getByRole("checkbox", { name: "سويتها" });
  await firstStep.check();
  await expect(page.getByTestId("done-count")).toContainText("سويت 1 من");
  await page.reload();
  await page.getByRole("tab", { name: "iPhone / iPad" }).click();
  await expect(page.getByTestId("control-step").first().getByRole("checkbox")).toBeChecked();
  // تحاور
  await page.getByRole("button", { name: /التالي: تحاور/ }).click();
  const cards = page.getByTestId("conversation-card");
  await expect(cards).toHaveCount(3);
  await expect(page.locator('[data-testid="conversation-card"][data-point="friends"]')).toHaveCount(
    1,
  );
  // اتفق
  await page.getByRole("button", { name: /التالي: اتفق/ }).click();
  await pick(page, "ساعة يوميًا بعد الواجبات");
  await pick(page, "لا أحد — المحادثة مقفلة");
  await pick(page, "بإذن، كل مرة");
  await page.getByTestId("agree-parent").getByRole("button", { name: "التالي" }).click();
  await expect(page.getByTestId("handoff-child")).toBeVisible();
  await page.getByRole("button", { name: "أنا الطفل، جاهز" }).click();
  await pick(page, "ثلاث ساعات كل يوم");
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await pick(page, "ما أكلم أحد");
  await page.getByRole("button", { name: "التالي", exact: true }).click();
  await pick(page, "أستأذن كل مرة");
  await page.getByRole("button", { name: "خلصت" }).click();
  await expect(page.getByTestId("handoff-parent")).toBeVisible();
  await page.getByRole("button", { name: "أنا ولي الأمر، جاهز" }).click();
  await expect(page.getByTestId("clause-when")).toHaveAttribute("data-kind", "midpoint");
  await expect(page.getByTestId("clause-when")).toContainText("ساعتين في الويكند");
  await expect(page.getByTestId("clause-talk")).toHaveAttribute("data-kind", "agreed");
  await pick(page, "أجرب اللعبة معك مرة على الأقل");
  await page.getByRole("button", { name: /احفظ الاتفاق/ }).click();
  // صفحة الطباعة
  await expect(page).toHaveURL(/\/agreement\/print\?id=/);
  const sheet = page.getByTestId("print-sheet");
  await expect(sheet).toContainText("ماين كرافت");
  await expect(page.getByTestId("print-clauses").locator("li")).toHaveCount(3);
  await expect(sheet).toContainText("أجرب اللعبة معك مرة على الأقل");
  await expect(page.getByTestId("signatures")).toContainText("ولي الأمر");
  await expect(page.getByTestId("signatures")).toContainText("الابن / البنت");
  const iso = await page.getByTestId("review-date").getAttribute("data-iso");
  const days = Math.round((new Date(iso!).getTime() - Date.now()) / 86_400_000);
  expect(days).toBe(14);
  await expect(sheet.locator("svg")).toHaveCount(1); // QR
  // الطباعة صفحة A4 وحدة
  await page.emulateMedia({ media: "print" });
  const pdf = await page.pdf({ format: "A4", preferCSSPageSize: true }).catch(() => null);
  if (pdf) {
    const pagesCount = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    expect(pagesCount).toBe(1);
  }
  await page.emulateMedia({ media: "screen" });
  // ميثاق البيت
  await page.goto("/charter");
  await expect(page.getByTestId("charter-list")).toContainText("ماين كرافت");
});

test("الطفل ما يشوف اختيارات الأب في أي لحظة (حتى لو رجع بالمتصفح)", async ({ page }) => {
  await page.goto("/title/roblox?age=10&step=agree");
  await pick(page, "ساعتين يوميًا");
  await pick(page, "كتابة فقط مع أصحاب يعرفهم في الواقع");
  await pick(page, "مصروف شهري محدد يتفق عليه");
  await page.getByTestId("agree-parent").getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "أنا الطفل، جاهز" }).click();
  const child = page.getByTestId("agree-child");
  await expect(child).toBeVisible();
  const body = await page.locator("main").innerText();
  expect(body).not.toContain("ساعتين يوميًا");
  expect(body).not.toContain("كتابة فقط مع أصحاب يعرفهم في الواقع");
  expect(await child.locator("input:checked").count()).toBe(0);
  // التنقل بين الخطوات ثم الرجوع ما يكشف شي
  await page.getByRole("button", { name: /اعرف/ }).first().click();
  await page.getByRole("button", { name: /اتفق/ }).first().click();
  await expect(page.getByTestId("agree-child")).toBeVisible();
  await expect(page.getByTestId("agree-parent")).toHaveCount(0);
});

test("3) عمر 5 ⇐ مسار الأب وحده", async ({ page }) => {
  await page.goto("/title/minecraft?age=5&step=agree");
  await expect(page.getByTestId("agree-mode")).toBeVisible();
  await page.getByRole("button", { name: "أقرر أنا" }).click();
  await pick(page, "نص ساعة يوميًا بعد الواجبات");
  await pick(page, "لا أحد — المحادثة مقفلة");
  await pick(page, "لا شي — المشتريات مقفلة");
  await page.getByTestId("agree-parent").getByRole("button", { name: "التالي" }).click();
  await expect(page.getByTestId("handoff-child")).toHaveCount(0);
  await expect(page.getByTestId("agree-result")).toBeVisible();
  await expect(page.getByTestId("clause-when")).toHaveAttribute("data-kind", "parent_only");
});

test("4) عمر 15 ⇐ «أقترح بند» ظاهر", async ({ page }) => {
  await page.goto("/title/fortnite?age=15&step=agree");
  await pick(page, "ساعة يوميًا بعد الواجبات");
  await pick(page, "لا أحد — المحادثة مقفلة");
  await pick(page, "بإذن، كل مرة");
  await page.getByTestId("agree-parent").getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "أنا الطفل، جاهز" }).click();
  for (const t of ["ساعة كل يوم", "ما أكلم أحد", "أستأذن كل مرة"]) {
    await pick(page, t);
    await page.getByRole("button", { name: "التالي", exact: true }).click();
  }
  await expect(page.getByTestId("agree-teen")).toBeVisible();
  await expect(page.getByText("أقترح بند")).toBeVisible();
  await pick(page, "أختار وقت لعبي بنفسي ضمن المدة المتفق عليها");
  await page.getByRole("button", { name: "خلصت" }).click();
  await page.getByRole("button", { name: "أنا ولي الأمر، جاهز" }).click();
  await expect(page.getByTestId("teen-proposals")).toContainText("أختار وقت لعبي بنفسي");
});

test("5) عنوان بلا بيانات ⇐ «غير متوفر/ما لقيت» في كل مكان ولا نص مخترع", async ({ page }) => {
  await page.goto("/title/no-data-demo?age=9");
  await expect(page.getByTestId("rating-table").getByText("غير متوفر")).toHaveCount(5);
  await expect(page.getByTestId("rating-summary")).toContainText("لا يوجد تصنيف متوفر");
  await expect(page.getByTestId("attention-points").getByTestId("not-found")).toHaveCount(5);
  await expect(page.getByTestId("attention-points").getByTestId("source-link")).toHaveCount(0);
  await page.getByTestId("family-lens").getByRole("button").click();
  for (const k of ["gambling", "mixedVoiceChat", "magic", "clothing", "music"]) {
    await expect(page.getByTestId(`lens-${k}`)).toContainText("ما لقيت");
  }
  await expect(page.getByTestId("prayer-pause")).toContainText("ما لقيت");
  // «اضبط»: غير مراجع ⇐ خطوات الجهاز العامة من دليله الرسمي فقط (كل خطوة باقتباس)، ولا خطوة خاصة بالعنوان
  await page.getByRole("button", { name: /التالي: اضبط/ }).click();
  await expect(page.getByTestId("generic-steps-note")).toBeVisible();
  const steps = page.getByTestId("control-step");
  const n = await steps.count();
  expect(n).toBeGreaterThan(0);
  await expect(steps.getByTestId("source-quote")).toHaveCount(n);
  await expect(page.locator('[data-testid="control-step"] a[href*="example.org"]')).toHaveCount(0);
  await page.getByRole("tab", { name: "PC" }).click();
  await expect(page.getByTestId("not-reviewed-note")).toBeVisible();
  await expect(page.getByTestId("control-step")).toHaveCount(0);
});

test("6) عنوان غير موجود ⇐ طلب إضافة", async ({ page }) => {
  await searchAndStart(page, "لعبة خيالية ما لها وجود", 8);
  await expect(page).toHaveURL(/\/request\?q=/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ما لقينا هذا العنوان بعد");
  const req = page.waitForRequest((r) => r.url().includes("/api/request-title"));
  await page.getByRole("button", { name: "اطلب إضافته" }).click();
  const body = (await req).postDataJSON();
  expect(body).toEqual({ name: "لعبة خيالية ما لها وجود" });
  await expect(page.getByTestId("request-status")).toContainText("وصل طلبك");
  // بدون مفتاح: ما فيه زر بطاقة آلية، والـAPI يرجع 503 عربي
  await expect(page.getByRole("button", { name: /ولّد بطاقة آلية/ })).toHaveCount(0);
  const res = await page.request.post("/api/generate-card", { data: { name: "test" } });
  expect(res.status()).toBe(503);
  expect((await res.json()).message).toMatch(/غير مفعّلة/);
});

test("صفحة عنوان بدون عمر تطلب العمر", async ({ page }) => {
  await page.goto("/title/tiktok");
  await expect(page.getByTestId("age-gate")).toBeVisible();
  await page.getByRole("radio", { name: /^14 / }).check({ force: true });
  await page.getByRole("button", { name: "كمّل" }).click();
  await expect(page).toHaveURL(/age=14/);
  await expect(page.getByTestId("age-chip")).toContainText("14");
});
