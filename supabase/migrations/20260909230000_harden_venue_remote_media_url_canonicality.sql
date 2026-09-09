create or replace function public.media_ip_literal_is_canonical(target_host text)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  address inet;
begin
  if target_host is null then
    return false;
  end if;

  begin
    address := target_host::inet;
  exception
    when invalid_text_representation then
      return false;
  end;

  return target_host = host(address);
end;
$$;

revoke all on function public.media_ip_literal_is_canonical(text)
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
  scheme text;
  authority text;
  suffix text;
  path_text text;
  host_text text;
  port_text text;
  port_number integer;
  lower_host text;
  is_ip_literal boolean := false;
begin
  if target_url is null
    or char_length(target_url) < 1
    or char_length(target_url) > 2048
    or octet_length(target_url) <> char_length(target_url)
    or target_url ~ '[[:cntrl:][:space:]]' then
    return false;
  end if;

  matched := regexp_match(
    target_url,
    '^(https?)://([^/?#]+)(/[^[:space:][:cntrl:]]*)$'
  );
  if matched is null then
    return false;
  end if;

  scheme := matched[1];
  authority := matched[2];
  suffix := matched[3];

  if require_https and scheme <> 'https' then
    return false;
  end if;

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
    host_text := matched[1];
    port_text := matched[2];
    is_ip_literal := true;
  else
    matched := regexp_match(authority, '^([^:]+)(?::([0-9]{1,5}))?$');
    if matched is null then
      return false;
    end if;
    host_text := matched[1];
    port_text := matched[2];
    is_ip_literal := host_text ~ '^[0-9.]+$';
  end if;

  if port_text is not null then
    port_number := port_text::integer;
    if port_number > 65535
      or port_text <> port_number::text
      or (scheme = 'https' and port_number = 443)
      or (scheme = 'http' and port_number = 80) then
      return false;
    end if;
  end if;

  path_text := split_part(split_part(suffix, '?', 1), '#', 1);
  if strpos(path_text, chr(92)) > 0
    or path_text ~* '/(?:\.|%2e|\.\.|\.%2e|%2e\.|%2e%2e)(?:/|$)' then
    return false;
  end if;

  lower_host := lower(host_text);
  if lower_host = 'localhost'
    or lower_host like '%.localhost'
    or lower_host like '%.local'
    or lower_host like '%.lan'
    or lower_host like '%.internal' then
    return false;
  end if;

  if is_ip_literal then
    return allow_public_ip_literal
      and public.media_ip_literal_is_canonical(host_text)
      and public.media_ip_literal_is_public(host_text);
  end if;

  return public.media_dns_host_is_canonical(
    host_text,
    allow_single_label_host
  );
exception
  when others then
    return false;
end;
$$;

revoke all on function public.media_public_url_is_valid(
  text, boolean, boolean, boolean
) from public, anon, authenticated;

alter table public.media
  add constraint media_remote_url_canonical_check
  check (public.media_public_url_is_valid(remote_url, true, true, false));

alter table public.media
  add constraint media_source_page_url_canonical_check
  check (
    source_page_url is null
    or public.media_public_url_is_valid(source_page_url, false, false, true)
  );