begin;

create extension if not exists pgtap with schema extensions;
select plan(3);

select ok(
  to_regprocedure(
    'public.venue_private_media_manage_core(text,uuid,uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,integer,integer,uuid,text,integer)'
  ) is not null,
  'MED-006 internal lifecycle core exists behind the public receipt wrapper'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.venue_private_media_manage_core(text,uuid,uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,integer,integer,uuid,text,integer)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.venue_private_media_manage_core(text,uuid,uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,integer,integer,uuid,text,integer)',
    'execute'
  ),
  'internal lifecycle core is not directly executable by client roles'
);

select is(
  (
    select proconfig
    from pg_catalog.pg_proc
    where oid = 'public.manage_venue_private_media(text,uuid,uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,integer,integer,uuid,text,integer)'::regprocedure
  ),
  array['search_path=pg_catalog']::text[],
  'MED-006 public lifecycle wrapper retains a fixed trusted search_path'
);

select * from finish();
rollback;
