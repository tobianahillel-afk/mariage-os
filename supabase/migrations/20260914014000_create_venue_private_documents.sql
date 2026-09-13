-- WP-2.9A: ordinary private PDF documents, Venue links, recoverable metadata
-- lifecycle, protected command boundary and exact private Storage authorization.

create table public.documents (
  id uuid primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  document_type text not null check (
    document_type = public.fact_ecmascript_trim(document_type)
    and char_length(document_type) between 1 and 120
    and document_type !~ '[[:cntrl:]]'
  ),
  title text not null check (
    title = public.fact_ecmascript_trim(title)
    and char_length(title) between 1 and 500
    and title !~ '[[:cntrl:]]'
  ),
  storage_path text not null,
  remote_url text null,
  original_filename text not null check (
    char_length(original_filename) between 1 and 512
    and original_filename !~ '[[:cntrl:]]'
    and position('/' in original_filename) = 0
    and position(chr(92) in original_filename) = 0
    and lower(original_filename) ~ '\.pdf$'
  ),
  mime_type text not null check (mime_type = 'application/pdf'),
  size_bytes bigint not null check (size_bytes between 1 and 25000000),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  classification text not null default 'private' check (classification = 'private'),
  upload_status text not null check (upload_status in ('pending', 'ready')),
  source_id uuid null,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id),
  revision bigint not null default 1 check (revision > 0),
  unique (project_id, id),
  foreign key (project_id, source_id)
    references public.sources(project_id, id)
    on update restrict
    on delete restrict,
  constraint documents_wp29a_private_state check (
    remote_url is null
    and storage_path = (
      project_id::text || '/documents/' || id::text || '/original'
    )
    and classification = 'private'
    and (deleted_at is null or upload_status = 'ready')
  )
);

create index documents_project_active_idx
  on public.documents (project_id, created_at desc, id asc)
  where upload_status = 'ready' and deleted_at is null;

create index documents_project_sha_idx
  on public.documents (project_id, sha256, id)
  where upload_status = 'ready';

create table public.document_links (
  id uuid primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  document_id uuid not null,
  target_type text not null check (target_type = 'venue'),
  target_id uuid not null,
  relationship_type text null check (relationship_type is null),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  unique (project_id, id),
  unique (project_id, document_id, target_type, target_id),
  foreign key (project_id, document_id)
    references public.documents(project_id, id)
    on update restrict
    on delete cascade,
  foreign key (project_id, target_id)
    references public.venues(project_id, id)
    on update restrict
    on delete cascade
);

create index document_links_venue_idx
  on public.document_links (
    project_id, target_id, target_type, created_at desc, id asc
  );

alter table public.documents enable row level security;
alter table public.document_links enable row level security;

revoke all on table public.documents from public, anon, authenticated;
revoke all on table public.document_links from public, anon, authenticated;
grant select on table public.documents to authenticated;
grant select on table public.document_links to authenticated;

create policy documents_select_authorized
on public.documents
for select
to authenticated
using (
  public.has_project_permission(project_id, 'documents.write')
  or (
    upload_status = 'ready'
    and deleted_at is null
    and public.has_project_permission(project_id, 'documents.read')
  )
);

create policy document_links_select_authorized
on public.document_links
for select
to authenticated
using (
  exists (
    select 1
    from public.documents d
    where d.project_id = document_links.project_id
      and d.id = document_links.document_id
      and (
        public.has_project_permission(d.project_id, 'documents.write')
        or (
          d.upload_status = 'ready'
          and d.deleted_at is null
          and public.has_project_permission(d.project_id, 'documents.read')
        )
      )
  )
);

create unique index activity_log_private_document_operation_unique_idx
  on public.activity_log (project_id, event_type, operation_id)
  where operation_id is not null
    and event_type in (
      'private_document_reserve_upload',
      'private_document_finalize_upload',
      'private_document_abandon_upload',
      'private_document_link_venue',
      'private_document_unlink_venue',
      'private_document_soft_delete',
      'private_document_restore'
    );

create or replace function public.private_document_assert_writer(
  target_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null then
    raise exception 'private document unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'documents.write') then
    raise exception 'private document unavailable' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.private_document_assert_writer(uuid)
from public, anon, authenticated;

create or replace function public.private_document_replay_receipt(
  target_project_id uuid,
  target_event_type text,
  target_operation_id uuid,
  target_document_id uuid,
  target_semantic_payload jsonb
)
returns jsonb
language plpgsql
set search_path = pg_catalog
as $$
declare
  existing_operation public.activity_log%rowtype;
  stored_receipt jsonb;
begin
  select al.* into existing_operation
  from public.activity_log al
  where al.project_id = target_project_id
    and al.event_type = target_event_type
    and al.operation_id = target_operation_id
  limit 1;

  if not found then
    return null;
  end if;

  if existing_operation.entity_id is distinct from target_document_id
    or existing_operation.metadata_json -> 'semanticPayload'
      is distinct from target_semantic_payload then
    raise exception 'private document conflict' using errcode = '23505';
  end if;

  stored_receipt := existing_operation.metadata_json -> 'receipt';
  if stored_receipt is null or jsonb_typeof(stored_receipt) <> 'object' then
    raise exception 'private document unavailable' using errcode = '55000';
  end if;

  return stored_receipt || jsonb_build_object('replayed', true);
end;
$$;

revoke all on function public.private_document_replay_receipt(
  uuid, text, uuid, uuid, jsonb
) from public, anon, authenticated;

create or replace function public.private_document_record_operation(
  target_project_id uuid,
  target_event_type text,
  target_operation_id uuid,
  target_document_id uuid,
  target_semantic_payload jsonb,
  target_receipt jsonb
)
returns void
language plpgsql
set search_path = pg_catalog
as $$
begin
  insert into public.activity_log (
    project_id,
    actor_user_id,
    event_type,
    entity_type,
    entity_id,
    summary_key,
    metadata_json,
    operation_id
  ) values (
    target_project_id,
    auth.uid(),
    target_event_type,
    'document',
    target_document_id,
    target_event_type,
    jsonb_build_object(
      'semanticPayload', target_semantic_payload,
      'receipt', target_receipt
    ),
    target_operation_id
  );
end;
$$;

revoke all on function public.private_document_record_operation(
  uuid, text, uuid, uuid, jsonb, jsonb
) from public, anon, authenticated;

create or replace function public.manage_private_document(
  target_action text,
  target_operation_id uuid,
  target_project_id uuid,
  target_document_id uuid,
  target_venue_id uuid default null,
  target_link_id uuid default null,
  target_expected_revision bigint default null,
  target_document_type text default null,
  target_title text default null,
  target_original_filename text default null,
  target_mime_type text default null,
  target_size_bytes bigint default null,
  target_sha256 text default null,
  target_source_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  event_type text;
  normalized_document_type text;
  normalized_title text;
  expected_storage_path text;
  semantic_payload jsonb;
  replay_receipt jsonb;
  current_document public.documents%rowtype;
  saved_document public.documents%rowtype;
  current_link public.document_links%rowtype;
  saved_link public.document_links%rowtype;
  receipt jsonb;
  object_present boolean;
  transition_time timestamptz;
begin
  perform public.private_document_assert_writer(target_project_id);

  if target_operation_id is null
    or target_document_id is null
    or target_action not in (
      'reserve_upload',
      'finalize_upload',
      'abandon_upload',
      'link_venue',
      'unlink_venue',
      'soft_delete',
      'restore'
    ) then
    raise exception 'private document unavailable' using errcode = '22023';
  end if;

  event_type := 'private_document_' || target_action;

  if target_action = 'reserve_upload' then
    normalized_document_type := public.fact_ecmascript_trim(target_document_type);
    normalized_title := public.fact_ecmascript_trim(target_title);

    if target_venue_id is not null
      or target_link_id is not null
      or target_expected_revision is not null
      or normalized_document_type is null
      or char_length(normalized_document_type) not between 1 and 120
      or normalized_document_type ~ '[[:cntrl:]]'
      or normalized_title is null
      or char_length(normalized_title) not between 1 and 500
      or normalized_title ~ '[[:cntrl:]]'
      or target_original_filename is null
      or char_length(target_original_filename) not between 1 and 512
      or target_original_filename ~ '[[:cntrl:]]'
      or position('/' in target_original_filename) > 0
      or position(chr(92) in target_original_filename) > 0
      or lower(target_original_filename) !~ '\.pdf$'
      or target_mime_type is distinct from 'application/pdf'
      or target_size_bytes is null
      or target_size_bytes not between 1 and 25000000
      or target_sha256 is null
      or target_sha256 !~ '^[0-9a-f]{64}$' then
      raise exception 'private document unavailable' using errcode = '22023';
    end if;

    expected_storage_path := target_project_id::text
      || '/documents/' || target_document_id::text || '/original';

    semantic_payload := jsonb_build_object(
      'documentType', normalized_document_type,
      'title', normalized_title,
      'originalFilename', target_original_filename,
      'mimeType', target_mime_type,
      'sizeBytes', target_size_bytes,
      'sha256', target_sha256,
      'sourceId', target_source_id
    );

    replay_receipt := public.private_document_replay_receipt(
      target_project_id,
      event_type,
      target_operation_id,
      target_document_id,
      semantic_payload
    );
    if replay_receipt is not null then
      return replay_receipt;
    end if;

    if target_source_id is not null then
      perform 1
      from public.sources s
      where s.project_id = target_project_id
        and s.id = target_source_id;
      if not found then
        raise exception 'private document unavailable' using errcode = '42501';
      end if;
    end if;

    insert into public.documents (
      id,
      project_id,
      document_type,
      title,
      storage_path,
      remote_url,
      original_filename,
      mime_type,
      size_bytes,
      sha256,
      classification,
      upload_status,
      source_id,
      created_by,
      updated_by
    ) values (
      target_document_id,
      target_project_id,
      normalized_document_type,
      normalized_title,
      expected_storage_path,
      null,
      target_original_filename,
      target_mime_type,
      target_size_bytes,
      target_sha256,
      'private',
      'pending',
      target_source_id,
      auth.uid(),
      auth.uid()
    )
    on conflict (id) do nothing
    returning * into saved_document;

    if not found then
      select d.* into current_document
      from public.documents d
      where d.id = target_document_id;
      if not found or current_document.project_id <> target_project_id then
        raise exception 'private document unavailable' using errcode = '42501';
      end if;
      raise exception 'private document conflict' using errcode = '23505';
    end if;

    receipt := jsonb_build_object(
      'action', target_action,
      'replayed', false,
      'document', to_jsonb(saved_document)
    );

  else
    if target_document_type is not null
      or target_title is not null
      or target_original_filename is not null
      or target_mime_type is not null
      or target_size_bytes is not null
      or target_sha256 is not null
      or target_source_id is not null then
      raise exception 'private document unavailable' using errcode = '22023';
    end if;

    if target_action in ('finalize_upload', 'abandon_upload') then
      if target_venue_id is not null
        or target_link_id is not null
        or target_expected_revision is not null then
        raise exception 'private document unavailable' using errcode = '22023';
      end if;
      semantic_payload := jsonb_build_object('documentId', target_document_id);

    elsif target_action in ('link_venue', 'unlink_venue') then
      if target_venue_id is null
        or target_link_id is null
        or target_expected_revision is null
        or target_expected_revision < 1 then
        raise exception 'private document unavailable' using errcode = '22023';
      end if;
      semantic_payload := jsonb_build_object(
        'documentId', target_document_id,
        'venueId', target_venue_id,
        'linkId', target_link_id,
        'expectedRevision', target_expected_revision
      );

    else
      if target_venue_id is not null
        or target_link_id is not null
        or target_expected_revision is null
        or target_expected_revision < 1 then
        raise exception 'private document unavailable' using errcode = '22023';
      end if;
      semantic_payload := jsonb_build_object(
        'documentId', target_document_id,
        'expectedRevision', target_expected_revision
      );
    end if;

    replay_receipt := public.private_document_replay_receipt(
      target_project_id,
      event_type,
      target_operation_id,
      target_document_id,
      semantic_payload
    );
    if replay_receipt is not null then
      return replay_receipt;
    end if;

    select d.* into current_document
    from public.documents d
    where d.id = target_document_id
    for update;

    if target_action = 'abandon_upload' and not found then
      receipt := jsonb_build_object(
        'action', target_action,
        'replayed', false,
        'projectId', target_project_id,
        'documentId', target_document_id,
        'absent', true
      );
    else
      if not found or current_document.project_id <> target_project_id then
        raise exception 'private document unavailable' using errcode = '42501';
      end if;

      -- Re-check live authorization after the target row lock so a concurrent
      -- membership downgrade/revocation does not become a stale capability.
      perform public.private_document_assert_writer(target_project_id);

      if current_document.storage_path <> (
          target_project_id::text || '/documents/' || target_document_id::text || '/original'
        )
        or current_document.remote_url is not null
        or current_document.classification <> 'private' then
        raise exception 'private document conflict' using errcode = '23505';
      end if;

      if target_action = 'finalize_upload' then
        if current_document.deleted_at is not null then
          raise exception 'private document conflict' using errcode = '23505';
        end if;

        if current_document.upload_status = 'pending' then
          select exists (
            select 1
            from storage.objects so
            where so.bucket_id = 'project-private'
              and so.name = current_document.storage_path
          ) into object_present;

          if not object_present then
            raise exception 'private document object unavailable' using errcode = '55000';
          end if;

          update public.documents
          set upload_status = 'ready',
              updated_at = now(),
              updated_by = auth.uid(),
              revision = revision + 1
          where project_id = target_project_id
            and id = target_document_id
          returning * into saved_document;
        elsif current_document.upload_status = 'ready' then
          saved_document := current_document;
        else
          raise exception 'private document conflict' using errcode = '23505';
        end if;

        receipt := jsonb_build_object(
          'action', target_action,
          'replayed', false,
          'document', to_jsonb(saved_document)
        );

      elsif target_action = 'abandon_upload' then
        if current_document.upload_status <> 'pending'
          or current_document.deleted_at is not null then
          raise exception 'private document conflict' using errcode = '23505';
        end if;

        select exists (
          select 1
          from storage.objects so
          where so.bucket_id = 'project-private'
            and so.name = current_document.storage_path
        ) into object_present;

        if object_present then
          raise exception 'private document object still present' using errcode = '55000';
        end if;

        delete from public.documents
        where project_id = target_project_id
          and id = target_document_id;

        receipt := jsonb_build_object(
          'action', target_action,
          'replayed', false,
          'projectId', target_project_id,
          'documentId', target_document_id,
          'absent', true
        );

      elsif target_action = 'link_venue' then
        if current_document.upload_status <> 'ready'
          or current_document.deleted_at is not null then
          raise exception 'private document conflict' using errcode = '23505';
        end if;

        select dl.* into current_link
        from public.document_links dl
        where dl.id = target_link_id;

        if found then
          if current_link.project_id <> target_project_id then
            raise exception 'private document unavailable' using errcode = '42501';
          end if;
          if current_link.document_id <> target_document_id
            or current_link.target_type <> 'venue'
            or current_link.target_id <> target_venue_id
            or current_link.relationship_type is not null then
            raise exception 'private document conflict' using errcode = '23505';
          end if;
          saved_link := current_link;
          saved_document := current_document;
        else
          perform 1
          from public.venues v
          where v.project_id = target_project_id
            and v.id = target_venue_id;
          if not found then
            raise exception 'private document unavailable' using errcode = '42501';
          end if;

          if current_document.revision <> target_expected_revision then
            raise exception 'stale private document' using errcode = '40001';
          end if;

          insert into public.document_links (
            id, project_id, document_id, target_type, target_id,
            relationship_type, created_by
          ) values (
            target_link_id, target_project_id, target_document_id,
            'venue', target_venue_id, null, auth.uid()
          )
          returning * into saved_link;

          update public.documents
          set updated_at = now(),
              updated_by = auth.uid(),
              revision = revision + 1
          where project_id = target_project_id
            and id = target_document_id
          returning * into saved_document;
        end if;

        receipt := jsonb_build_object(
          'action', target_action,
          'replayed', false,
          'document', to_jsonb(saved_document),
          'link', to_jsonb(saved_link)
        );

      elsif target_action = 'unlink_venue' then
        if current_document.upload_status <> 'ready'
          or current_document.deleted_at is not null then
          raise exception 'private document conflict' using errcode = '23505';
        end if;

        perform 1
        from public.venues v
        where v.project_id = target_project_id
          and v.id = target_venue_id;
        if not found then
          raise exception 'private document unavailable' using errcode = '42501';
        end if;

        select dl.* into current_link
        from public.document_links dl
        where dl.id = target_link_id;

        if not found then
          saved_document := current_document;
          receipt := jsonb_build_object(
            'action', target_action,
            'replayed', false,
            'document', to_jsonb(saved_document),
            'linkId', target_link_id,
            'absent', true
          );
        else
          if current_link.project_id <> target_project_id then
            raise exception 'private document unavailable' using errcode = '42501';
          end if;
          if current_link.document_id <> target_document_id
            or current_link.target_type <> 'venue'
            or current_link.target_id <> target_venue_id
            or current_link.relationship_type is not null then
            raise exception 'private document conflict' using errcode = '23505';
          end if;

          if current_document.revision <> target_expected_revision then
            raise exception 'stale private document' using errcode = '40001';
          end if;

          delete from public.document_links
          where project_id = target_project_id
            and id = target_link_id;

          update public.documents
          set updated_at = now(),
              updated_by = auth.uid(),
              revision = revision + 1
          where project_id = target_project_id
            and id = target_document_id
          returning * into saved_document;

          receipt := jsonb_build_object(
            'action', target_action,
            'replayed', false,
            'document', to_jsonb(saved_document),
            'linkId', target_link_id,
            'absent', true
          );
        end if;

      else
        if current_document.upload_status <> 'ready' then
          raise exception 'private document conflict' using errcode = '23505';
        end if;

        if (target_action = 'soft_delete' and current_document.deleted_at is not null)
          or (target_action = 'restore' and current_document.deleted_at is null) then
          saved_document := current_document;
          receipt := jsonb_build_object(
            'action', target_action,
            'replayed', true,
            'document', to_jsonb(saved_document)
          );
        else
          if current_document.revision <> target_expected_revision then
            raise exception 'stale private document' using errcode = '40001';
          end if;

          transition_time := now();
          update public.documents
          set deleted_at = case
                when target_action = 'soft_delete' then transition_time
                else null
              end,
              updated_at = transition_time,
              updated_by = auth.uid(),
              revision = revision + 1
          where project_id = target_project_id
            and id = target_document_id
          returning * into saved_document;

          receipt := jsonb_build_object(
            'action', target_action,
            'replayed', false,
            'document', to_jsonb(saved_document)
          );
        end if;
      end if;
    end if;
  end if;

  perform public.private_document_record_operation(
    target_project_id,
    event_type,
    target_operation_id,
    target_document_id,
    semantic_payload,
    receipt
  );

  return receipt;
exception
  when unique_violation then
    raise exception 'private document conflict' using errcode = '23505';
end;
$$;

revoke all on function public.manage_private_document(
  text, uuid, uuid, uuid, uuid, uuid, bigint, text, text, text,
  text, bigint, text, uuid
) from public, anon;

grant execute on function public.manage_private_document(
  text, uuid, uuid, uuid, uuid, uuid, bigint, text, text, text,
  text, bigint, text, uuid
) to authenticated;

comment on function public.manage_private_document(
  text, uuid, uuid, uuid, uuid, uuid, bigint, text, text, text,
  text, bigint, text, uuid
) is
  'WP-2.9A protected private PDF document reserve/finalize/recovery/link/delete/restore boundary with live documents.write authorization and replay receipts.';

comment on table public.documents is
  'WP-2.9A ordinary private PDF metadata. Pending rows are recovery state; ready active rows are committed document truth.';
comment on table public.document_links is
  'WP-2.9A document links; Lot 2 exposes only same-project Venue targets and does not duplicate binary objects.';

-- Extend the already-accepted project-private object policies. Media behavior is
-- preserved exactly; Documents adds a second exact-DB-reservation branch.
drop policy if exists project_private_media_select on storage.objects;
drop policy if exists project_private_media_insert on storage.objects;
drop policy if exists project_private_media_update on storage.objects;
drop policy if exists project_private_media_delete on storage.objects;

create policy project_private_media_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-private'
  and (
    exists (
      select 1
      from public.media reserved_media
      where reserved_media.project_id = substring(
        storage.objects.name
        from '^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/media/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
      )::uuid
        and reserved_media.storage_path = storage.objects.name
        and reserved_media.remote_url is null
        and (
          (
            reserved_media.upload_status = 'ready'
            and public.has_project_permission(
              reserved_media.project_id,
              'media.read'
            )
          )
          or (
            reserved_media.upload_status = 'pending'
            and public.has_project_permission(
              reserved_media.project_id,
              'media.write'
            )
          )
        )
    )
    or exists (
      select 1
      from public.documents reserved_document
      where reserved_document.project_id = substring(
        storage.objects.name
        from '^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/documents/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/original$'
      )::uuid
        and reserved_document.storage_path = storage.objects.name
        and reserved_document.remote_url is null
        and (
          (
            reserved_document.upload_status = 'ready'
            and reserved_document.deleted_at is null
            and public.has_project_permission(
              reserved_document.project_id,
              'documents.read'
            )
          )
          or (
            (
              reserved_document.upload_status = 'pending'
              or reserved_document.deleted_at is not null
            )
            and public.has_project_permission(
              reserved_document.project_id,
              'documents.write'
            )
          )
        )
    )
  )
);

create policy project_private_media_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-private'
  and (
    exists (
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
    or exists (
      select 1
      from public.documents reserved_document
      where reserved_document.project_id = substring(
        storage.objects.name
        from '^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/documents/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/original$'
      )::uuid
        and reserved_document.storage_path = storage.objects.name
        and reserved_document.remote_url is null
        and reserved_document.upload_status = 'pending'
        and reserved_document.deleted_at is null
        and public.has_project_permission(
          reserved_document.project_id,
          'documents.write'
        )
    )
  )
);

-- Deliberately no UPDATE policy. Ready and pending private objects are immutable
-- at the reserved path; replacement/upsert and rename fail closed.

create policy project_private_media_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-private'
  and (
    exists (
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
    or exists (
      select 1
      from public.documents reserved_document
      where reserved_document.project_id = substring(
        storage.objects.name
        from '^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/documents/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/original$'
      )::uuid
        and reserved_document.storage_path = storage.objects.name
        and reserved_document.remote_url is null
        and reserved_document.upload_status = 'pending'
        and reserved_document.deleted_at is null
        and public.has_project_permission(
          reserved_document.project_id,
          'documents.write'
        )
    )
  )
);

comment on policy project_private_media_select on storage.objects is
  'WP-2.9A: preserve accepted Media access and add exact DB-bound private Document access; ready active Documents require documents.read, pending/deleted recovery requires documents.write.';
comment on policy project_private_media_insert on storage.objects is
  'WP-2.9A: preserve accepted Media upload and allow private Document upload only at an exact pending reservation path with live documents.write.';
comment on policy project_private_media_delete on storage.objects is
  'WP-2.9A: preserve accepted Media cleanup and allow Document cleanup only for an exact pending reservation with live documents.write; ready binaries remain immutable.';
