-- profiles: non-admins cannot change identity/permission columns
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and public.app_role() is distinct from 'admin' then
    if new.id                   is distinct from old.id
    or new.role                 is distinct from old.role
    or new.username             is distinct from old.username
    or new.is_active            is distinct from old.is_active
    or new.must_change_password is distinct from old.must_change_password then
      raise exception 'not allowed';
    end if;
  end if;
  return new;
end $$;
create trigger trg_profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

-- drink_orders: forced defaults, max 3 pending, valid options, restricted updates
create or replace function public.drink_orders_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare d public.drink_menu; pending_count int;
begin
  if tg_op = 'INSERT' then
    select * into d from public.drink_menu where id = new.drink_id and is_active;
    if not found then raise exception 'drink not available'; end if;
    if not d.has_sugar_option then new.sugar := null; end if;
    if not d.has_milk_option  then new.milk  := null; end if;
    new.note := nullif(btrim(new.note), '');
    new.status := 'pending';
    new.delivered_at := null;
    new.delivered_by := null;
    new.created_at := now();
    select count(*) into pending_count from public.drink_orders
      where user_id = new.user_id and status = 'pending';
    if pending_count >= 3 then raise exception 'max_pending_orders'; end if;
    return new;
  end if;

  -- UPDATE
  if auth.uid() is not null then
    if new.user_id is distinct from old.user_id
    or new.drink_id is distinct from old.drink_id
    or new.sugar is distinct from old.sugar
    or new.milk is distinct from old.milk
    or new.note is distinct from old.note
    or new.created_at is distinct from old.created_at then
      raise exception 'not allowed';
    end if;
    if public.is_helper_or_admin() then
      if new.status = 'delivered' and old.status <> 'delivered' then
        new.delivered_at := now();
        new.delivered_by := auth.uid();
      end if;
    else
      if not (old.status = 'pending' and new.status = 'cancelled')
         or new.delivered_at is distinct from old.delivered_at
         or new.delivered_by is distinct from old.delivered_by then
        raise exception 'not allowed';
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger trg_drink_orders_guard before insert or update on public.drink_orders
  for each row execute function public.drink_orders_guard();

-- meal_responses: audit columns, item required when 'in'
create or replace function public.meal_responses_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if auth.uid() is not null then new.updated_by := auth.uid(); end if;
  if new.choice = 'out' then new.menu_item_id := null; end if;
  if new.choice = 'in' and new.menu_item_id is null
     and exists (select 1 from public.menu_items where menu_day_id = new.menu_day_id) then
    raise exception 'menu_item_required';
  end if;
  return new;
end $$;
create trigger trg_meal_responses_guard before insert or update on public.meal_responses
  for each row execute function public.meal_responses_guard();

-- app_settings validation
create or replace function public.app_settings_validate() returns trigger
language plpgsql as $$
begin
  if new.key = 'meal_lock_time' and new.value !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'meal_lock_time must be HH:MM';
  end if;
  if new.key = 'timezone'
     and not exists (select 1 from pg_timezone_names where name = new.value) then
    raise exception 'invalid timezone';
  end if;
  return new;
end $$;
create trigger trg_app_settings_validate before insert or update on public.app_settings
  for each row execute function public.app_settings_validate();

-- cron idempotency: returns true only for the first caller per (job, key)
create or replace function public.claim_job(p_job text, p_key text) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.job_runs(job_name, run_key) values (p_job, p_key)
    on conflict do nothing;
  get diagnostics n = row_count;
  return n = 1;
end $$;
