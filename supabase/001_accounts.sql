-- Run once in a dedicated MOLİ Supabase project. No service-role key is used by the app.
begin;
create table if not exists public.moli_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  role text not null check (role in ('student','teacher')),
  teacher_status text check (teacher_status in ('pending','verified')),
  language text not null default 'tr' check (language in ('tr','en')),
  guardian_confirmed boolean not null default false,
  notice_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.moli_profiles enable row level security;
revoke all on public.moli_profiles from anon, authenticated;
grant select on public.moli_profiles to authenticated;
grant update (display_name, language) on public.moli_profiles to authenticated;
drop policy if exists moli_select_own on public.moli_profiles;
create policy moli_select_own on public.moli_profiles for select to authenticated using ((select auth.uid())=id);
drop policy if exists moli_update_own on public.moli_profiles;
create policy moli_update_own on public.moli_profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create or replace function public.moli_create_profile()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  requested text := new.raw_user_meta_data->>'requested_role';
  chosen_name text := btrim(coalesce(new.raw_user_meta_data->>'display_name',''));
begin
  if requested not in ('student','teacher') or requested is null then
    raise exception 'Invalid MOLI account role';
  end if;
  if char_length(chosen_name)<2 or char_length(chosen_name)>80 then
    raise exception 'Invalid MOLI display name';
  end if;
  if requested='student' and coalesce((new.raw_user_meta_data->>'guardian_confirmed')::boolean,false)=false then
    raise exception 'Guardian confirmation required';
  end if;
  insert into public.moli_profiles(id,display_name,role,teacher_status,language,guardian_confirmed,notice_version)
  values(new.id,chosen_name,requested,case when requested='teacher' then 'pending' else null end,
  case when new.raw_user_meta_data->>'language'='en' then 'en' else 'tr' end,
  requested='student',left(new.raw_user_meta_data->>'notice_version',40));
  return new;
end; $$;
revoke all on function public.moli_create_profile() from public,anon,authenticated;
drop trigger if exists moli_on_auth_user_created on auth.users;
create trigger moli_on_auth_user_created after insert on auth.users for each row execute procedure public.moli_create_profile();
create or replace function public.moli_touch_profile()
returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now();return new;end; $$;
revoke all on function public.moli_touch_profile() from public,anon,authenticated;
drop trigger if exists moli_profile_updated on public.moli_profiles;
create trigger moli_profile_updated before update on public.moli_profiles for each row execute procedure public.moli_touch_profile();
commit;
-- Verified teacher status can only be assigned by the project administrator.
-- No policy in this migration gives teachers access to any student's profile.
