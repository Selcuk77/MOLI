-- Run once in the dedicated MOLI project, after 001_accounts.sql.
begin;
create table if not exists public.moli_learning (
 user_id uuid primary key references auth.users(id) on delete cascade,
 state jsonb not null default '{}'::jsonb,
 revision integer not null default 0,
 updated_at timestamptz not null default now(),
 constraint learning_size check (octet_length(state::text)<1500000)
);
alter table public.moli_learning enable row level security;
revoke all on public.moli_learning from anon,authenticated;
grant select,insert,update on public.moli_learning to authenticated;
create policy "Own learning records" on public.moli_learning for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create table if not exists public.moli_contacts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 phone text not null,
 verified_at timestamptz,
 last_sent_at timestamptz,
 attempts integer not null default 0
);
alter table public.moli_contacts enable row level security;
revoke all on public.moli_contacts from anon,authenticated;
grant select on public.moli_contacts to authenticated;
create policy "Own verified contact" on public.moli_contacts for select to authenticated using ((select auth.uid())=user_id);
create table if not exists public.moli_deliveries (
 id text primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 channel text not null check (channel in ('email','sms')),
 status text not null default 'claimed',
 created_at timestamptz not null default now()
);
alter table public.moli_deliveries enable row level security;
revoke all on public.moli_deliveries from anon,authenticated;
-- Server-only credentials are required for verified phone writes and reminder delivery.
grant all on public.moli_learning,public.moli_contacts,public.moli_deliveries to service_role;
commit;
