begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

select has_table(
  'public',
  'sync_mutation_receipts',
  'WP-2.10 creates the canonical sync mutation receipt table'
);

select ok(
  (select relrowsecurity from pg_class where oid = to_regclass('public.sync_mutation_receipts')),
  'sync mutation receipts have RLS enabled'
);

select ok(
  not has_table_privilege('authenticated', 'public.sync_mutation_receipts', 'select')
  and not has_table_privilege('authenticated', 'public.sync_mutation_receipts', 'insert')
  and not has_table_privilege('authenticated', 'public.sync_mutation_receipts', 'update')
  and not has_table_privilege('authenticated', 'public.sync_mutation_receipts', 'delete'),
  'browser clients have no direct receipt-table access'
);

select has_function(
  'public',
  'update_venue_core',
  array['uuid','uuid','bigint','text','text','text','text','uuid','uuid'],
  'venue core update accepts stable operation and device ids'
);

select has_function(
  'public',
  'transition_venue_status',
  array['uuid','uuid','text','text','bigint','uuid','uuid'],
  'venue lifecycle transition accepts stable operation and device ids'
);

select ok(
  to_regprocedure('public.update_venue_core(uuid,uuid,bigint,text,text,text,text)') is null,
  'non-receipt venue core update signature is removed'
);

select ok(
  to_regprocedure('public.transition_venue_status(uuid,uuid,text,text,bigint)') is null,
  'non-receipt venue lifecycle signature is removed'
);

select col_is_pk(
  'public',
  'sync_mutation_receipts',
  'operation_id',
  'operation id is the receipt idempotency key'
);

select columns_are(
  'public',
  'sync_mutation_receipts',
  array[
    'operation_id','project_id','user_id','device_id','entity_type',
    'entity_id','result_revision','created_at'
  ],
  'receipt schema matches the frozen V1 physical contract'
);

select * from finish();
rollback;
