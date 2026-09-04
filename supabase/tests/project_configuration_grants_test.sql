begin;

create extension if not exists pgtap with schema extensions;

select plan(3);

select ok(
  has_table_privilege('authenticated', 'public.wedding_date_options', 'select')
  and has_table_privilege('authenticated', 'public.project_reference_origins', 'select')
  and has_table_privilege('authenticated', 'public.user_project_preferences', 'select')
  and has_table_privilege('authenticated', 'public.project_rsvp_intent_settings', 'select')
  and not has_table_privilege('anon', 'public.wedding_date_options', 'select')
  and not has_table_privilege('anon', 'public.project_reference_origins', 'select')
  and not has_table_privilege('anon', 'public.user_project_preferences', 'select')
  and not has_table_privilege('anon', 'public.project_rsvp_intent_settings', 'select')
  and not has_table_privilege('authenticated', 'public.wedding_date_options', 'insert')
  and not has_table_privilege('authenticated', 'public.wedding_date_options', 'update')
  and not has_table_privilege('authenticated', 'public.wedding_date_options', 'delete')
  and not has_table_privilege('authenticated', 'public.project_reference_origins', 'insert')
  and not has_table_privilege('authenticated', 'public.project_reference_origins', 'update')
  and not has_table_privilege('authenticated', 'public.project_reference_origins', 'delete')
  and not has_table_privilege('authenticated', 'public.user_project_preferences', 'insert')
  and not has_table_privilege('authenticated', 'public.user_project_preferences', 'update')
  and not has_table_privilege('authenticated', 'public.user_project_preferences', 'delete')
  and not has_table_privilege('authenticated', 'public.project_rsvp_intent_settings', 'insert')
  and not has_table_privilege('authenticated', 'public.project_rsvp_intent_settings', 'update')
  and not has_table_privilege('authenticated', 'public.project_rsvp_intent_settings', 'delete')
  and not has_table_privilege('anon', 'public.wedding_date_options', 'insert')
  and not has_table_privilege('anon', 'public.project_reference_origins', 'insert')
  and not has_table_privilege('anon', 'public.user_project_preferences', 'insert')
  and not has_table_privilege('anon', 'public.project_rsvp_intent_settings', 'insert'),
  'configuration tables expose authenticated reads only and no anonymous or direct client writes'
);

select ok(
  has_function_privilege('authenticated', 'public.update_project_settings(uuid,text,text,text,text,integer)', 'execute')
  and has_function_privilege('authenticated', 'public.create_wedding_date_option(uuid,date,text,text)', 'execute')
  and has_function_privilege('authenticated', 'public.update_wedding_date_option(uuid,uuid,date,text,text,text)', 'execute')
  and has_function_privilege('authenticated', 'public.select_wedding_date_option(uuid,uuid)', 'execute')
  and has_function_privilege('authenticated', 'public.save_project_reference_origin(uuid,uuid,text,text,numeric,numeric,boolean,integer)', 'execute')
  and has_function_privilege('authenticated', 'public.delete_project_reference_origin(uuid,uuid)', 'execute')
  and has_function_privilege('authenticated', 'public.upsert_user_project_preferences(uuid,jsonb)', 'execute')
  and has_function_privilege('authenticated', 'public.upsert_project_rsvp_intent_settings(uuid,text,date,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,text,text)', 'execute')
  and not has_function_privilege('anon', 'public.update_project_settings(uuid,text,text,text,text,integer)', 'execute')
  and not has_function_privilege('anon', 'public.create_wedding_date_option(uuid,date,text,text)', 'execute')
  and not has_function_privilege('anon', 'public.update_wedding_date_option(uuid,uuid,date,text,text,text)', 'execute')
  and not has_function_privilege('anon', 'public.select_wedding_date_option(uuid,uuid)', 'execute')
  and not has_function_privilege('anon', 'public.save_project_reference_origin(uuid,uuid,text,text,numeric,numeric,boolean,integer)', 'execute')
  and not has_function_privilege('anon', 'public.delete_project_reference_origin(uuid,uuid)', 'execute')
  and not has_function_privilege('anon', 'public.upsert_user_project_preferences(uuid,jsonb)', 'execute')
  and not has_function_privilege('anon', 'public.upsert_project_rsvp_intent_settings(uuid,text,date,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,text,text)', 'execute'),
  'all eight configuration commands are authenticated-only execution surfaces'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_proc p
    where p.oid in (
      'public.update_project_settings(uuid,text,text,text,text,integer)'::regprocedure,
      'public.create_wedding_date_option(uuid,date,text,text)'::regprocedure,
      'public.update_wedding_date_option(uuid,uuid,date,text,text,text)'::regprocedure,
      'public.select_wedding_date_option(uuid,uuid)'::regprocedure,
      'public.save_project_reference_origin(uuid,uuid,text,text,numeric,numeric,boolean,integer)'::regprocedure,
      'public.delete_project_reference_origin(uuid,uuid)'::regprocedure,
      'public.upsert_user_project_preferences(uuid,jsonb)'::regprocedure,
      'public.upsert_project_rsvp_intent_settings(uuid,text,date,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,text,text)'::regprocedure
    )
      and p.prosecdef
      and p.proconfig = array['search_path=pg_catalog']::text[]
  ),
  8,
  'all eight security-definer configuration commands use only trusted pg_catalog search path'
);

select * from finish();
rollback;
