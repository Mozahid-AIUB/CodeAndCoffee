alter table public.app_settings   enable row level security;
alter table public.profiles       enable row level security;
alter table public.drink_menu     enable row level security;
alter table public.drink_orders   enable row level security;
alter table public.menu_days      enable row level security;
alter table public.menu_items     enable row level security;
alter table public.meal_responses enable row level security;
alter table public.push_tokens    enable row level security;
alter table public.job_runs       enable row level security;

create policy settings_read on public.app_settings for select to authenticated
  using (public.app_role() is not null);
create policy settings_admin on public.app_settings for all to authenticated
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_helper_or_admin());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

create policy drinkmenu_read on public.drink_menu for select to authenticated
  using (public.app_role() is not null);
create policy drinkmenu_manage on public.drink_menu for all to authenticated
  using (public.is_helper_or_admin()) with check (public.is_helper_or_admin());

create policy orders_select on public.drink_orders for select to authenticated
  using (user_id = auth.uid() or public.is_helper_or_admin());
create policy orders_insert on public.drink_orders for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and public.app_role() is not null);
create policy orders_owner_cancel on public.drink_orders for update to authenticated
  using (user_id = auth.uid() and status = 'pending' and public.app_role() is not null)
  with check (user_id = auth.uid() and status = 'cancelled');
create policy orders_helper_update on public.drink_orders for update to authenticated
  using (public.is_helper_or_admin()) with check (public.is_helper_or_admin());

create policy menudays_read on public.menu_days for select to authenticated
  using (public.app_role() is not null);
create policy menudays_manage on public.menu_days for all to authenticated
  using (public.is_helper_or_admin()) with check (public.is_helper_or_admin());
create policy menuitems_read on public.menu_items for select to authenticated
  using (public.app_role() is not null);
create policy menuitems_manage on public.menu_items for all to authenticated
  using (public.is_helper_or_admin()) with check (public.is_helper_or_admin());

create policy meals_select on public.meal_responses for select to authenticated
  using (user_id = auth.uid() or public.is_helper_or_admin());
create policy meals_insert_own on public.meal_responses for insert to authenticated
  with check (user_id = auth.uid() and public.app_role() is not null
              and public.menu_is_open(menu_day_id));
create policy meals_update_own on public.meal_responses for update to authenticated
  using (user_id = auth.uid() and public.app_role() is not null
         and public.menu_is_open(menu_day_id))
  with check (user_id = auth.uid() and public.menu_is_open(menu_day_id));
create policy meals_manager_all on public.meal_responses for all to authenticated
  using (public.is_helper_or_admin()) with check (public.is_helper_or_admin());

create policy tokens_own on public.push_tokens for all to authenticated
  using (user_id = auth.uid() and public.app_role() is not null)
  with check (user_id = auth.uid());
