create extension if not exists pgcrypto;

create type public.user_role    as enum ('staff','helper','admin');
create type public.order_status as enum ('pending','delivered','cancelled');
create type public.sugar_level  as enum ('none','less','normal','more');
create type public.meal_choice  as enum ('in','out');

create table public.app_settings (
  key   text primary key,
  value text not null
);
insert into public.app_settings(key, value) values
  ('timezone',       'Asia/Dhaka'),
  ('meal_lock_time', '22:30'),
  ('working_days',   'sun,mon,tue,wed,thu');

create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  username             text not null unique check (username ~ '^[a-z0-9._-]{3,30}$'),
  full_name            text not null check (char_length(full_name) between 2 and 80),
  role                 public.user_role not null default 'staff',
  desk_location        text check (char_length(desk_location) <= 60),
  theme                text not null default 'system' check (theme in ('light','dark','system')),
  usual_order          jsonb,
  is_active            boolean not null default true,
  must_change_password boolean not null default true,
  created_at           timestamptz not null default now()
);

create table public.drink_menu (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  category         text not null check (category in ('tea','coffee','other')),
  has_sugar_option boolean not null default true,
  has_milk_option  boolean not null default true,
  sort_order       int not null default 0,
  is_active        boolean not null default true
);

create table public.drink_orders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id),
  drink_id     uuid not null references public.drink_menu(id),
  sugar        public.sugar_level,
  milk         boolean,
  note         text check (char_length(note) <= 140),
  status       public.order_status not null default 'pending',
  created_at   timestamptz not null default now(),
  delivered_at timestamptz,
  delivered_by uuid references public.profiles(id)
);
create index drink_orders_status_idx on public.drink_orders (status, created_at desc);
create index drink_orders_user_idx   on public.drink_orders (user_id, created_at desc);

create table public.menu_days (
  id              uuid primary key default gen_random_uuid(),
  meal_date       date not null unique,
  title           text,
  lock_at         timestamptz not null,
  summary_sent_at timestamptz,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);

create table public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  menu_day_id uuid not null references public.menu_days(id) on delete cascade,
  name        text not null,
  sort_order  int not null default 0,
  unique (id, menu_day_id)
);
create index menu_items_day_idx on public.menu_items (menu_day_id);

create table public.meal_responses (
  menu_day_id  uuid not null references public.menu_days(id) on delete cascade,
  user_id      uuid not null references public.profiles(id),
  choice       public.meal_choice not null,
  menu_item_id uuid,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.profiles(id),
  primary key (menu_day_id, user_id),
  foreign key (menu_item_id, menu_day_id)
    references public.menu_items(id, menu_day_id),
  check (choice = 'in' or menu_item_id is null)
);
create index meal_responses_user_idx on public.meal_responses (user_id);

create table public.push_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  token        text not null unique,
  platform     text,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);

create table public.job_runs (
  job_name text not null,
  run_key  text not null,
  ran_at   timestamptz not null default now(),
  primary key (job_name, run_key)
);

-- Default lock_at from settings (Asia/Dhaka, day before meal_date)
create or replace function public.menu_days_set_lock() returns trigger
language plpgsql as $$
declare t text; tz text;
begin
  if new.lock_at is null then
    select value into t  from public.app_settings where key = 'meal_lock_time';
    select value into tz from public.app_settings where key = 'timezone';
    new.lock_at := ((new.meal_date - 1) + t::time) at time zone tz;
  end if;
  return new;
end $$;
create trigger trg_menu_days_lock before insert on public.menu_days
  for each row execute function public.menu_days_set_lock();

-- RLS helper functions
create or replace function public.app_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active = true
$$;
create or replace function public.is_helper_or_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() in ('helper','admin'), false)
$$;
create or replace function public.menu_is_open(p_menu_day uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.menu_days d
                 where d.id = p_menu_day and now() < d.lock_at)
$$;
