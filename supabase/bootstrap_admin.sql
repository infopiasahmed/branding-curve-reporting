-- Promote exactly one existing profile to admin.
-- Run this ONLY after:
-- 1. You have already run supabase/schema.sql
-- 2. You have created YOUR user in Authentication → Users (email + password)
--
-- Replace ahmedpias.info@gmail.com on the v_email line below with that exact email.
-- Leave the placeholder unchanged and this script will refuse to run.

do $$
declare
  v_email text := 'ahmedpias.info@gmail.com';
  n int;
  rec public.profiles;
begin
  if v_email is null
     or btrim(v_email) = ''
     or v_email = 'YOUR_EMAIL_HERE'
     or position('@' in v_email) = 0
  then
    raise exception 'Replace YOUR_EMAIL_HERE with the exact email of the user you already created in Authentication → Users.';
  end if;

  select count(*) into n
  from public.profiles
  where email = v_email;

  if n = 0 then
    raise exception 'No profile found for %. Create the user in Authentication → Users first, wait for the profile to appear, then run this again.', v_email;
  end if;

  if n <> 1 then
    raise exception 'Expected exactly 1 profile for %, found %. Refusing to continue.', v_email, n;
  end if;

  update public.profiles
  set
    role = 'admin',
    is_active = true
  where email = v_email
  returning * into rec;

  if rec.id is null or rec.role <> 'admin' or rec.is_active is not true then
    raise exception 'Admin bootstrap failed for %.', v_email;
  end if;

  raise notice 'Admin bootstrap OK: id=%, email=%, name=% %, role=%, is_active=%',
    rec.id, rec.email, rec.first_name, rec.last_name, rec.role, rec.is_active;
end $$;

-- Verification: every current admin (should include the user you just promoted)
select id, email, first_name, last_name, role, is_active
from public.profiles
where role = 'admin'
order by email;
