-- Branding Curve — full database setup for a FRESH Supabase project.
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query → Run
-- Do not put the service role key in the frontend.
--
-- Re-run notes:
-- This file is written for a FRESH project. Running it again on the SAME project
-- refreshes functions, triggers, policies (all existing policies on these tables
-- are dropped first), grants, and indexes.
-- It is NOT a complete migration system: CREATE TYPE / CREATE TABLE IF NOT EXISTS
-- will not add new enum values, columns (except profiles.is_active), or table
-- constraints to objects that already exist.
-- Do not use this file as a substitute for migrations on a live database.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('admin', 'marketer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.client_status as enum ('active', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.meeting_type as enum ('client', 'internal');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.activity_type as enum (
    'report_created',
    'report_updated',
    'meeting_created',
    'meeting_notes_added',
    'meeting_notes_updated',
    'action_item_completed'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null default '',
  email text not null unique,
  role public.user_role not null default 'marketer',
  is_active boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists is_active boolean not null default true;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  category text,
  contact_person text,
  status public.client_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_assignments (
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, user_id)
);

create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete cascade,
  report_date date not null,
  content text not null,
  tomorrow_plan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, user_id, report_date)
);

create table if not exists public.report_tags (
  report_id uuid not null references public.daily_reports (id) on delete cascade,
  tag text not null,
  primary key (report_id, tag),
  constraint report_tags_tag_check check (
    tag in (
      'campaign',
      'creative',
      'performance',
      'client_feedback',
      'issue',
      'follow_up',
      'other'
    )
  )
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  meeting_date date not null,
  meeting_time time not null,
  meeting_type public.meeting_type not null default 'client',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meeting_participants (
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (meeting_id, user_id)
);

create table if not exists public.meeting_action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  content text not null,
  completed boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  type public.activity_type not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,
  entity_id uuid,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_active on public.profiles (is_active);
create index if not exists idx_clients_status on public.clients (status);
create index if not exists idx_assignments_user on public.client_assignments (user_id);
create index if not exists idx_assignments_client on public.client_assignments (client_id);
create index if not exists idx_reports_client_date on public.daily_reports (client_id, report_date desc);
create index if not exists idx_reports_user_date on public.daily_reports (user_id, report_date desc);
create index if not exists idx_meetings_date on public.meetings (meeting_date, meeting_time);
create index if not exists idx_meetings_client on public.meetings (client_id, meeting_date desc);
create index if not exists idx_activities_created on public.activities (created_at desc);
create index if not exists idx_activities_client on public.activities (client_id, created_at desc);
create index if not exists idx_activities_user on public.activities (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_clients_updated on public.clients;
create trigger trg_clients_updated
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists trg_reports_updated on public.daily_reports;
create trigger trg_reports_updated
before update on public.daily_reports
for each row execute function public.set_updated_at();

drop trigger if exists trg_meetings_updated on public.meetings;
create trigger trg_meetings_updated
before update on public.meetings
for each row execute function public.set_updated_at();

drop trigger if exists trg_action_items_updated on public.meeting_action_items;
create trigger trg_action_items_updated
before update on public.meeting_action_items
for each row execute function public.set_updated_at();

-- Authorization helpers. SECURITY DEFINER avoids RLS recursion.
-- Bodies only read authorization tables for auth.uid() and use a fixed search_path.

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'::public.user_role
      and is_active = true
  );
$$;

create or replace function public.is_assigned_to_client(_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_admin()
  or (
    public.is_active_user()
    and exists (
      select 1
      from public.client_assignments
      where client_id = _client_id
        and user_id = auth.uid()
    )
  );
$$;

create or replace function public.is_meeting_participant(_meeting_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.meeting_participants
    where meeting_id = _meeting_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.can_read_meeting(_meeting_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.meetings m
    where m.id = _meeting_id
      and public.is_active_user()
      and (
        public.is_assigned_to_client(m.client_id)
        or m.created_by = auth.uid()
        or public.is_meeting_participant(m.id)
      )
  );
$$;

create or replace function public.can_manage_meeting(_meeting_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.meetings m
    where m.id = _meeting_id
      and (
        public.is_admin()
        or (
          m.created_by = auth.uid()
          and public.is_active_user()
          and public.is_assigned_to_client(m.client_id)
        )
      )
  );
$$;

create or replace function public.can_write_action_item(_meeting_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_admin()
  or public.can_manage_meeting(_meeting_id)
  or (
    public.is_active_user()
    and public.is_meeting_participant(_meeting_id)
  );
$$;

-- Participants must already belong to the meeting's client (or be admin/creator).
-- This prevents inserting an unrelated user just to expand their visibility.
create or replace function public.participant_allowed(_meeting_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.meetings m
    inner join public.profiles p on p.id = _user_id
    where m.id = _meeting_id
      and p.is_active = true
      and (
        m.created_by = _user_id
        or p.role = 'admin'::public.user_role
        or exists (
          select 1
          from public.client_assignments ca
          where ca.client_id = m.client_id
            and ca.user_id = _user_id
        )
      )
  );
$$;

create or replace function public.can_mutate_report_tags(_report_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.daily_reports r
    where r.id = _report_id
      and (
        public.is_admin()
        or (
          r.user_id = auth.uid()
          and public.is_active_user()
          and public.is_assigned_to_client(r.client_id)
        )
      )
  );
$$;

-- Names needed on meeting cards only: self, admin (all), or people on a readable meeting.
create or replace function public.can_read_profile(_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_admin()
  or _profile_id = auth.uid()
  or exists (
    select 1
    from public.meetings m
    where m.created_by = _profile_id
      and public.can_read_meeting(m.id)
  )
  or exists (
    select 1
    from public.meeting_participants mp
    where mp.user_id = _profile_id
      and public.can_read_meeting(mp.meeting_id)
  );
$$;

create or replace function public.is_assigned(_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_assigned_to_client(_client_id);
$$;

-- New auth users always become marketers. Role is NEVER taken from user metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, first_name, last_name, email, role, is_active)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'first_name', ''), split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    'marketer'::public.user_role,
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE'
     and auth.uid() is not null
     and not public.is_admin()
  then
    new.role := old.role;
    new.is_active := old.is_active;
    new.email := old.email;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile on public.profiles;
create trigger trg_protect_profile
before update on public.profiles
for each row execute function public.protect_profile_privileges();

create or replace function public.protect_report_identity()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
    new.client_id := old.client_id;
    new.report_date := old.report_date;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_report_identity on public.daily_reports;
create trigger trg_protect_report_identity
before update on public.daily_reports
for each row execute function public.protect_report_identity();

create or replace function public.protect_meeting_identity()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' then
    new.created_by := old.created_by;
    new.client_id := old.client_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_meeting_identity on public.meetings;
create trigger trg_protect_meeting_identity
before update on public.meetings
for each row execute function public.protect_meeting_identity();

create or replace function public.log_report_activity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activities (type, user_id, client_id, entity_id, summary)
    values (
      'report_created'::public.activity_type,
      new.user_id,
      new.client_id,
      new.id,
      'Added daily report'
    );
  elsif tg_op = 'UPDATE' and (
    old.content is distinct from new.content
    or old.tomorrow_plan is distinct from new.tomorrow_plan
  ) then
    insert into public.activities (type, user_id, client_id, entity_id, summary)
    values (
      'report_updated'::public.activity_type,
      new.user_id,
      new.client_id,
      new.id,
      'Updated daily report'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_report_activity on public.daily_reports;
create trigger trg_report_activity
after insert or update on public.daily_reports
for each row execute function public.log_report_activity();

create or replace function public.log_meeting_activity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activities (type, user_id, client_id, entity_id, summary)
    values (
      'meeting_created'::public.activity_type,
      new.created_by,
      new.client_id,
      new.id,
      'Added meeting'
    );
  elsif tg_op = 'UPDATE' and coalesce(old.notes, '') is distinct from coalesce(new.notes, '') then
    insert into public.activities (type, user_id, client_id, entity_id, summary)
    values (
      'meeting_notes_added'::public.activity_type,
      new.created_by,
      new.client_id,
      new.id,
      'Added meeting notes'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_meeting_activity on public.meetings;
create trigger trg_meeting_activity
after insert or update on public.meetings
for each row execute function public.log_meeting_activity();

create or replace function public.log_action_item_activity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  meeting_row public.meetings;
begin
  if new.completed = true and old.completed = false then
    select * into meeting_row from public.meetings where id = new.meeting_id;
    insert into public.activities (type, user_id, client_id, entity_id, summary)
    values (
      'action_item_completed'::public.activity_type,
      coalesce(auth.uid(), meeting_row.created_by),
      meeting_row.client_id,
      new.id,
      'Completed action item'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_action_item_activity on public.meeting_action_items;
create trigger trg_action_item_activity
after update on public.meeting_action_items
for each row execute function public.log_action_item_activity();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.client_assignments enable row level security;
alter table public.daily_reports enable row level security;
alter table public.report_tags enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.meeting_action_items enable row level security;
alter table public.activities enable row level security;

-- Drop every current policy on these tables so renamed policies cannot linger on re-run.
do $$
declare r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'clients',
        'client_assignments',
        'daily_reports',
        'report_tags',
        'meetings',
        'meeting_participants',
        'meeting_action_items',
        'activities'
      )
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (
    public.is_active_user()
    and public.can_read_profile(id)
  );

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = auth.uid() and public.is_active_user())
  with check (id = auth.uid() and public.is_active_user());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "clients_select" on public.clients;
create policy "clients_select" on public.clients
  for select to authenticated
  using (public.is_assigned_to_client(id));

drop policy if exists "clients_admin_write" on public.clients;
create policy "clients_admin_write" on public.clients
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "assignments_select" on public.client_assignments;
create policy "assignments_select" on public.client_assignments
  for select to authenticated
  using (
    public.is_active_user()
    and (public.is_admin() or user_id = auth.uid())
  );

drop policy if exists "assignments_admin_write" on public.client_assignments;
create policy "assignments_admin_write" on public.client_assignments
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "reports_select" on public.daily_reports;
create policy "reports_select" on public.daily_reports
  for select to authenticated
  using (
    public.is_admin()
    or (
      public.is_active_user()
      and user_id = auth.uid()
      and public.is_assigned_to_client(client_id)
    )
  );

drop policy if exists "reports_insert_own" on public.daily_reports;
create policy "reports_insert_own" on public.daily_reports
  for insert to authenticated
  with check (
    public.is_active_user()
    and user_id = auth.uid()
    and public.is_assigned_to_client(client_id)
  );

drop policy if exists "reports_update_own" on public.daily_reports;
create policy "reports_update_own" on public.daily_reports
  for update to authenticated
  using (
    public.is_admin()
    or (
      user_id = auth.uid()
      and public.is_active_user()
      and public.is_assigned_to_client(client_id)
    )
  )
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and public.is_active_user()
      and public.is_assigned_to_client(client_id)
    )
  );

drop policy if exists "report_tags_select" on public.report_tags;
create policy "report_tags_select" on public.report_tags
  for select to authenticated
  using (public.can_mutate_report_tags(report_id));

drop policy if exists "report_tags_write" on public.report_tags;
create policy "report_tags_write" on public.report_tags
  for all to authenticated
  using (public.can_mutate_report_tags(report_id))
  with check (public.can_mutate_report_tags(report_id));

drop policy if exists "meetings_select" on public.meetings;
create policy "meetings_select" on public.meetings
  for select to authenticated
  using (
    public.is_active_user()
    and (
      public.is_assigned_to_client(client_id)
      or created_by = auth.uid()
      or public.is_meeting_participant(id)
    )
  );

drop policy if exists "meetings_insert" on public.meetings;
create policy "meetings_insert" on public.meetings
  for insert to authenticated
  with check (
    public.is_active_user()
    and created_by = auth.uid()
    and public.is_assigned_to_client(client_id)
  );

drop policy if exists "meetings_update" on public.meetings;
create policy "meetings_update" on public.meetings
  for update to authenticated
  using (public.can_manage_meeting(id))
  with check (public.can_manage_meeting(id));

drop policy if exists "participants_select" on public.meeting_participants;
create policy "participants_select" on public.meeting_participants
  for select to authenticated
  using (public.can_read_meeting(meeting_id));

drop policy if exists "participants_write" on public.meeting_participants;
create policy "participants_write" on public.meeting_participants
  for all to authenticated
  using (public.can_manage_meeting(meeting_id))
  with check (
    public.can_manage_meeting(meeting_id)
    and public.participant_allowed(meeting_id, user_id)
  );

drop policy if exists "action_items_select" on public.meeting_action_items;
create policy "action_items_select" on public.meeting_action_items
  for select to authenticated
  using (public.can_read_meeting(meeting_id));

drop policy if exists "action_items_write" on public.meeting_action_items;
create policy "action_items_write" on public.meeting_action_items
  for all to authenticated
  using (public.can_write_action_item(meeting_id))
  with check (public.can_write_action_item(meeting_id));

drop policy if exists "activities_select" on public.activities;
create policy "activities_select" on public.activities
  for select to authenticated
  using (
    public.is_admin()
    or (public.is_active_user() and user_id = auth.uid())
  );

drop policy if exists "activities_insert" on public.activities;
drop policy if exists "activities_update" on public.activities;
drop policy if exists "activities_delete" on public.activities;

revoke all on public.activities from anon, authenticated, public;
grant select on public.activities to authenticated;

revoke all on schema public from anon;
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.client_assignments to authenticated;
grant select, insert, update, delete on public.daily_reports to authenticated;
grant select, insert, update, delete on public.report_tags to authenticated;
grant select, insert, update, delete on public.meetings to authenticated;
grant select, insert, update, delete on public.meeting_participants to authenticated;
grant select, insert, update, delete on public.meeting_action_items to authenticated;

-- Default CREATE FUNCTION grants EXECUTE to PUBLIC. Revoke that, then grant only what is needed.
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_active_user() from public, anon;
revoke all on function public.is_assigned_to_client(uuid) from public, anon;
revoke all on function public.is_assigned(uuid) from public, anon;
revoke all on function public.is_meeting_participant(uuid) from public, anon;
revoke all on function public.can_read_meeting(uuid) from public, anon;
revoke all on function public.can_manage_meeting(uuid) from public, anon;
revoke all on function public.can_write_action_item(uuid) from public, anon;
revoke all on function public.participant_allowed(uuid, uuid) from public, anon;
revoke all on function public.can_mutate_report_tags(uuid) from public, anon;
revoke all on function public.can_read_profile(uuid) from public, anon;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_assigned_to_client(uuid) to authenticated;
grant execute on function public.is_assigned(uuid) to authenticated;
grant execute on function public.is_meeting_participant(uuid) to authenticated;
grant execute on function public.can_read_meeting(uuid) to authenticated;
grant execute on function public.can_manage_meeting(uuid) to authenticated;
grant execute on function public.can_write_action_item(uuid) to authenticated;
grant execute on function public.participant_allowed(uuid, uuid) to authenticated;
grant execute on function public.can_mutate_report_tags(uuid) to authenticated;
grant execute on function public.can_read_profile(uuid) to authenticated;

-- Auth trigger: not callable by app roles. Keep EXECUTE for the Auth owner if that role exists.
revoke all on function public.handle_new_user() from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant execute on function public.handle_new_user() to supabase_auth_admin;
  end if;
end $$;

-- PostgreSQL requires the DML role to have EXECUTE on trigger functions.
-- These return TRIGGER, so they are not usable as PostgREST RPCs.
revoke all on function public.protect_profile_privileges() from public, anon;
revoke all on function public.protect_report_identity() from public, anon;
revoke all on function public.protect_meeting_identity() from public, anon;
revoke all on function public.set_updated_at() from public, anon;
revoke all on function public.log_report_activity() from public, anon;
revoke all on function public.log_meeting_activity() from public, anon;
revoke all on function public.log_action_item_activity() from public, anon;

grant execute on function public.protect_profile_privileges() to authenticated;
grant execute on function public.protect_report_identity() to authenticated;
grant execute on function public.protect_meeting_identity() to authenticated;
grant execute on function public.set_updated_at() to authenticated;
grant execute on function public.log_report_activity() to authenticated;
grant execute on function public.log_meeting_activity() to authenticated;
grant execute on function public.log_action_item_activity() to authenticated;
