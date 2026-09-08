begin;

create extension if not exists pgtap with schema extensions;
select plan(2);

select ok(
  to_regclass('public.contacts') is not null,
  'WP-2.6C red-first: contacts table must exist'
);

select ok(
  to_regprocedure('public.save_venue_contact(uuid,uuid,uuid,bigint,text,text,text,text,text,text)') is not null,
  'WP-2.6C red-first: one atomic save_venue_contact command must exist'
);

select * from finish();
rollback;
