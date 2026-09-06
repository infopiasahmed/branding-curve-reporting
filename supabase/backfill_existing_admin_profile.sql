do $$
declare
  v_email text := 'ahmedpias.info@gmail.com';
  n int;
  u auth.users%ROWTYPE;
begin
  if v_email is null
     or btrim(v_email) = ''
     or v_email = 'YOUR_EMAIL_HERE'
     or position('@' in v_email) = 0
  then
    raise exception 'Replace YOUR_EMAIL_HERE with the exact email of the existing Authentication user.';
  end if;

  select count(*) into n
  from auth.users
  where email = v_email;

  if n <> 1 then
    raise exception 'Expected exactly 1 auth user for %, found %.', v_email, n;
  end if;

  select * into u
  from auth.users
  where email = v_email;

  insert into public.profiles (id, first_name, last_name, email, role, is_active)
  values (
    u.id,
    coalesce(nullif(u.raw_user_meta_data->>'first_name', ''), split_part(u.email, '@', 1)),
    coalesce(u.raw_user_meta_data->>'last_name', ''),
    u.email,
    'marketer'::public.user_role,
    true
  )
  on conflict (id) do nothing;
end $$;

select id, email, first_name, last_name, role, is_active
from public.profiles
where email = 'ahmedpias.info@gmail.com';
