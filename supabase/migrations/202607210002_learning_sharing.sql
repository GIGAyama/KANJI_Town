-- 漢字タウン: 教師・保護者へ最小限の学習要約だけを共有する
alter table public.kanji_town_saves
add column if not exists report_payload jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'kanji_town_report_payload_size'
      and conrelid = 'public.kanji_town_saves'::regclass
  ) then
    alter table public.kanji_town_saves
    add constraint kanji_town_report_payload_size
    check (octet_length(report_payload::text) <= 65536);
  end if;
end;
$$;

create table if not exists public.kanji_town_share_invites (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  learner_label text not null check (char_length(learner_label) between 1 and 30),
  viewer_role text not null check (viewer_role in ('guardian', 'teacher')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint kanji_town_share_invite_one_per_learner unique (learner_id),
  constraint kanji_town_share_invite_expiry check (
    expires_at > created_at and expires_at <= created_at + interval '1 hour'
  )
);

create table if not exists public.kanji_town_learning_links (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  learner_label text not null check (char_length(learner_label) between 1 and 30),
  viewer_label text not null check (char_length(viewer_label) between 1 and 30),
  viewer_role text not null check (viewer_role in ('guardian', 'teacher')),
  created_at timestamptz not null default now(),
  constraint kanji_town_learning_link_accounts check (learner_id <> viewer_id),
  constraint kanji_town_learning_link_unique unique (learner_id, viewer_id)
);

alter table public.kanji_town_share_invites enable row level security;
alter table public.kanji_town_learning_links enable row level security;

revoke all on table public.kanji_town_share_invites from anon, authenticated;
revoke all on table public.kanji_town_learning_links from anon, authenticated;
grant select, delete on table public.kanji_town_share_invites to authenticated;
grant select, delete on table public.kanji_town_learning_links to authenticated;

drop policy if exists "manage own learning share invites" on public.kanji_town_share_invites;
drop policy if exists "read own learning share invites" on public.kanji_town_share_invites;
create policy "read own learning share invites"
on public.kanji_town_share_invites
for select
to authenticated
using ((select auth.uid()) = learner_id);

drop policy if exists "remove own learning share invites" on public.kanji_town_share_invites;
create policy "remove own learning share invites"
on public.kanji_town_share_invites
for delete
to authenticated
using ((select auth.uid()) = learner_id);

drop policy if exists "read related learning links" on public.kanji_town_learning_links;
create policy "read related learning links"
on public.kanji_town_learning_links
for select
to authenticated
using ((select auth.uid()) in (learner_id, viewer_id));

drop policy if exists "remove related learning links" on public.kanji_town_learning_links;
create policy "remove related learning links"
on public.kanji_town_learning_links
for delete
to authenticated
using ((select auth.uid()) in (learner_id, viewer_id));

create or replace function public.create_kanji_town_share_invite(
  p_token_hash text,
  p_learner_label text,
  p_viewer_role text
)
returns table (invite_id uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  clean_label text := btrim(p_learner_label);
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$'
    or clean_label is null or char_length(clean_label) not between 1 and 30
    or p_viewer_role is null or p_viewer_role not in ('guardian', 'teacher') then
    raise exception 'invalid invite input' using errcode = '22023';
  end if;

  -- 1アカウントにつき有効な招待は1件だけにして、不要な蓄積と誤共有を防ぐ。
  delete from public.kanji_town_share_invites where learner_id = current_user_id;
  return query
  insert into public.kanji_town_share_invites as created (
    learner_id, token_hash, learner_label, viewer_role, expires_at
  ) values (
    current_user_id, p_token_hash, clean_label, p_viewer_role, now() + interval '15 minutes'
  )
  returning created.id, created.expires_at;
end;
$$;

create or replace function public.claim_kanji_town_share_invite(
  p_token_hash text,
  p_viewer_label text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  clean_viewer_label text := btrim(p_viewer_label);
  invite public.kanji_town_share_invites%rowtype;
  link_id uuid;
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$'
    or clean_viewer_label is null or char_length(clean_viewer_label) not between 1 and 30 then
    raise exception 'invalid or expired invite' using errcode = 'P0002';
  end if;

  select * into invite
  from public.kanji_town_share_invites
  where token_hash = p_token_hash and expires_at > now()
  for update;

  if not found or invite.learner_id = current_user_id then
    raise exception 'invalid or expired invite' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.kanji_town_learning_links
    where learner_id = invite.learner_id and viewer_id = current_user_id
  ) and (
    select count(*) from public.kanji_town_learning_links
    where learner_id = invite.learner_id
  ) >= 10 then
    raise exception 'viewer limit reached' using errcode = '54000';
  end if;

  insert into public.kanji_town_learning_links (
    learner_id, viewer_id, learner_label, viewer_label, viewer_role
  ) values (
    invite.learner_id, current_user_id, invite.learner_label, clean_viewer_label, invite.viewer_role
  )
  on conflict (learner_id, viewer_id) do update set
    learner_label = excluded.learner_label,
    viewer_label = excluded.viewer_label,
    viewer_role = excluded.viewer_role
  returning id into link_id;

  delete from public.kanji_town_share_invites where id = invite.id;
  return link_id;
end;
$$;

create or replace function public.get_kanji_town_linked_reports()
returns table (
  link_id uuid,
  learner_id uuid,
  learner_label text,
  viewer_role text,
  report_payload jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    link.id,
    link.learner_id,
    link.learner_label,
    link.viewer_role,
    save.report_payload,
    save.updated_at
  from public.kanji_town_learning_links as link
  left join public.kanji_town_saves as save on save.user_id = link.learner_id
  where link.viewer_id = (select auth.uid())
  order by link.created_at desc;
$$;

revoke all on function public.create_kanji_town_share_invite(text, text, text) from public, anon;
revoke all on function public.claim_kanji_town_share_invite(text, text) from public, anon;
revoke all on function public.get_kanji_town_linked_reports() from public, anon;
grant execute on function public.create_kanji_town_share_invite(text, text, text) to authenticated;
grant execute on function public.claim_kanji_town_share_invite(text, text) to authenticated;
grant execute on function public.get_kanji_town_linked_reports() to authenticated;
