begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

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
    select array_agg(permission_key order by permission_key)
    from public.app_role_permissions
    where role_key = 'owner'
  ),
  (
    select array_agg(permission_key order by permission_key)
    from public.app_permissions
  ),
  'owner receives exactly the complete built-in V1 permission catalog'
);

select is(
  (
    select array_agg(permission_key order by permission_key)
    from public.app_role_permissions
    where role_key = 'editor'
  ),
  array[
    'access.read',
    'access.write',
    'contract_review.read',
    'contract_review.write',
    'decisions.read',
    'decisions.write',
    'documents.read',
    'documents.write',
    'exports.standard',
    'finance.read',
    'finance.write',
    'guest_sensitive.read',
    'guest_sensitive.write',
    'guests.read',
    'guests.write',
    'imports.apply',
    'imports.preview',
    'imports.rollback',
    'inbox.read',
    'inbox.write',
    'media.read',
    'media.write',
    'members.read',
    'payments.record',
    'payments.refund',
    'planning.read',
    'planning.write',
    'project.read',
    'search.use',
    'seating.read',
    'seating.write',
    'sensitive_documents.read',
    'tasks.read',
    'tasks.write',
    'timeline.read',
    'timeline.write',
    'vendors.read',
    'vendors.write',
    'venues.read',
    'venues.write'
  ]::text[],
  'editor receives exactly the normative built-in permission set with no extra grants'
);

select is(
  (
    select array_agg(permission_key order by permission_key)
    from public.app_role_permissions
    where role_key = 'viewer'
  ),
  array[
    'access.read',
    'decisions.read',
    'documents.read',
    'exports.standard',
    'media.read',
    'planning.read',
    'project.read',
    'search.use',
    'tasks.read',
    'timeline.read',
    'vendors.read',
    'venues.read'
  ]::text[],
  'viewer receives exactly the conservative normative permission set with no extra grants'
);

select ok(
  not public.role_has_permission('unknown-role', 'project.read')
  and not public.role_has_permission('owner', 'unknown.permission'),
  'unknown role or permission fails closed'
);

select ok(
  not has_table_privilege('anon', 'public.app_permissions', 'select')
  and not has_table_privilege('authenticated', 'public.app_permissions', 'select')
  and not has_table_privilege('anon', 'public.app_roles', 'select')
  and not has_table_privilege('authenticated', 'public.app_roles', 'select')
  and not has_table_privilege('anon', 'public.app_role_permissions', 'select')
  and not has_table_privilege('authenticated', 'public.app_role_permissions', 'select'),
  'authorization metadata is not ordinary client-readable table data'
);

select ok(
  not has_function_privilege('anon', 'public.role_has_permission(text,text)', 'execute')
  and not has_function_privilege('authenticated', 'public.role_has_permission(text,text)', 'execute'),
  'client roles cannot invoke the internal role lookup with a self-supplied role'
);

select is(
  (
    select proconfig
    from pg_catalog.pg_proc
    where oid = 'public.role_has_permission(text,text)'::regprocedure
  ),
  array['search_path=pg_catalog']::text[],
  'security-definer role lookup resolves only through the trusted pg_catalog search path'
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
