begin;

create extension if not exists pgtap with schema extensions;
select plan(3);

select ok(
  to_regclass('public.media') is not null,
  'WP-2.8A red-first: media table must exist'
);

select ok(
  to_regclass('public.media_links') is not null,
  'WP-2.8A red-first: media_links table must exist'
);

select ok(
  to_regprocedure('public.create_venue_remote_media(uuid,uuid,uuid,uuid,text,text,text,text)') is not null,
  'WP-2.8A red-first: one atomic create_venue_remote_media command must create/replay media plus Venue gallery link'
);

select * from finish();
rollback;
