-- WP-2.8B: the accepted remote URL validator remains authoritative for
-- remote references, while private Storage-backed rows intentionally have
-- no remote URL.

alter table public.media
  drop constraint media_remote_url_canonical_check;

alter table public.media
  add constraint media_remote_url_canonical_check
  check (
    remote_url is null
    or public.media_public_url_is_valid(remote_url, true, true, false)
  );

comment on constraint media_remote_url_canonical_check on public.media is
  'WP-2.8A/B: remote references require a canonical public HTTPS URL; private Storage-backed rows have no remote URL.';
