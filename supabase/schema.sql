-- Supabase SQL schema for Result Management System

-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- admins
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  username text unique not null,
  email text unique not null,
  password_hash text not null,
  role text default 'admin',
  profile_image text,
  created_at timestamp with time zone default timezone('utc', now())
);

-- admin sessions
create table if not exists admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admins(id) on delete cascade,
  token text unique not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc', now())
);

-- students
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  father_name text not null,
  class text not null,
  roll_no int not null unique,
  created_at timestamp with time zone default timezone('utc', now())
);

create sequence if not exists roll_seq start 1000;

-- subjects
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  class text not null,
  subject_name text not null,
  total_marks int not null default 100,
  created_at timestamp with time zone default timezone('utc', now())
);
create unique index if not exists subjects_unique_per_class ON subjects (class, lower(subject_name));

-- results
create table if not exists results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  class text not null,
  subject_id uuid references subjects(id) on delete cascade,
  total_marks int not null,
  obtained_marks int not null,
  grade text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc', now())
);

-- FUNCTIONS

-- admin login: verifies password using crypt and returns token + admin json
create or replace function admin_login(identifier_param text, password_param text)
returns jsonb language plpgsql security definer as $$
declare
  a record;
  tok text := replace(gen_random_uuid()::text, '-', '');
  expires timestamp := now() + interval '8 hours';
  result jsonb;
begin
  select * into a from admins where lower(username)=lower(identifier_param) or lower(email)=lower(identifier_param) limit 1;
  if not found then
    raise exception 'Invalid credentials';
  end if;
  if crypt(password_param, a.password_hash) <> a.password_hash then
    raise exception 'Invalid credentials';
  end if;
  insert into admin_sessions(admin_id, token, expires_at) values (a.id, tok, expires);
  result := jsonb_build_object('token', tok, 'admin', jsonb_build_object('id', a.id, 'full_name', a.full_name, 'username', a.username, 'email', a.email, 'role', a.role, 'profile_image', a.profile_image));
  return result;
end;
$$;

-- admin dashboard stats
drop function if exists admin_dashboard_stats();
create function admin_dashboard_stats()
returns jsonb
language sql
security definer
stable
as $$
  select jsonb_build_object(
    'total_students', (select count(*) from students),
    'total_classes', (select count(distinct class) from students),
    'total_subjects', (select count(*) from subjects),
    'pending_results', (select count(*) from results where status='pending')
  );
$$;

-- admin add student
drop function if exists admin_add_student(text, text, text);
create function admin_add_student(student_name text, father_name text, class_name text)
returns students
language plpgsql
security definer
as $$
declare newid uuid; rec students%rowtype;
begin
  newid := gen_random_uuid();
  insert into students(id, student_name, father_name, class, roll_no)
    values (newid, student_name, father_name, class_name, nextval('roll_seq'))
    returning * into rec;
  return rec;
end;
$$;

-- admin delete student
drop function if exists admin_delete_student(uuid);
create function admin_delete_student(p_student_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from results where student_id = p_student_id;
  delete from students where id = p_student_id;
end;
$$;

-- list students
drop function if exists admin_list_students();
create function admin_list_students()
returns setof students
language sql
security definer
as $$ select * from students order by created_at desc $$;

drop function if exists admin_list_students_by_class(text);
create function admin_list_students_by_class(class_name text)
returns table(id uuid, student_name text, father_name text, class text, roll_no int)
language sql
security definer
as $$ select id, student_name, father_name, class, roll_no from students where class = class_name order by roll_no $$;

-- add subjects batch
drop function if exists admin_add_subjects(text, jsonb);
create function admin_add_subjects(class_name text, subjects jsonb)
returns void
language plpgsql
security definer
as $$
declare s jsonb; name text; total int;
begin
  for s in select * from jsonb_array_elements(subjects) loop
    name := trim((s->>'name')::text);
    total := COALESCE((s->>'total')::int, 100);
    if name = '' then
      raise exception 'Subject name empty';
    end if;
    if exists(select 1 from subjects where class = class_name and lower(subject_name)=lower(name)) then
      raise exception 'Duplicate subject: %', name;
    end if;
    insert into subjects(class, subject_name, total_marks) values (class_name, name, total);
  end loop;
end;
$$;

-- bulk approvals and deletions for pending results
drop function if exists admin_approve_results_bulk(jsonb);
create function admin_approve_results_bulk(ids jsonb)
returns void
language plpgsql
security definer
as $$
declare rid uuid; val text;
begin
  for val in select jsonb_array_elements_text(ids) loop
    rid := val::uuid;
    update results set status='published' where id = rid;
  end loop;
end;
$$;

drop function if exists admin_delete_results_bulk(jsonb);
create function admin_delete_results_bulk(ids jsonb)
returns void
language plpgsql
security definer
as $$
declare rid uuid; val text;
begin
  for val in select jsonb_array_elements_text(ids) loop
    rid := val::uuid;
    delete from results where id = rid;
  end loop;
end;
$$;

drop function if exists admin_list_subjects(text);
create function admin_list_subjects(class_name text)
returns table(id uuid, class text, subject_name text, total_marks int)
language sql
security definer
as $$ select id, class, subject_name, total_marks from subjects where class = class_name order by subject_name $$;

drop function if exists admin_delete_subject(uuid);
create function admin_delete_subject(subject_id uuid)
returns void
language sql
security definer
as $$ delete from subjects where id = subject_id $$;

-- add results batch
drop function if exists admin_add_results_batch(jsonb);
create function admin_add_results_batch(results jsonb)
returns void
language plpgsql
security definer
as $$
declare r jsonb; sid uuid; subid uuid; tot int; obt int;
begin
  for r in select * from jsonb_array_elements(results) loop
    sid := (r->>'student_id')::uuid;
    subid := (r->>'subject_id')::uuid;
    tot := (r->>'total_marks')::int;
    obt := (r->>'obtained_marks')::int;
    if not exists(select 1 from students where id = sid) then
      raise exception 'Student not found';
    end if;
    if obt > tot then
      raise exception 'Obtained marks cannot exceed total';
    end if;
    insert into results(student_id, class, subject_id, total_marks, obtained_marks, grade, status)
    values (sid, (select class from students where id=sid), subid, tot, obt, null, 'pending');
  end loop;
end;
$$;

-- list results
drop function if exists admin_list_results(text);
create function admin_list_results(status text)
returns table(id uuid, student_id uuid, student_name text, roll_no int, class text, subject_id uuid, subject_name text, total_marks int, obtained_marks int)
language sql
security definer
as $$
select r.id, r.student_id, s.student_name, s.roll_no, r.class, r.subject_id, subj.subject_name, r.total_marks, r.obtained_marks
from results r
join students s on s.id = r.student_id
join subjects subj on subj.id = r.subject_id
where r.status = lower(status) or r.status = status
order by r.created_at desc
$$;

drop function if exists admin_approve_result(uuid);
create function admin_approve_result(result_id uuid)
returns void
language sql
security definer
as $$ update results set status='published' where id = result_id $$;

drop function if exists admin_delete_result(uuid);
create function admin_delete_result(result_id uuid)
returns void
language sql
security definer
as $$ delete from results where id = result_id $$;

-- portal functions
drop function if exists portal_find_student(text, text);
create function portal_find_student(class_name text, roll_param text)
returns students
language sql
security definer
as $$ select * from students where class = class_name and roll_no::text = roll_param limit 1 $$;

drop function if exists portal_get_results(uuid);
create function portal_get_results(p_student_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare s record; res record; arr jsonb := '[]'::jsonb; student jsonb;
begin
  select * into s from students where id = p_student_id;
  if not found then return null; end if;
  student := to_jsonb(s);
  for res in select r.*, subj.subject_name,
      case
        when r.total_marks = 0 then 'F'
        when (r.obtained_marks::numeric / r.total_marks::numeric) * 100 >= 90 then 'A+'
        when (r.obtained_marks::numeric / r.total_marks::numeric) * 100 >= 80 then 'A'
        when (r.obtained_marks::numeric / r.total_marks::numeric) * 100 >= 70 then 'B'
        when (r.obtained_marks::numeric / r.total_marks::numeric) * 100 >= 60 then 'C'
        when (r.obtained_marks::numeric / r.total_marks::numeric) * 100 >= 50 then 'D'
        when (r.obtained_marks::numeric / r.total_marks::numeric) * 100 >= 40 then 'E'
        else 'F'
      end as grade
    from results r
    join subjects subj on subj.id = r.subject_id
    where r.student_id = p_student_id and r.status='published' loop
    arr := arr || jsonb_build_object(
      'id', res.id,
      'subject_name', res.subject_name,
      'total_marks', res.total_marks,
      'obtained_marks', res.obtained_marks,
      'grade', res.grade
    );
  end loop;
  return jsonb_build_object('student', student, 'results', arr);
end;
$$;

-- Search students helper
drop function if exists admin_search_students(text, text);
create function admin_search_students(q text, class_name text)
returns table(id uuid, student_name text, father_name text, class text, roll_no int)
language sql
security definer
as $$
select id, student_name, father_name, class, roll_no from students
where (q = '' or lower(student_name) like lower('%'||q||'%') or roll_no::text = q)
and (class_name = '' or class = class_name)
order by roll_no
$$;

-- Update result (edit obtained marks)
drop function if exists admin_update_result(uuid, int);
create function admin_update_result(result_id uuid, obtained int)
returns void
language plpgsql
security definer
as $$
begin
  update results set obtained_marks = obtained where id = result_id;
end;
$$;

-- Indexes
create index if not exists idx_students_class on students(class);
create index if not exists idx_results_status on results(status);

-- Password reset table
create table if not exists admin_password_resets (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admins(id) on delete cascade,
  token text unique not null,
  expires_at timestamp with time zone not null,
  used boolean default false,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Row Level Security: restrict direct table operations; use security definer functions instead
alter table admins enable row level security;
alter table admin_sessions enable row level security;
alter table admin_password_resets enable row level security;
alter table students enable row level security;
alter table subjects enable row level security;
alter table results enable row level security;

-- Policies: deny all by default for anon role (public), allow function execution via RPC security definer
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'admins' and policyname = 'deny_all_admins'
  ) then
    create policy deny_all_admins on admins for all using (false);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'students' and policyname = 'deny_all_students'
  ) then
    create policy deny_all_students on students for all using (false);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'subjects' and policyname = 'deny_all_subjects'
  ) then
    create policy deny_all_subjects on subjects for all using (false);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'results' and policyname = 'deny_all_results'
  ) then
    create policy deny_all_results on results for all using (false);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'admin_sessions' and policyname = 'deny_all_admin_sessions'
  ) then
    create policy deny_all_admin_sessions on admin_sessions for all using (false);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'admin_password_resets' and policyname = 'deny_all_password_resets'
  ) then
    create policy deny_all_password_resets on admin_password_resets for all using (false);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'students' and policyname = 'allow_public_read_students'
  ) then
    create policy allow_public_read_students on students for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'subjects' and policyname = 'allow_public_read_subjects'
  ) then
    create policy allow_public_read_subjects on subjects for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'results' and policyname = 'allow_public_read_results'
  ) then
    create policy allow_public_read_results on results for select using (status = 'published');
  end if;
end $$;

-- Initial admin insert example (run manually, replace password)
-- INSERT INTO admins(full_name, username, email, password_hash) VALUES ('Administrator','admin','admin@example.com', crypt('ChangeMeStrongPassword!', gen_salt('bf')));

-- profile update and change password
drop function if exists admin_update_profile(uuid, text, text, text);
create function admin_update_profile(admin_id uuid, full_name text, username_param text, profile_image text default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  a admins%rowtype;
  new_full_name alias for full_name;
  new_profile_image alias for profile_image;
begin
  update admins
  set full_name = new_full_name,
      username = username_param,
      profile_image = COALESCE(new_profile_image, admins.profile_image)
  where id = admin_id returning * into a;
  if not found then raise exception 'Not found'; end if;
  return to_jsonb(a);
end;
$$;

drop function if exists admin_change_password(uuid, text);
create function admin_change_password(admin_id uuid, new_password text)
returns void
language plpgsql
security definer
as $$
begin
  update admins set password_hash = crypt(new_password, gen_salt('bf')) where id = admin_id;
end;
$$;

-- helpers: create an initial admin (to be run manually with secure password)
-- Example: insert into admins(full_name, username, email, password_hash) values ('Admin','admin','admin@example.com', crypt('YourStrongPassword', gen_salt('bf')));

-- Password reset functions
drop function if exists admin_create_password_reset(text);
create function admin_create_password_reset(identifier text)
returns text
language plpgsql
security definer
as $$
declare a admins%rowtype; tok text := replace(gen_random_uuid()::text, '-',''); exp timestamp := now() + interval '1 hour';
begin
  select * into a from admins where lower(username)=lower(identifier) or lower(email)=lower(identifier) limit 1;
  if not found then
    raise exception 'Admin not found';
  end if;
  insert into admin_password_resets(admin_id, token, expires_at) values (a.id, tok, exp);
  return tok;
end;
$$;

drop function if exists admin_reset_password(text, text);
create function admin_reset_password(token_param text, new_password text)
returns void
language plpgsql
security definer
as $$
declare r admin_password_resets%rowtype;
begin
  select * into r from admin_password_resets where token = token_param and used = false and expires_at > now() limit 1;
  if not found then
    raise exception 'Invalid or expired token';
  end if;
  update admins set password_hash = crypt(new_password, gen_salt('bf')) where id = r.admin_id;
  update admin_password_resets set used = true where id = r.id;
end;
$$;

-- Bulk student import
drop function if exists admin_add_students_bulk(jsonb);
create function admin_add_students_bulk(payload jsonb)
returns void
language plpgsql
security definer
as $$
declare item jsonb; name text; father text; class text; rno int;
begin
  for item in select * from jsonb_array_elements(payload) loop
    name := coalesce(trim((item->>'student_name')::text), '');
    father := coalesce(trim((item->>'father_name')::text), '');
    class := coalesce(trim((item->>'class')::text), '');
    if name = '' or father = '' or class = '' then
      raise exception 'Missing fields in CSV import';
    end if;
    rno := nextval('roll_seq');
    insert into students(student_name, father_name, class, roll_no) values (name, father, class, rno);
  end loop;
end;
$$;

-- Bulk results import expects array of objects {roll_no, class, subject_name, obtained_marks}
drop function if exists admin_add_results_csv(jsonb);
create function admin_add_results_csv(payload jsonb)
returns void
language plpgsql
security definer
as $$
declare item jsonb; roll text; cls text; subj text; obtained int; stu students%rowtype; subjrec subjects%rowtype; tot int;
begin
  for item in select * from jsonb_array_elements(payload) loop
    roll := (item->>'roll_no')::text;
    cls := (item->>'class')::text;
    subj := (item->>'subject_name')::text;
    obtained := (item->>'obtained_marks')::int;
    select * into stu from students where roll_no::text = roll and class = cls limit 1;
    if not found then raise exception 'Student not found % %', roll, cls; end if;
    select * into subjrec from subjects where class = cls and lower(subject_name)=lower(subj) limit 1;
    if not found then raise exception 'Subject not found % %', subj, cls; end if;
    tot := subjrec.total_marks;
    if obtained > tot then raise exception 'Obtained marks exceed total for %', subj; end if;
    insert into results(student_id, class, subject_id, total_marks, obtained_marks, status) values (stu.id, cls, subjrec.id, tot, obtained, 'pending');
  end loop;
end;
$$;

-- Grant RPC permissions to the frontend client roles
grant execute on function admin_login(text, text) to anon, authenticated;
grant execute on function admin_dashboard_stats() to anon, authenticated;
grant execute on function admin_add_student(text, text, text) to anon, authenticated;
grant execute on function admin_delete_student(uuid) to anon, authenticated;
grant execute on function admin_list_students() to anon, authenticated;
grant execute on function admin_list_students_by_class(text) to anon, authenticated;
grant execute on function admin_add_subjects(text, jsonb) to anon, authenticated;
grant execute on function admin_approve_results_bulk(jsonb) to anon, authenticated;
grant execute on function admin_delete_results_bulk(jsonb) to anon, authenticated;
grant execute on function admin_list_subjects(text) to anon, authenticated;
grant execute on function admin_delete_subject(uuid) to anon, authenticated;
grant execute on function admin_add_results_batch(jsonb) to anon, authenticated;
grant execute on function admin_list_results(text) to anon, authenticated;
grant execute on function admin_approve_result(uuid) to anon, authenticated;
grant execute on function admin_delete_result(uuid) to anon, authenticated;
grant execute on function portal_find_student(text, text) to anon, authenticated;
grant execute on function portal_get_results(uuid) to anon, authenticated;
grant execute on function admin_search_students(text, text) to anon, authenticated;
grant execute on function admin_update_result(uuid, int) to anon, authenticated;
grant execute on function admin_update_profile(uuid, text, text, text) to anon, authenticated;
grant execute on function admin_change_password(uuid, text) to anon, authenticated;
grant execute on function admin_create_password_reset(text) to anon, authenticated;
grant execute on function admin_reset_password(text, text) to anon, authenticated;
grant execute on function admin_add_students_bulk(jsonb) to anon, authenticated;
grant execute on function admin_add_results_csv(jsonb) to anon, authenticated;

