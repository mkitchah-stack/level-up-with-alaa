-- Minimal local stand-in for the parts of Supabase our schema touches.
-- Used ONLY for automated RLS tests on a plain Postgres (never run on Supabase).
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname='supabase_auth_admin') then create role supabase_auth_admin nologin; end if;
end $$;
-- Real Supabase: the auth service's role does NOT have `public` on its search_path
alter role supabase_auth_admin set search_path = auth;

create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(nullif(current_setting('request.jwt.claims', true),'')::jsonb->>'sub','')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role, supabase_auth_admin;
grant all on auth.users to supabase_auth_admin;
grant execute on function auth.uid() to anon, authenticated, service_role;

create schema if not exists storage;
create table if not exists storage.buckets (id text primary key, name text, public boolean,
  file_size_limit bigint, allowed_mime_types text[]);
create table if not exists storage.objects (id uuid primary key default gen_random_uuid(),
  bucket_id text, name text, owner uuid);
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated, service_role;
grant all on storage.objects to authenticated, service_role;
grant select on storage.buckets to authenticated;

-- Supabase grants table privileges broadly on public; RLS is the actual guard.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
