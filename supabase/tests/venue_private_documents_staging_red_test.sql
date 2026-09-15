begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

select is(
  (select count(*)::integer from storage.buckets where id = 'document-ingest-staging'),
  1,
  'ADR 0009 creates the dedicated document-ingest-staging bucket'
);
select is(
  (select public from storage.buckets where id = 'document-ingest-staging'),
  false,
  'document-ingest-staging is private'
);
select is(
  (select file_size_limit from storage.buckets where id = 'document-ingest-staging'),
  25000000::bigint,
  'document-ingest-staging enforces the exact 25,000,000-byte provider limit'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'document-ingest-staging'),
  array['application/pdf']::text[],
  'document-ingest-staging accepts only application/pdf'
);
select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'document_ingest_staging_insert'
  ),
  1,
  'staging exposes one narrow authenticated INSERT policy'
);
select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'document_ingest_staging_%'
  ),
  1,
  'staging grants no ordinary SELECT, UPDATE or DELETE policy'
);

select * from finish();
rollback;
