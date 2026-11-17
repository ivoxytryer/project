-- Study Tracker — схема Supabase
-- Выполнить в Supabase → SQL Editor → New query → Run.

create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  date date not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_date_idx
  on public.tasks (user_id, date);

-- Явные права для Data API (нужны, если галочка
-- «Automatically expose new tables» была снята при создании проекта).
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;

-- Доступ только к своим задачам
alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own"
  on public.tasks for select
  using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own"
  on public.tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Realtime: синхронизация между ПК и телефоном
do $$
begin
  alter publication supabase_realtime add table public.tasks;
exception
  when duplicate_object then null;
end $$;
