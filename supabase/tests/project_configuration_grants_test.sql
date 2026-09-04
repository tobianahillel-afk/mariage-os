begin;

create extension if not exists pgtap with schema extensions;

select plan(3);

with target_tables(table_name) as (
  values
    ('public.wedding_date_options'),
    ('public.project_reference_origins'),
    ('public.user_project_preferences'),
    ('public.project_rsvp_intent_settings')
),
client_roles(role_name) as (
  values ('anon'), ('authenticated')
),
table_privileges(privilege_name) as (
  values
    ('select'),
    ('insert'),
    ('update'),
    ('delete'),
    ('truncate'),
    ('references'),
    ('trigger')
)
select ok(
  bool_and(
    case
      when role_name = 'authenticated' and privilege_name = 'select'
        then has_table_privilege(role_name, table_name, privilege_name)
      else not has_table_privilege(role_name, table_name, privilege_name)
    end
  ),
  'configuration tables expose only authenticated SELECT across the complete PostgreSQL table-privilege matrix'
)
from target_tables
cross join client_roles
cross join table_privileges;

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
