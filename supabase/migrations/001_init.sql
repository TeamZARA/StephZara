create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('canvasser','manager')) default 'canvasser',
  created_at timestamptz default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  source text default 'PropCon',
  name text,
  phone text,
  suburb text,
  area text,
  address text,
  owner text,
  status text default 'New',
  script text default 'Recent Sales',
  last_reply text,
  notes text,
  follow_up_number int default 0,
  last_contact_date date,
  follow_up_due_date date,
  opted_out boolean default false,
  consent_status text default 'Unknown',
  score int default 0,
  assigned_to text,
  last_updated_by text,
  last_updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.contacts enable row level security;

create policy "profiles read own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles update own"
on public.profiles
for update
to authenticated
using (auth.uid() = id);

create policy "contacts read all authenticated"
on public.contacts
for select
to authenticated
using (true);

create policy "contacts insert authenticated"
on public.contacts
for insert
to authenticated
with check (true);

create policy "contacts update authenticated"
on public.contacts
for update
to authenticated
using (true);
