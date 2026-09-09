create or replace function public.media_dns_host_is_canonical(
  target_host text,
  allow_single_label boolean
)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  labels text[];
  label text;
  final_label text;
begin
  if target_host is null
    or char_length(target_host) < 1
    or char_length(target_host) > 253
    or target_host <> lower(target_host)
    or target_host ~ '^[0-9.]+$' then
    return false;
  end if;

  labels := string_to_array(target_host, '.');
  if array_length(labels, 1) = 1 and not allow_single_label then
    return false;
  end if;

  foreach label in array labels loop
    if char_length(label) < 1
      or char_length(label) > 63
      or label !~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$'
      or label ~ '^xn--' then
      return false;
    end if;
  end loop;

  final_label := labels[array_length(labels, 1)];
  if array_length(labels, 1) > 1
    and final_label !~ '^[a-z]{2,63}$' then
    return false;
  end if;

  return true;
end;
$$;

revoke all on function public.media_dns_host_is_canonical(text, boolean)
from public, anon, authenticated;

create or replace function public.media_ip_literal_is_public(target_host text)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  address inet;
begin
  begin
    address := target_host::inet;
  exception
    when invalid_text_representation then
      return false;
  end;

  if family(address) = 4 then
    return not (
      address <<= '0.0.0.0/8'::inet
      or address <<= '10.0.0.0/8'::inet
      or address <<= '100.64.0.0/10'::inet
      or address <<= '127.0.0.0/8'::inet
      or address <<= '169.254.0.0/16'::inet
      or address <<= '172.16.0.0/12'::inet
      or address <<= '192.168.0.0/16'::inet
    );
  end if;

  return not (
    address <<= '::/128'::inet
    or address <<= '::1/128'::inet
    or address <<= 'fc00::/7'::inet
    or address <<= 'fe80::/10'::inet
    or address <<= '::ffff:0:0/96'::inet
  );
end;
$$;

revoke all on function public.media_ip_literal_is_public(text)
from public, anon, authenticated;

create or replace function public.media_public_url_is_valid(
  target_url text,
  require_https boolean,
  allow_public_ip_literal boolean,
  allow_single_label_host boolean
)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  matched text[];
  authority text;
  host text;
  port_text text;
  lower_host text;
  is_ip_literal boolean := false;
begin
  if target_url is null
    or char_length(target_url) < 1
    or char_length(target_url) > 2048
    or target_url ~ '[[:cntrl:][:space:]]' then
    return false;
  end if;

  if require_https then
    matched := regexp_match(target_url, '^https://([^/?#]+)(?:[/?#].*)?$');
  else
    matched := regexp_match(target_url, '^https?://([^/?#]+)(?:[/?#].*)?$');
  end if;
  if matched is null then
    return false;
  end if;

  authority := matched[1];
  if position('@' in authority) > 0 then
    return false;
  end if;

  if left(authority, 1) = '[' then
    matched := regexp_match(
      authority,
      '^\[([0-9A-Fa-f:.]+)\](?::([0-9]{1,5}))?$'
    );
    if matched is null then
      return false;
    end if;
    host := matched[1];
    port_text := matched[2];
    is_ip_literal := true;
  else
    matched := regexp_match(authority, '^([^:]+)(?::([0-9]{1,5}))?$');
    if matched is null then
      return false;
    end if;
    host := matched[1];
    port_text := matched[2];
    is_ip_literal := host ~ '^[0-9.]+$';
  end if;

  if port_text is not null and port_text::integer > 65535 then
    return false;
  end if;

  lower_host := lower(host);
  if lower_host = 'localhost'
    or lower_host like '%.localhost'
    or lower_host like '%.local'
    or lower_host like '%.lan'
    or lower_host like '%.internal' then
    return false;
  end if;

  if is_ip_literal then
    return allow_public_ip_literal
      and public.media_ip_literal_is_public(host);
  end if;

  return public.media_dns_host_is_canonical(
    lower_host,
    allow_single_label_host
  );
end;
$$;

revoke all on function public.media_public_url_is_valid(
  text, boolean, boolean, boolean
) from public, anon, authenticated;

create table public.media (
  id uuid primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  media_type text not null check (media_type = 'image'),
  category text null check (
    category is null
    or category in (
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
  ),
  storage_path text null,
  remote_url text not null check (
    public.media_public_url_is_valid(remote_url, true, true, false)
  ),
  source_page_url text null check (
    source_page_url is null
    or public.media_public_url_is_valid(source_page_url, false, false, true)
  ),
  original_filename text null,
  mime_type text null,
  size_bytes bigint null check (size_bytes is null or size_bytes >= 0),
  sha256 text null,
  width_px integer null check (width_px is null or width_px >= 0),
  height_px integer null check (height_px is null or height_px >= 0),
  derivative_of_id uuid null,
  is_original boolean not null default true,
  upload_status text not null check (upload_status = 'ready'),
  caption text null check (
    caption is null
    or (
      caption = public.fact_ecmascript_trim(caption)
      and char_length(caption) between 1 and 5000
    )
  ),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id),
  revision bigint not null default 1 check (revision > 0),
  unique (project_id, id),
  foreign key (project_id, derivative_of_id)
    references public.media(project_id, id)
    on update restrict
    on delete restrict,
  constraint media_wp28a_remote_reference_state check (
    storage_path is null
    and original_filename is null
    and mime_type is null
    and size_bytes is null
    and sha256 is null
    and width_px is null
    and height_px is null
    and derivative_of_id is null
    and is_original
    and upload_status = 'ready'
  )
);

create index media_project_remote_idx
  on public.media (project_id, created_at desc, id asc);

create table public.media_links (
  id uuid primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  media_id uuid not null,
  target_type text not null check (target_type = 'venue'),
  target_id uuid not null,
  relationship_type text not null check (relationship_type = 'gallery'),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  unique (project_id, id),
  unique (
    project_id,
    media_id,
    target_type,
    target_id,
    relationship_type
  ),
  foreign key (project_id, media_id)
    references public.media(project_id, id)
    on update restrict
    on delete cascade,
  foreign key (project_id, target_id)
    references public.venues(project_id, id)
    on update restrict
    on delete cascade
);

create index media_links_venue_gallery_idx
  on public.media_links (
    project_id,
    target_id,
    target_type,
    relationship_type,
    created_at desc,
    id asc
  );

alter table public.media enable row level security;
alter table public.media_links enable row level security;

revoke all on table public.media from public, anon, authenticated;
revoke all on table public.media_links from public, anon, authenticated;
grant select on table public.media to authenticated;
grant select on table public.media_links to authenticated;

create policy media_select_authorized
on public.media for select to authenticated
using (public.has_project_permission(project_id, 'media.read'));

create policy media_links_select_authorized
on public.media_links for select to authenticated
using (public.has_project_permission(project_id, 'media.read'));

create or replace function public.venue_remote_media_assert_writer(
  target_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null then
    raise exception 'venue remote media unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'media.write') then
    raise exception 'venue remote media unavailable' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.venue_remote_media_assert_writer(uuid)
from public, anon, authenticated;

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

    saved_media := existing_media;
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
