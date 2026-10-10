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
  await expect(page.getByTestId("rating-gcam")).toContainText("PlayStation (السعودية)");
  await expect(page.getByTestId("rating-pegi")).toContainText("7");
  await expect(page.getByTestId("rating-pegi").getByTestId("source-link")).toHaveAttribute(
    "href",
    /^https:\/\/pegi\.info\//,
  );
  await expect(page.getByTestId("point-strangerChat")).toContainText("Users Interact");
  await expect(page.getByTestId("point-ads")).toContainText("Contains ads");
  await expect(page.getByTestId("rating-googlePlay")).toContainText("7+");
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

test("التصنيف السعودي (Gmedia) كما يعرضه Google Play في السعودية", async ({ page }) => {
  await page.goto("/title/brawl-stars?age=9");
  await expect(page.getByTestId("demo-badge")).toHaveCount(0);
  const gcam = page.getByTestId("rating-gcam");
  await expect(gcam).toContainText("7");
  await expect(gcam).toContainText("يعرضه: Google Play (السعودية)");
  await expect(gcam).toContainText("بحاجة مراجعة بشرية");
  await expect(page.getByTestId("rating-googlePlay")).toContainText("غير متوفر");
});

test("تصنيفات الأجهزة المنزلية: GCAM من PlayStation (السعودية)، PEGI من Xbox (السعودية)، وESRB من موقعها", async ({
  page,
}) => {
  await page.goto("/title/among-us?age=10");
  const gcam = page.getByTestId("rating-gcam");
  await expect(gcam).toContainText("12");
  await expect(gcam).toContainText("يعرضه: PlayStation (السعودية)");
  await expect(gcam).toContainText("التصنيف أعلى من عمر طفلك");
  await page.goto("/title/stumble-guys?age=10");
  const pegi = page.getByTestId("rating-pegi");
  await expect(pegi).toContainText("3");
  await expect(pegi).toContainText("يعرضه: Xbox (السعودية)");
  await page.goto("/title/rocket-league?age=10");
  await expect(page.getByTestId("rating-esrb")).toContainText("Everyone");
  await expect(page.getByTestId("rating-esrb").getByTestId("source-link")).toHaveAttribute(
    "href",
    "https://www.esrb.org/ratings/10018866/rocket-league/",
  );
  await expect(page.getByTestId("rating-appStore")).toContainText("غير متوفر");
  await expect(page.getByTestId("point-ads").getByTestId("not-found")).toBeVisible();
  await expect(page.getByTestId("point-sessionPause").getByTestId("not-found")).toBeVisible();
});

test("دليل الرقابة الرسمي لـPlayStation بعد الفحص معه تاريخ واقتباس", async ({ page }) => {
  await page.goto("/title/among-us?age=10&step=setup");
  await page.getByRole("tab", { name: "PlayStation" }).click();
  const link = page.getByRole("tabpanel").getByTestId("source-link").first();
  await expect(link).toHaveAttribute("href", "https://www.playstation.com/en-sa/ps-family-app/");
  await expect(page.getByRole("tabpanel").getByTestId("source-quote").first()).toContainText(
    "PlayStation Family app",
  );
});

test("«الصورة باختصار» فوق «اعرف»، والمصادر مطوية، والواصفات بالعربي", async ({ page }) => {
  await page.goto("/title/among-us?age=10");
  const glance = page.getByTestId("know-glance");
  await expect(glance.getByTestId("glance-saudi")).toContainText("12");
  await expect(glance.getByTestId("glance-saudi")).toContainText("أعلى من عمر طفلك");
  await expect(glance.getByTestId("glance-present")).toContainText("محادثة الغرباء");
  await expect(glance.getByTestId("glance-unknown")).toContainText("مدة الجلسة والتوقف");
  const content = page.getByTestId("point-content");
  await expect(content.getByTestId("point-terms")).toContainText("عنف خيالي");
  const sources = content.getByTestId("point-sources");
  await expect(sources.getByTestId("source-link").first()).toBeHidden();
  await sources.locator("summary").click();
  await expect(sources.getByTestId("source-link").first()).toBeVisible();
  await expect(page.getByTestId("rating-esrb")).toContainText("عنف خيالي");
  await expectNoSeriousA11y(page);
});
