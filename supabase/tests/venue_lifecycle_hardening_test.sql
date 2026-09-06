begin;

create extension if not exists pgtap with schema extensions;
select plan(11);

select ok(
  strpos(
    lower(pg_get_functiondef('public.update_venue_core(uuid,uuid,bigint,text,text,text,text)'::regprocedure)),
    'has_project_permission'
  ) < strpos(
    lower(pg_get_functiondef('public.update_venue_core(uuid,uuid,bigint,text,text,text,text)'::regprocedure)),
    'for update'
  ),
  'ordinary venue update authorizes before acquiring the venue row lock'
);

select ok(
  strpos(
    lower(pg_get_functiondef('public.transition_venue_status(uuid,uuid,text,text,bigint)'::regprocedure)),
    'has_project_permission'
  ) < strpos(
    lower(pg_get_functiondef('public.transition_venue_status(uuid,uuid,text,text,bigint)'::regprocedure)),
    'for update'
  ),
  'venue lifecycle command authorizes before acquiring the venue row lock'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '77777777-7777-4777-8777-777777777777',
  'authenticated',
  'authenticated',
  'lifecycle-owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'Lifecycle Test Project',
  '77777777-7777-4777-8777-777777777777',
  '77777777-7777-4777-8777-777777777777'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '77777777-7777-4777-8777-777777777777',
  'owner',
  'active',
  now(),
  null
);

insert into public.venues (
  id, project_id, code, name, status, created_by, updated_by
)
values
  (
    'c1000000-0000-4000-8000-000000000001',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'T1',
    'Ordinary Lifecycle Venue',
    'research',
    '77777777-7777-4777-8777-777777777777',
    '77777777-7777-4777-8777-777777777777'
  ),
  (
    'c1000000-0000-4000-8000-000000000002',
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'T2',
    'Protected Lifecycle Venue',
    'selected',
    '77777777-7777-4777-8777-777777777777',
    '77777777-7777-4777-8777-777777777777'
  );

create function pg_temp.try_transition(
  target_id uuid,
  target_status text,
  target_reason text default null
)
returns boolean
language plpgsql
as $$
declare
  current_revision bigint;
begin
  select revision into current_revision
  from public.venues
  where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    and id = target_id;

  perform public.transition_venue_status(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    target_id,
    target_status,
    target_reason,
    current_revision
  );
  return true;
exception
  when insufficient_privilege or invalid_parameter_value or serialization_failure
    then return false;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}',
  true
);

select ok(
  not pg_temp.try_transition(
    'c1000000-0000-4000-8000-000000000001',
    null
  ),
  'null lifecycle target is rejected before mutation'
);

select ok(
  (
    select bool_and(
      not pg_temp.try_transition(
        'c1000000-0000-4000-8000-000000000001',
        protected_status
      )
    )
    from unnest(array[
      'selected',
      'contract_sent',
      'contract_signed',
      'deposit_paid',
      'confirmed',
      'completed',
      'archived'
    ]) as protected_status
  ),
  'generic lifecycle command rejects every protected commitment or terminal target'
);

select is(
  (
    select status
    from public.venues
    where id = 'c1000000-0000-4000-8000-000000000001'
  ),
  'research',
  'rejected protected targets leave ordinary venue state unchanged'
);

select ok(
  pg_temp.try_transition(
    'c1000000-0000-4000-8000-000000000001',
    'reserve'
  ),
  'reserve remains an allowed non-contractual backup state'
);

select is(
  (
    select status
    from public.venues
    where id = 'c1000000-0000-4000-8000-000000000001'
  ),
  'reserve',
  'reserve lifecycle state is stored canonically'
);

select ok(
  pg_temp.try_transition(
    'c1000000-0000-4000-8000-000000000001',
    'shortlist'
  ),
  'reserve can be explicitly reclassified back into active research workflow'
);

select is(
  (
    select count(*)::integer
    from public.activity_log
    where entity_id = 'c1000000-0000-4000-8000-000000000001'
  ),
  2,
  'reserve and restore transitions retain both lifecycle history entries'
);

select ok(
  not pg_temp.try_transition(
    'c1000000-0000-4000-8000-000000000002',
    'shortlist'
  ),
  'venue already in protected state cannot leave through generic lifecycle command'
);

select is(
  (
    select status
    from public.venues
    where id = 'c1000000-0000-4000-8000-000000000002'
  ),
  'selected',
  'failed generic transition preserves protected current state'
);

select * from finish();
rollback;
