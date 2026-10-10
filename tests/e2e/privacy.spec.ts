import { expect, test } from "@playwright/test";
import { pick, searchAndStart } from "./helpers";

test("7) بدون موافقة لا طلبات أحداث، وبعد الموافقة الحدث ما فيه شي عن الطفل", async ({ page }) => {
  const events: string[] = [];
  // sendBeacon ما يكشف الـbody لـPlaywright؛ نعطّله عشان يُستخدم fetch ونقدر نفحص المحتوى.
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "sendBeacon", { value: undefined }),
  );
  page.on("request", (r) => {
    if (r.url().includes("/api/events")) events.push(r.postData() ?? "");
  });
  await page.goto("/");
  await expect(page.getByTestId("consent-notice")).toBeVisible();
  // بدون اختيار (الشريط ظاهر): نكمل رحلة كاملة
  const box = page.getByRole("combobox", { name: "اسم اللعبة أو التطبيق" });
  await box.fill("minecraft");
  await page.getByRole("radio", { name: /^9 / }).dispatchEvent("click");
  await box.press("Escape");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/title\/minecraft/);
  const stepper = page.getByTestId("stepper");
  await stepper.getByRole("button", { name: /اضبط/ }).click();
  await stepper.getByRole("button", { name: /تحاور/ }).click();
  await page.waitForTimeout(300);
  expect(events).toEqual([]);

  // رفض صريح ⇐ لا شي كذلك
  await page.evaluate(() => localStorage.setItem("dalil.consent", JSON.stringify("denied")));
  await page.reload();
  await page.getByTestId("stepper").getByRole("button", { name: /اتفق/ }).click();
  await page.waitForTimeout(300);
  expect(events).toEqual([]);

  // موافقة ⇐ أحداث مجهولة فقط
  await page.goto("/");
  await page.evaluate(() => localStorage.removeItem("dalil.consent"));
  await page.reload();
  await page.getByRole("button", { name: "موافق" }).click();
  await searchAndStart(page, "minecraft", 9);
  await expect.poll(() => events.length).toBeGreaterThan(0);
  for (const raw of events) {
    const e = JSON.parse(raw);
    const allowed = [
      "type",
      "titleSlug",
      "ageBand",
      "platform",
      "step",
      "controlKey",
      "found",
      "ts",
      "sessionId",
    ];
    expect(Object.keys(e).every((k) => allowed.includes(k))).toBe(true);
    expect(raw).not.toMatch(/"age"\s*:/);
    if (e.ageBand) expect(["under7", "7to12", "13plus"]).toContain(e.ageBand);
  }
});

test("«امسح كل بياناتي» يفضي localStorage", async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("dalil.consent", JSON.stringify("granted"));
      localStorage.setItem("dalil.controls.minecraft", JSON.stringify(["ios-purchases-2"]));
      localStorage.setItem("dalil.charter", JSON.stringify([]));
      sessionStorage.setItem("seeded", "1");
    }
  });
  await page.goto("/privacy");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "امسح كل بياناتي من هذا الجهاز" }).click();
  await expect(page.getByText("انمسحت كل بيانات الدليل")).toBeVisible();
  const keys = await page.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith("dalil.")),
  );
  expect(keys).toEqual([]);
});

test("اختيارات الطفل ما تنحفظ في التخزين المحلي", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("dalil.consent", JSON.stringify("denied")));
  await page.goto("/title/minecraft?age=10&step=agree");
  await pick(page, "ساعة يوميًا بعد الواجبات");
  await pick(page, "لا أحد — المحادثة مقفلة");
  await pick(page, "بإذن، كل مرة");
  await page.getByTestId("agree-parent").getByRole("button", { name: "التالي" }).click();
  await page.getByRole("button", { name: "أنا الطفل، جاهز" }).click();
  for (const t of ["ثلاث ساعات كل يوم", "أكتب لأصحابي اللي أعرفهم بس", "مصروف شهري محدد"]) {
    await pick(page, t);
    await page.getByRole("button", { name: /^(التالي|خلصت)$/ }).click();
  }
  const dump = await page.evaluate(
    () => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }),
  );
  expect(dump).not.toContain("when-3h");
  expect(dump).not.toContain("talk-known-text");
});
