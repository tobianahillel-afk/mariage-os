begin;

create extension if not exists pgtap with schema extensions;

select plan(3);

-- WP-2.9A RED-first contract seed. These assertions intentionally fail until
-- the private-document persistence and protected command boundary exist.
select has_table(
  'public',
  'documents',
  'WP-2.9A private documents persistence exists'
);

select has_table(
  'public',
  'document_links',
  'WP-2.9A generic document-link persistence exists'
);

select has_function(
  'public',
  'manage_private_document',
  array[
    'text',
    'uuid',
    'uuid',
    'uuid',
    'uuid',
    'uuid',
    'bigint',
    'text',
    'text',
    'text',
    'text',
    'bigint',
    'text',
    'uuid'
  ],
  'WP-2.9A protected private-document action boundary exists'
);

select * from finish();
rollback;
