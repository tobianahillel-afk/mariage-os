begin;

create extension if not exists pgtap with schema extensions;
select plan(2);

select ok(
  to_regclass('public.interactions') is not null,
  'WP-2.6D red-first: interactions table must exist'
);

select ok(
  to_regprocedure('public.append_venue_interaction(uuid,uuid,uuid,uuid,text,text,text,text,uuid)') is not null,
  'WP-2.6D red-first: one atomic append_venue_interaction command must exist'
);

select * from finish();
rollback;
