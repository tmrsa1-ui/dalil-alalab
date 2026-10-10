# النشر (تجهيز فقط — لم يُنشر شي)

> لم يتم أي نشر أو تسجيل في خدمات. هذا الملف خطوات يسويها صاحب المشروع بنفسه.

## المتطلبات

- Node.js 20+ (مختبر على 22).
- لا قاعدة بيانات مطلوبة: البيانات ملفات JSON في `data/` تُقرأ وقت البناء.

## الخيار أ: Vercel (الأبسط)

1. اربط المستودع بمشروع Vercel جديد (Framework: Next.js).
2. أمر البناء الافتراضي `npm run build` (يشغّل `validate:data` ويفشل لو البيانات ناقصة).
3. متغيرات البيئة (كلها اختيارية):
   - `NEXT_PUBLIC_SITE_URL` = رابط الموقع النهائي (للـQR في صفحة الطباعة).
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY` لتخزين الأحداث المجهولة.
   - `ENABLE_AI_CARDS=true`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `MAX_AI_CARDS_PER_DAY` للبطاقات الآلية.
4. ملاحظة: نظام ملفات Vercel للقراءة فقط، فـ`data/review-queue/` ما يُكتب في الإنتاج (يُتجاهل بهدوء). لمراجعة البطاقات الآلية استخدم جدول `card_cache` أو شغّل محليًا.

## الخيار ب: أي خادم Node

```bash
npm ci
npm run build
PORT=3000 npm run start
```

ضع الخادم خلف HTTPS (مطلوب للـPWA والـservice worker).

## Supabase (اختياري)

1. أنشئ مشروع (منطقة قريبة).
2. شغّل `supabase/migrations/0001_init.sql` من SQL editor.
3. انسخ `URL` و`anon key` لمتغيرات البيئة. الجداول insert فقط للـanon.
4. أرقام الأثر: `select * from impact_summary;` من اللوحة.

## قبل الإطلاق مع الأهالي

- [ ] استبدال البذور التجريبية بعناوين راجعها إنسان (`isDemo: false`) — انظر `CONTENT_GUIDE.md`.
- [ ] التحقق البشري من روابط الأدلة الرسمية في `data/platforms/*.json` وتعبئة `verifiedAt`.
- [ ] التحقق من مصدر تصنيفات GCAM وطريقة الاستشهاد بها.
- [ ] ضبط `NEXT_PUBLIC_SITE_URL`.
- [ ] تشغيل `npm run test:e2e` على نسخة الإنتاج.
- [ ] Lighthouse على الجوال (هدف ≥ 90 أداء ووصولية).
- [ ] رابط واتساب للتجربة: `https://<الموقع>/` (بدون أي معرّفات تتبع في الرابط).
