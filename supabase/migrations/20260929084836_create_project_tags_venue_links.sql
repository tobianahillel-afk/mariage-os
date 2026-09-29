create or replace function public.project_tag_label_is_valid(target_label text)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select target_label is not null
    and target_label = public.fact_ecmascript_trim(target_label)
    and char_length(target_label) between 1 and 80
    and not exists (
      select 1
      from generate_series(1, char_length(target_label)) as point(pos)
      where ascii(substr(target_label, point.pos, 1)) between 0 and 31
        or ascii(substr(target_label, point.pos, 1)) between 127 and 159
    );
$$;

revoke all on function public.project_tag_label_is_valid(text)
from public, anon, authenticated;
grant execute on function public.project_tag_label_is_valid(text)
to authenticated;

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  key text not null check (key collate "C" ~ '^[a-z0-9][a-z0-9_-]{0,63}$'),
  label text not null check (public.project_tag_label_is_valid(label)),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id),
  revision bigint not null default 1 check (revision > 0),
  deleted_at timestamptz null,
  unique (project_id, id)
);

create unique index tags_active_project_key_unique
on public.tags (project_id, key) where deleted_at is null;
create index tags_project_active_idx
on public.tags (project_id, id) where deleted_at is null;

create or replace function public.protect_project_tag_update()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if new.id is distinct from old.id
    or new.project_id is distinct from old.project_id
    or new.key is distinct from old.key
    or new.created_at is distinct from old.created_at
    or new.created_by is distinct from old.created_by
    or new.updated_at is distinct from old.updated_at
    or new.updated_by is distinct from old.updated_by
    or new.revision is distinct from old.revision then
    raise exception 'tag protected fields are immutable' using errcode = '23514';
  end if;

  if old.deleted_at is null and new.deleted_at is not null then
    new.deleted_at := now();
  elsif old.deleted_at is not null
    and new.deleted_at is not null
    and new.deleted_at is distinct from old.deleted_at then
    raise exception 'tag deletion timestamp is immutable' using errcode = '23514';
  end if;

  new.updated_at := now();
  new.updated_by := auth.uid();
  new.revision := old.revision + 1;
  return new;
end;
$$;

revoke all on function public.protect_project_tag_update()
from public, anon, authenticated;

create trigger tags_protect_update
before update on public.tags
for each row execute function public.protect_project_tag_update();

alter table public.tags enable row level security;
revoke all on table public.tags from public, anon, authenticated;
grant select on table public.tags to authenticated;
grant insert (id, project_id, key, label) on table public.tags to authenticated;
grant update (label, deleted_at) on table public.tags to authenticated;

create policy tags_select_authorized
on public.tags for select to authenticated
using (
  public.has_project_permission(project_id, 'project.read')
  and (
    deleted_at is null
    or public.has_project_permission(project_id, 'project.settings.update')
  )
);

create policy tags_insert_authorized
on public.tags for insert to authenticated
with check (
  public.has_project_permission(project_id, 'project.settings.update')
  and created_by = auth.uid()
  and updated_by = auth.uid()
  and revision = 1
  and deleted_at is null
);

create policy tags_update_authorized
on public.tags for update to authenticated
using (public.has_project_permission(project_id, 'project.settings.update'))
with check (public.has_project_permission(project_id, 'project.settings.update'));

create table public.entity_tags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tag_id uuid not null,
  target_type text not null check (target_type = 'venue'),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  unique (project_id, id),
  unique (project_id, tag_id, target_type, target_id),
  foreign key (project_id, tag_id)
    references public.tags(project_id, id) on delete cascade,
  foreign key (project_id, target_id)
    references public.venues(project_id, id) on delete cascade
);

create index entity_tags_venue_target_idx
on public.entity_tags (project_id, target_type, target_id, id);

create or replace function public.assert_active_tag_for_entity_link()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  perform 1
  from public.tags tag
  where tag.project_id = new.project_id
    and tag.id = new.tag_id
    and tag.deleted_at is null
  for share;
  if not found then
    raise exception 'active tag unavailable' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.assert_active_tag_for_entity_link()
from public, anon, authenticated;

create trigger entity_tags_active_tag_insert
before insert on public.entity_tags
for each row execute function public.assert_active_tag_for_entity_link();

alter table public.entity_tags enable row level security;
revoke all on table public.entity_tags from public, anon, authenticated;
grant select on table public.entity_tags to authenticated;
grant insert (id, project_id, tag_id, target_type, target_id)
on table public.entity_tags to authenticated;
grant delete on table public.entity_tags to authenticated;

create policy entity_tags_select_authorized
on public.entity_tags for select to authenticated
using (
  public.has_project_permission(project_id, 'venues.read')
  and exists (
    select 1 from public.tags tag
    where tag.project_id = entity_tags.project_id
      and tag.id = entity_tags.tag_id
      and tag.deleted_at is null
  )
);

create policy entity_tags_insert_authorized
on public.entity_tags for insert to authenticated
with check (
  public.has_project_permission(project_id, 'venues.write')
  and created_by = auth.uid()
  and target_type = 'venue'
  and exists (
    select 1 from public.tags tag
    where tag.project_id = entity_tags.project_id
      and tag.id = entity_tags.tag_id
      and tag.deleted_at is null
  )
);

create policy entity_tags_delete_authorized
on public.entity_tags for delete to authenticated
using (
  public.has_project_permission(project_id, 'venues.write')
  and exists (
    select 1 from public.tags tag
    where tag.project_id = entity_tags.project_id
      and tag.id = entity_tags.tag_id
      and tag.deleted_at is null
  )
);
