-- Nekko Journal — Supabase schema for optional cloud sync (the paid tier).
-- Run this in the Supabase SQL editor after creating your project.
--
-- Design: the free app is 100% local (IndexedDB). When a user opts into Cloud,
-- their whole vault is stored as a single JSONB snapshot, reconciled last-write-wins
-- across their own devices. Row-Level Security guarantees a user can only ever touch
-- their own rows. (Upgrade path: split into per-entity tables with per-row updated_at
-- for granular multi-user merge — see DEPLOY.md.)

-- ---------------------------------------------------------------------------
-- profiles: one row per user, holds their plan.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  plan       text not null default 'free' check (plan in ('free', 'cloud')),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "profiles: upsert own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create a free profile when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, plan) values (new.id, 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- vaults: one JSONB snapshot per user.
-- ---------------------------------------------------------------------------
create table if not exists public.vaults (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.vaults enable row level security;

create policy "vaults: read own"
  on public.vaults for select
  using (auth.uid() = user_id);

create policy "vaults: insert own"
  on public.vaults for insert
  with check (auth.uid() = user_id);

create policy "vaults: update own"
  on public.vaults for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- NOTE: gating sync to the 'cloud' plan is enforced client-side today. For a
-- production paywall, verify the plan server-side (e.g. an edge function or a
-- policy that joins profiles) before allowing writes, and set plan='cloud' from
-- your Stripe webhook on successful subscription.
