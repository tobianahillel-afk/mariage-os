create or replace function public.transition_venue_offer_status(
  target_project_id uuid,
  target_venue_id uuid,
  target_offer_id uuid,
  target_status text,
  target_expected_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_row public.venue_offers%rowtype;
  saved_row public.venue_offers%rowtype;
begin
  perform public.venue_offer_assert_writer(target_project_id);
  if target_expected_revision is null or target_expected_revision < 1
    or target_status is null
    or target_status not in ('quoted', 'accepted', 'rejected', 'expired', 'superseded') then
    raise exception 'venue offer transition unavailable' using errcode = '22023';
  end if;

  select * into current_row
  from public.venue_offers vo
  where vo.project_id = target_project_id
    and vo.venue_id = target_venue_id
    and vo.id = target_offer_id
  for update;

  if not found then
    raise exception 'venue offer transition unavailable' using errcode = '42501';
  end if;
  perform public.venue_offer_assert_writer(target_project_id);
  if current_row.revision <> target_expected_revision then
    raise exception 'stale venue offer' using errcode = '40001';
  end if;
  if not public.venue_offer_transition_allowed(current_row.status, target_status) then
    raise exception 'venue offer transition unavailable' using errcode = '22023';
  end if;

  update public.venue_offers
  set status = target_status
  where project_id = target_project_id and id = target_offer_id
  returning * into saved_row;
  return to_jsonb(saved_row);
end;
$$;
