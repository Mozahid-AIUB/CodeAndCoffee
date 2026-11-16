alter table public.drink_orders   replica identity full;
alter table public.meal_responses replica identity full;
alter publication supabase_realtime add table public.drink_orders;
alter publication supabase_realtime add table public.meal_responses;
alter publication supabase_realtime add table public.menu_days;
