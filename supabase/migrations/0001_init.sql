-- دليل الألعاب — مخطط التخزين الاختياري (Supabase / Postgres)
-- مبدأ: insert فقط للمفتاح العام (anon). لا قراءة ولا تعديل ولا حذف من الواجهة.
-- لا IP ولا user agent ولا أي بيانات عن الطفل.

create table if not exists public.events (
  id bigint generated always as identity primary key,
  type text not null check (type in (
    'search','card_viewed','step_viewed','control_step_done','conversation_viewed',
    'agreement_completed','agreement_printed','title_requested','feedback')),
  title_slug text check (title_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  age_band text check (age_band in ('under7','7to12','13plus')),
  platform text check (platform in ('ios','android','playstation','xbox','switch','pc')),
  step text check (step in ('know','setup','talk','agree')),
  control_key text,
  found boolean,
  session_id uuid not null,
  ts timestamptz not null,
  received_at timestamptz not null default now()
);

create table if not exists public.title_requests (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 80),
  ts timestamptz not null default now()
);

create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  useful text not null check (useful in ('yes','somewhat','no')),
  talked text not null check (talked in ('yes','planned','no')),
  will_use_again text not null check (will_use_again in ('yes','maybe','no')),
  parent_note text check (parent_note is null or char_length(parent_note) <= 500),
  title_slug text,
  ts timestamptz not null default now()
);

-- كاش البطاقات الآلية (يكتبه الخادم بمفتاح الخدمة فقط، لا anon).
create table if not exists public.card_cache (
  key text primary key,
  title jsonb not null,
  report jsonb,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
alter table public.title_requests enable row level security;
alter table public.feedback enable row level security;
alter table public.card_cache enable row level security;

create policy "anon insert events" on public.events for insert to anon with check (true);
create policy "anon insert title_requests" on public.title_requests for insert to anon with check (true);
create policy "anon insert feedback" on public.feedback for insert to anon with check (true);
-- لا سياسات select/update/delete للـanon = ممنوعة افتراضيًا.
-- card_cache: بدون أي سياسة للـanon.

create index if not exists events_type_ts on public.events (type, ts);

-- عرض مجمّع لقياس الأثر (يُقرأ من لوحة Supabase أو بمفتاح الخدمة فقط).
create or replace view public.impact_summary as
  select type, count(*) as events, count(distinct session_id) as sessions
  from public.events group by type;
revoke all on public.impact_summary from anon;
