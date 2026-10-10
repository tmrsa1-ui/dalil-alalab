# دليل المراجع: كيف تعبّي بطاقة عنوان

## 1. أنشئ الملف

```bash
npm run new-title -- <slug> "<الاسم العربي>" "<English Name>"
```

يطلع ملف `data/titles/<slug>.json` كل شي فيه «غير متوفر/ما لقيت». عبّ اللي تتحقق منه فقط، واترك الباقي.

## 2. القواعد الذهبية

- **لا تكتب شي ما شفته بعينك في مصدر رسمي.** الفراغ أحسن من التخمين.
- كل رابط `https` ومن: `esrb.org`, `pegi.info`, `apps.apple.com`, `play.google.com`, `gcam.gov.sa`، أدلة المنصات الرسمية، أو **نطاق الناشر** المكتوب في `publisher.url`. غير كذا `validate:data` يرفض.
- ممنوع «آمن/آمنة/أمان» بأي صيغة. اكتب وصف، مو حكم.
- النصوص (`summaryAr`, `noteAr`) سطرين كحد أقصى (220 حرف)، بلغة هادئة بدون وعظ أو تخويف.
- `verifiedAt` = تاريخ اليوم اللي فتحت فيه الصفحة وتحققت (YYYY-MM-DD).
- `isDemo: false` للبيانات الحقيقية.

## 3. الحقول

### الأساسيات

| الحقل       | كيف                                                                           |
| ----------- | ----------------------------------------------------------------------------- |
| `aliases`   | كل الأسماء الشائعة بالعربي والإنجليزي والاختصارات (ببجي، pubg، بابجي).        |
| `kind`      | `game` أو `app`.                                                              |
| `platforms` | الأجهزة الرسمية فقط: `ios`, `android`, `playstation`, `xbox`, `switch`, `pc`. |
| `publisher` | الاسم ورابط الموقع الرسمي (يحدد النطاق المسموح لمصادر الناشر).                |

### `ratings` (كل جهة لحالها)

| الجهة        | من وين                                                                                | `value`                                     |
| ------------ | ------------------------------------------------------------------------------------- | ------------------------------------------- |
| `gcam`       | موقع الهيئة العامة لتنظيم الإعلام (gcam.gov.sa) — **تحقق من وجود صفحة تصنيف للعنوان** | كما هو مكتوب                                |
| `esrb`       | صفحة العنوان في esrb.org                                                              | `E`, `E10+`, `T`, `M`, `AO` + `descriptors` |
| `pegi`       | صفحة العنوان في pegi.info                                                             | `3`, `7`, `12`, `16`, `18` + `descriptors`  |
| `appStore`   | صفحة التطبيق في apps.apple.com (متجر السعودية إن أمكن)                                | مثل `12+`                                   |
| `googlePlay` | صفحة التطبيق في play.google.com                                                       | كما يظهر للمنطقة                            |

لو ما لقيت: `{"value": null, "sourceUrl": null, "verifiedAt": null}`. **لا تحسب تصنيف من جهة ثانية.**

### `attentionPoints` — النقاط الخمس

لكل نقطة: `status` (`present` / `absent` / `configurable` / `unknown`)، `summaryAr`، `sources` (مصدر واحد على الأقل: `url`, `title`, `quote` اقتباس حرفي، `verifiedAt`)، `confidence: "human"`.

- **strangerChat**: هل فيه محادثة نص/صوت مع غرباء؟ تقدر تقفلها؟ (`configurable` لو فيه إعداد لقفلها).
- **purchases**: عملات داخلية، صناديق بمكافآت عشوائية، اشتراكات.
- **content**: من واصفات جهات التصنيف (عنف، رعب، ألفاظ…).
- **ads**: إعلانات داخل العنوان؟ موجّهة؟
- **sessionPause**: هل الجلسة تتوقف (حفظ في أي لحظة) أو مباريات ما تتوقف؟ + `hasRecommendationFeed` و`autoplay` (`true`/`false`/`null`). لاحظ: `present` هنا يعني «جلسات طويلة أو ما تتوقف»، و`absent` يعني «تتوقف بسهولة».

### `familyLens`

`gambling`, `mixedVoiceChat`, `magic`, `clothing`, `music`: `present` / `absent` / `unknown` + `noteAr` وصفي + مصدر. لا أحكام.

### `prayerPause`

`pausable` / `not_pausable_in_match` / `unknown` + `noteAr` + مصدر (مثل صفحة دعم تشرح الإيقاف أو مدة المباراة).

### `controls`

- `inGame`: خطوات من إعدادات اللعبة نفسها (`id`, `pointKey`, `stepAr`, `sourceUrl` رسمي، `verifiedAt`).
- `platformOverrides`: لو خطوات المنصة لهذا العنوان تختلف عن الدليل العام.
- الخطوات تظهر فقط لما يكون `reviewStatus: "human_reviewed"`.

### `conversationTags`

أهم نقطتين للحوار بالترتيب (مثلًا `["strangerChat", "purchases"]`). يحدد أسئلة «تحاور».

### الحالة

- `reviewStatus: "human_reviewed"` + `lastReviewedAt` بعد ما تخلص المراجعة.

## 4. أدلة المنصات `data/platforms/*.json`

- راجع `officialGuideUrl` وعبّ `verifiedAt`.
- كل خطوة تحققت منها: غيّر `isDemo` إلى `false` وحط `sourceUrl` الرسمي و`verifiedAt`.

## 5. البطاقات الآلية

تنحفظ في `data/review-queue/<slug>.json` مع تقرير القبول/الرفض. راجعها، انقلها لـ`data/titles/`، غيّر الثقة لـ`human` بعد التحقق.

## 6. تحقق

```bash
npm run validate:data && npm test
```
