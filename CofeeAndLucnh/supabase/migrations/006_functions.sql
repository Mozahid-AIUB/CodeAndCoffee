create or replace function public.meal_summary(p_menu_day uuid)
returns table(item_id uuid, name text, in_count bigint)
language sql stable security definer set search_path = public as $$
  select i.id, i.name,
         count(r.user_id) filter (where r.choice = 'in')
  from public.menu_items i
  left join public.meal_responses r
         on r.menu_item_id = i.id and r.menu_day_id = p_menu_day
  where i.menu_day_id = p_menu_day and public.is_helper_or_admin()
  group by i.id, i.name, i.sort_order
  order by i.sort_order
$$;

create or replace function public.meal_overview(p_menu_day uuid)
returns table(total_in bigint, total_out bigint, not_answered bigint)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.meal_responses r
      where r.menu_day_id = p_menu_day and r.choice = 'in'),
    (select count(*) from public.meal_responses r
      where r.menu_day_id = p_menu_day and r.choice = 'out'),
    (select count(*) from public.profiles p
      where p.is_active and not exists
        (select 1 from public.meal_responses x
          where x.user_id = p.id and x.menu_day_id = p_menu_day))
  where public.is_helper_or_admin()
$$;

create or replace function public.meal_responses_detail(p_menu_day uuid)
returns table(user_id uuid, full_name text, desk_location text, choice public.meal_choice, item_name text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.desk_location, r.choice, i.name
  from public.meal_responses r
  join public.profiles p on p.id = r.user_id
  left join public.menu_items i on i.id = r.menu_item_id
  where r.menu_day_id = p_menu_day and public.is_helper_or_admin()
  order by p.full_name
$$;

-- Lock down function execution: only signed-in users (and service role)
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prokind = 'f' loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated, service_role', f.sig);
  end loop;
end $$;
revoke execute on function public.claim_job(text, text) from authenticated;
