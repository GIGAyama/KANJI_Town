-- 漢字タウン: 利用者本人だけが読み書きできるクラウド保存領域
create table if not exists public.kanji_town_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{16,64}$'),
  revision bigint not null default 1 check (revision >= 1),
  schema_version integer not null default 1 check (schema_version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kanji_town_payload_size check (octet_length(payload::text) <= 5242880)
);

alter table public.kanji_town_saves enable row level security;

revoke all on table public.kanji_town_saves from anon;
grant select, insert, update, delete on table public.kanji_town_saves to authenticated;

drop policy if exists "read own kanji town save" on public.kanji_town_saves;
create policy "read own kanji town save"
on public.kanji_town_saves
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "insert own kanji town save" on public.kanji_town_saves;
create policy "insert own kanji town save"
on public.kanji_town_saves
for insert
to authenticated
with check ((select auth.uid()) = user_id and revision = 1);

drop policy if exists "update own kanji town save" on public.kanji_town_saves;
create policy "update own kanji town save"
on public.kanji_town_saves
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "delete own kanji town save" on public.kanji_town_saves;
create policy "delete own kanji town save"
on public.kanji_town_saves
for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.set_kanji_town_save_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.user_id <> old.user_id then
    raise exception 'user_id cannot be changed';
  end if;
  if new.revision <> old.revision + 1 then
    raise exception 'revision must increase by exactly one' using errcode = '40001';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_kanji_town_save_updated_at on public.kanji_town_saves;
create trigger set_kanji_town_save_updated_at
before update on public.kanji_town_saves
for each row execute function public.set_kanji_town_save_updated_at();
