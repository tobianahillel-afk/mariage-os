-- WP-2.12V RED-only gate: the accepted branch has no atomic observation + visit-source
-- command. This file is intentionally a failing contract probe, never to be
-- merged without the independently accepted GREEN implementation.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  to_regprocedure(
    'public.append_venue_fact_observation_visit_atomic(uuid,uuid,uuid,jsonb,text,text,text,text,text,uuid,uuid,bigint)'
  ) is not null,
  'WP212V RED: one twelve-argument atomic observation/provenance RPC exists'
);

select is(
  (
    select pg_catalog.pg_get_function_result(p.oid)
    from pg_catalog.pg_proc p
    where p.oid = to_regprocedure(
      'public.append_venue_fact_observation_visit_atomic(uuid,uuid,uuid,jsonb,text,text,text,text,text,uuid,uuid,bigint)'
    )
  ),
  'jsonb',
  'WP212V RED: RPC returns one inspectable atomic JSON receipt'
);

select ok(
  coalesce(
    (
      select p.prosecdef
      from pg_catalog.pg_proc p
      where p.oid = to_regprocedure(
        'public.append_venue_fact_observation_visit_atomic(uuid,uuid,uuid,jsonb,text,text,text,text,text,uuid,uuid,bigint)'
      )
    ),
    false
  ),
  'WP212V RED: privileged atomic command has explicit authorization boundary'
);

select ok(
  coalesce(
    (
      select 'search_path=pg_catalog' = any(p.proconfig)
      from pg_catalog.pg_proc p
      where p.oid = to_regprocedure(
        'public.append_venue_fact_observation_visit_atomic(uuid,uuid,uuid,jsonb,text,text,text,text,text,uuid,uuid,bigint)'
      )
    ),
    false
  ),
  'WP212V RED: atomic SECURITY DEFINER fixes pg_catalog search_path'
);

select ok(
  coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure(
        'public.append_venue_fact_observation_visit_atomic(uuid,uuid,uuid,jsonb,text,text,text,text,text,uuid,uuid,bigint)'
      ),
      'EXECUTE'
    ),
    false
  ),
  'WP212V RED: authenticated clients can invoke the bounded command'
);

select * from finish();
rollback;
