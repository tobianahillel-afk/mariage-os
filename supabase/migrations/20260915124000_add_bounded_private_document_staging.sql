-- WP-2.9C / ADR-0009: bounded browser ingress for private PDF documents.
-- The browser may INSERT only the exact pending reservation path. It receives no
-- ordinary read/update/delete policy on this bucket; promotion and cleanup are
-- trusted server responsibilities.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'document-ingest-staging',
  'document-ingest-staging',
  false,
  25000000,
  array['application/pdf']::text[]
);

create policy document_ingest_staging_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'document-ingest-staging'
  and exists (
    select 1
    from public.documents d
    where d.storage_path = storage.objects.name
      and d.upload_status = 'pending'
      and d.deleted_at is null
      and d.remote_url is null
      and d.classification = 'private'
      and d.mime_type = 'application/pdf'
      and d.size_bytes between 1 and 25000000
      and public.has_project_permission(d.project_id, 'documents.write')
  )
);
