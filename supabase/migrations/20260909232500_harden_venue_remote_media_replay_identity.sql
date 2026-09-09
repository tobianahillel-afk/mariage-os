create or replace function public.create_venue_remote_media(
  target_project_id uuid,
  target_venue_id uuid,
  target_media_id uuid,
  target_link_id uuid,
  target_category text,
  target_remote_url text,
  target_source_page_url text,
  target_caption text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  normalized_caption text;
  existing_media public.media%rowtype;
  saved_media public.media%rowtype;
  existing_link public.media_links%rowtype;
  saved_link public.media_links%rowtype;
begin
  perform public.venue_remote_media_assert_writer(target_project_id);

  if target_venue_id is null
    or target_media_id is null
    or target_link_id is null
    or target_remote_url is null
    or not public.media_public_url_is_valid(
      target_remote_url,
      true,
      true,
      false
    )
    or (
      target_source_page_url is not null
      and not public.media_public_url_is_valid(
        target_source_page_url,
        false,
        false,
        true
      )
    )
    or (
      target_category is not null
      and target_category not in (
        'exterior',
        'interior_empty',
        'interior_decorated',
        'view',
        'ceremony',
        'kitchen',
        'toilets',
        'parking',
        'accommodation',
        'floorplan',
        'own_visit',
        'other'
      )
    ) then
    raise exception 'venue remote media unavailable' using errcode = '22023';
  end if;

  normalized_caption := nullif(public.fact_ecmascript_trim(target_caption), '');
  if normalized_caption is not null
    and char_length(normalized_caption) > 5000 then
    raise exception 'venue remote media unavailable' using errcode = '22023';
  end if;

  perform 1
  from public.venues v
  where v.project_id = target_project_id
    and v.id = target_venue_id;
  if not found then
    raise exception 'venue remote media unavailable' using errcode = '42501';
  end if;

  insert into public.media (
    id,
    project_id,
    media_type,
    category,
    storage_path,
    remote_url,
    source_page_url,
    original_filename,
    mime_type,
    size_bytes,
    sha256,
    width_px,
    height_px,
    derivative_of_id,
    is_original,
    upload_status,
    caption,
    created_by,
    updated_by
  ) values (
    target_media_id,
    target_project_id,
    'image',
    target_category,
    null,
    target_remote_url,
    target_source_page_url,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    true,
    'ready',
    normalized_caption,
    auth.uid(),
    auth.uid()
  )
  on conflict (id) do nothing
  returning * into saved_media;

  if not found then
    select m.* into existing_media
    from public.media m
    where m.id = target_media_id;

    if not found or existing_media.project_id <> target_project_id then
      raise exception 'venue remote media unavailable' using errcode = '42501';
    end if;

    if existing_media.media_type <> 'image'
      or existing_media.category is distinct from target_category
      or existing_media.storage_path is not null
      or existing_media.remote_url <> target_remote_url
      or existing_media.source_page_url is distinct from target_source_page_url
      or existing_media.original_filename is not null
      or existing_media.mime_type is not null
      or existing_media.size_bytes is not null
      or existing_media.sha256 is not null
      or existing_media.width_px is not null
      or existing_media.height_px is not null
      or existing_media.derivative_of_id is not null
      or not existing_media.is_original
      or existing_media.upload_status <> 'ready'
      or existing_media.caption is distinct from normalized_caption then
      raise exception 'venue remote media conflict' using errcode = '23505';
    end if;

    select ml.* into existing_link
    from public.media_links ml
    where ml.id = target_link_id;

    if not found then
      raise exception 'venue remote media conflict' using errcode = '23505';
    end if;

    if existing_link.project_id <> target_project_id then
      raise exception 'venue remote media unavailable' using errcode = '42501';
    end if;

    if existing_link.media_id <> target_media_id
      or existing_link.target_type <> 'venue'
      or existing_link.target_id <> target_venue_id
      or existing_link.relationship_type <> 'gallery' then
      raise exception 'venue remote media conflict' using errcode = '23505';
    end if;

    return jsonb_build_object(
      'media', to_jsonb(existing_media),
      'link', to_jsonb(existing_link)
    );
  end if;

  insert into public.media_links (
    id,
    project_id,
    media_id,
    target_type,
    target_id,
    relationship_type,
    created_by
  ) values (
    target_link_id,
    target_project_id,
    target_media_id,
    'venue',
    target_venue_id,
    'gallery',
    auth.uid()
  )
  on conflict (id) do nothing
  returning * into saved_link;

  if not found then
    select ml.* into existing_link
    from public.media_links ml
    where ml.id = target_link_id;

    if not found or existing_link.project_id <> target_project_id then
      raise exception 'venue remote media unavailable' using errcode = '42501';
    end if;

    if existing_link.media_id <> target_media_id
      or existing_link.target_type <> 'venue'
      or existing_link.target_id <> target_venue_id
      or existing_link.relationship_type <> 'gallery' then
      raise exception 'venue remote media conflict' using errcode = '23505';
    end if;

    saved_link := existing_link;
  end if;

  return jsonb_build_object(
    'media', to_jsonb(saved_media),
    'link', to_jsonb(saved_link)
  );
exception
  when unique_violation then
    raise exception 'venue remote media conflict' using errcode = '23505';
end;
$$;

revoke all on function public.create_venue_remote_media(
  uuid, uuid, uuid, uuid, text, text, text, text
) from public, anon;

grant execute on function public.create_venue_remote_media(
  uuid, uuid, uuid, uuid, text, text, text, text
) to authenticated;
