-- WP-2.8B: the original WP-2.8A column-level URL check was remote-only.
-- Keep the same remote validation while allowing Storage-backed media to
-- represent the frozen private branch of the discriminated media model.

alter table public.media
  drop constraint media_remote_url_check;

alter table public.media
  add constraint media_remote_url_check
  check (
    remote_url is null
    or public.media_public_url_is_valid(remote_url, true, true, false)
  );

comment on constraint media_remote_url_check on public.media is
  'WP-2.8A/B: present remote URLs retain the accepted public HTTPS validation; private Storage-backed rows have remote_url null.';
