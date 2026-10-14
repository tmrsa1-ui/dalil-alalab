-- ملخص التقييم (مفيد / تكلمتوا / تستخدمه ثانية) — أعداد مجمّعة فقط، بدون الملاحظات النصية.
-- يُقرأ بمفتاح الخدمة من صفحة /about/impact. لا شي للـanon.
create or replace view public.feedback_summary as
  select 'useful' as question, useful as answer, count(*) as n from public.feedback group by useful
  union all
  select 'talked', talked, count(*) from public.feedback group by talked
  union all
  select 'willUseAgain', will_use_again, count(*) from public.feedback group by will_use_again;
revoke all on public.feedback_summary from anon;
