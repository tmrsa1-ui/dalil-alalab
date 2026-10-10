import { expect, test } from "@playwright/test";
import { expectNoSeriousA11y, setConsent } from "./helpers";

test.beforeEach(async ({ page }) => setConsent(page, "denied"));

test("عنوان حقيقي مستورد: القيم «بحاجة مراجعة بشرية» والناقص «غير متوفر/ما لقيت»", async ({
  page,
}) => {
  await page.goto("/title/among-us?age=9");
  await expect(page.getByTestId("demo-badge")).toHaveCount(0);
  await expect(page.getByTestId("rating-esrb")).toContainText("Everyone 10+");
  await expect(page.getByTestId("rating-esrb")).toContainText("بحاجة مراجعة بشرية");
  await expect(page.getByTestId("rating-esrb")).toContainText("Crewmate Edition");
  await expect(page.getByTestId("rating-appStore")).toContainText("9+");
  await expect(page.getByTestId("rating-gcam")).toContainText("غير متوفر");
  await expect(page.getByTestId("rating-pegi")).toContainText("غير متوفر");
  await expect(page.getByTestId("point-strangerChat")).toContainText("Users Interact");
  await expect(page.getByTestId("point-ads").getByTestId("not-found")).toBeVisible();
  await expect(page.getByTestId("point-sessionPause").getByTestId("not-found")).toBeVisible();
  await expectNoSeriousA11y(page);
});

test("رابط الرقابة الأبوية الرسمي من الناشر يظهر في «داخل اللعبة» بدون خطوات مخترعة", async ({
  page,
}) => {
  await page.goto("/title/snapchat?age=14&step=setup");
  await page.getByRole("tab", { name: "داخل اللعبة" }).click();
  const guide = page.getByTestId("publisher-guide");
  await expect(guide.getByTestId("source-link")).toHaveAttribute(
    "href",
    "https://values.snap.com/safety/family-center",
  );
  await expect(guide).toContainText("بحاجة مراجعة بشرية");
  await expect(page.getByTestId("control-step")).toHaveCount(0);
});

test("عنوان حقيقي ما ورد في ملف البحث يبقى كله «غير متوفر/ما لقيت»", async ({ page }) => {
  await page.goto("/title/discord?age=15");
  await expect(page.getByTestId("rating-table").getByText("غير متوفر")).toHaveCount(5);
  await expect(page.getByTestId("attention-points").getByTestId("not-found")).toHaveCount(5);
});
