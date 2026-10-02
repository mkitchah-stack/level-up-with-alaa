-- =====================================================================
-- LEVEL UP WITH ALAA — BAC 2027
-- Supabase schema + Row Level Security  (v2 — patched & hardened)
--
-- HOW TO RUN: Supabase Dashboard > SQL Editor > New query > paste this
-- WHOLE file > Run. Then run seed_import.sql in a second query.
--
-- This file is IDEMPOTENT and UPGRADE-SAFE:
--   * fresh project  -> creates everything
--   * project that already ran the v1 schema.sql -> adds the missing
--     columns / functions and replaces every policy, without touching data.
--
-- What changed vs v1 (see README "قرارات تقنية"):
--   1. Every object is schema-qualified (public.profiles ...) and every
--      SECURITY DEFINER function pins `search_path = public`.  v1's
--      handle_new_user() ran under supabase_auth_admin, whose search_path
--      does not include `public` -> "relation profiles does not exist"
--      at signup.  This is the fix for ERROR 42P01.
--   2. Policies are dropped-then-created, so re-running never fails with
--      "policy already exists".
--   3. SECURITY: a student could UPDATE their own profile row and set
--      role='admin' / account_status='active'.  Now blocked by a trigger.
--   4. SECURITY: a student could INSERT a payment_request with
--      status='approved'.  Now the insert policy forces 'pending'.
--   5. Program content + progress are gated on account_status='active'
--      (manual payment model).  Admins always pass.
--   6. Admin write policies added for every content table and settings
--      (v1 only had one for program_tasks, and settings had no INSERT).
--   7. program_start_date on profiles -> enables real Catch-up (see
--      programLogic.js header for why the v1 rule could never produce any).
--   8. Review tables gain the `goal` field that exists in the approved JSON.
--   9. Atomic admin RPCs: approve/reject payment, set account status,
--      per-student overview.
-- =====================================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'student' check (role in ('student','admin')),
  account_status text not null default 'pending' check (account_status in ('pending','active','suspended')),
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists program_start_date date;
alter table public.profiles add column if not exists activated_at timestamptz;

-- helpers (SECURITY DEFINER bypasses RLS on profiles -> no policy recursion)
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_active() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and (account_status = 'active' or role = 'admin'));
$$;

-- "trusted" = admin, or a server-side/maintenance connection (SQL editor,
-- service_role key).  Normal browser sessions run as role `authenticated`.
create or replace function public.is_trusted_caller() returns boolean
language sql stable set search_path = public as $$
  select public.is_admin()
      or current_user in ('postgres','supabase_admin','service_role')
      or coalesce(nullif(current_setting('request.jwt.claims', true),'')::jsonb->>'role','') = 'service_role';
$$;

-- auto-create a profile row on signup.  Only `name` is taken from user
-- metadata; role/status always start at their safe defaults.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id,
          left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email,'@',1)), 120),
          new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep profiles.email in sync if the user changes their auth email
create or replace function public.handle_user_email_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- SECURITY: students may only change their own `name`.
-- NOTE: deliberately NOT security definer, so current_user reflects the real caller.
create or replace function public.guard_profile_update() returns trigger
language plpgsql set search_path = public as $$
begin
  if public.is_trusted_caller() then
    return new;
  end if;
  -- the email sync trigger runs as the definer (postgres) -> trusted above
  if new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.account_status is distinct from old.account_status
     or new.email is distinct from old.email
     or new.program_start_date is distinct from old.program_start_date
     or new.activated_at is distinct from old.activated_at
     or new.created_at is distinct from old.created_at then
    raise exception 'not allowed: only the name can be changed by the account owner'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ============================================================
-- 2. PROGRAM CONTENT (imported from the approved JSON via seed_import.sql)
-- ============================================================
create table if not exists public.program_days (
  day_number int primary key,
  month int not null
);

create table if not exists public.program_tasks (
  id text primary key,              -- "{day_number}-{task_number}", e.g. "1-1"
  day_number int not null references public.program_days(day_number),
  task_number int not null,
  subject text,
  subject_label_ar text,
  task_type text,
  title text not null,
  description text,
  has_video boolean not null default false,
  video_url text,
  thumbnail_url text,
  resources jsonb not null default '[]'::jsonb
);
-- admin-entered links must be https (blocks javascript: / data: URLs)
alter table public.program_tasks drop constraint if exists program_tasks_video_url_https;
alter table public.program_tasks add constraint program_tasks_video_url_https
  check (video_url is null or video_url ~* '^https://');
alter table public.program_tasks drop constraint if exists program_tasks_thumb_url_https;
alter table public.program_tasks add constraint program_tasks_thumb_url_https
  check (thumbnail_url is null or thumbnail_url ~* '^https://');
alter table public.program_tasks drop constraint if exists program_tasks_resources_array;
alter table public.program_tasks add constraint program_tasks_resources_array
  check (jsonb_typeof(resources) = 'array');
create index if not exists program_tasks_day_idx on public.program_tasks(day_number);

create table if not exists public.program_checklist_items (
  id text primary key,              -- "{task_id}::{item_index}", e.g. "1-2::0"
  task_id text not null references public.program_tasks(id) on delete cascade,
  item_index int not null,
  text text not null
);
create index if not exists program_checklist_task_idx on public.program_checklist_items(task_id);

create table if not exists public.weekly_reviews (
  week_number int primary key,
  from_day int not null,
  to_day int not null,
  max_stars int
);

create table if not exists public.monthly_reviews (
  month_number int primary key,
  from_day int not null,
  to_day int not null,
  max_stars int
);

create table if not exists public.final_check_metrics (
  label text primary key,
  value int not null,
  target int not null
);

-- ============================================================
-- 3. STUDENT PROGRESS (private per student)
-- ============================================================
create table if not exists public.student_task_progress (
  student_id uuid not null references public.profiles(id) on delete cascade,
  task_id text not null references public.program_tasks(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  primary key (student_id, task_id)
);

create table if not exists public.student_checklist_progress (
  student_id uuid not null references public.profiles(id) on delete cascade,
  checklist_item_id text not null references public.program_checklist_items(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  primary key (student_id, checklist_item_id)
);

create table if not exists public.weekly_review_responses (
  student_id uuid not null references public.profiles(id) on delete cascade,
  week_number int not null references public.weekly_reviews(week_number),
  what_accomplished text,
  what_to_improve text,
  updated_at timestamptz not null default now(),
  primary key (student_id, week_number)
);
alter table public.weekly_review_responses add column if not exists goal text;

create table if not exists public.monthly_review_responses (
  student_id uuid not null references public.profiles(id) on delete cascade,
  month_number int not null references public.monthly_reviews(month_number),
  biggest_achievement text,
  improve_next_month text,
  updated_at timestamptz not null default now(),
  primary key (student_id, month_number)
);
alter table public.monthly_review_responses add column if not exists goal text;

-- length limits on free text (abuse / storage protection)
alter table public.weekly_review_responses drop constraint if exists weekly_text_len;
alter table public.weekly_review_responses add constraint weekly_text_len check (
  coalesce(length(goal),0) <= 2000 and coalesce(length(what_accomplished),0) <= 4000
  and coalesce(length(what_to_improve),0) <= 4000);
alter table public.monthly_review_responses drop constraint if exists monthly_text_len;
alter table public.monthly_review_responses add constraint monthly_text_len check (
  coalesce(length(goal),0) <= 2000 and coalesce(length(biggest_achievement),0) <= 4000
  and coalesce(length(improve_next_month),0) <= 4000);

-- server stamps the timestamps (client clocks are not trusted)
create or replace function public.stamp_completed_at() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.completed then
    if tg_op = 'INSERT' or not old.completed then new.completed_at := now();
    else new.completed_at := old.completed_at; end if;
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists stamp_task_progress on public.student_task_progress;
create trigger stamp_task_progress before insert or update on public.student_task_progress
  for each row execute function public.stamp_completed_at();
drop trigger if exists stamp_checklist_progress on public.student_checklist_progress;
create trigger stamp_checklist_progress before insert or update on public.student_checklist_progress
  for each row execute function public.stamp_completed_at();

create or replace function public.stamp_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end;
$$;
drop trigger if exists stamp_weekly_resp on public.weekly_review_responses;
create trigger stamp_weekly_resp before insert or update on public.weekly_review_responses
  for each row execute function public.stamp_updated_at();
drop trigger if exists stamp_monthly_resp on public.monthly_review_responses;
create trigger stamp_monthly_resp before insert or update on public.monthly_review_responses
  for each row execute function public.stamp_updated_at();

-- ============================================================
-- 4. PAYMENTS + SETTINGS
-- ============================================================
create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  payment_method text,
  payment_reference text,
  screenshot_path text,
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  admin_note text
);
create index if not exists payment_requests_student_idx on public.payment_requests(student_id);
-- at most one open request per student
create unique index if not exists payment_requests_one_pending
  on public.payment_requests(student_id) where status = 'pending';
alter table public.payment_requests drop constraint if exists payment_text_len;
alter table public.payment_requests add constraint payment_text_len check (
  coalesce(length(payment_method),0) <= 60 and coalesce(length(payment_reference),0) <= 200
  and coalesce(length(note),0) <= 1000 and coalesce(length(screenshot_path),0) <= 300);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null
);
insert into public.app_settings (key, value) values
  ('subscription_price', 'null'::jsonb),
  ('currency', '"DZD"'::jsonb),
  ('payment_instructions', '""'::jsonb),
  ('contact', '""'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.program_days enable row level security;
alter table public.program_tasks enable row level security;
alter table public.program_checklist_items enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.monthly_reviews enable row level security;
alter table public.final_check_metrics enable row level security;
alter table public.student_task_progress enable row level security;
alter table public.student_checklist_progress enable row level security;
alter table public.weekly_review_responses enable row level security;
alter table public.monthly_review_responses enable row level security;
alter table public.payment_requests enable row level security;
alter table public.app_settings enable row level security;

-- drop every policy we own (v1 + v2 names) so this file is re-runnable
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' and tablename in (
    'profiles','program_days','program_tasks','program_checklist_items','weekly_reviews',
    'monthly_reviews','final_check_metrics','student_task_progress','student_checklist_progress',
    'weekly_review_responses','monthly_review_responses','payment_requests','app_settings')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- profiles: owner or admin can read; owner may update (trigger limits it to `name`);
-- admin may update anything.  No INSERT/DELETE policy: rows come from the signup trigger.
create policy profiles_select_own_or_admin on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_update on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- program content: readable by ACTIVE students and admins; writable by admins only
create policy program_days_read on public.program_days for select using (public.is_active());
create policy program_tasks_read on public.program_tasks for select using (public.is_active());
create policy program_checklist_read on public.program_checklist_items for select using (public.is_active());
create policy weekly_reviews_read on public.weekly_reviews for select using (public.is_active());
create policy monthly_reviews_read on public.monthly_reviews for select using (public.is_active());
create policy final_check_read on public.final_check_metrics for select using (public.is_active());

create policy program_days_admin_write on public.program_days for all using (public.is_admin()) with check (public.is_admin());
create policy program_tasks_admin_write on public.program_tasks for all using (public.is_admin()) with check (public.is_admin());
create policy program_checklist_admin_write on public.program_checklist_items for all using (public.is_admin()) with check (public.is_admin());
create policy weekly_reviews_admin_write on public.weekly_reviews for all using (public.is_admin()) with check (public.is_admin());
create policy monthly_reviews_admin_write on public.monthly_reviews for all using (public.is_admin()) with check (public.is_admin());
create policy final_check_admin_write on public.final_check_metrics for all using (public.is_admin()) with check (public.is_admin());

-- student progress: owner reads/writes own rows (must be active); admin can read all.
-- Admin does NOT get write access to other students' progress (not needed, safer).
create policy task_progress_select on public.student_task_progress for select
  using (student_id = auth.uid() or public.is_admin());
create policy task_progress_write on public.student_task_progress for insert
  with check (student_id = auth.uid() and public.is_active());
create policy task_progress_update on public.student_task_progress for update
  using (student_id = auth.uid() and public.is_active()) with check (student_id = auth.uid());
create policy task_progress_delete on public.student_task_progress for delete
  using (student_id = auth.uid() and public.is_active());

create policy checklist_progress_select on public.student_checklist_progress for select
  using (student_id = auth.uid() or public.is_admin());
create policy checklist_progress_write on public.student_checklist_progress for insert
  with check (student_id = auth.uid() and public.is_active());
create policy checklist_progress_update on public.student_checklist_progress for update
  using (student_id = auth.uid() and public.is_active()) with check (student_id = auth.uid());
create policy checklist_progress_delete on public.student_checklist_progress for delete
  using (student_id = auth.uid() and public.is_active());

create policy weekly_response_select on public.weekly_review_responses for select
  using (student_id = auth.uid() or public.is_admin());
create policy weekly_response_insert on public.weekly_review_responses for insert
  with check (student_id = auth.uid() and public.is_active());
create policy weekly_response_update on public.weekly_review_responses for update
  using (student_id = auth.uid() and public.is_active()) with check (student_id = auth.uid());

create policy monthly_response_select on public.monthly_review_responses for select
  using (student_id = auth.uid() or public.is_admin());
create policy monthly_response_insert on public.monthly_review_responses for insert
  with check (student_id = auth.uid() and public.is_active());
create policy monthly_response_update on public.monthly_review_responses for update
  using (student_id = auth.uid() and public.is_active()) with check (student_id = auth.uid());

-- payments: student inserts own request ONLY as a fresh pending one; reads own.
-- Only admin can update (approve/reject).  No student UPDATE/DELETE policy exists.
create policy payments_insert_own on public.payment_requests for insert
  with check (
    student_id = auth.uid()
    and status = 'pending'
    and reviewed_at is null
    and admin_note is null
    and (screenshot_path is null or split_part(screenshot_path, '/', 1) = auth.uid()::text)
  );
create policy payments_select_own_or_admin on public.payment_requests for select
  using (student_id = auth.uid() or public.is_admin());
create policy payments_admin_update on public.payment_requests for update
  using (public.is_admin()) with check (public.is_admin());

-- settings: any signed-in user can read (price on the payment page); admin writes
create policy settings_read on public.app_settings for select using (auth.uid() is not null);
create policy settings_admin_insert on public.app_settings for insert with check (public.is_admin());
create policy settings_admin_update on public.app_settings for update using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 6. ADMIN RPCs (atomic, re-check admin inside)
-- ============================================================
create or replace function public.admin_set_account_status(p_user uuid, p_status text, p_start date default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  if p_status not in ('pending','active','suspended') then raise exception 'bad status'; end if;
  update public.profiles
     set account_status = p_status,
         activated_at = case when p_status = 'active' and activated_at is null then now() else activated_at end,
         program_start_date = case
            when p_start is not null then p_start
            when p_status = 'active' and program_start_date is null then (now() at time zone 'Africa/Algiers')::date
            else program_start_date end
   where id = p_user;
end;
$$;

create or replace function public.admin_set_start_date(p_user uuid, p_start date)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  update public.profiles set program_start_date = p_start where id = p_user;
end;
$$;

create or replace function public.admin_review_payment(p_request uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_student uuid;
begin
  if not public.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  update public.payment_requests
     set status = case when p_approve then 'approved' else 'rejected' end,
         reviewed_at = now(),
         admin_note = nullif(trim(coalesce(p_note,'')), '')
   where id = p_request and status = 'pending'
   returning student_id into v_student;
  if v_student is null then raise exception 'request not found or already reviewed'; end if;
  if p_approve then
    perform public.admin_set_account_status(v_student, 'active', null);
  end if;
end;
$$;

-- per-student summary for the admin table (task completion computed in SQL
-- with the SAME rule as programLogic.isTaskComplete)
create or replace function public.admin_student_overview()
returns table (id uuid, name text, email text, role text, account_status text,
               program_start_date date, created_at timestamptz,
               completed_tasks int, last_activity timestamptz)
language plpgsql security definer stable set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only' using errcode = '42501'; end if;
  return query
  with cl_total as (
    select task_id, count(*) n from public.program_checklist_items group by task_id
  ), cl_done as (
    select scp.student_id, ci.task_id, count(*) n, max(scp.completed_at) at
      from public.student_checklist_progress scp
      join public.program_checklist_items ci on ci.id = scp.checklist_item_id
     where scp.completed group by 1,2
  ), done as (
    select d.student_id, d.task_id, d.at from cl_done d join cl_total t using (task_id) where d.n = t.n
    union all
    select stp.student_id, stp.task_id, stp.completed_at
      from public.student_task_progress stp
     where stp.completed and not exists (select 1 from cl_total t where t.task_id = stp.task_id)
  ), activity as (
    select s.student_id, max(s.completed_at) at from (
      select student_id, completed_at from public.student_checklist_progress
      union all select student_id, completed_at from public.student_task_progress) s group by 1
  )
  select p.id, p.name, p.email, p.role, p.account_status, p.program_start_date, p.created_at,
         coalesce((select count(*)::int from done where done.student_id = p.id), 0),
         (select a.at from activity a where a.student_id = p.id)
    from public.profiles p
   order by p.created_at desc;
end;
$$;

revoke all on function public.admin_set_account_status(uuid,text,date) from public, anon;
revoke all on function public.admin_set_start_date(uuid,date) from public, anon;
revoke all on function public.admin_review_payment(uuid,boolean,text) from public, anon;
revoke all on function public.admin_student_overview() from public, anon;
grant execute on function public.admin_set_account_status(uuid,text,date) to authenticated;
grant execute on function public.admin_set_start_date(uuid,date) to authenticated;
grant execute on function public.admin_review_payment(uuid,boolean,text) to authenticated;
grant execute on function public.admin_student_overview() to authenticated;

-- ============================================================
-- 7. STORAGE (payment screenshots, private)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs','payment-proofs', false, 5242880,
        array['image/jpeg','image/png','image/webp','image/heic','application/pdf'])
on conflict (id) do update set public = false,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "payment_proof_student_upload" on storage.objects;
drop policy if exists "payment_proof_owner_or_admin_read" on storage.objects;
create policy "payment_proof_student_upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "payment_proof_owner_or_admin_read" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
-- no update/delete policy: proofs are immutable once uploaded

-- ============================================================
-- 8. FIRST ADMIN (run manually once, after registering normally):
--   update public.profiles set role = 'admin', account_status = 'active'
--    where email = 'your-email@example.com';
-- ============================================================
