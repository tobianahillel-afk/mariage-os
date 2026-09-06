create or replace function public.set_venue_member_rating(
  target_project_id uuid,
  target_venue_id uuid,
  target_dimension_key text,
  target_rating numeric,
  target_expected_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_row public.member_ratings%rowtype;
  saved_row public.member_ratings%rowtype;
begin
  if auth.uid() is null then
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

revoke all on function public.set_venue_member_rating(uuid, uuid, text, numeric, bigint)
from public, anon, authenticated;
grant execute on function public.set_venue_member_rating(uuid, uuid, text, numeric, bigint)
to authenticated;

comment on function public.set_venue_member_rating(uuid, uuid, text, numeric, bigint) is
  'Self-authored Venue rating command with optimistic revision checks and exact two-decimal precision validation.';
