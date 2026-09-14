-- WP-2.9C AR-005: make private Document binary ingestion a trusted-server
-- boundary. Authenticated clients keep Media upload behavior, but cannot create
-- Document originals directly; pending -> ready additionally requires a
-- service-only attestation bound to the reserved digest and byte size.

create table public.private_document_ingest_attestations (
  project_id uuid not null,
  document_id uuid not null,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  size_bytes bigint not null check (size_bytes between 1 and 25000000),
  verified_at timestamptz not null default now(),
  primary key (project_id, document_id),
  foreign key (project_id, document_id)
    references public.documents(project_id, id)
    on update restrict
    on delete cascade
);

alter table public.private_document_ingest_attestations enable row level security;

revoke all on table public.private_document_ingest_attestations
from public, anon, authenticated;

create or replace function public.attest_private_document_ingest(
  target_project_id uuid,
  target_document_id uuid,
  target_sha256 text,
  target_size_bytes bigint
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  reserved_document public.documents%rowtype;
  object_present boolean;
begin
  if target_project_id is null
    or target_document_id is null
    or target_sha256 is null
    or target_sha256 !~ '^[0-9a-f]{64}$'
    or target_size_bytes is null
    or target_size_bytes not between 1 and 25000000 then
    raise exception 'private document object unavailable' using errcode = '55000';
  end if;

  select d.* into reserved_document
  from public.documents d
  where d.project_id = target_project_id
    and d.id = target_document_id
  for update;

  if not found
    or reserved_document.upload_status <> 'pending'
    or reserved_document.deleted_at is not null
    or reserved_document.remote_url is not null
    or reserved_document.classification <> 'private'
    or reserved_document.sha256 <> target_sha256
    or reserved_document.size_bytes <> target_size_bytes
    or reserved_document.storage_path <> (
      target_project_id::text || '/documents/' || target_document_id::text || '/original'
    ) then
    raise exception 'private document object unavailable' using errcode = '55000';
  end if;

  select exists (
    select 1
    from storage.objects so
    where so.bucket_id = 'project-private'
      and so.name = reserved_document.storage_path
  ) into object_present;

  if not object_present then
    raise exception 'private document object unavailable' using errcode = '55000';
  end if;

  insert into public.private_document_ingest_attestations (
    project_id,
    document_id,
    sha256,
    size_bytes
  ) values (
    target_project_id,
    target_document_id,
    target_sha256,
    target_size_bytes
  )
  on conflict (project_id, document_id) do nothing;

  perform 1
  from public.private_document_ingest_attestations attestation
  where attestation.project_id = target_project_id
    and attestation.document_id = target_document_id
    and attestation.sha256 = target_sha256
    and attestation.size_bytes = target_size_bytes;

  if not found then
    raise exception 'private document object unavailable' using errcode = '55000';
  end if;
end;
$$;

revoke all on function public.attest_private_document_ingest(
  uuid, uuid, text, bigint
) from public, anon, authenticated;
grant execute on function public.attest_private_document_ingest(
  uuid, uuid, text, bigint
) to service_role;

create or replace function public.private_document_require_trusted_ingest()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if old.upload_status = 'pending' and new.upload_status = 'ready' then
    perform 1
    from public.private_document_ingest_attestations attestation
    where attestation.project_id = new.project_id
      and attestation.document_id = new.id
      and attestation.sha256 = new.sha256
      and attestation.size_bytes = new.size_bytes;

    if not found then
      raise exception 'private document object unavailable' using errcode = '55000';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.private_document_require_trusted_ingest()
from public, anon, authenticated;

create trigger documents_require_trusted_ingest_before_ready
before update of upload_status on public.documents
for each row
execute function public.private_document_require_trusted_ingest();

-- Preserve the accepted Media INSERT branch exactly while removing browser
-- authority for /documents/<document_id>/original.
drop policy if exists project_private_media_insert on storage.objects;

create policy project_private_media_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-private'
  and exists (
    select 1
    from public.media reserved_media
    where reserved_media.project_id = substring(
      storage.objects.name
      from '^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/media/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
    )::uuid
      and reserved_media.storage_path = storage.objects.name
      and reserved_media.remote_url is null
      and reserved_media.upload_status = 'pending'
      and public.has_project_permission(
        reserved_media.project_id,
        'media.write'
      )
  )
);

comment on table public.private_document_ingest_attestations is
  'WP-2.9C server-only proof that a pending private Document object was independently verified against its reserved SHA-256 and byte size.';
comment on function public.attest_private_document_ingest(
  uuid, uuid, text, bigint
) is
  'WP-2.9C service-role-only attestation boundary used after trusted exact-byte verification and privileged Storage ingestion.';
comment on policy project_private_media_insert on storage.objects is
  'WP-2.9C: preserve accepted authenticated Media upload only; private Document originals are ingested by the trusted server boundary.';
