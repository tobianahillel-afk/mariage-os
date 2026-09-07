create or replace function public.fact_instant_in_application_domain(
  target_value timestamptz
)
returns boolean
language sql
immutable
parallel safe
security definer
set search_path = pg_catalog
as $$
  select pg_catalog.isfinite(target_value)
    and target_value >= timestamp with time zone '0001-01-01 00:00:00+00'
    and target_value < timestamp with time zone '10000-01-01 00:00:00+00';
$$;

revoke all on function public.fact_instant_in_application_domain(timestamptz)
from public, anon, authenticated;

alter table public.sources
  add constraint sources_observed_at_application_domain_check
  check (
    observed_at is null
    or public.fact_instant_in_application_domain(observed_at)
  );

alter table public.fact_observations
  add constraint fact_observations_observed_at_application_domain_check
  check (public.fact_instant_in_application_domain(observed_at));

alter table public.facts
  add constraint facts_resolved_at_application_domain_check
  check (
    resolved_at is null
    or public.fact_instant_in_application_domain(resolved_at)
  ),
  add constraint facts_last_verified_at_application_domain_check
  check (
    last_verified_at is null
    or public.fact_instant_in_application_domain(last_verified_at)
  ),
  add constraint facts_stale_at_application_domain_check
  check (
    stale_at is null
    or public.fact_instant_in_application_domain(stale_at)
  );
