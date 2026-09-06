alter table public.venues
  add constraint venues_website_url_supported_scheme check (
    website_url is null or website_url ~* '^https?://'
  );

revoke update (
  code, name, address_line1, address_line2, postal_code, city, region,
  country_code, latitude, longitude, website_url, phone, email, summary_note
) on table public.venues from authenticated;

create or replace function public.update_venue_core(
  target_project_id uuid,
  target_venue_id uuid,
  target_expected_revision bigint,
  target_name text,
  target_code text,
  target_website_url text,
  target_city text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_row public.venues%rowtype;
  updated_row public.venues%rowtype;
  normalized_name text;
  normalized_code text;
  normalized_website_url text;
  normalized_city text;
begin
  if auth.uid() is null then
    raise exception 'venue update unavailable' using errcode = '42501';
  end if;

  if target_expected_revision is null or target_expected_revision < 1 then
    raise exception 'venue update unavailable' using errcode = '22023';
  end if;

  normalized_name := btrim(target_name);
  normalized_code := nullif(btrim(target_code), '');
  normalized_website_url := nullif(btrim(target_website_url), '');
  normalized_city := nullif(btrim(target_city), '');

  if normalized_name is null or char_length(normalized_name) not between 1 and 240 then
    raise exception 'venue update unavailable' using errcode = '22023';
  end if;
  if normalized_code is not null and char_length(normalized_code) > 40 then
    raise exception 'venue update unavailable' using errcode = '22023';
  end if;
  if normalized_website_url is not null and (
    char_length(normalized_website_url) > 2048
    or normalized_website_url !~* '^https?://'
  ) then
    raise exception 'venue update unavailable' using errcode = '22023';
  end if;
  if normalized_city is not null and char_length(normalized_city) > 160 then
    raise exception 'venue update unavailable' using errcode = '22023';
  end if;

  select * into current_row
  from public.venues v
  where v.project_id = target_project_id
    and v.id = target_venue_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue update unavailable' using errcode = '42501';
  end if;

  if current_row.revision <> target_expected_revision then
    raise exception 'venue update unavailable' using errcode = '40001';
  end if;

  update public.venues
  set name = normalized_name,
      code = normalized_code,
      website_url = normalized_website_url,
      city = normalized_city
  where project_id = target_project_id
    and id = target_venue_id
  returning * into updated_row;

  return jsonb_build_object(
    'id', updated_row.id,
    'project_id', updated_row.project_id,
    'code', updated_row.code,
    'name', updated_row.name,
    'status', updated_row.status,
    'rejection_reason', updated_row.rejection_reason,
    'website_url', updated_row.website_url,
    'city', updated_row.city,
    'revision', updated_row.revision
  );
end;
$$;

revoke all on function public.update_venue_core(uuid, uuid, bigint, text, text, text, text)
from public, anon, authenticated;
grant execute on function public.update_venue_core(uuid, uuid, bigint, text, text, text, text)
to authenticated;

drop function public.transition_venue_status(uuid, uuid, text, text, uuid);

create function public.transition_venue_status(
  target_project_id uuid,
  target_venue_id uuid,
  target_status text,
  target_rejection_reason text,
  target_expected_revision bigint
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_row public.venues%rowtype;
  normalized_reason text;
  next_revision bigint;
begin
  if auth.uid() is null then
    raise exception 'venue transition unavailable' using errcode = '42501';
  end if;

  if target_expected_revision is null or target_expected_revision < 1 then
    raise exception 'venue transition unavailable' using errcode = '22023';
  end if;

  if target_status not in (
    'research', 'shortlist', 'reserve', 'contacted', 'quote_requested',
    'quote_received', 'visit_planned', 'visited', 'reviewed', 'finalist',
    'option_held', 'selected', 'contract_sent', 'contract_signed',
    'deposit_paid', 'confirmed', 'completed', 'archived', 'rejected',
    'unavailable', 'withdrawn', 'paused'
  ) then
    raise exception 'venue transition unavailable' using errcode = '22023';
  end if;

  normalized_reason := nullif(btrim(target_rejection_reason), '');
  if target_status = 'rejected' then
    if normalized_reason is null or char_length(normalized_reason) > 1000 then
      raise exception 'venue transition unavailable' using errcode = '22023';
    end if;
  elsif normalized_reason is not null then
    raise exception 'venue transition unavailable' using errcode = '22023';
  end if;

  select * into current_row
  from public.venues v
  where v.project_id = target_project_id
    and v.id = target_venue_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue transition unavailable' using errcode = '42501';
  end if;

  if current_row.revision <> target_expected_revision then
    raise exception 'venue transition unavailable' using errcode = '40001';
  end if;

  if current_row.status = target_status
    and current_row.rejection_reason is not distinct from normalized_reason then
    return current_row.revision;
  end if;

  update public.venues
  set status = target_status,
      rejection_reason = normalized_reason
  where project_id = target_project_id
    and id = target_venue_id
  returning revision into next_revision;

  insert into public.activity_log (
    project_id,
    actor_user_id,
    event_type,
    entity_type,
    entity_id,
    summary_key,
    metadata_json
  )
  values (
    target_project_id,
    auth.uid(),
    'venue_status_changed',
    'venue',
    target_venue_id,
    'venue.status_changed',
    jsonb_build_object(
      'previousStatus', current_row.status,
      'previousRejectionReason', current_row.rejection_reason,
      'status', target_status,
      'rejectionReason', normalized_reason
    )
  );

  return next_revision;
end;
$$;

revoke all on function public.transition_venue_status(uuid, uuid, text, text, bigint)
from public, anon, authenticated;
grant execute on function public.transition_venue_status(uuid, uuid, text, text, bigint)
to authenticated;

comment on function public.update_venue_core(uuid, uuid, bigint, text, text, text, text) is
  'Ordinary venue identity update with live venues.write authorization, expected-revision optimistic locking and database-level input normalization.';
comment on function public.transition_venue_status(uuid, uuid, text, text, bigint) is
  'Explicit venue lifecycle command with live authorization, expected-revision optimistic locking, rejection validation and retained history. Operation receipts remain owned by the later sync packet.';
