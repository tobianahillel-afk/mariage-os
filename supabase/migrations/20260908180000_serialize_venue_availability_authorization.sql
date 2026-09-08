create or replace function public.venue_availability_assert_writer(
  target_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null then
    raise exception 'venue availability unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue availability unavailable' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.venue_availability_assert_writer(uuid)
from public, anon, authenticated;
