alter table public.contacts
  add constraint contacts_project_parent_identity_key
  unique (project_id, parent_type, parent_id, id);

create table public.interactions (
  id uuid primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_type text not null check (parent_type = 'venue'),
  parent_id uuid not null,
  contact_id uuid null,
  interaction_type text not null check (
    interaction_type = public.fact_ecmascript_trim(interaction_type)
    and char_length(interaction_type) between 1 and 80
  ),
  occurred_at timestamptz not null check (
    public.fact_instant_in_application_domain(occurred_at)
  ),
  summary text not null check (
    summary = public.fact_ecmascript_trim(summary)
    and char_length(summary) between 1 and 5000
  ),
  next_follow_up_at timestamptz null check (
    next_follow_up_at is null
    or public.fact_instant_in_application_domain(next_follow_up_at)
  ),
  source_id uuid null,
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id),
  revision bigint not null default 1 check (revision = 1),
  unique (project_id, id),
  foreign key (project_id, parent_id)
    references public.venues(project_id, id)
    on delete cascade,
  foreign key (project_id, parent_type, parent_id, contact_id)
    references public.contacts(project_id, parent_type, parent_id, id)
    on update restrict
    on delete restrict,
  foreign key (project_id, source_id)
    references public.sources(project_id, id)
    on update restrict
    on delete restrict
);

create index interactions_venue_history_idx
  on public.interactions (
    project_id,
    parent_type,
    parent_id,
    occurred_at desc,
    created_at desc,
    id asc
  );

create or replace function public.protect_venue_interaction_immutable()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  raise exception 'venue interaction is immutable' using errcode = '23514';
end;
$$;

revoke all on function public.protect_venue_interaction_immutable()
from public, anon, authenticated;

create trigger interactions_protect_update
before update on public.interactions
for each row execute function public.protect_venue_interaction_immutable();

create trigger interactions_protect_delete
before delete on public.interactions
for each row execute function public.protect_venue_interaction_immutable();

alter table public.interactions enable row level security;

revoke all on table public.interactions from public, anon, authenticated;
grant select on table public.interactions to authenticated;

create policy interactions_select_authorized
on public.interactions for select to authenticated
using (public.has_project_permission(project_id, 'venues.read'));

create or replace function public.venue_interaction_assert_writer(
  target_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null then
    raise exception 'venue interaction unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue interaction unavailable' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.venue_interaction_assert_writer(uuid)
from public, anon, authenticated;

create or replace function public.append_venue_interaction(
  target_project_id uuid,
  target_venue_id uuid,
  target_interaction_id uuid,
  target_contact_id uuid,
  target_interaction_type text,
  target_occurred_at text,
  target_summary text,
  target_next_follow_up_at text,
  target_source_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  normalized_interaction_type text;
  parsed_occurred_at timestamptz;
  normalized_summary text;
  parsed_next_follow_up_at timestamptz;
  saved_row public.interactions%rowtype;
  existing_row public.interactions%rowtype;
begin
  perform public.venue_interaction_assert_writer(target_project_id);

  if target_venue_id is null
    or target_interaction_id is null
    or target_interaction_type is null
    or target_occurred_at is null
    or target_summary is null then
    raise exception 'venue interaction unavailable' using errcode = '22023';
  end if;

  normalized_interaction_type := nullif(
    public.fact_ecmascript_trim(target_interaction_type),
    ''
  );
  parsed_occurred_at := public.fact_parse_application_instant(target_occurred_at);
  normalized_summary := nullif(public.fact_ecmascript_trim(target_summary), '');
  parsed_next_follow_up_at := public.fact_parse_application_instant(
    target_next_follow_up_at
  );

  if normalized_interaction_type is null
    or char_length(normalized_interaction_type) > 80
    or parsed_occurred_at is null
    or normalized_summary is null
    or char_length(normalized_summary) > 5000
    or (
      target_next_follow_up_at is not null
      and parsed_next_follow_up_at is null
    ) then
    raise exception 'venue interaction unavailable' using errcode = '22023';
  end if;

  perform 1
  from public.venues v
  where v.project_id = target_project_id
    and v.id = target_venue_id;
  if not found then
    raise exception 'venue interaction unavailable' using errcode = '42501';
  end if;

  if target_contact_id is not null then
    perform 1
    from public.contacts c
    where c.project_id = target_project_id
      and c.parent_type = 'venue'
      and c.parent_id = target_venue_id
      and c.id = target_contact_id;
    if not found then
      raise exception 'venue interaction unavailable' using errcode = '42501';
    end if;
  end if;

  if target_source_id is not null then
    perform 1
    from public.sources s
    where s.project_id = target_project_id
      and s.id = target_source_id;
    if not found then
      raise exception 'venue interaction unavailable' using errcode = '42501';
    end if;
  end if;

  insert into public.interactions (
    id,
    project_id,
    parent_type,
    parent_id,
    contact_id,
    interaction_type,
    occurred_at,
    summary,
    next_follow_up_at,
    source_id,
    created_by,
    updated_by
  ) values (
    target_interaction_id,
    target_project_id,
    'venue',
    target_venue_id,
    target_contact_id,
    normalized_interaction_type,
    parsed_occurred_at,
    normalized_summary,
    parsed_next_follow_up_at,
    target_source_id,
    auth.uid(),
    auth.uid()
  )
  on conflict (id) do nothing
  returning * into saved_row;

  if found then
    return to_jsonb(saved_row);
  end if;

  select i.* into existing_row
  from public.interactions i
  where i.id = target_interaction_id;

  if found and (
    existing_row.project_id <> target_project_id
    or existing_row.parent_type <> 'venue'
    or existing_row.parent_id <> target_venue_id
  ) then
    raise exception 'venue interaction unavailable' using errcode = '42501';
  end if;

  if found
    and existing_row.project_id = target_project_id
    and existing_row.parent_type = 'venue'
    and existing_row.parent_id = target_venue_id
    and existing_row.contact_id is not distinct from target_contact_id
    and existing_row.interaction_type = normalized_interaction_type
    and existing_row.occurred_at = parsed_occurred_at
    and existing_row.summary = normalized_summary
    and existing_row.next_follow_up_at is not distinct from parsed_next_follow_up_at
    and existing_row.source_id is not distinct from target_source_id then
    return to_jsonb(existing_row);
  end if;

  raise exception 'venue interaction conflict' using errcode = '23505';
end;
$$;

revoke all on function public.append_venue_interaction(
  uuid, uuid, uuid, uuid, text, text, text, text, uuid
) from public, anon;

grant execute on function public.append_venue_interaction(
  uuid, uuid, uuid, uuid, text, text, text, text, uuid
) to authenticated;
