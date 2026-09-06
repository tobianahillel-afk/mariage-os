begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

set local role anon;
select throws_ok(
  $$select * from engineering.rls_probe$$,
  '42501',
  'permission denied for schema engineering',
  'anonymous access is denied before row access'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from engineering.rls_probe),
  0,
  'authenticated principal without tenant claim is denied all rows'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","tenant_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',
  true
);

select is(
  (select count(*)::integer from engineering.rls_probe),
  1,
  'tenant A principal sees only tenant A seed row'
);

select is(
  (
    select count(*)::integer
    from engineering.rls_probe
    where tenant_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ),
  0,
  'tenant A principal cannot read tenant B row'
);

select lives_ok(
  $$
    insert into engineering.rls_probe (id, tenant_id, label)
    values (
      '30000000-0000-4000-8000-000000000003',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'synthetic-tenant-a-insert'
    )
  $$,
  'same-tenant insert is allowed'
);

select throws_ok(
  $$
    insert into engineering.rls_probe (id, tenant_id, label)
    values (
      '40000000-0000-4000-8000-000000000004',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'synthetic-cross-tenant-insert'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "rls_probe"',
  'cross-tenant insert is rejected by WITH CHECK'
);

select throws_ok(
  $$
    update engineering.rls_probe
    set tenant_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    where id = '10000000-0000-4000-8000-000000000001'
  $$,
  '42501',
  'new row violates row-level security policy for table "rls_probe"',
  'cross-tenant update is rejected by WITH CHECK'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","tenant_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"}',
  true
);

select is(
  (select count(*)::integer from engineering.rls_probe),
  1,
  'tenant B principal sees only tenant B seed row'
);

select * from finish();
rollback;
