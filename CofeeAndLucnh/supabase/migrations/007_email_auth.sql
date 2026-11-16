-- Email-based accounts: sign up only with a company email, verified by link.

alter table public.profiles add column email text;
alter table public.profiles drop column username;
alter table public.profiles alter column email set not null;
create unique index profiles_email_key on public.profiles (lower(email));

insert into public.app_settings(key, value) values
  ('allowed_email_domain', 'manush.tech'),
  ('email_allowlist',      '')   -- comma separated extra addresses (e.g. the admin email)
on conflict (key) do nothing;

-- profiles guard (username removed, email added)
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and public.app_role() is distinct from 'admin' then
    if new.id                   is distinct from old.id
    or new.email                is distinct from old.email
    or new.role                 is distinct from old.role
    or new.is_active            is distinct from old.is_active
    or new.must_change_password is distinct from old.must_change_password then
      raise exception 'not allowed';
    end if;
  end if;
  return new;
end $$;

-- 1) Only company emails (or allowlisted addresses) can ever create an auth user,
--    no matter which API path is used.
create or replace function public.enforce_email_domain() returns trigger
language plpgsql security definer set search_path = public as $$
declare dom text; allow text; mail text := lower(coalesce(new.email, ''));
begin
  select value into dom   from public.app_settings where key = 'allowed_email_domain';
  select value into allow from public.app_settings where key = 'email_allowlist';
  if mail like '%@' || lower(dom) then return new; end if;
  if mail = any (string_to_array(lower(replace(coalesce(allow, ''), ' ', '')), ',')) then
    return new;
  end if;
  raise exception 'email domain not allowed';
end $$;
drop trigger if exists trg_enforce_email_domain on auth.users;
create trigger trg_enforce_email_domain before insert on auth.users
  for each row execute function public.enforce_email_domain();

-- 2) Every auth user gets a profile. Self sign-ups start inactive until the email is verified.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare n text := btrim(coalesce(new.raw_user_meta_data->>'full_name', ''));
begin
  if char_length(n) < 2 then n := 'Member'; end if;
  insert into public.profiles (id, email, full_name, role, is_active, must_change_password)
  values (new.id, lower(new.email), left(n, 80), 'staff',
          new.email_confirmed_at is not null, false);
  return new;
end $$;
drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Verifying the email activates the account.
create or replace function public.handle_email_confirmed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set is_active = true where id = new.id;
  return new;
end $$;
drop trigger if exists trg_handle_email_confirmed on auth.users;
create trigger trg_handle_email_confirmed after update of email_confirmed_at on auth.users
  for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.handle_email_confirmed();

revoke execute on function public.enforce_email_domain()  from public, anon, authenticated;
revoke execute on function public.handle_new_user()       from public, anon, authenticated;
revoke execute on function public.handle_email_confirmed() from public, anon, authenticated;
