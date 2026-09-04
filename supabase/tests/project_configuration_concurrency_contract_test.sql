begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

select ok(
  position('for update' in lower(pg_get_functiondef('public.update_project_settings(uuid,text,text,text,text,integer)'::regprocedure)))
  < position('has_project_permission' in lower(pg_get_functiondef('public.update_project_settings(uuid,text,text,text,text,integer)'::regprocedure))),
  'project settings lock project before live permission evaluation'
);

select ok(
  position('for update' in lower(pg_get_functiondef('public.create_wedding_date_option(uuid,date,text,text)'::regprocedure)))
  < position('has_project_permission' in lower(pg_get_functiondef('public.create_wedding_date_option(uuid,date,text,text)'::regprocedure))),
  'date creation locks project before live permission evaluation'
);

select ok(
  position('for update' in lower(pg_get_functiondef('public.update_wedding_date_option(uuid,uuid,date,text,text,text)'::regprocedure)))
  < position('has_project_permission' in lower(pg_get_functiondef('public.update_wedding_date_option(uuid,uuid,date,text,text,text)'::regprocedure))),
  'date update locks project before live permission evaluation'
);

select ok(
  position('for update' in lower(pg_get_functiondef('public.select_wedding_date_option(uuid,uuid)'::regprocedure)))
  < position('has_project_permission' in lower(pg_get_functiondef('public.select_wedding_date_option(uuid,uuid)'::regprocedure))),
  'date selection locks project before live permission evaluation'
);

select ok(
  position('for update' in lower(pg_get_functiondef('public.save_project_reference_origin(uuid,uuid,text,text,numeric,numeric,boolean,integer)'::regprocedure)))
  < position('has_project_permission' in lower(pg_get_functiondef('public.save_project_reference_origin(uuid,uuid,text,text,numeric,numeric,boolean,integer)'::regprocedure))),
  'origin save locks project before live permission evaluation'
);

select ok(
  position('for update' in lower(pg_get_functiondef('public.delete_project_reference_origin(uuid,uuid)'::regprocedure)))
  < position('has_project_permission' in lower(pg_get_functiondef('public.delete_project_reference_origin(uuid,uuid)'::regprocedure))),
  'origin delete locks project before live permission evaluation'
);

select ok(
  position('for update' in lower(pg_get_functiondef('public.upsert_user_project_preferences(uuid,jsonb)'::regprocedure)))
  < position('has_project_permission' in lower(pg_get_functiondef('public.upsert_user_project_preferences(uuid,jsonb)'::regprocedure))),
  'personal preference upsert locks project before live membership/permission evaluation'
);

select ok(
  position('for update' in lower(pg_get_functiondef('public.upsert_project_rsvp_intent_settings(uuid,text,date,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,text,text)'::regprocedure)))
  < position('has_project_permission' in lower(pg_get_functiondef('public.upsert_project_rsvp_intent_settings(uuid,text,date,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,text,text)'::regprocedure))),
  'RSVP intent upsert locks project before live permission evaluation'
);

select * from finish();
rollback;
