/**
 * يولّد public/og.png (1200×630) لمعاينة الروابط في واتساب وتويتر — من HTML محلي بالخط المحلي، بدون أي خدمة.
 * الاستخدام: npm run og:image
 */
import { chromium } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const font = (w: number) => pathToFileURL(resolve(`src/fonts/plex-arabic-${w}.woff2`)).href;
const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:P;src:url("${font(700)}") format("woff2");font-weight:700}
@font-face{font-family:P;src:url("${font(400)}") format("woff2");font-weight:400}
html,body{margin:0;width:1200px;height:630px;background:#0d5c52;color:#fbecd8;font-family:P,sans-serif}
.wrap{display:flex;align-items:center;gap:56px;padding:72px 88px;height:100%;box-sizing:border-box}
.text{flex:1}
h1{font-size:92px;font-weight:700;margin:0 0 8px;line-height:1.15}
.steps{font-size:44px;font-weight:700;color:#f2b56b;margin:0 0 28px}
p{font-size:30px;font-weight:400;margin:0;line-height:1.5;opacity:.92}
</style></head><body><div class="wrap">
<svg width="300" height="300" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="112" fill="#0a4a42"/><circle cx="256" cy="256" r="150" fill="none" stroke="#fbecd8" stroke-width="28"/><path d="M196 300c0-50 40-90 90-90" fill="none" stroke="#fbecd8" stroke-width="28" stroke-linecap="round"/><circle cx="286" cy="300" r="26" fill="#f2b56b"/></svg>
<div class="text"><h1>دليل الألعاب</h1><p class="steps">اعرف · اضبط · تحاور · اتفق</p>
<p>طبقة مرافقة عربية للأهالي فوق أدوات الرقابة الأبوية الموجودة — نعطيك الصورة، والقرار لك.</p></div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "public/og.png", type: "png" });
await browser.close();
console.log("✓ og:image — public/og.png");
