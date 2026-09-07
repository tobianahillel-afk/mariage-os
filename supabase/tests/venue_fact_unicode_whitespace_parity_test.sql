begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '81111111-1111-4111-8111-111111111111',
  'authenticated','authenticated','unicode-parity-owner@example.invalid','',now(),
  '{"provider":"email","providers":["email"]}','{}',now(),now()
);

insert into public.projects(id,name,created_by,updated_by) values (
  '81000000-0000-4000-8000-000000000001',
  'Unicode parity project',
  '81111111-1111-4111-8111-111111111111',
  '81111111-1111-4111-8111-111111111111'
);

insert into public.project_members(
  project_id,user_id,role_key,membership_status,accepted_at,revoked_at
) values (
  '81000000-0000-4000-8000-000000000001',
  '81111111-1111-4111-8111-111111111111',
  'owner','active',now(),null
);

insert into public.venues(
  id,project_id,code,name,status,created_by,updated_by
) values (
  '81000000-0000-4000-8000-000000000011',
  '81000000-0000-4000-8000-000000000001',
  'UP1','Unicode parity venue','research',
  '81111111-1111-4111-8111-111111111111',
  '81111111-1111-4111-8111-111111111111'
);

insert into public.fact_definitions(
  id,project_id,key,label,entity_type,value_type,priority,system_defined,
  created_by,updated_by
) values (
  '81000000-0000-4000-8000-000000000021',
  '81000000-0000-4000-8000-000000000001',
  'unicode_parity_boolean','Unicode parity boolean','venue','boolean','important',false,
  '81111111-1111-4111-8111-111111111111',
  '81111111-1111-4111-8111-111111111111'
);

insert into public.facts(
  id,project_id,target_type,target_id,definition_id,state,retained_value,
  created_by,updated_by
) values (
  '81000000-0000-4000-8000-000000000031',
  '81000000-0000-4000-8000-000000000001',
  'venue','81000000-0000-4000-8000-000000000011',
  '81000000-0000-4000-8000-000000000021','unknown',null,
  '81111111-1111-4111-8111-111111111111',
  '81111111-1111-4111-8111-111111111111'
);

create function pg_temp.try_create_source(target_title text)
returns jsonb language plpgsql as $$
declare result_row jsonb;
begin
  result_row := public.create_venue_fact_source(
    '81000000-0000-4000-8000-000000000001',
    'written_confirmation',
    target_title,
    'https://example.com/unicode-parity',
    'confirmed_for_event',
    now(),
    null,
    'active'
  );
  return result_row;
exception when others then
  return null;
end$$;

create function pg_temp.try_update_source(target_source_id uuid,target_title text)
returns jsonb language plpgsql as $$
declare result_row jsonb;
begin
  result_row := public.update_venue_fact_source(
    '81000000-0000-4000-8000-000000000001',
    target_source_id,
    1,
    'written_confirmation',
    target_title,
    'https://example.com/unicode-parity',
    'confirmed_for_event',
    now(),
    null,
    'active'
  );
  return result_row;
exception when others then
  return null;
end$$;

create function pg_temp.try_append_observation()
returns uuid language plpgsql as $$
declare result_row jsonb;
begin
  result_row := public.append_venue_fact_observation(
    '81000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000031',
    'true'::jsonb,
    'yes',
    'confirmed_for_event',
    'high',
    now(),
    null,
    null
  );
  return (result_row ->> 'id')::uuid;
exception when others then
  return null;
end$$;

create function pg_temp.try_resolve_conflict(
  target_observation_id uuid,
  target_resolution_note text
)
returns boolean language plpgsql as $$
begin
  perform public.resolve_venue_fact_from_observation(
    '81000000-0000-4000-8000-000000000001',
    '81000000-0000-4000-8000-000000000031',
    target_observation_id,
    1,
    'conflict',
    target_resolution_note
  );
  return true;
exception when others then
  return false;
end$$;

create function pg_temp.try_force_conflict_note(target_resolution_note text)
returns boolean language plpgsql security definer as $$
begin
  update public.facts
  set resolution_note = target_resolution_note
  where id = '81000000-0000-4000-8000-000000000031';
  return true;
exception when others then
  return false;
end$$;

select is(
  public.fact_ecmascript_trim(chr(9) || chr(160) || 'Évidence' || chr(160) || chr(9)),
  'Évidence',
  'database canonical trim matches TypeScript trim for TAB and NBSP boundaries'
);
select is(
  public.fact_ecmascript_trim(chr(65279) || 'Texte' || chr(12288)),
  'Texte',
  'database canonical trim covers BOM and ideographic space boundaries'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.create_venue_fact_source_core(uuid,text,text,text,text,timestamp with time zone,text,text)',
    'EXECUTE'
  ),
  'authenticated cannot bypass canonical source create wrapper'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.update_venue_fact_source_core(uuid,uuid,bigint,text,text,text,text,timestamp with time zone,text,text)',
    'EXECUTE'
  ),
  'authenticated cannot bypass canonical source update wrapper'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.resolve_venue_fact_from_observation_core(uuid,uuid,uuid,bigint,text,text)',
    'EXECUTE'
  ),
  'authenticated cannot bypass canonical conflict-resolution wrapper'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  pg_temp.try_create_source(chr(9)),
  null::jsonb,
  'TAB-only source title is rejected at the RPC/database boundary'
);
select is(
  pg_temp.try_create_source(chr(160)),
  null::jsonb,
  'NBSP-only source title is rejected at the RPC/database boundary'
);

select is(
  pg_temp.try_create_source(chr(9) || chr(160) || 'Évidence écrite' || chr(160) || chr(9)) ->> 'title',
  'Évidence écrite',
  'legitimate Unicode source title is canonically trimmed before persistence'
);

select is(
  pg_temp.try_update_source(
    (select id from public.sources where project_id='81000000-0000-4000-8000-000000000001'),
    chr(160)
  ),
  null::jsonb,
  'NBSP-only source title is rejected on update'
);
select is(
  (select title from public.sources where project_id='81000000-0000-4000-8000-000000000001'),
  'Évidence écrite',
  'rejected source update leaves canonical title unchanged'
);
select is(
  (select revision from public.sources where project_id='81000000-0000-4000-8000-000000000001'),
  1::bigint,
  'rejected source update leaves source revision unchanged'
);

select isnt(
  pg_temp.try_append_observation(),
  null::uuid,
  'active typed observation exists for conflict-resolution parity checks'
);

select ok(
  not pg_temp.try_resolve_conflict(
    (select id from public.fact_observations where fact_id='81000000-0000-4000-8000-000000000031'),
    chr(9)
  ),
  'TAB-only conflict rationale is rejected'
);
select ok(
  not pg_temp.try_resolve_conflict(
    (select id from public.fact_observations where fact_id='81000000-0000-4000-8000-000000000031'),
    chr(160)
  ),
  'NBSP-only conflict rationale is rejected'
);
select is(
  (select state from public.facts where id='81000000-0000-4000-8000-000000000031'),
  'unknown',
  'rejected blank conflict rationale does not mutate fact state'
);
select is(
  (select revision from public.facts where id='81000000-0000-4000-8000-000000000031'),
  1::bigint,
  'rejected blank conflict rationale does not mutate fact revision'
);
select is(
  (select retained_observation_id from public.facts where id='81000000-0000-4000-8000-000000000031'),
  null::uuid,
  'rejected blank conflict rationale does not attach retained evidence'
);
select is(
  (select resolution_note from public.facts where id='81000000-0000-4000-8000-000000000031'),
  null::text,
  'rejected blank conflict rationale does not persist rationale'
);
select is(
  (select resolved_by from public.facts where id='81000000-0000-4000-8000-000000000031'),
  null::uuid,
  'rejected blank conflict rationale does not persist resolution actor'
);

select ok(
  pg_temp.try_resolve_conflict(
    (select id from public.fact_observations where fact_id='81000000-0000-4000-8000-000000000031'),
    'Conflit – vérifier auprès du lieu'
  ),
  'legitimate nonblank Unicode conflict rationale succeeds'
);
select is(
  (select state from public.facts where id='81000000-0000-4000-8000-000000000031'),
  'conflict',
  'valid conflict resolution persists conflict state'
);
select is(
  (select retained_value from public.facts where id='81000000-0000-4000-8000-000000000031'),
  'true'::jsonb,
  'valid conflict resolution retains the selected observation value'
);
select is(
  (select resolution_note from public.facts where id='81000000-0000-4000-8000-000000000031'),
  'Conflit – vérifier auprès du lieu',
  'valid conflict rationale is preserved verbatim'
);
select is(
  (select revision from public.facts where id='81000000-0000-4000-8000-000000000031'),
  2::bigint,
  'valid conflict resolution advances fact revision exactly once'
);

reset role;

select ok(
  not pg_temp.try_force_conflict_note(chr(160)),
  'table integrity rejects a privileged NBSP-only conflict rationale write-around'
);
select is(
  (select resolution_note from public.facts where id='81000000-0000-4000-8000-000000000031'),
  'Conflit – vérifier auprès du lieu',
  'rejected privileged blank-rationale write-around preserves prior rationale'
);
select is(
  (select revision from public.facts where id='81000000-0000-4000-8000-000000000031'),
  2::bigint,
  'rejected privileged blank-rationale write-around preserves prior revision'
);

select * from finish();
rollback;
