create table public.venue_offers (
  id uuid primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  venue_id uuid not null,
  name text not null check (
    name = public.fact_ecmascript_trim(name)
    and char_length(name) between 1 and 240
  ),
  status text not null check (
    status in ('draft', 'quoted', 'accepted', 'rejected', 'expired', 'superseded')
  ),
  valid_from date null,
  valid_to date null,
  weekday smallint null check (weekday between 0 and 6),
  base_amount_minor bigint null check (
    base_amount_minor between 0 and 9007199254740991
  ),
  currency char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  tax_mode text not null default 'unknown' check (
    tax_mode in ('included', 'excluded', 'unknown', 'not_applicable')
  ),
  tax_rate_basis_points integer null check (tax_rate_basis_points between 0 and 10000),
  included_guest_count integer null check (included_guest_count >= 0),
  extra_guest_amount_minor bigint null check (
    extra_guest_amount_minor between 0 and 9007199254740991
  ),
  deposit_amount_minor bigint null check (
    deposit_amount_minor between 0 and 9007199254740991
  ),
  deposit_refundable boolean null,
  security_deposit_minor bigint null check (
    security_deposit_minor between 0 and 9007199254740991
  ),
  security_deposit_refundable boolean null default true,
  included_start_time time(0) null,
  included_end_time time(0) null,
  included_end_day_offset smallint not null default 0 check (
    included_end_day_offset between 0 and 2
  ),
  extra_hour_amount_minor bigint null check (
    extra_hour_amount_minor between 0 and 9007199254740991
  ),
  source_id uuid null,
  notes text null check (
    notes is null
    or (
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
  foreign key (project_id, venue_id)
    references public.venues(project_id, id)
    on delete cascade,
  foreign key (project_id, source_id)
    references public.sources(project_id, id)
    on delete restrict,
  check (valid_from is null or valid_to is null or valid_from <= valid_to)
);

create index venue_offers_venue_status_idx
  on public.venue_offers (project_id, venue_id, status, created_at desc);

create table public.offer_components (
  id uuid primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_type text not null check (owner_type = 'venue_offer'),
  owner_id uuid not null,
  label text not null check (
    label = public.fact_ecmascript_trim(label)
    and char_length(label) between 1 and 240
  ),
  component_type text not null check (
    component_type in ('included', 'mandatory_extra', 'optional')
  ),
  calculation_type text not null check (
    calculation_type in (
      'fixed', 'per_guest', 'per_adult', 'per_child', 'per_table',
      'per_hour', 'quantity_unit'
    )
  ),
  unit_amount_minor bigint null check (
    unit_amount_minor between 0 and 9007199254740991
  ),
  quantity numeric(12,3) null check (quantity between 0 and 999999999.999),
  unit_label text null check (
    unit_label is null
    or (
      unit_label = public.fact_ecmascript_trim(unit_label)
      and char_length(unit_label) between 1 and 80
    )
  ),
  currency char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  tax_mode text not null default 'unknown' check (
    tax_mode in ('included', 'excluded', 'unknown', 'not_applicable')
  ),
  tax_rate_basis_points integer null check (tax_rate_basis_points between 0 and 10000),
  notes text null check (
    notes is null
    or (
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
  foreign key (project_id, owner_id)
    references public.venue_offers(project_id, id)
    on delete cascade
);

create index offer_components_owner_idx
  on public.offer_components (project_id, owner_id, created_at, id);

create or replace function public.venue_commercial_parse_date(target_value text)
returns date
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
begin
  if target_value is null then
    return null;
  end if;
  if target_value !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'venue commercial date unavailable' using errcode = '22023';
  end if;
  begin
    return target_value::date;
  exception when datetime_field_overflow or invalid_datetime_format then
    raise exception 'venue commercial date unavailable' using errcode = '22023';
  end;
end;
$$;

create or replace function public.venue_commercial_parse_time(target_value text)
returns time
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
begin
  if target_value is null then
    return null;
  end if;
  if target_value !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'venue commercial time unavailable' using errcode = '22023';
  end if;
  return target_value::time;
end;
$$;

revoke all on function public.venue_commercial_parse_date(text)
from public, anon, authenticated;
revoke all on function public.venue_commercial_parse_time(text)
from public, anon, authenticated;

create or replace function public.venue_offer_transition_allowed(
  current_status text,
  target_status text
)
returns boolean
language sql
immutable
security definer
set search_path = pg_catalog
as $$
  select case
    when current_status = 'draft' then target_status in ('quoted', 'rejected')
    when current_status = 'quoted' then target_status in (
      'accepted', 'rejected', 'expired', 'superseded'
    )
    when current_status = 'accepted' then target_status = 'superseded'
    else false
  end;
$$;

revoke all on function public.venue_offer_transition_allowed(text, text)
from public, anon, authenticated;

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

  new.updated_at := now();
  new.updated_by := auth.uid();
  new.revision := old.revision + 1;
  return new;
end;
$$;

revoke all on function public.protect_touch_venue_offer()
from public, anon, authenticated;

create trigger venue_offers_protect_touch
before update on public.venue_offers
for each row execute function public.protect_touch_venue_offer();

create or replace function public.protect_touch_offer_component()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  parent_status text;
begin
  select vo.status into parent_status
  from public.venue_offers vo
  where vo.project_id = coalesce(new.project_id, old.project_id)
    and vo.id = coalesce(new.owner_id, old.owner_id);

  if parent_status is distinct from 'draft' then
    raise exception 'venue offer component is immutable' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
      or new.project_id is distinct from old.project_id
      or new.owner_type is distinct from old.owner_type
      or new.owner_id is distinct from old.owner_id
      or new.created_at is distinct from old.created_at
      or new.created_by is distinct from old.created_by then
      raise exception 'venue offer component identity is immutable' using errcode = '23514';
    end if;
    new.updated_at := now();
    new.updated_by := auth.uid();
    new.revision := old.revision + 1;
    return new;
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function public.protect_touch_offer_component()
from public, anon, authenticated;

create trigger offer_components_protect_insert
before insert on public.offer_components
for each row execute function public.protect_touch_offer_component();
create trigger offer_components_protect_update
before update on public.offer_components
for each row execute function public.protect_touch_offer_component();
create trigger offer_components_protect_delete
before delete on public.offer_components
for each row execute function public.protect_touch_offer_component();

alter table public.venue_offers enable row level security;
alter table public.offer_components enable row level security;

revoke all on table public.venue_offers from public, anon, authenticated;
revoke all on table public.offer_components from public, anon, authenticated;

grant select on table public.venue_offers to authenticated;
grant select on table public.offer_components to authenticated;

create policy venue_offers_select_authorized
on public.venue_offers for select to authenticated
using (public.has_project_permission(project_id, 'venues.read'));

create policy offer_components_select_authorized
on public.offer_components for select to authenticated
using (public.has_project_permission(project_id, 'venues.read'));

create or replace function public.venue_offer_assert_writer(target_project_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue offer unavailable' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.venue_offer_assert_writer(uuid)
from public, anon, authenticated;

create or replace function public.insert_venue_offer_component_core(
  target_project_id uuid,
  target_offer_id uuid,
  target_component_id uuid,
  target_label text,
  target_component_type text,
  target_calculation_type text,
  target_unit_amount_minor bigint,
  target_quantity numeric,
  target_unit_label text,
  target_currency text,
  target_tax_mode text,
  target_tax_rate_basis_points integer,
  target_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  normalized_label text := public.fact_ecmascript_trim(target_label);
  normalized_unit_label text := nullif(public.fact_ecmascript_trim(target_unit_label), '');
  normalized_notes text := nullif(public.fact_ecmascript_trim(target_notes), '');
  saved_row public.offer_components%rowtype;
begin
  if normalized_label is null or char_length(normalized_label) not between 1 and 240
    or target_component_type not in ('included', 'mandatory_extra', 'optional')
    or target_calculation_type not in (
      'fixed', 'per_guest', 'per_adult', 'per_child', 'per_table',
      'per_hour', 'quantity_unit'
    )
    or (target_unit_amount_minor is not null and target_unit_amount_minor not between 0 and 9007199254740991)
    or (target_quantity is not null and (
      target_quantity < 0
      or target_quantity > 999999999.999
      or target_quantity <> trunc(target_quantity, 3)
    ))
    or (normalized_unit_label is not null and char_length(normalized_unit_label) > 80)
    or target_currency !~ '^[A-Z]{3}$'
    or target_tax_mode not in ('included', 'excluded', 'unknown', 'not_applicable')
    or (target_tax_rate_basis_points is not null and target_tax_rate_basis_points not between 0 and 10000)
    or (normalized_notes is not null and char_length(normalized_notes) > 5000) then
    raise exception 'venue offer component unavailable' using errcode = '22023';
  end if;

  insert into public.offer_components (
    id, project_id, owner_type, owner_id, label, component_type,
    calculation_type, unit_amount_minor, quantity, unit_label, currency,
    tax_mode, tax_rate_basis_points, notes, created_by, updated_by
  ) values (
    target_component_id, target_project_id, 'venue_offer', target_offer_id,
    normalized_label, target_component_type, target_calculation_type,
    target_unit_amount_minor, target_quantity, normalized_unit_label,
    target_currency, target_tax_mode, target_tax_rate_basis_points,
    normalized_notes, auth.uid(), auth.uid()
  ) returning * into saved_row;

  return to_jsonb(saved_row);
end;
$$;

revoke all on function public.insert_venue_offer_component_core(
  uuid, uuid, uuid, text, text, text, bigint, numeric, text, text, text,
  integer, text
) from public, anon, authenticated;

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

  if target_status not in ('draft', 'quoted')
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

create or replace function public.update_venue_offer_draft(
  target_project_id uuid,
  target_venue_id uuid,
  target_offer_id uuid,
  target_expected_revision bigint,
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
  target_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_row public.venue_offers%rowtype;
  saved_row public.venue_offers%rowtype;
  normalized_name text := public.fact_ecmascript_trim(target_name);
  normalized_notes text := nullif(public.fact_ecmascript_trim(target_notes), '');
  parsed_valid_from date := public.venue_commercial_parse_date(target_valid_from);
  parsed_valid_to date := public.venue_commercial_parse_date(target_valid_to);
  parsed_start_time time := public.venue_commercial_parse_time(target_included_start_time);
  parsed_end_time time := public.venue_commercial_parse_time(target_included_end_time);
begin
  perform public.venue_offer_assert_writer(target_project_id);

  if target_expected_revision is null or target_expected_revision < 1
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
    or (normalized_notes is not null and char_length(normalized_notes) > 5000) then
    raise exception 'venue offer unavailable' using errcode = '22023';
  end if;

  select * into current_row
  from public.venue_offers vo
  where vo.project_id = target_project_id
    and vo.venue_id = target_venue_id
    and vo.id = target_offer_id
  for update;

  if not found then
    raise exception 'venue offer unavailable' using errcode = '42501';
  end if;
  perform public.venue_offer_assert_writer(target_project_id);
  if current_row.revision <> target_expected_revision then
    raise exception 'stale venue offer' using errcode = '40001';
  end if;
  if current_row.status <> 'draft' then
    raise exception 'venue offer terms are immutable' using errcode = '22023';
  end if;

  update public.venue_offers
  set name = normalized_name,
      valid_from = parsed_valid_from,
      valid_to = parsed_valid_to,
      weekday = target_weekday,
      base_amount_minor = target_base_amount_minor,
      currency = target_currency,
      tax_mode = target_tax_mode,
      tax_rate_basis_points = target_tax_rate_basis_points,
      included_guest_count = target_included_guest_count,
      extra_guest_amount_minor = target_extra_guest_amount_minor,
      deposit_amount_minor = target_deposit_amount_minor,
      deposit_refundable = target_deposit_refundable,
      security_deposit_minor = target_security_deposit_minor,
      security_deposit_refundable = target_security_deposit_refundable,
      included_start_time = parsed_start_time,
      included_end_time = parsed_end_time,
      included_end_day_offset = target_included_end_day_offset,
      extra_hour_amount_minor = target_extra_hour_amount_minor,
      source_id = target_source_id,
      notes = normalized_notes
  where project_id = target_project_id and id = target_offer_id
  returning * into saved_row;

  return to_jsonb(saved_row);
end;
$$;

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
  if current_row.status = target_status then
    return to_jsonb(current_row);
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

create or replace function public.create_venue_offer_component(
  target_project_id uuid,
  target_offer_id uuid,
  target_component_id uuid,
  target_expected_offer_revision bigint,
  target_label text,
  target_component_type text,
  target_calculation_type text,
  target_unit_amount_minor bigint,
  target_quantity numeric,
  target_unit_label text,
  target_currency text,
  target_tax_mode text,
  target_tax_rate_basis_points integer,
  target_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  offer_row public.venue_offers%rowtype;
begin
  perform public.venue_offer_assert_writer(target_project_id);
  if target_expected_offer_revision is null or target_expected_offer_revision < 1 then
    raise exception 'venue offer component unavailable' using errcode = '22023';
  end if;

  select * into offer_row from public.venue_offers vo
  where vo.project_id = target_project_id and vo.id = target_offer_id
  for update;
  if not found then
    raise exception 'venue offer component unavailable' using errcode = '42501';
  end if;
  perform public.venue_offer_assert_writer(target_project_id);
  if offer_row.revision <> target_expected_offer_revision then
    raise exception 'stale venue offer' using errcode = '40001';
  end if;
  if offer_row.status <> 'draft' then
    raise exception 'venue offer component is immutable' using errcode = '22023';
  end if;

  return public.insert_venue_offer_component_core(
    target_project_id, target_offer_id, target_component_id, target_label,
    target_component_type, target_calculation_type, target_unit_amount_minor,
    target_quantity, target_unit_label, target_currency, target_tax_mode,
    target_tax_rate_basis_points, target_notes
  );
end;
$$;

create or replace function public.update_venue_offer_component(
  target_project_id uuid,
  target_offer_id uuid,
  target_component_id uuid,
  target_expected_offer_revision bigint,
  target_expected_component_revision bigint,
  target_label text,
  target_component_type text,
  target_calculation_type text,
  target_unit_amount_minor bigint,
  target_quantity numeric,
  target_unit_label text,
  target_currency text,
  target_tax_mode text,
  target_tax_rate_basis_points integer,
  target_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  offer_row public.venue_offers%rowtype;
  component_row public.offer_components%rowtype;
  saved_row public.offer_components%rowtype;
  normalized_label text := public.fact_ecmascript_trim(target_label);
  normalized_unit_label text := nullif(public.fact_ecmascript_trim(target_unit_label), '');
  normalized_notes text := nullif(public.fact_ecmascript_trim(target_notes), '');
begin
  perform public.venue_offer_assert_writer(target_project_id);
  if target_expected_offer_revision is null or target_expected_offer_revision < 1
    or target_expected_component_revision is null or target_expected_component_revision < 1
    or normalized_label is null or char_length(normalized_label) not between 1 and 240
    or target_component_type not in ('included', 'mandatory_extra', 'optional')
    or target_calculation_type not in (
      'fixed', 'per_guest', 'per_adult', 'per_child', 'per_table',
      'per_hour', 'quantity_unit'
    )
    or (target_unit_amount_minor is not null and target_unit_amount_minor not between 0 and 9007199254740991)
    or (target_quantity is not null and (
      target_quantity < 0
      or target_quantity > 999999999.999
      or target_quantity <> trunc(target_quantity, 3)
    ))
    or (normalized_unit_label is not null and char_length(normalized_unit_label) > 80)
    or target_currency !~ '^[A-Z]{3}$'
    or target_tax_mode not in ('included', 'excluded', 'unknown', 'not_applicable')
    or (target_tax_rate_basis_points is not null and target_tax_rate_basis_points not between 0 and 10000)
    or (normalized_notes is not null and char_length(normalized_notes) > 5000) then
    raise exception 'venue offer component unavailable' using errcode = '22023';
  end if;

  select * into offer_row from public.venue_offers vo
  where vo.project_id = target_project_id and vo.id = target_offer_id
  for update;
  if not found then
    raise exception 'venue offer component unavailable' using errcode = '42501';
  end if;
  perform public.venue_offer_assert_writer(target_project_id);
  if offer_row.revision <> target_expected_offer_revision then
    raise exception 'stale venue offer' using errcode = '40001';
  end if;
  if offer_row.status <> 'draft' then
    raise exception 'venue offer component is immutable' using errcode = '22023';
  end if;

  select * into component_row from public.offer_components oc
  where oc.project_id = target_project_id
    and oc.owner_id = target_offer_id
    and oc.id = target_component_id
  for update;
  if not found then
    raise exception 'venue offer component unavailable' using errcode = '42501';
  end if;
  if component_row.revision <> target_expected_component_revision then
    raise exception 'stale venue offer component' using errcode = '40001';
  end if;

  update public.offer_components
  set label = normalized_label,
      component_type = target_component_type,
      calculation_type = target_calculation_type,
      unit_amount_minor = target_unit_amount_minor,
      quantity = target_quantity,
      unit_label = normalized_unit_label,
      currency = target_currency,
      tax_mode = target_tax_mode,
      tax_rate_basis_points = target_tax_rate_basis_points,
      notes = normalized_notes
  where project_id = target_project_id and id = target_component_id
  returning * into saved_row;
  return to_jsonb(saved_row);
end;
$$;

create or replace function public.remove_venue_offer_component(
  target_project_id uuid,
  target_offer_id uuid,
  target_component_id uuid,
  target_expected_offer_revision bigint,
  target_expected_component_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  offer_row public.venue_offers%rowtype;
  component_row public.offer_components%rowtype;
begin
  perform public.venue_offer_assert_writer(target_project_id);
  if target_expected_offer_revision is null or target_expected_offer_revision < 1
    or target_expected_component_revision is null or target_expected_component_revision < 1 then
    raise exception 'venue offer component unavailable' using errcode = '22023';
  end if;

  select * into offer_row from public.venue_offers vo
  where vo.project_id = target_project_id and vo.id = target_offer_id
  for update;
  if not found then
    raise exception 'venue offer component unavailable' using errcode = '42501';
  end if;
  perform public.venue_offer_assert_writer(target_project_id);
  if offer_row.revision <> target_expected_offer_revision then
    raise exception 'stale venue offer' using errcode = '40001';
  end if;
  if offer_row.status <> 'draft' then
    raise exception 'venue offer component is immutable' using errcode = '22023';
  end if;

  select * into component_row from public.offer_components oc
  where oc.project_id = target_project_id
    and oc.owner_id = target_offer_id
    and oc.id = target_component_id
  for update;
  if not found then
    raise exception 'venue offer component unavailable' using errcode = '42501';
  end if;
  if component_row.revision <> target_expected_component_revision then
    raise exception 'stale venue offer component' using errcode = '40001';
  end if;

  delete from public.offer_components
  where project_id = target_project_id and id = target_component_id;

  return jsonb_build_object(
    'project_id', target_project_id,
    'offer_id', target_offer_id,
    'component_id', target_component_id,
    'removed', true
  );
end;
$$;

revoke all on function public.create_venue_offer(
  uuid, uuid, uuid, text, text, text, text, smallint, bigint, text, text,
  integer, integer, bigint, bigint, boolean, bigint, boolean, text, text,
  smallint, bigint, uuid, text, jsonb
) from public, anon;
grant execute on function public.create_venue_offer(
  uuid, uuid, uuid, text, text, text, text, smallint, bigint, text, text,
  integer, integer, bigint, bigint, boolean, bigint, boolean, text, text,
  smallint, bigint, uuid, text, jsonb
) to authenticated;

revoke all on function public.update_venue_offer_draft(
  uuid, uuid, uuid, bigint, text, text, text, smallint, bigint, text, text,
  integer, integer, bigint, bigint, boolean, bigint, boolean, text, text,
  smallint, bigint, uuid, text
) from public, anon;
grant execute on function public.update_venue_offer_draft(
  uuid, uuid, uuid, bigint, text, text, text, smallint, bigint, text, text,
  integer, integer, bigint, bigint, boolean, bigint, boolean, text, text,
  smallint, bigint, uuid, text
) to authenticated;

revoke all on function public.transition_venue_offer_status(uuid, uuid, uuid, text, bigint)
from public, anon;
grant execute on function public.transition_venue_offer_status(uuid, uuid, uuid, text, bigint)
to authenticated;

revoke all on function public.create_venue_offer_component(
  uuid, uuid, uuid, bigint, text, text, text, bigint, numeric, text, text,
  text, integer, text
) from public, anon;
grant execute on function public.create_venue_offer_component(
  uuid, uuid, uuid, bigint, text, text, text, bigint, numeric, text, text,
  text, integer, text
) to authenticated;

revoke all on function public.update_venue_offer_component(
  uuid, uuid, uuid, bigint, bigint, text, text, text, bigint, numeric, text,
  text, text, integer, text
) from public, anon;
grant execute on function public.update_venue_offer_component(
  uuid, uuid, uuid, bigint, bigint, text, text, text, bigint, numeric, text,
  text, text, integer, text
) to authenticated;

revoke all on function public.remove_venue_offer_component(uuid, uuid, uuid, bigint, bigint)
from public, anon;
grant execute on function public.remove_venue_offer_component(uuid, uuid, uuid, bigint, bigint)
to authenticated;

comment on table public.venue_offers is
  'WP-2.6A Venue commercial offer history. Terms are mutable only while draft; quoted and later terms are historical.';
comment on table public.offer_components is
  'WP-2.6A staged Venue-owned offer components. owner_type is venue_offer until the later Vendor packet widens the final V1 model.';
