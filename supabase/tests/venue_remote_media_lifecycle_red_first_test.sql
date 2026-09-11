begin;

create extension if not exists pgtap with schema extensions;
select plan(2);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'media'
      and column_name = 'deleted_at'
      and data_type = 'timestamp with time zone'
  ),
  'WP-2.8C red-first: media.deleted_at timestamptz must persist recoverable remote-media lifecycle'
);

select ok(
  to_regprocedure(
    'public.transition_venue_remote_media_lifecycle(uuid,uuid,text,bigint)'
  ) is not null,
  'WP-2.8C red-first: protected remote-media soft-delete/restore lifecycle command must exist'
);

select * from finish();
rollback;
