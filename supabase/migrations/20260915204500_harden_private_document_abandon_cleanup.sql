-- WP-2.9C / WP29C-AR-005: metadata abandonment is allowed only after
-- every trusted-ingest storage location is proven empty. This trigger is a
-- database backstop for direct RPC calls and races around the Pages cleanup
-- boundary; ordinary browser roles still receive no staging DELETE capability.

create or replace function public.private_document_guard_pending_delete()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if old.upload_status <> 'pending' then
    return old;
  end if;

  if exists (
    select 1
    from storage.objects so
    where so.name = old.storage_path
      and so.bucket_id in ('project-private', 'document-ingest-staging')
  ) then
    raise exception 'private document object still present'
      using errcode = '55000';
  end if;

  return old;
end;
$$;

revoke all on function public.private_document_guard_pending_delete()
from public, anon, authenticated;

drop trigger if exists private_document_guard_pending_delete
on public.documents;

create trigger private_document_guard_pending_delete
before delete on public.documents
for each row
execute function public.private_document_guard_pending_delete();
