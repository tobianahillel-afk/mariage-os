begin;

create extension if not exists pgtap with schema extensions;
select plan(2);

select has_table(
  'public',
  'venue_access_routes',
  'venue access route history table exists'
);

select has_function(
  'public',
  'append_venue_access_route',
  array[
    'uuid', 'uuid', 'uuid', 'uuid', 'text', 'text', 'text', 'text',
    'integer', 'integer', 'integer', 'text', 'uuid', 'text'
  ],
  'atomic venue access route append command exists'
);

select * from finish();
rollback;
