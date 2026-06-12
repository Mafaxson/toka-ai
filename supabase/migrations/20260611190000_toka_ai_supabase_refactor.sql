create extension if not exists "pgcrypto";

drop table if exists public.messages cascade;
drop table if exists public.profiles cascade;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  business_name text,
  preferred_language text not null default 'English',
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14,2) not null check (amount > 0),
  category text not null,
  description text,
  transaction_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  message text not null default '',
  ai_response text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  report_type text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_date on public.transactions(user_id, transaction_date desc);
create index if not exists idx_conversations_user_created on public.conversations(user_id, created_at desc);
create index if not exists idx_reports_user_created on public.reports(user_id, created_at desc);

alter table public.users enable row level security;
alter table public.transactions enable row level security;
alter table public.conversations enable row level security;
alter table public.reports enable row level security;

drop policy if exists "Users manage own users row" on public.users;
drop policy if exists "Users manage own transactions" on public.transactions;
drop policy if exists "Users manage own conversations" on public.conversations;
drop policy if exists "Users manage own reports" on public.reports;

create policy "Users manage own users row" on public.users
  for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users manage own transactions" on public.transactions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own conversations" on public.conversations
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own reports" on public.reports
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, business_name, preferred_language, currency)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'business_name', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'preferred_language', ''), 'English'),
    coalesce(nullif(new.raw_user_meta_data ->> 'currency', ''), 'USD')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    business_name = excluded.business_name,
    preferred_language = excluded.preferred_language,
    currency = excluded.currency;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();