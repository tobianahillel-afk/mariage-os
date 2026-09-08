begin;

create extension if not exists pgtap with schema extensions;
select plan(1);

select ok(
  position(
    'for update'
    in lower(pg_get_functiondef('public.venue_availability_assert_writer(uuid)'::regprocedure))
  ) > 0
  and position(
    'for update'
    in lower(pg_get_functiondef('public.venue_availability_assert_writer(uuid)'::regprocedure))
  ) < position(
    'has_project_permission'
    in lower(pg_get_functiondef('public.venue_availability_assert_writer(uuid)'::regprocedure))
  ),
  'availability append locks the project before live venues.write permission evaluation'
);

select * from finish();
rollback;
