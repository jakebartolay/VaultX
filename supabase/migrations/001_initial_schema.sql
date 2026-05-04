create extension if not exists pgcrypto;

create table if not exists public.users (
  user_id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  preferences jsonb not null default '{
    "currency": "PHP",
    "dateFormat": "MMM d, yyyy",
    "exportFormat": "csv",
    "darkMode": false,
    "liabilities": 0
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  expense_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  date timestamptz not null,
  amount numeric(14, 2) not null check (amount >= 0),
  category text not null,
  description text,
  payment_method text not null check (payment_method in ('Cash', 'Credit Card', 'Debit Card', 'E-wallet')),
  receipt_url text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.income (
  income_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  date date not null,
  amount numeric(14, 2) not null check (amount >= 0),
  source text not null,
  description text,
  payment_method text not null check (payment_method in ('Cash', 'Credit Card', 'Debit Card', 'E-wallet')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assets (
  asset_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  name text not null,
  category text not null,
  purchase_date date not null,
  purchase_price numeric(14, 2) not null check (purchase_price >= 0),
  current_value numeric(14, 2) not null check (current_value >= 0),
  location text not null,
  serial_number text,
  warranty_expiry date,
  insurance_details text,
  condition text not null check (condition in ('Excellent', 'Good', 'Fair', 'Poor')),
  photos text[] not null default '{}',
  documents text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  category_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  type text not null check (type in ('expense', 'income', 'asset')),
  name text not null,
  icon text,
  color text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, type, name)
);

create table if not exists public.budgets (
  budget_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  category text not null,
  monthly_limit numeric(14, 2) not null check (monthly_limit >= 0),
  month int not null check (month between 1 and 12),
  year int not null check (year between 2020 and 2100),
  created_at timestamptz not null default now(),
  unique (user_id, category, month, year)
);

create table if not exists public.savings_goals (
  goal_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_transactions (
  recurring_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  amount numeric(14, 2) not null check (amount >= 0),
  category_or_source text not null,
  description text,
  payment_method text not null check (payment_method in ('Cash', 'Credit Card', 'Debit Card', 'E-wallet')),
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  next_run_at date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  notification_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  type text not null check (type in ('budget_alert', 'bill_reminder', 'warranty_expiry')),
  title text not null,
  body text not null,
  scheduled_for timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_date_idx on public.expenses(user_id, date desc);
create index if not exists expenses_user_category_idx on public.expenses(user_id, category);
create index if not exists income_user_date_idx on public.income(user_id, date desc);
create index if not exists income_user_source_idx on public.income(user_id, source);
create index if not exists assets_user_category_idx on public.assets(user_id, category);
create index if not exists assets_user_location_idx on public.assets(user_id, location);
create index if not exists budgets_user_month_idx on public.budgets(user_id, year, month);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_expenses_updated_at on public.expenses;
create trigger set_expenses_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

drop trigger if exists set_income_updated_at on public.income;
create trigger set_income_updated_at
before update on public.income
for each row execute function public.set_updated_at();

drop trigger if exists set_assets_updated_at on public.assets;
create trigger set_assets_updated_at
before update on public.assets
for each row execute function public.set_updated_at();

drop trigger if exists set_goals_updated_at on public.savings_goals;
create trigger set_goals_updated_at
before update on public.savings_goals
for each row execute function public.set_updated_at();

drop trigger if exists set_recurring_updated_at on public.recurring_transactions;
create trigger set_recurring_updated_at
before update on public.recurring_transactions
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.expenses enable row level security;
alter table public.income enable row level security;
alter table public.assets enable row level security;
alter table public.categories enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.notifications enable row level security;

-- If Supabase Auth is used, set public.users.user_id to auth.uid().
-- Service-role API handlers can also enforce user_id ownership server-side.
create policy "users own profile" on public.users
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own expenses" on public.expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own income" on public.income
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own assets" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own budgets" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own goals" on public.savings_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own recurring transactions" on public.recurring_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own notifications" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
