-- =====================================================================
-- Emtterboxd : schéma complet, idempotent (peut être rejoué sans risque)
-- À exécuter dans Supabase : SQL Editor > New query > Run
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Table films
-- ---------------------------------------------------------------------
create table if not exists public.films (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  poster_path text,
  rating      numeric(2,1) check (rating >= 0.5 and rating <= 5),
  comment     text check (comment is null or char_length(comment) <= 5000),
  rewatched   boolean not null default false,
  favorite    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.films add column if not exists favorite boolean not null default false;

create index if not exists films_user_created_idx on public.films (user_id, created_at desc);


-- ---------------------------------------------------------------------
-- 2. Table profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  user_id     uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  avatar_path text,
  updated_at  timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 3. Sécurité : RLS (chaque utilisateur ne voit et ne modifie que ses lignes)
-- ---------------------------------------------------------------------
alter table public.films    enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "films: lecture de ses films" on public.films;
drop policy if exists "films: ajout"                on public.films;
drop policy if exists "films: modification"         on public.films;
drop policy if exists "films: suppression"          on public.films;

create policy "films: lecture de ses films" on public.films
  for select to authenticated using (user_id = auth.uid());
create policy "films: ajout" on public.films
  for insert to authenticated with check (user_id = auth.uid());
create policy "films: modification" on public.films
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "films: suppression" on public.films
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "profiles: lecture"      on public.profiles;
drop policy if exists "profiles: ajout"        on public.profiles;
drop policy if exists "profiles: modification" on public.profiles;

create policy "profiles: lecture" on public.profiles
  for select to authenticated using (user_id = auth.uid());
create policy "profiles: ajout" on public.profiles
  for insert to authenticated with check (user_id = auth.uid());
create policy "profiles: modification" on public.profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Aucun accès pour le rôle anonyme (non connecté)
revoke all on public.films    from anon;
revoke all on public.profiles from anon;


-- ---------------------------------------------------------------------
-- 4. Sécurité : maximum 5 favoris, appliqué côté base
-- ---------------------------------------------------------------------
create or replace function public.enforce_max_favorites() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.favorite and (
    select count(*) from public.films
    where user_id = new.user_id and favorite and id <> new.id
  ) >= 5 then
    raise exception 'Maximum 5 favorites';
  end if;
  return new;
end $$;

drop trigger if exists films_max_favorites on public.films;
create trigger films_max_favorites
  before insert or update of favorite on public.films
  for each row when (new.favorite)
  execute function public.enforce_max_favorites();


-- ---------------------------------------------------------------------
-- 5. Storage : buckets PRIVÉS, 5 Mo max, images uniquement
--    (l'app lit les fichiers via des URLs signées temporaires)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('posters', 'posters', false, 5242880, array['image/jpeg','image/png','image/webp','image/gif','image/avif']),
  ('avatars', 'avatars', false, 5242880, array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Nettoyage des anciennes politiques
drop policy if exists "posters: ajout dans son dossier"         on storage.objects;
drop policy if exists "posters: modification dans son dossier"  on storage.objects;
drop policy if exists "posters: suppression dans son dossier"   on storage.objects;
drop policy if exists "avatars: ajout dans son dossier"         on storage.objects;
drop policy if exists "avatars: modification dans son dossier"  on storage.objects;
drop policy if exists "avatars: suppression dans son dossier"   on storage.objects;
drop policy if exists "posters: lecture dans son dossier"       on storage.objects;
drop policy if exists "avatars: lecture dans son dossier"       on storage.objects;

-- Chaque utilisateur n'accède qu'à son dossier <user_id>/ (lecture nécessaire aux URLs signées)
create policy "posters: lecture dans son dossier" on storage.objects
  for select to authenticated
  using (bucket_id = 'posters' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "posters: ajout dans son dossier" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'posters' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "posters: modification dans son dossier" on storage.objects
  for update to authenticated
  using (bucket_id = 'posters' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "posters: suppression dans son dossier" on storage.objects
  for delete to authenticated
  using (bucket_id = 'posters' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: lecture dans son dossier" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: ajout dans son dossier" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: modification dans son dossier" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: suppression dans son dossier" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);


-- ---------------------------------------------------------------------
-- 6. Inscription : prénom, nom, pseudo (profil créé automatiquement)
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name  text,
  add column if not exists username   text;

alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format check (username is null or username ~ '^\S{3,20}$');

alter table public.profiles drop constraint if exists profiles_name_length;
alter table public.profiles
  add constraint profiles_name_length check (
    (first_name is null or char_length(first_name) <= 60) and
    (last_name  is null or char_length(last_name)  <= 60)
  );

-- Pseudo unique, sans tenir compte de la casse
create unique index if not exists profiles_username_key on public.profiles (lower(username));

-- Crée le profil à partir des métadonnées fournies à l'inscription
create or replace function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, first_name, last_name, username)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data->>'first_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'last_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'username'), '')
  )
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Vérification de disponibilité du pseudo (appelable avant connexion)
create or replace function public.username_available(p_username text) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;

revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;


-- ---------------------------------------------------------------------
-- 7. Date de visionnage
-- ---------------------------------------------------------------------
alter table public.films add column if not exists watched_at date;
update public.films set watched_at = created_at::date where watched_at is null;
alter table public.films alter column watched_at set default current_date;
alter table public.films alter column watched_at set not null;

create index if not exists films_user_watched_idx on public.films (user_id, watched_at desc);


-- ---------------------------------------------------------------------
-- 8. "I rewatched it" toggle: remembers the previous watch date
-- ---------------------------------------------------------------------
alter table public.films add column if not exists previous_watched_at date;


-- ---------------------------------------------------------------------
-- 9. Public profiles (read-only, no sign-in needed)
--    Profiles are private by default; the owner opts in with is_public.
--    Anonymous visitors never touch the tables: they read two views that
--    only contain public profiles (no first/last name) and their films.
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists is_public boolean not null default false;

-- Used by the storage policy below (RLS on profiles would hide rows from anonymous users)
create or replace function public.is_public_user(p_user text) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id::text = p_user and p.is_public and p.username is not null
  );
$$;

revoke all on function public.is_public_user(text) from public;
grant execute on function public.is_public_user(text) to anon, authenticated;

-- Views run with their owner's rights, so they bypass RLS on purpose and only expose public rows.
-- (Supabase's security advisor flags them as SECURITY DEFINER views: that is intended here.)
drop view if exists public.public_films;
drop view if exists public.public_profiles;

create view public.public_profiles as
  select user_id, username, avatar_path
  from public.profiles
  where is_public and username is not null;

create view public.public_films as
  select f.*
  from public.films f
  join public.profiles p on p.user_id = f.user_id
  where p.is_public and p.username is not null;

revoke all on public.public_profiles from anon, authenticated;
revoke all on public.public_films    from anon, authenticated;
grant select on public.public_profiles to anon, authenticated;
grant select on public.public_films    to anon, authenticated;

-- Storage: posters and avatars of public profiles can be read (needed to create signed URLs)
drop policy if exists "storage: lecture des profils publics" on storage.objects;
create policy "storage: lecture des profils publics" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id in ('posters', 'avatars')
    and public.is_public_user((storage.foldername(name))[1])
  );
