-- Automated security tests. Run on a LOCAL Postgres after 00_mock_supabase.sql,
-- supabase/schema.sql and supabase/seed_import.sql.  Never run on production.
\set ON_ERROR_STOP 1
set client_min_messages = notice;

create schema if not exists t;
grant usage on schema t to anon, authenticated;
create or replace function t.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role','authenticated')::text, false);
end $$;
create or replace function t.expect_error(label text, q text) returns void language plpgsql as $$
begin
  begin execute q;
  exception when others then raise notice 'PASS  %  (blocked: %)', label, sqlerrm; return; end;
  raise exception 'FAIL  % — statement was allowed: %', label, q;
end $$;
create or replace function t.expect_count(label text, q text, n bigint) returns void language plpgsql as $$
declare c bigint;
begin
  execute 'select count(*) from (' || q || ') s' into c;
  if c <> n then raise exception 'FAIL  % — expected %, got %', label, n, c; end if;
  raise notice 'PASS  %  (%)', label, c;
end $$;
create or replace function t.expect_rows_affected(label text, q text, n bigint) returns void language plpgsql as $$
declare c bigint;
begin
  execute q; get diagnostics c = row_count;
  if c <> n then raise exception 'FAIL  % — expected % rows affected, got %', label, n, c; end if;
  raise notice 'PASS  %  (% rows)', label, c;
end $$;
grant execute on all functions in schema t to anon, authenticated;

\set A '''aaaaaaaa-0000-0000-0000-00000000000a'''
\set B '''bbbbbbbb-0000-0000-0000-00000000000b'''
\set C '''cccccccc-0000-0000-0000-00000000000c'''
\set ADM '''dddddddd-0000-0000-0000-00000000000d'''

-- 1. signup through the auth service role (reproduces the real Supabase context)
set role supabase_auth_admin; set search_path = auth;
insert into auth.users(id,email,raw_user_meta_data) values
 (:A,'a@test.dz','{"name":"Student A","role":"admin"}'),
 (:B,'b@test.dz','{"name":"Student B"}'),
 (:C,'c@test.dz','{"name":"Student C"}'),
 (:ADM,'admin@test.dz','{"name":"Admin"}');
reset role; set search_path = public;
select t.expect_count('signup creates 4 profiles', 'select 1 from public.profiles', 4);
select t.expect_count('metadata role ignored at signup', $$select 1 from public.profiles where role='admin'$$, 0);
update public.profiles set role='admin', account_status='active' where email='admin@test.dz';  -- manual first-admin step

-- 2. anon sees nothing
set role anon; select set_config('request.jwt.claims','',false);
select t.expect_count('anon cannot read tasks', 'select 1 from public.program_tasks', 0);
select t.expect_count('anon cannot read profiles', 'select 1 from public.profiles', 0);
select t.expect_count('anon cannot read settings', 'select 1 from public.app_settings', 0);
reset role;

-- 3. pending student A
set role authenticated; select t.as_user(:A);
select t.expect_count('pending student cannot read program content', 'select 1 from public.program_tasks', 0);
select t.expect_count('student sees only own profile', 'select 1 from public.profiles', 1);
select t.expect_error('student cannot make self admin', $$update public.profiles set role='admin' where id=auth.uid()$$);
select t.expect_error('student cannot activate self', $$update public.profiles set account_status='active' where id=auth.uid()$$);
select t.expect_error('student cannot set own start date', $$update public.profiles set program_start_date='2020-01-01' where id=auth.uid()$$);
select t.expect_rows_affected('student can change own name', $$update public.profiles set name='Alaa A' where id=auth.uid()$$, 1);
select t.expect_rows_affected('student cannot touch other profile', $$update public.profiles set name='x' where email='b@test.dz'$$, 0);
select t.expect_error('pending student cannot write progress', $$insert into public.student_task_progress(student_id,task_id,completed) values (auth.uid(),'1-1',true)$$);
select t.expect_error('student cannot insert approved payment', $$insert into public.payment_requests(student_id,status) values (auth.uid(),'approved')$$);
select t.expect_error('student cannot insert payment for someone else', $$insert into public.payment_requests(student_id) values ('bbbbbbbb-0000-0000-0000-00000000000b')$$);
select t.expect_error('student cannot point proof at another folder', $$insert into public.payment_requests(student_id,screenshot_path) values (auth.uid(),'bbbbbbbb-0000-0000-0000-00000000000b/x.png')$$);
insert into public.payment_requests(student_id,payment_method,payment_reference,screenshot_path)
  values (auth.uid(),'baridimob','REF123','aaaaaaaa-0000-0000-0000-00000000000a/proof.png');
select t.expect_error('only one pending payment at a time', $$insert into public.payment_requests(student_id) values (auth.uid())$$);
select t.expect_rows_affected('student cannot approve own payment', $$update public.payment_requests set status='approved'$$, 0);
select t.expect_error('student cannot call admin RPC', $$select public.admin_set_account_status(auth.uid(),'active')$$);
select t.expect_error('student cannot call admin overview', $$select * from public.admin_student_overview()$$);
select t.expect_error('student cannot write settings', $$insert into public.app_settings values ('x','1')$$);
select t.expect_rows_affected('student cannot update price', $$update public.app_settings set value='1' where key='subscription_price'$$, 0);
select t.expect_count('student can read settings (price)', 'select 1 from public.app_settings', 4);
-- storage
insert into storage.objects(bucket_id,name) values ('payment-proofs','aaaaaaaa-0000-0000-0000-00000000000a/proof.png');
select t.expect_error('student cannot upload into another folder', $$insert into storage.objects(bucket_id,name) values ('payment-proofs','bbbbbbbb-0000-0000-0000-00000000000b/evil.png')$$);
reset role;

-- 4. student B cannot see A's payment or proof
set role authenticated; select t.as_user(:B);
select t.expect_count('B cannot see A payment', 'select 1 from public.payment_requests', 0);
select t.expect_count('B cannot see A proof file', 'select 1 from storage.objects', 0);
reset role;

-- 5. admin approves A's payment -> A becomes active with start date
set role authenticated; select t.as_user(:ADM);
select t.expect_count('admin sees all profiles', 'select 1 from public.profiles', 4);
select t.expect_count('admin sees A proof file', 'select 1 from storage.objects', 1);
select public.admin_review_payment((select id from public.payment_requests limit 1), true, 'ok');
select t.expect_count('A is active after approval', $$select 1 from public.profiles where email='a@test.dz' and account_status='active' and program_start_date is not null$$, 1);
select t.expect_error('approved request cannot be reviewed twice', $$select public.admin_review_payment((select id from public.payment_requests limit 1), false, null)$$);
select public.admin_set_account_status(:B, 'active');
select public.admin_set_start_date(:A, '2026-09-01');
select t.expect_error('admin video_url must be https', $$update public.program_tasks set video_url='javascript:alert(1)' where id='1-1'$$);
select t.expect_rows_affected('admin can set video url', $$update public.program_tasks set video_url='https://youtu.be/abc' where id='1-1'$$, 1);
select t.expect_rows_affected('admin can add resources', $$update public.program_tasks set resources='[{"title":"PDF","url":"https://example.com/a.pdf"}]' where id='1-2'$$, 1);
select t.expect_rows_affected('admin can edit checklist text', $$update public.program_checklist_items set text=text where id='1-2::0'$$, 1);
select t.expect_rows_affected('admin can set price', $$update public.app_settings set value='2500' where key='subscription_price'$$, 1);
reset role;

-- 6. active student A works through the program
set role authenticated; select t.as_user(:A);
select t.expect_count('active student reads 132 days', 'select 1 from public.program_days', 132);
select t.expect_count('active student reads 396 tasks', 'select 1 from public.program_tasks', 396);
select t.expect_count('active student reads 335 checklist items', 'select 1 from public.program_checklist_items', 335);
select t.expect_rows_affected('student cannot edit task content', $$update public.program_tasks set title='hacked' where id='1-1'$$, 0);
select t.expect_rows_affected('student cannot delete content', $$delete from public.program_tasks where id='1-1'$$, 0);
insert into public.student_task_progress(student_id,task_id,completed,completed_at) values (auth.uid(),'1-1',true,'1999-01-01');
select t.expect_count('completed_at is server-stamped (client value ignored)', $$select 1 from public.student_task_progress where completed_at > now() - interval '1 minute'$$, 1);
insert into public.student_checklist_progress(student_id,checklist_item_id,completed) values
  (auth.uid(),'1-2::0',true),(auth.uid(),'1-2::1',true),(auth.uid(),'1-3::0',true);
select t.expect_error('student cannot write progress for B', $$insert into public.student_task_progress(student_id,task_id,completed) values ('bbbbbbbb-0000-0000-0000-00000000000b','2-1',true)$$);
select t.expect_error('student cannot move own row to B', $$update public.student_task_progress set student_id='bbbbbbbb-0000-0000-0000-00000000000b' where task_id='1-1'$$);
insert into public.weekly_review_responses(student_id,week_number,goal,what_accomplished) values (auth.uid(),1,'goal','did it');
insert into public.monthly_review_responses(student_id,month_number,goal) values (auth.uid(),1,'m goal');
reset role;

-- 7. B is isolated from A
set role authenticated; select t.as_user(:B);
select t.expect_count('B sees none of A task progress', 'select 1 from public.student_task_progress', 0);
select t.expect_count('B sees none of A checklist progress', 'select 1 from public.student_checklist_progress', 0);
select t.expect_count('B sees none of A weekly reviews', 'select 1 from public.weekly_review_responses', 0);
select t.expect_count('B sees none of A monthly reviews', 'select 1 from public.monthly_review_responses', 0);
select t.expect_rows_affected('B cannot delete A progress', $$delete from public.student_checklist_progress$$, 0);
select t.expect_count('B sees only own profile', 'select 1 from public.profiles', 1);
reset role;

-- 8. admin overview uses the same completion rule as programLogic (day 1 = 3 tasks)
set role authenticated; select t.as_user(:ADM);
select t.expect_count('overview: A has 3 completed tasks', $$select 1 from public.admin_student_overview() where email='a@test.dz' and completed_tasks=3$$, 1);
select t.expect_count('admin can read A progress', 'select 1 from public.student_checklist_progress', 3);
select t.expect_error('admin cannot forge progress for a student', $$insert into public.student_task_progress(student_id,task_id,completed) values ('aaaaaaaa-0000-0000-0000-00000000000a','5-1',true)$$);
select public.admin_set_account_status(:A, 'suspended');
reset role;

-- 9. suspended student is locked out of content and writes
set role authenticated; select t.as_user(:A);
select t.expect_count('suspended student cannot read content', 'select 1 from public.program_tasks', 0);
select t.expect_error('suspended student cannot write progress', $$insert into public.student_task_progress(student_id,task_id,completed) values (auth.uid(),'2-1',true)$$);
select t.expect_count('suspended student still sees own profile', 'select 1 from public.profiles', 1);
reset role;

\echo ALL SECURITY TESTS PASSED
