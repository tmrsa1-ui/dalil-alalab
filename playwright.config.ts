import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3200);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "ar-SA",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run build && NEXT_TELEMETRY_DISABLED=1 npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    // بدون أي متغيرات بيئة: المنتج لازم يشتغل كامل بدون LLM وبدون Supabase.
    env: {
      // البطاقات التجريبية (data/demo) تُحمَّل في الاختبارات فقط، مو في نسخة الإنتاج.
      DALIL_DEMO: "1",
      ENABLE_AI_CARDS: "false",
      ANTHROPIC_API_KEY: "",
      SUPABASE_URL: "",
      SUPABASE_ANON_KEY: "",
    },
  },
});
