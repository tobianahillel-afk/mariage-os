create or replace function public.create_venue_offer(
  target_project_id uuid,
  target_venue_id uuid,
  target_offer_id uuid,
  target_status text,
  target_name text,
  target_valid_from text,
  target_valid_to text,
  target_weekday smallint,
  target_base_amount_minor bigint,
  target_currency text,
  target_tax_mode text,
  target_tax_rate_basis_points integer,
  target_included_guest_count integer,
  target_extra_guest_amount_minor bigint,
  target_deposit_amount_minor bigint,
  target_deposit_refundable boolean,
  target_security_deposit_minor bigint,
  target_security_deposit_refundable boolean,
  target_included_start_time text,
  target_included_end_time text,
  target_included_end_day_offset smallint,
  target_extra_hour_amount_minor bigint,
  target_source_id uuid,
  target_notes text,
  target_components jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  normalized_name text := public.fact_ecmascript_trim(target_name);
  normalized_notes text := nullif(public.fact_ecmascript_trim(target_notes), '');
  parsed_valid_from date := public.venue_commercial_parse_date(target_valid_from);
  parsed_valid_to date := public.venue_commercial_parse_date(target_valid_to);
  parsed_start_time time := public.venue_commercial_parse_time(target_included_start_time);
  parsed_end_time time := public.venue_commercial_parse_time(target_included_end_time);
  saved_offer public.venue_offers%rowtype;
  component jsonb;
  component_rows jsonb := '[]'::jsonb;
  component_row jsonb;
begin
  perform public.venue_offer_assert_writer(target_project_id);

  if target_status is null
    or target_status not in ('draft', 'quoted')
    or normalized_name is null or char_length(normalized_name) not between 1 and 240
    or (parsed_valid_from is not null and parsed_valid_to is not null and parsed_valid_from > parsed_valid_to)
    or (target_weekday is not null and target_weekday not between 0 and 6)
    or (target_base_amount_minor is not null and target_base_amount_minor not between 0 and 9007199254740991)
    or target_currency !~ '^[A-Z]{3}$'
    or target_tax_mode not in ('included', 'excluded', 'unknown', 'not_applicable')
    or (target_tax_rate_basis_points is not null and target_tax_rate_basis_points not between 0 and 10000)
    or (target_included_guest_count is not null and target_included_guest_count < 0)
    or (target_extra_guest_amount_minor is not null and target_extra_guest_amount_minor not between 0 and 9007199254740991)
    or (target_deposit_amount_minor is not null and target_deposit_amount_minor not between 0 and 9007199254740991)
    or (target_security_deposit_minor is not null and target_security_deposit_minor not between 0 and 9007199254740991)
    or target_included_end_day_offset not between 0 and 2
    or (target_extra_hour_amount_minor is not null and target_extra_hour_amount_minor not between 0 and 9007199254740991)
    or (normalized_notes is not null and char_length(normalized_notes) > 5000)
    or target_components is null
    or jsonb_typeof(target_components) <> 'array' then
    raise exception 'venue offer unavailable' using errcode = '22023';
  end if;

  perform 1 from public.venues v
  where v.project_id = target_project_id and v.id = target_venue_id;
  if not found then
    raise exception 'venue offer unavailable' using errcode = '42501';
  end if;

  insert into public.venue_offers (
    id, project_id, venue_id, name, status, valid_from, valid_to, weekday,
    base_amount_minor, currency, tax_mode, tax_rate_basis_points,
    included_guest_count, extra_guest_amount_minor, deposit_amount_minor,
    deposit_refundable, security_deposit_minor, security_deposit_refundable,
    included_start_time, included_end_time, included_end_day_offset,
    extra_hour_amount_minor, source_id, notes, created_by, updated_by
  ) values (
    target_offer_id, target_project_id, target_venue_id, normalized_name, 'draft',
    parsed_valid_from, parsed_valid_to, target_weekday, target_base_amount_minor,
    target_currency, target_tax_mode, target_tax_rate_basis_points,
    target_included_guest_count, target_extra_guest_amount_minor,
    target_deposit_amount_minor, target_deposit_refundable,
    target_security_deposit_minor, target_security_deposit_refundable,
    parsed_start_time, parsed_end_time, target_included_end_day_offset,
    target_extra_hour_amount_minor, target_source_id, normalized_notes,
    auth.uid(), auth.uid()
  ) returning * into saved_offer;

  for component in select value from jsonb_array_elements(target_components)
  loop
    if jsonb_typeof(component) <> 'object'
      or jsonb_typeof(component -> 'id') <> 'string'
      or (component ->> 'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      or jsonb_typeof(component -> 'label') <> 'string'
      or jsonb_typeof(component -> 'component_type') <> 'string'
      or jsonb_typeof(component -> 'calculation_type') <> 'string'
      or (component -> 'unit_amount_minor' is not null and component -> 'unit_amount_minor' <> 'null'::jsonb and jsonb_typeof(component -> 'unit_amount_minor') <> 'number')
      or (component -> 'quantity' is not null and component -> 'quantity' <> 'null'::jsonb and jsonb_typeof(component -> 'quantity') <> 'number')
      or (component -> 'unit_label' is not null and component -> 'unit_label' <> 'null'::jsonb and jsonb_typeof(component -> 'unit_label') <> 'string')
      or jsonb_typeof(component -> 'currency') <> 'string'
      or jsonb_typeof(component -> 'tax_mode') <> 'string'
      or (component -> 'tax_rate_basis_points' is not null and component -> 'tax_rate_basis_points' <> 'null'::jsonb and jsonb_typeof(component -> 'tax_rate_basis_points') <> 'number')
      or (component -> 'notes' is not null and component -> 'notes' <> 'null'::jsonb and jsonb_typeof(component -> 'notes') <> 'string') then
      raise exception 'venue offer component unavailable' using errcode = '22023';
    end if;

    component_row := public.insert_venue_offer_component_core(
      target_project_id,
      target_offer_id,
      (component ->> 'id')::uuid,
      component ->> 'label',
      component ->> 'component_type',
      component ->> 'calculation_type',
      case when component -> 'unit_amount_minor' = 'null'::jsonb then null else (component ->> 'unit_amount_minor')::bigint end,
      case when component -> 'quantity' = 'null'::jsonb then null else (component ->> 'quantity')::numeric end,
      case when component -> 'unit_label' = 'null'::jsonb then null else component ->> 'unit_label' end,
      component ->> 'currency',
      component ->> 'tax_mode',
      case when component -> 'tax_rate_basis_points' = 'null'::jsonb then null else (component ->> 'tax_rate_basis_points')::integer end,
      case when component -> 'notes' = 'null'::jsonb then null else component ->> 'notes' end
    );
    component_rows := component_rows || jsonb_build_array(component_row);
  end loop;

  if target_status = 'quoted' then
    update public.venue_offers
    set status = 'quoted'
    where project_id = target_project_id and id = target_offer_id
    returning * into saved_offer;
  end if;

  return jsonb_build_object(
    'offer', to_jsonb(saved_offer),
    'components', component_rows
  );
end;
$$;
