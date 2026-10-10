# CLAUDE.md — دليل الألعاب (Dalil Al-Alab)

> ملف التشغيل لأي وكيل برمجة يعمل على هذا المستودع. اقرأه كاملًا قبل أي تعديل.

## السياق

- منتج ويب عربي (RTL) لأولياء الأمور السعوديين: «طبقة مرافقة عربية فوق أدوات الرقابة الأبوية الموجودة: تفعّلها، وتربطها بحوار واتفاق أسري». **ليس** تطبيق حجب ولا مراقبة.
- مقدَّم لـ**جائزة نورة الملاحي للابتكار الاجتماعي التقني**، المسار 2 (تعرّض الأطفال لمحتوى لا يناسب أعمارهم وضعف فاعلية أدوات الحماية الأبوية). آخر موعد 15 أكتوبر 2026.
- معايير التحكيم: الأثر المتوقع **والمتحقق**، الجاهزية الابتكارية، قابلية التطبيق والاستدامة. المنتج لازم يشتغل فعلًا على جوال الأهالي.
- الرحلة: البحث (اسم العنوان + عمر الطفل) ← أربع خطوات: **اعرف ← اضبط ← تحاور ← اتفق** ← صفحة اتفاق قابلة للطباعة ← «ميثاق البيت» محليًا.

## القواعد الصارمة (غير قابلة للتفاوض)

1. **لا معلومة ولا رقم مخترع.** لا تصنيف، لا إحصائية، لا عدد مستخدمين، لا شهادات. كل بيانات تجريبية تحمل `"isDemo": true` وتظهر بشارة «تجريبي» وروابطها على `https://example.org/...` فقط.
2. كل تصنيف عمري له `sourceUrl` + `verifiedAt` وإلا فهو `null` ويظهر «غير متوفر». كل نقطة انتباه بلا مصدر تظهر «ما لقيت معلومة موثوقة». لا تخمين ولا fallback.
3. **ممنوع كلمة «آمن/آمنة/غير آمن» (وأي مشتق من الجذر بنفس المعنى) في الواجهة والبيانات.** نستخدم «نقاط انتباه». هناك tests تفحص `src/lib/i18n/ar.ts` و`data/` وكل ملفات `src/`.
4. عربي RTL بالكامل (`<html lang="ar" dir="rtl">`)، خط محلي (IBM Plex Sans Arabic عبر `next/font/local` من `@fontsource`)، خصائص CSS منطقية (`ms-`, `me-`, `ps-`, `pe-`, `start`, `end`).
5. WCAG 2.2 AA: تباين، أهداف لمس ≥ 44px، كيبورد، focus مرئي، `prefers-reduced-motion`، labels. axe بدون serious/critical.
6. Mobile-first (360px بدون scroll أفقي)، PWA.
7. **لا بيانات عن الطفل:** لا حساب، لا اسم، لا عمر على الخادم (فقط `ageBand` في الأحداث بعد الموافقة)، لا نص حر من الطفل، لا cookies تتبع، لا analytics طرف ثالث. اختيارات الطفل الخام تُمسح من الـstore فور توليد البنود.
8. النبرة: لا وعظ، لا تخويف، لا تحيّز ضد الألعاب. «نعطيك الصورة، والقرار لك».
9. **ممنوع:** النشر، التسجيل في خدمات، إرسال إيميل/رسائل، استدعاء API مدفوع إلا لو المفتاح موجود في `.env.local`، كتابة أسرار في الكود. لا تنزيل محتوى من الإنترنت لتعبئة البيانات.
10. كل نصوص الواجهة في `src/lib/i18n/ar.ts`.

## الـStack

Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 · Zod 4 (schemas + تصدير JSON Schema) · Zustand · Fuse.js · Vitest + Testing Library · Playwright + @axe-core/playwright · ESLint + Prettier · tsx للسكربتات.
اختياري: Supabase (خلف adapter، عبر REST بدون SDK) و Anthropic SDK (خلف `ENABLE_AI_CARDS` و`ANTHROPIC_API_KEY`). المنتج يشتغل كاملًا بدون أي env vars.

## الأوامر

| الأمر                                                      | الوظيفة                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                                              | خادم التطوير (يبني الفهرس أولًا)                                |
| `npm run build`                                            | `validate:data` + فهرس + `next build`                           |
| `npm run start`                                            | تشغيل نسخة الإنتاج                                              |
| `npm run test`                                             | Vitest (unit + component)                                       |
| `npm run test:e2e`                                         | Playwright (Pixel 7 + Desktop Chrome) + axe                     |
| `npm run lint`                                             | ESLint                                                          |
| `npm run typecheck`                                        | `tsc --noEmit`                                                  |
| `npm run validate:data`                                    | يتحقق من كل ملفات `data/` ويفشل عند أي نقص                      |
| `npm run build:index`                                      | يولّد `data/titles.index.json`                                  |
| `npm run export:schema`                                    | يصدّر JSON Schema إلى `schemas/json/`                           |
| `npm run new-title -- <slug> "<الاسم العربي>" "<English>"` | قالب عنوان فاضي للمراجع                                         |
| `npm run import:verified -- <file> [--dry]`                | دمج بيانات متحقق منها + تحقق كامل                               |
| `npm run seed:real`                                        | قوالب العناوين الحقيقية العشرين                                 |
| `npm run fetch:official` / `apply:official [-- --dry]`     | جلب App Store/Google Play الرسمية وتطبيقها (بحاجة مراجعة بشرية) |
| `npm run eval:agent`                                       | تقييم الوكيل مقابل `data/eval/holdout.json`                     |
| `npm run format`                                           | Prettier                                                        |

فحص كل checkpoint: `npm run lint && npm run typecheck && npm run test && npm run build`.

## هيكل المجلدات

```
CLAUDE.md, README.md, CHANGELOG.md
docs/            DECISIONS, PRIVACY, DEPLOY, DEMO_SCRIPT, EVALUATION, CONTENT_GUIDE
data/            titles/<slug>.json (حقيقية فقط) · demo/titles/ (تجريبية، DALIL_DEMO=1)
                 titles.index.json (مولّد، حقيقية فقط) · platforms/<id>.json
                 questions.json · agreement.json · eval/holdout.json · review-queue/
schemas/         Zod: title, platform, questions, agreement, event (+ json/ مُصدَّر)
scripts/         validate-data, build-index, export-json-schema, eval-agent, new-title
src/app/         الصفحات + api/(events, generate-card, request-title)
src/components/  مكونات الواجهة
src/lib/         normalize-ar, search, age, questions/select, agreement/merge, agent/*,
                 events, storage, data (قراءة البيانات في الخادم), i18n/ar
supabase/migrations/0001_init.sql
tests/           unit/, components/, e2e/, fixtures/
public/          manifest.webmanifest, icons/, sw.js
```

## Checkpoints

- [x] CP0 الأساس
- [x] CP1 البيانات (schemas, validate, index, seeds, banks, platforms)
- [x] CP2 البحث والعمر
- [x] CP3 «اعرف»
- [x] CP4 «اضبط»
- [x] CP5 «تحاور»
- [x] CP6 «اتفق» + الطباعة + الميثاق
- [x] CP7 الأحداث والخصوصية
- [x] CP8 الوكيل الاختياري
- [x] CP9 PWA وأداء ووصولية
- [x] CP10 الوثائق والتحقق النهائي

## ملاحظات للوكيل

- القرارات تُسجّل في `docs/DECISIONS.md`، والتحسينات في `CHANGELOG.md`.
- البيانات تُقرأ وقت البناء من `data/` (Server Components). لا قاعدة بيانات مطلوبة.
- `isDemo: false` يتطلب روابط من allowlist (`src/lib/agent/allowlist.ts`) أو نطاق الناشر.
- Playwright يستخدم Chromium المثبت مسبقًا (`/opt/pw-browsers`) — لا تشغّل `playwright install`.

## الحالة الحالية (2026-10-10)

- كل الـcheckpoints مكتملة. lint · typecheck · validate:data · 105 unit/component · build · 58 e2e (موبايل + ديسكتوب، axe) كلها تمر.
- Lighthouse محلي: الأداء 90–97، الوصولية 100.
- `data/titles`: 20 عنوان حقيقي. القيم من App Store السعودي وGoogle Play (السعودية) وESRB (من ملف البحث)، كلها `confidence: auto` = «بحاجة مراجعة بشرية». الناقص «غير متوفر/ما لقيت». البطاقات التجريبية في `data/demo/titles` وتظهر فقط مع `DALIL_DEMO=1` (الـe2e يضبطه تلقائيًا، فـminecraft/fortnite/roblox/pubg-mobile/tiktok في الـe2e تجريبية).
- الشبكة: App Store وGoogle Play مفتوحة؛ `www.esrb.org` و`pegi.info` و`gcam.gov.sa` ومواقع أغلب الناشرين مرفوضة من البوابة. Node يحتاج `NODE_USE_ENV_PROXY=1` (مضبوط في `fetch:official`).
- المطلوب بشريًا: مراجعة القيم وتحويلها لـ`human`، PEGI وموقع GCAM، روابط PlayStation/Xbox/Nintendo/Steam، ورابط Epic.
- ملاحظة بيئة: `pkill -f next-server` يقتل الـshell نفسه في هذه البيئة؛ استخدم `ps aux | grep -E "next-serve[r]" | awk '{print $2}' | xargs -r kill`.
