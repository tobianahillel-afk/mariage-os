begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

select has_table('public', 'app_permissions', 'permission catalog table exists');
select has_table('public', 'app_roles', 'role catalog table exists');
select has_table('public', 'app_role_permissions', 'role-permission mapping table exists');

select is(
  (select count(*)::integer from public.app_roles),
  3,
  'owner, editor and viewer built-in roles are migration controlled'
);

select is(
  (select count(*)::integer from public.app_permissions),
  51,
  'the frozen V1 permission catalog is seeded completely'
);

select is(
  (
    select count(*)::integer
    from public.app_role_permissions
    where role_key = 'owner'
  ),
  (select count(*)::integer from public.app_permissions),
  'owner receives the complete built-in V1 permission catalog'
);

select ok(
  public.role_has_permission('editor', 'venues.write'),
  'editor receives ordinary venue write permission'
);

select ok(
  not public.role_has_permission('editor', 'members.invite'),
  'editor does not receive owner-only membership invitation permission'
);

select ok(
  public.role_has_permission('viewer', 'venues.read'),
  'viewer receives ordinary venue read permission'
);

select ok(
  not public.role_has_permission('viewer', 'finance.read'),
  'viewer does not receive financial read permission'
);

select ok(
  not public.role_has_permission('unknown-role', 'project.read')
  and not public.role_has_permission('owner', 'unknown.permission'),
  'unknown role or permission fails closed'
);

select ok(
  not has_table_privilege('anon', 'public.app_permissions', 'select')
  and not has_table_privilege('authenticated', 'public.app_permissions', 'select')
  and not has_table_privilege('anon', 'public.app_role_permissions', 'select')
  and not has_table_privilege('authenticated', 'public.app_role_permissions', 'select'),
  'authorization metadata is not ordinary client-readable table data'
);

select ok(
  not has_function_privilege('anon', 'public.role_has_permission(text,text)', 'execute')
  and not has_function_privilege('authenticated', 'public.role_has_permission(text,text)', 'execute'),
  'client roles cannot invoke the internal role lookup with a self-supplied role'
);

select throws_ok(
  $$
    insert into public.app_permissions (permission_key, description, sensitivity)
    values ('Invalid Permission', 'invalid key fixture', 'ordinary')
  $$,
  '23514',
  'new row for relation "app_permissions" violates check constraint "app_permissions_key_format"',
  'invalid permission-key syntax is rejected by the database'
);

select * from finish();
rollback;
