drop function public.set_venue_member_rating(
  uuid, uuid, text, numeric, bigint
);

create function public.set_venue_member_rating(
  target_project_id uuid,
  target_venue_id uuid,
  target_dimension_key text,
  target_rating numeric,
  target_expected_revision bigint,
  target_operation_id uuid,
  target_device_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_row public.member_ratings%rowtype;
  saved_row public.member_ratings%rowtype;
  receipt_row public.sync_mutation_receipts%rowtype;
  receipt_created integer;
begin
  if auth.uid() is null
    or target_operation_id is null
    or target_device_id is null then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.read') then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  if target_dimension_key not in (
      'love_score',
      'interior_aesthetic_score_personal',
      'exterior_aesthetic_score_personal',
      'logistics_score_personal',
      'value_for_money_score_personal'
    )
    or target_rating is null
    or target_rating < 0
    or target_rating > 10
    or target_rating <> round(target_rating, 2)
    or target_expected_revision is null
    or target_expected_revision < 0 then
    raise exception 'venue rating unavailable' using errcode = '22023';
  end if;

  perform 1
  from public.venues v
  where v.project_id = target_project_id
    and v.id = target_venue_id;

  if not found then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  insert into public.sync_mutation_receipts (
    operation_id,
    project_id,
    user_id,
    device_id,
    entity_type,
    entity_id
  )
  values (
    target_operation_id,
    target_project_id,
    auth.uid(),
    target_device_id,
    'venue_member_rating',
    null
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
      or receipt_row.entity_type <> 'venue_member_rating'
      or receipt_row.entity_id is null
      or receipt_row.result_revision is null then
      raise exception 'venue rating unavailable' using errcode = '22023';
    end if;

    select * into current_row
    from public.member_ratings mr
    where mr.project_id = target_project_id
      and mr.user_id = auth.uid()
      and mr.target_type = 'venue'
      and mr.id = receipt_row.entity_id;

    if not found then
      raise exception 'venue rating conflict' using errcode = '40001';
    end if;

    if current_row.revision <> receipt_row.result_revision then
      raise exception 'venue rating conflict' using errcode = '40001';
    end if;

    if current_row.target_id is distinct from target_venue_id
      or current_row.dimension_key is distinct from target_dimension_key
      or current_row.rating is distinct from target_rating
      or receipt_row.result_revision <> target_expected_revision + 1 then
      raise exception 'venue rating unavailable' using errcode = '22023';
    end if;

    if not public.has_project_permission(target_project_id, 'venues.read') then
      raise exception 'venue rating unavailable' using errcode = '42501';
    end if;

    return jsonb_build_object(
      'id', current_row.id,
      'project_id', current_row.project_id,
      'user_id', current_row.user_id,
      'target_type', current_row.target_type,
      'target_id', current_row.target_id,
      'dimension_key', current_row.dimension_key,
      'rating', current_row.rating,
      'revision', current_row.revision
    );
  end if;

  select * into current_row
  from public.member_ratings mr
  where mr.project_id = target_project_id
    and mr.user_id = auth.uid()
    and mr.target_type = 'venue'
    and mr.target_id = target_venue_id
    and mr.dimension_key = target_dimension_key
  for update;

  if found then
    if current_row.revision <> target_expected_revision then
      raise exception 'venue rating unavailable' using errcode = '40001';
    end if;

    update public.member_ratings
    set rating = target_rating
    where id = current_row.id
    returning * into saved_row;
  else
    if target_expected_revision <> 0 then
      raise exception 'venue rating unavailable' using errcode = '40001';
    end if;

    insert into public.member_ratings (
      project_id,
      user_id,
      target_type,
      target_id,
      dimension_key,
      rating
    )
    values (
      target_project_id,
      auth.uid(),
      'venue',
      target_venue_id,
      target_dimension_key,
      target_rating
    )
    returning * into saved_row;
  end if;

  if not public.has_project_permission(target_project_id, 'venues.read') then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  update public.sync_mutation_receipts
  set entity_id = saved_row.id,
      result_revision = saved_row.revision
  where operation_id = target_operation_id;

  return jsonb_build_object(
    'id', saved_row.id,
    'project_id', saved_row.project_id,
    'user_id', saved_row.user_id,
    'target_type', saved_row.target_type,
    'target_id', saved_row.target_id,
    'dimension_key', saved_row.dimension_key,
    'rating', saved_row.rating,
    'revision', saved_row.revision
  );
end;
$$;

revoke all on function public.set_venue_member_rating(
  uuid, uuid, text, numeric, bigint, uuid, uuid
) from public, anon, authenticated;
grant execute on function public.set_venue_member_rating(
  uuid, uuid, text, numeric, bigint, uuid, uuid
) to authenticated;

comment on function public.set_venue_member_rating(
  uuid, uuid, text, numeric, bigint, uuid, uuid
) is
  'Receipt-aware self-authored Venue rating command with stable operation/device identity, live authorization, exact replay recognition and optimistic revision conflicts.';
