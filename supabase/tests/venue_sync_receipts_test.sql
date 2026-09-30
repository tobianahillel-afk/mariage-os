begin;

create extension if not exists pgtap with schema extensions;
select plan(22);

select has_table('public', 'sync_mutation_receipts', 'sync receipt table exists');
select col_is_pk('public', 'sync_mutation_receipts', 'operation_id', 'operation id is the receipt key');
select columns_are(
  'public', 'sync_mutation_receipts',
  array['operation_id','project_id','user_id','device_id','entity_type','entity_id','result_revision','created_at'],
  'sync receipt schema matches frozen V1 contract'
);
select ok((select relrowsecurity from pg_class where oid='public.sync_mutation_receipts'::regclass), 'receipt table has RLS enabled');
select ok(
  not has_table_privilege('authenticated','public.sync_mutation_receipts','select')
  and not has_table_privilege('authenticated','public.sync_mutation_receipts','insert')
  and not has_table_privilege('authenticated','public.sync_mutation_receipts','update')
  and not has_table_privilege('authenticated','public.sync_mutation_receipts','delete'),
  'browser role has no direct receipt-table access'
);
select has_function('public','update_venue_core',array['uuid','uuid','bigint','text','text','text','text','uuid','uuid'],'core update accepts operation/device ids');
select has_function('public','transition_venue_status',array['uuid','uuid','text','text','bigint','uuid','uuid'],'lifecycle transition accepts operation/device ids');
select ok(
  to_regprocedure('public.update_venue_core(uuid,uuid,bigint,text,text,text,text)') is null
  and to_regprocedure('public.transition_venue_status(uuid,uuid,text,text,bigint)') is null,
  'non-receipt mutation signatures are removed'
);

insert into auth.users (
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
('00000000-0000-0000-0000-000000000000','11111111-1111-4111-8111-111111111111','authenticated','authenticated','receipt-owner@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','22222222-2222-4222-8222-222222222222','authenticated','authenticated','receipt-editor@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','33333333-3333-4333-8333-333333333333','authenticated','authenticated','receipt-owner-b@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());

insert into public.projects (id,name,created_by,updated_by) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Receipt Project A','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Receipt Project B','33333333-3333-4333-8333-333333333333','33333333-3333-4333-8333-333333333333');

insert into public.project_members (project_id,user_id,role_key,membership_status,accepted_at) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','owner','active',now()),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222','editor','active',now()),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','33333333-3333-4333-8333-333333333333','owner','active',now());

insert into public.venues (id,project_id,name,status,created_by,updated_by) values
('a1000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Receipt Venue A','research','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111'),
('b1000000-0000-4000-8000-000000000001','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Receipt Venue B','research','33333333-3333-4333-8333-333333333333','33333333-3333-4333-8333-333333333333');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);

select lives_ok($select public.update_venue_core(
'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000001',
1,'Receipt Venue Renamed',null,null,'Paris',
'71000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001')$$,'first core update succeeds');
select is((select revision from public.venues where id='a1000000-0000-4000-8000-000000000001'),2::bigint,'core update increments once');
select lives_ok($select public.update_venue_core(
'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000001',
1,'Receipt Venue Renamed',null,null,'Paris',
'71000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001')$$,'same core operation retry survives stale base');
select is((select revision from public.venues where id='a1000000-0000-4000-8000-000000000001'),2::bigint,'core retry does not reapply');
reset role;
select is((select result_revision from public.sync_mutation_receipts where operation_id='71000000-0000-4000-8000-000000000001'),2::bigint,'core receipt stores revision');
select throws_ok($$select public.update_venue_core(
'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000001',
1,'Different Intent',null,null,'Paris',
'71000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001')$$,
'22023','venue update unavailable','same operation id cannot acknowledge a different core intent');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);

select lives_ok($select public.transition_venue_status(
'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000001',
'shortlist',null,2,'72000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001')$$,'first lifecycle transition succeeds');
select lives_ok($select public.transition_venue_status(
'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000001',
'shortlist',null,2,'72000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001')$$,'same lifecycle operation retry survives response loss');
select is((select count(*)::integer from public.activity_log where operation_id='72000000-0000-4000-8000-000000000001'),1,'lifecycle retry does not duplicate history');
reset role;
select is((select result_revision from public.sync_mutation_receipts where operation_id='72000000-0000-4000-8000-000000000001'),3::bigint,'lifecycle receipt stores revision');
select throws_ok($$select public.transition_venue_status(
'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000001',
'contacted',null,2,'72000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001')$$,
'22023','venue transition unavailable','same operation id cannot acknowledge a different lifecycle intent');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);

select throws_ok($select public.transition_venue_status(
'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000001',
'contacted',null,3,'71000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001')$$,
'22023','venue transition unavailable','operation id cannot cross command classes');

select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
select throws_ok($select public.update_venue_core(
'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1000000-0000-4000-8000-000000000001',
3,'Editor Reuse',null,null,null,
'71000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001')$$,
'22023','venue update unavailable','receipt cannot be replayed by another authorized user');

select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select throws_ok($select public.update_venue_core(
'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','b1000000-0000-4000-8000-000000000001',
1,'Cross Project',null,null,null,
'73000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000001')$$,
'42501','venue update unavailable','live authorization denies cross-project receipt mutation');

reset role;
select * from finish();
rollback;
