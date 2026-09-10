-- WP-2.8B private Venue media lifecycle metadata boundary.
-- Binary Storage authorization is hardened in a subsequent dedicated migration.

create unique index activity_log_private_media_operation_unique_idx
  on public.activity_log (project_id, event_type, operation_id)
  where operation_id is not null
    and event_type in (
      'venue_private_media_reserve_original',
      'venue_private_media_finalize_original',
      'venue_private_media_abandon_original',
      'venue_private_media_reserve_derivative',
      'venue_private_media_finalize_derivative',
      'venue_private_media_abandon_derivative'
    );

create or replace function public.venue_private_media_assert_writer(
  target_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null then
    raise exception 'venue private media unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'media.write') then
    raise exception 'venue private media unavailable' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.venue_private_media_assert_writer(uuid)
from public, anon, authenticated;

create or replace function public.venue_private_media_replay_receipt(
  target_project_id uuid,
  target_event_type text,
  target_operation_id uuid,
  target_media_id uuid,
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

  if existing_operation.entity_id is distinct from target_media_id
    or existing_operation.metadata_json -> 'semanticPayload'
      is distinct from target_semantic_payload then
    raise exception 'venue private media conflict' using errcode = '23505';
  end if;

  stored_receipt := existing_operation.metadata_json -> 'receipt';
  if stored_receipt is null or jsonb_typeof(stored_receipt) <> 'object' then
    raise exception 'venue private media unavailable' using errcode = '55000';
  end if;

  return stored_receipt || jsonb_build_object('replayed', true);
end;
$$;

revoke all on function public.venue_private_media_replay_receipt(
  uuid, text, uuid, uuid, jsonb
) from public, anon, authenticated;

create or replace function public.venue_private_media_record_operation(
  target_project_id uuid,
  target_event_type text,
  target_operation_id uuid,
  target_media_id uuid,
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
    'media',
    target_media_id,
    target_event_type,
    jsonb_build_object(
      'semanticPayload', target_semantic_payload,
      'receipt', target_receipt
    ),
    target_operation_id
  );
end;
$$;

revoke all on function public.venue_private_media_record_operation(
  uuid, text, uuid, uuid, jsonb, jsonb
) from public, anon, authenticated;

create or replace function public.manage_venue_private_media(
  target_action text,
  target_operation_id uuid,
  target_project_id uuid,
  target_media_id uuid,
  target_venue_id uuid default null,
  target_link_id uuid default null,
  target_category text default null,
  target_caption text default null,
  target_original_filename text default null,
  target_mime_type text default null,
  target_size_bytes bigint default null,
  target_sha256 text default null,
  target_width_px integer default null,
  target_height_px integer default null,
  target_derivative_of_id uuid default null,
  target_derivative_kind text default null,
  target_derivative_version integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  event_type text;
  expected_storage_path text;
  normalized_caption text;
  semantic_payload jsonb;
  replay_receipt jsonb;
  current_media public.media%rowtype;
  saved_media public.media%rowtype;
  current_link public.media_links%rowtype;
  saved_link public.media_links%rowtype;
  receipt jsonb;
  object_present boolean;
begin
  perform public.venue_private_media_assert_writer(target_project_id);

  if target_operation_id is null
    or target_media_id is null
    or target_action not in (
      'reserve_original',
      'finalize_original',
      'abandon_original',
      'reserve_derivative',
      'finalize_derivative',
      'abandon_derivative'
    ) then
    raise exception 'venue private media unavailable' using errcode = '22023';
  end if;

  event_type := 'venue_private_media_' || target_action;
  normalized_caption := nullif(public.fact_ecmascript_trim(target_caption), '');

  if target_action = 'reserve_original' then
    if target_venue_id is null
      or target_link_id is null
      or target_original_filename is null
      or char_length(target_original_filename) not between 1 and 512
      or target_original_filename ~ '[[:cntrl:]]'
      or target_mime_type is null
      or target_mime_type not in ('image/jpeg', 'image/png', 'image/webp')
      or not (
        (target_mime_type = 'image/jpeg' and lower(target_original_filename) ~ '\.(jpe?g)$')
        or (target_mime_type = 'image/png' and lower(target_original_filename) ~ '\.png$')
        or (target_mime_type = 'image/webp' and lower(target_original_filename) ~ '\.webp$')
      )
      or target_size_bytes is null
      or target_size_bytes not between 1 and 20000000
      or target_sha256 is null
      or target_sha256 !~ '^[0-9a-f]{64}$'
      or target_width_px is null
      or target_width_px not between 1 and 16384
      or target_height_px is null
      or target_height_px not between 1 and 16384
      or target_width_px::bigint * target_height_px::bigint > 50000000
      or target_derivative_of_id is not null
      or target_derivative_kind is not null
      or target_derivative_version is not null
      or (target_category is not null and target_category not in (
        'exterior', 'interior_empty', 'interior_decorated', 'view',
        'ceremony', 'kitchen', 'toilets', 'parking', 'accommodation',
        'floorplan', 'own_visit', 'other'
      ))
      or (normalized_caption is not null and char_length(normalized_caption) > 5000) then
      raise exception 'venue private media unavailable' using errcode = '22023';
    end if;

    perform 1
    from public.venues v
    where v.project_id = target_project_id
      and v.id = target_venue_id;
    if not found then
      raise exception 'venue private media unavailable' using errcode = '42501';
    end if;

    expected_storage_path := target_project_id::text || '/media/' || target_media_id::text || '/original';
    semantic_payload := jsonb_build_object(
      'venueId', target_venue_id,
      'linkId', target_link_id,
      'category', target_category,
      'caption', normalized_caption,
      'originalFilename', target_original_filename,
      'mimeType', target_mime_type,
      'sizeBytes', target_size_bytes,
      'sha256', target_sha256,
      'widthPx', target_width_px,
      'heightPx', target_height_px
    );

    replay_receipt := public.venue_private_media_replay_receipt(
      target_project_id, event_type, target_operation_id, target_media_id, semantic_payload
    );
    if replay_receipt is not null then
      return replay_receipt;
    end if;

    insert into public.media (
      id, project_id, media_type, category, storage_path, remote_url,
      source_page_url, original_filename, mime_type, size_bytes, sha256,
      width_px, height_px, derivative_of_id, is_original, upload_status,
      caption, created_by, updated_by
    ) values (
      target_media_id, target_project_id, 'image', target_category,
      expected_storage_path, null, null, target_original_filename,
      target_mime_type, target_size_bytes, target_sha256, target_width_px,
      target_height_px, null, true, 'pending', normalized_caption,
      auth.uid(), auth.uid()
    )
    on conflict (id) do nothing
    returning * into saved_media;

    if not found then
      select m.* into current_media from public.media m where m.id = target_media_id;
      if not found or current_media.project_id <> target_project_id then
        raise exception 'venue private media unavailable' using errcode = '42501';
      end if;
      raise exception 'venue private media conflict' using errcode = '23505';
    end if;

    insert into public.media_links (
      id, project_id, media_id, target_type, target_id, relationship_type, created_by
    ) values (
      target_link_id, target_project_id, target_media_id,
      'venue', target_venue_id, 'gallery', auth.uid()
    )
    on conflict (id) do nothing
    returning * into saved_link;

    if not found then
      select ml.* into current_link from public.media_links ml where ml.id = target_link_id;
      if not found or current_link.project_id <> target_project_id then
        raise exception 'venue private media unavailable' using errcode = '42501';
      end if;
      raise exception 'venue private media conflict' using errcode = '23505';
    end if;

    receipt := jsonb_build_object(
      'action', target_action,
      'replayed', false,
      'media', to_jsonb(saved_media),
      'link', to_jsonb(saved_link)
    );

  elsif target_action = 'reserve_derivative' then
    if target_venue_id is not null
      or target_link_id is not null
      or target_category is not null
      or normalized_caption is not null
      or target_original_filename is not null
      or target_derivative_of_id is null
      or target_derivative_kind not in ('thumbnail', 'preview')
      or target_derivative_version is null
      or target_derivative_version not between 1 and 32767
      or target_mime_type is null
      or target_mime_type not in ('image/jpeg', 'image/png', 'image/webp')
      or target_size_bytes is null
      or target_size_bytes not between 1 and 20000000
      or target_sha256 is null
      or target_sha256 !~ '^[0-9a-f]{64}$'
      or target_width_px is null
      or target_width_px not between 1 and 16384
      or target_height_px is null
      or target_height_px not between 1 and 16384
      or target_width_px::bigint * target_height_px::bigint > 50000000 then
      raise exception 'venue private media unavailable' using errcode = '22023';
    end if;

    select m.* into current_media
    from public.media m
    where m.id = target_derivative_of_id;
    if not found or current_media.project_id <> target_project_id then
      raise exception 'venue private media unavailable' using errcode = '42501';
    end if;
    if current_media.remote_url is not null
      or current_media.storage_path is null
      or not current_media.is_original
      or current_media.derivative_of_id is not null
      or current_media.upload_status <> 'ready' then
      raise exception 'venue private media conflict' using errcode = '23505';
    end if;

    expected_storage_path := target_project_id::text || '/media/' || target_media_id::text || '/'
      || target_derivative_kind || '-v' || target_derivative_version::text;
    semantic_payload := jsonb_build_object(
      'parentMediaId', target_derivative_of_id,
      'derivativeKind', target_derivative_kind,
      'derivativeVersion', target_derivative_version,
      'mimeType', target_mime_type,
      'sizeBytes', target_size_bytes,
      'sha256', target_sha256,
      'widthPx', target_width_px,
      'heightPx', target_height_px
    );

    replay_receipt := public.venue_private_media_replay_receipt(
      target_project_id, event_type, target_operation_id, target_media_id, semantic_payload
    );
    if replay_receipt is not null then
      return replay_receipt;
    end if;

    insert into public.media (
      id, project_id, media_type, category, storage_path, remote_url,
      source_page_url, original_filename, mime_type, size_bytes, sha256,
      width_px, height_px, derivative_of_id, is_original, upload_status,
      caption, created_by, updated_by, derivative_kind, derivative_version
    ) values (
      target_media_id, target_project_id, 'image', null, expected_storage_path,
      null, null, null, target_mime_type, target_size_bytes, target_sha256,
      target_width_px, target_height_px, target_derivative_of_id, false,
      'pending', null, auth.uid(), auth.uid(), target_derivative_kind,
      target_derivative_version
    )
    on conflict (id) do nothing
    returning * into saved_media;

    if not found then
      select m.* into current_media from public.media m where m.id = target_media_id;
      if not found or current_media.project_id <> target_project_id then
        raise exception 'venue private media unavailable' using errcode = '42501';
      end if;
      raise exception 'venue private media conflict' using errcode = '23505';
    end if;

    receipt := jsonb_build_object(
      'action', target_action,
      'replayed', false,
      'media', to_jsonb(saved_media)
    );

  elsif target_action in ('finalize_original', 'finalize_derivative') then
    if target_venue_id is not null
      or target_link_id is not null
      or target_category is not null
      or normalized_caption is not null
      or target_original_filename is not null
      or target_mime_type is not null
      or target_size_bytes is not null
      or target_sha256 is not null
      or target_width_px is not null
      or target_height_px is not null
      or target_derivative_of_id is not null
      or target_derivative_kind is not null
      or target_derivative_version is not null then
      raise exception 'venue private media unavailable' using errcode = '22023';
    end if;

    semantic_payload := jsonb_build_object('mediaId', target_media_id);
    replay_receipt := public.venue_private_media_replay_receipt(
      target_project_id, event_type, target_operation_id, target_media_id, semantic_payload
    );
    if replay_receipt is not null then
      return replay_receipt;
    end if;

    select m.* into current_media
    from public.media m
    where m.id = target_media_id
    for update;
    if not found or current_media.project_id <> target_project_id then
      raise exception 'venue private media unavailable' using errcode = '42501';
    end if;

    if target_action = 'finalize_original' then
      if current_media.remote_url is not null
        or current_media.storage_path <> (
          target_project_id::text || '/media/' || target_media_id::text || '/original'
        )
        or not current_media.is_original
        or current_media.derivative_of_id is not null then
        raise exception 'venue private media conflict' using errcode = '23505';
      end if;

      select ml.* into saved_link
      from public.media_links ml
      where ml.project_id = target_project_id
        and ml.media_id = target_media_id
        and ml.target_type = 'venue'
        and ml.relationship_type = 'gallery'
      order by ml.id
      limit 1;
      if not found then
        raise exception 'venue private media conflict' using errcode = '23505';
      end if;
    else
      if current_media.remote_url is not null
        or current_media.storage_path is null
        or current_media.is_original
        or current_media.derivative_of_id is null
        or current_media.derivative_kind not in ('thumbnail', 'preview') then
        raise exception 'venue private media conflict' using errcode = '23505';
      end if;
    end if;

    if current_media.upload_status = 'pending' then
      select exists (
        select 1 from storage.objects so
        where so.bucket_id = 'project-private'
          and so.name = current_media.storage_path
      ) into object_present;
      if not object_present then
        raise exception 'venue private media object unavailable' using errcode = '55000';
      end if;

      update public.media
      set upload_status = 'ready',
          updated_at = now(),
          updated_by = auth.uid(),
          revision = revision + 1
      where id = target_media_id
        and project_id = target_project_id
      returning * into saved_media;
    elsif current_media.upload_status = 'ready' then
      saved_media := current_media;
    else
      raise exception 'venue private media conflict' using errcode = '23505';
    end if;

    receipt := jsonb_build_object(
      'action', target_action,
      'replayed', false,
      'media', to_jsonb(saved_media)
    );
    if target_action = 'finalize_original' then
      receipt := receipt || jsonb_build_object('link', to_jsonb(saved_link));
    end if;

  else
    if target_category is not null
      or normalized_caption is not null
      or target_original_filename is not null
      or target_mime_type is not null
      or target_size_bytes is not null
      or target_sha256 is not null
      or target_width_px is not null
      or target_height_px is not null
      or target_derivative_of_id is not null
      or target_derivative_kind is not null
      or target_derivative_version is not null
      or (target_action = 'abandon_original' and (target_venue_id is null or target_link_id is null))
      or (target_action = 'abandon_derivative' and (target_venue_id is not null or target_link_id is not null)) then
      raise exception 'venue private media unavailable' using errcode = '22023';
    end if;

    semantic_payload := jsonb_build_object(
      'mediaId', target_media_id,
      'venueId', target_venue_id,
      'linkId', target_link_id
    );
    replay_receipt := public.venue_private_media_replay_receipt(
      target_project_id, event_type, target_operation_id, target_media_id, semantic_payload
    );
    if replay_receipt is not null then
      return replay_receipt;
    end if;

    select m.* into current_media
    from public.media m
    where m.id = target_media_id
    for update;

    if not found then
      if target_action = 'abandon_original' then
        select ml.* into current_link
        from public.media_links ml
        where ml.id = target_link_id;
        if found then
          if current_link.project_id <> target_project_id then
            raise exception 'venue private media unavailable' using errcode = '42501';
          end if;
          raise exception 'venue private media conflict' using errcode = '23505';
        end if;
      end if;

      receipt := jsonb_build_object(
        'action', target_action,
        'replayed', false,
        'projectId', target_project_id,
        'mediaId', target_media_id,
        'linkId', target_link_id,
        'absent', true
      );
    else
      if current_media.project_id <> target_project_id then
        raise exception 'venue private media unavailable' using errcode = '42501';
      end if;
      if current_media.upload_status <> 'pending'
        or current_media.remote_url is not null
        or current_media.storage_path is null then
        raise exception 'venue private media conflict' using errcode = '23505';
      end if;

      if target_action = 'abandon_original' then
        if not current_media.is_original or current_media.derivative_of_id is not null then
          raise exception 'venue private media conflict' using errcode = '23505';
        end if;
        select ml.* into current_link
        from public.media_links ml
        where ml.id = target_link_id;
        if not found or current_link.project_id <> target_project_id then
          raise exception 'venue private media unavailable' using errcode = '42501';
        end if;
        if current_link.media_id <> target_media_id
          or current_link.target_type <> 'venue'
          or current_link.target_id <> target_venue_id
          or current_link.relationship_type <> 'gallery' then
          raise exception 'venue private media conflict' using errcode = '23505';
        end if;
      else
        if current_media.is_original or current_media.derivative_of_id is null then
          raise exception 'venue private media conflict' using errcode = '23505';
        end if;
      end if;

      select exists (
        select 1 from storage.objects so
        where so.bucket_id = 'project-private'
          and so.name = current_media.storage_path
      ) into object_present;
      if object_present then
        raise exception 'venue private media object still present' using errcode = '55000';
      end if;

      delete from public.media
      where id = target_media_id
        and project_id = target_project_id;

      receipt := jsonb_build_object(
        'action', target_action,
        'replayed', false,
        'projectId', target_project_id,
        'mediaId', target_media_id,
        'linkId', target_link_id,
        'absent', true
      );
    end if;
  end if;

  perform public.venue_private_media_record_operation(
    target_project_id,
    event_type,
    target_operation_id,
    target_media_id,
    semantic_payload,
    receipt
  );

  return receipt;
exception
  when unique_violation then
    raise exception 'venue private media conflict' using errcode = '23505';
end;
$$;

revoke all on function public.manage_venue_private_media(
  text, uuid, uuid, uuid, uuid, uuid, text, text, text, text,
  bigint, text, integer, integer, uuid, text, integer
) from public, anon;

grant execute on function public.manage_venue_private_media(
  text, uuid, uuid, uuid, uuid, uuid, text, text, text, text,
  bigint, text, integer, integer, uuid, text, integer
) to authenticated;

comment on function public.manage_venue_private_media(
  text, uuid, uuid, uuid, uuid, uuid, text, text, text, text,
  bigint, text, integer, integer, uuid, text, integer
) is
  'WP-2.8B protected private Venue media metadata lifecycle with project-serialized live media.write authorization, opaque server-generated paths and operation-id replay receipts.';
