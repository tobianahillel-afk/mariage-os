create table public.contacts (
  id uuid primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_type text not null check (parent_type = 'venue'),
  parent_id uuid not null,
  name text null check (
    name is null or (
      name = public.fact_ecmascript_trim(name)
      and char_length(name) between 1 and 240
    )
  ),
  role_label text null check (
    role_label is null or (
      role_label = public.fact_ecmascript_trim(role_label)
      and char_length(role_label) between 1 and 160
    )
  ),
  email text null check (
    email is null or (
      email = public.fact_ecmascript_trim(email)
      and char_length(email) between 1 and 320
    )
  ),
  phone text null check (
    phone is null or phone ~ '^\+[1-9][0-9]{1,14}$'
  ),
  preferred_channel text null check (
    preferred_channel is null or (
      preferred_channel = public.fact_ecmascript_trim(preferred_channel)
      and char_length(preferred_channel) between 1 and 80
    )
  ),
  notes text null check (
    notes is null or (
      notes = public.fact_ecmascript_trim(notes)
      and char_length(notes) between 1 and 5000
    )
  ),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id),
  revision bigint not null default 1 check (revision > 0),
  unique (project_id, id),
  foreign key (project_id, parent_id)
    references public.venues(project_id, id)
    on delete cascade
);

create index contacts_venue_parent_idx
  on public.contacts (project_id, parent_type, parent_id, id);

create or replace function public.protect_venue_contact_update()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if new.id is distinct from old.id
    or new.project_id is distinct from old.project_id
    or new.parent_type is distinct from old.parent_type
    or new.parent_id is distinct from old.parent_id
    or new.created_at is distinct from old.created_at
    or new.created_by is distinct from old.created_by
    or new.updated_at is distinct from old.updated_at
    or new.updated_by is distinct from old.updated_by
    or new.revision is distinct from old.revision then
    raise exception 'venue contact protected fields are immutable' using errcode = '23514';
  end if;

  new.updated_at := now();
  new.updated_by := auth.uid();
  new.revision := old.revision + 1;
  return new;
end;
$$;

revoke all on function public.protect_venue_contact_update()
from public, anon, authenticated;

create trigger contacts_protect_update
before update on public.contacts
for each row execute function public.protect_venue_contact_update();

alter table public.contacts enable row level security;

revoke all on table public.contacts from public, anon, authenticated;
grant select on table public.contacts to authenticated;

create policy contacts_select_authorized
on public.contacts for select to authenticated
using (public.has_project_permission(project_id, 'venues.read'));

create or replace function public.venue_contact_assert_writer(
  target_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null then
    raise exception 'venue contact unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue contact unavailable' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.venue_contact_assert_writer(uuid)
from public, anon, authenticated;

create or replace function public.save_venue_contact(
  target_project_id uuid,
  target_venue_id uuid,
  target_contact_id uuid,
  target_expected_revision bigint,
  target_name text,
  target_role_label text,
  target_email text,
  target_phone text,
  target_preferred_channel text,
  target_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  normalized_name text;
  normalized_role_label text;
  normalized_email text;
  normalized_phone text;
  normalized_preferred_channel text;
  normalized_notes text;
  saved_row public.contacts%rowtype;
begin
  perform public.venue_contact_assert_writer(target_project_id);

  if target_project_id is null
    or target_venue_id is null
    or target_contact_id is null then
    raise exception 'venue contact unavailable' using errcode = '22023';
  end if;

  perform 1 from public.venues v
  where v.project_id = target_project_id and v.id = target_venue_id;
  if not found then
    raise exception 'venue contact unavailable' using errcode = '42501';
  end if;

  normalized_name := nullif(public.fact_ecmascript_trim(target_name), '');
  normalized_role_label := nullif(public.fact_ecmascript_trim(target_role_label), '');
  normalized_email := nullif(public.fact_ecmascript_trim(target_email), '');
  normalized_phone := nullif(public.fact_ecmascript_trim(target_phone), '');
  normalized_preferred_channel := nullif(public.fact_ecmascript_trim(target_preferred_channel), '');
  normalized_notes := nullif(public.fact_ecmascript_trim(target_notes), '');

  if (normalized_name is not null and char_length(normalized_name) > 240)
    or (normalized_role_label is not null and char_length(normalized_role_label) > 160)
    or (normalized_email is not null and char_length(normalized_email) > 320)
    or (normalized_phone is not null and normalized_phone !~ '^\+[1-9][0-9]{1,14}$')
    or (normalized_preferred_channel is not null and char_length(normalized_preferred_channel) > 80)
    or (normalized_notes is not null and char_length(normalized_notes) > 5000) then
    raise exception 'venue contact unavailable' using errcode = '22023';
  end if;

  if target_expected_revision is null then
    begin
      insert into public.contacts (
        id, project_id, parent_type, parent_id,
        name, role_label, email, phone, preferred_channel, notes,
        created_by, updated_by
      ) values (
        target_contact_id, target_project_id, 'venue', target_venue_id,
        normalized_name, normalized_role_label, normalized_email,
        normalized_phone, normalized_preferred_channel, normalized_notes,
        auth.uid(), auth.uid()
      )
      returning * into saved_row;
    exception when unique_violation then
      raise exception 'venue contact conflict' using errcode = '23505';
    end;
    return to_jsonb(saved_row);
  end if;

  if target_expected_revision <= 0 then
    raise exception 'venue contact unavailable' using errcode = '22023';
  end if;

  update public.contacts
  set name = normalized_name,
      role_label = normalized_role_label,
      email = normalized_email,
      phone = normalized_phone,
      preferred_channel = normalized_preferred_channel,
      notes = normalized_notes
  where id = target_contact_id
    and project_id = target_project_id
    and parent_type = 'venue'
    and parent_id = target_venue_id
    and revision = target_expected_revision
  returning * into saved_row;

  if not found then
    raise exception 'venue contact conflict' using errcode = '40001';
  end if;

  return to_jsonb(saved_row);
end;
$$;

revoke all on function public.save_venue_contact(
  uuid, uuid, uuid, bigint, text, text, text, text, text, text
) from public, anon;

grant execute on function public.save_venue_contact(
  uuid, uuid, uuid, bigint, text, text, text, text, text, text
) to authenticated;
