alter table public.activity_log
  alter column occurred_at set default clock_timestamp();

comment on column public.activity_log.occurred_at is
  'Wall-clock event timestamp. Uses clock_timestamp() so multiple meaningful events inside one transaction remain deterministically orderable by occurrence time.';
