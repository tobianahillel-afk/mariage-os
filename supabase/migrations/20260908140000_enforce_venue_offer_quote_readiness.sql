create or replace function public.protect_touch_venue_offer()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  terms_changed boolean;
begin
  if new.id is distinct from old.id
    or new.project_id is distinct from old.project_id
    or new.venue_id is distinct from old.venue_id
    or new.created_at is distinct from old.created_at
    or new.created_by is distinct from old.created_by then
    raise exception 'venue offer identity is immutable' using errcode = '23514';
  end if;

  terms_changed :=
    new.name is distinct from old.name
    or new.valid_from is distinct from old.valid_from
    or new.valid_to is distinct from old.valid_to
    or new.weekday is distinct from old.weekday
    or new.base_amount_minor is distinct from old.base_amount_minor
    or new.currency is distinct from old.currency
    or new.tax_mode is distinct from old.tax_mode
    or new.tax_rate_basis_points is distinct from old.tax_rate_basis_points
    or new.included_guest_count is distinct from old.included_guest_count
    or new.extra_guest_amount_minor is distinct from old.extra_guest_amount_minor
    or new.deposit_amount_minor is distinct from old.deposit_amount_minor
    or new.deposit_refundable is distinct from old.deposit_refundable
    or new.security_deposit_minor is distinct from old.security_deposit_minor
    or new.security_deposit_refundable is distinct from old.security_deposit_refundable
    or new.included_start_time is distinct from old.included_start_time
    or new.included_end_time is distinct from old.included_end_time
    or new.included_end_day_offset is distinct from old.included_end_day_offset
    or new.extra_hour_amount_minor is distinct from old.extra_hour_amount_minor
    or new.source_id is distinct from old.source_id
    or new.notes is distinct from old.notes;

  if terms_changed and old.status <> 'draft' then
    raise exception 'quoted venue offer terms are immutable' using errcode = '23514';
  end if;
  if terms_changed and new.status is distinct from old.status then
    raise exception 'venue offer transition cannot rewrite terms' using errcode = '23514';
  end if;
  if new.status is distinct from old.status
    and not public.venue_offer_transition_allowed(old.status, new.status) then
    raise exception 'venue offer transition unavailable' using errcode = '23514';
  end if;

  if new.status = 'quoted' and new.status is distinct from old.status then
    if new.valid_to is null
      or (
        new.base_amount_minor is null
        and new.extra_guest_amount_minor is null
        and new.deposit_amount_minor is null
        and new.extra_hour_amount_minor is null
      )
      or not exists (
        select 1
        from public.offer_components oc
        where oc.project_id = new.project_id
          and oc.owner_type = 'venue_offer'
          and oc.owner_id = new.id
      ) then
      raise exception 'venue offer is not ready to quote' using errcode = '23514';
    end if;
  end if;

  new.updated_at := now();
  new.updated_by := auth.uid();
  new.revision := old.revision + 1;
  return new;
end;
$$;

revoke all on function public.protect_touch_venue_offer()
from public, anon, authenticated;
