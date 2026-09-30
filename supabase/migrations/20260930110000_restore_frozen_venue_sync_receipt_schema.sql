alter table public.sync_mutation_receipts
  drop column intent_json,
  drop column result_json;

create or replace function public.update_venue_core(
  target_project_id uuid,
  target_venue_id uuid,
  target_expected_revision bigint,
  target_name text,
  target_code text,
  target_website_url text,
  target_city text,
  target_operation_id uuid,
  target_device_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_row public.venues%rowtype;
  updated_row public.venues%rowtype;
  receipt_row public.sync_mutation_receipts%rowtype;
  normalized_name text;
  normalized_code text;
  normalized_website_url text;
  normalized_city text;
  receipt_created integer;
begin
  if auth.uid() is null or target_operation_id is null or target_device_id is null then
    raise exception 'venue update unavailable' using errcode = '42501';
  end if;
  if not public.has_project_permission(target_project_id, 'venues.write') then
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

  insert into public.sync_mutation_receipts (
    operation_id, project_id, user_id, device_id, entity_type, entity_id
  )
  values (
    target_operation_id, target_project_id, auth.uid(), target_device_id,
    'venue_core_update', target_venue_id
  )
  on conflict (operation_id) do nothing;
  get diagnostics receipt_created = row_count;

  if receipt_created = 0 then
    select * into receipt_row
    from public.sync_mutation_receipts
    where operation_id = target_operation_id;

    if not found
      or receipt_row.project_id <> target_project_id
      or receipt_row.user_id <> auth.uid()
      or receipt_row.device_id is distinct from target_device_id
      or receipt_row.entity_type <> 'venue_core_update'
      or receipt_row.entity_id is distinct from target_venue_id
      or receipt_row.result_revision is null then
      raise exception 'venue update unavailable' using errcode = '22023';
    end if;

    select * into current_row
    from public.venues v
    where v.project_id = target_project_id and v.id = target_venue_id;
    if not found then
      raise exception 'venue update unavailable' using errcode = '42501';
    end if;
    if current_row.revision <> receipt_row.result_revision then
      raise exception 'venue update conflict' using errcode = '40001';
    end if;
    if receipt_row.result_revision <> target_expected_revision + 1
      or current_row.name is distinct from normalized_name
      or current_row.code is distinct from normalized_code
      or current_row.website_url is distinct from normalized_website_url
      or current_row.city is distinct from normalized_city then
      raise exception 'venue update unavailable' using errcode = '22023';
    end if;

    return jsonb_build_object(
      'id', current_row.id, 'project_id', current_row.project_id,
      'code', current_row.code, 'name', current_row.name,
      'status', current_row.status, 'rejection_reason', current_row.rejection_reason,
      'website_url', current_row.website_url, 'city', current_row.city,
      'revision', current_row.revision
    );
  end if;

  select * into current_row
  from public.venues v
  where v.project_id = target_project_id and v.id = target_venue_id
  for update;
  if not found or not public.has_project_permission(target_project_id, 'venues.write') then
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
  where project_id = target_project_id and id = target_venue_id
  returning * into updated_row;

  update public.sync_mutation_receipts
  set result_revision = updated_row.revision
  where operation_id = target_operation_id;

  return jsonb_build_object(
    'id', updated_row.id, 'project_id', updated_row.project_id,
    'code', updated_row.code, 'name', updated_row.name,
    'status', updated_row.status, 'rejection_reason', updated_row.rejection_reason,
    'website_url', updated_row.website_url, 'city', updated_row.city,
    'revision', updated_row.revision
  );
end;
$$;

create or replace function public.transition_venue_status(
  target_project_id uuid,
  target_venue_id uuid,
  target_status text,
  target_rejection_reason text,
  target_expected_revision bigint,
  target_operation_id uuid,
  target_device_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_row public.venues%rowtype;
  receipt_row public.sync_mutation_receipts%rowtype;
  normalized_reason text;
  next_revision bigint;
  receipt_created integer;
  changed_operation boolean;
begin
  if auth.uid() is null or target_operation_id is null or target_device_id is null then
    raise exception 'venue transition unavailable' using errcode = '42501';
  end if;
  if not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue transition unavailable' using errcode = '42501';
  end if;
  if target_expected_revision is null or target_expected_revision < 1 then
    raise exception 'venue transition unavailable' using errcode = '22023';
  end if;
  if target_status is null or target_status not in (
    'research', 'shortlist', 'reserve', 'contacted', 'quote_requested',
    'quote_received', 'visit_planned', 'visited', 'reviewed', 'finalist',
    'option_held', 'rejected', 'unavailable', 'withdrawn', 'paused'
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

  insert into public.sync_mutation_receipts (
    operation_id, project_id, user_id, device_id, entity_type, entity_id
  )
  values (
    target_operation_id, target_project_id, auth.uid(), target_device_id,
    'venue_status_transition', target_venue_id
  )
  on conflict (operation_id) do nothing;
  get diagnostics receipt_created = row_count;

  if receipt_created = 0 then
    select * into receipt_row
    from public.sync_mutation_receipts
    where operation_id = target_operation_id;
    if not found
      or receipt_row.project_id <> target_project_id
      or receipt_row.user_id <> auth.uid()
      or receipt_row.device_id is distinct from target_device_id
      or receipt_row.entity_type <> 'venue_status_transition'
      or receipt_row.entity_id is distinct from target_venue_id
      or receipt_row.result_revision is null then
      raise exception 'venue transition unavailable' using errcode = '22023';
    end if;

    select * into current_row
    from public.venues v
    where v.project_id = target_project_id and v.id = target_venue_id;
    if not found then
      raise exception 'venue transition unavailable' using errcode = '42501';
    end if;
    if current_row.revision <> receipt_row.result_revision then
      raise exception 'venue transition conflict' using errcode = '40001';
    end if;
    if current_row.status is distinct from target_status
      or current_row.rejection_reason is distinct from normalized_reason then
      raise exception 'venue transition unavailable' using errcode = '22023';
    end if;

    select exists (
      select 1
      from public.activity_log a
      where a.project_id = target_project_id
        and a.actor_user_id = auth.uid()
        and a.entity_type = 'venue'
        and a.entity_id = target_venue_id
        and a.event_type = 'venue_status_changed'
        and a.operation_id = target_operation_id
    ) into changed_operation;

    if changed_operation then
      if receipt_row.result_revision <> target_expected_revision + 1 then
        raise exception 'venue transition unavailable' using errcode = '22023';
      end if;
    elsif receipt_row.result_revision <> target_expected_revision then
      raise exception 'venue transition unavailable' using errcode = '22023';
    end if;

    return receipt_row.result_revision;
  end if;

  select * into current_row
  from public.venues v
  where v.project_id = target_project_id and v.id = target_venue_id
  for update;
  if not found or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue transition unavailable' using errcode = '42501';
  end if;
  if current_row.revision <> target_expected_revision then
    raise exception 'venue transition unavailable' using errcode = '40001';
  end if;
  if current_row.status in (
    'selected', 'contract_sent', 'contract_signed', 'deposit_paid',
    'confirmed', 'completed', 'archived'
  ) then
    raise exception 'venue transition unavailable' using errcode = '22023';
  end if;

  if current_row.status = target_status
    and current_row.rejection_reason is not distinct from normalized_reason then
    update public.sync_mutation_receipts
    set result_revision = current_row.revision
    where operation_id = target_operation_id;
    return current_row.revision;
  end if;

  update public.venues
  set status = target_status, rejection_reason = normalized_reason
  where project_id = target_project_id and id = target_venue_id
  returning revision into next_revision;

  insert into public.activity_log (
    project_id, actor_user_id, device_id, event_type, entity_type, entity_id,
    summary_key, metadata_json, operation_id
  )
  values (
    target_project_id, auth.uid(), target_device_id, 'venue_status_changed',
    'venue', target_venue_id, 'venue.status_changed',
    jsonb_build_object(
      'previousStatus', current_row.status,
      'previousRejectionReason', current_row.rejection_reason,
      'status', target_status,
      'rejectionReason', normalized_reason
    ),
    target_operation_id
  );

  update public.sync_mutation_receipts
  set result_revision = next_revision
  where operation_id = target_operation_id;
  return next_revision;
end;
$$;

revoke all on function public.update_venue_core(
  uuid, uuid, bigint, text, text, text, text, uuid, uuid
) from public, anon, authenticated;
grant execute on function public.update_venue_core(
  uuid, uuid, bigint, text, text, text, text, uuid, uuid
) to authenticated;

revoke all on function public.transition_venue_status(
  uuid, uuid, text, text, bigint, uuid, uuid
) from public, anon, authenticated;
grant execute on function public.transition_venue_status(
  uuid, uuid, text, text, bigint, uuid, uuid
) to authenticated;

comment on table public.sync_mutation_receipts is
  'Frozen-schema server-owned idempotency receipts. Replays fail closed when the current entity no longer proves the same acknowledged semantic result.';
comment on function public.update_venue_core(
  uuid, uuid, bigint, text, text, text, text, uuid, uuid
) is
  'Receipt-aware ordinary venue update; replay is accepted only while current revision and normalized fields prove the same acknowledged result.';
comment on function public.transition_venue_status(
  uuid, uuid, text, text, bigint, uuid, uuid
) is
  'Receipt-aware pre-contractual venue lifecycle command; replay is accepted only while current revision and lifecycle state prove the same acknowledged result.';
