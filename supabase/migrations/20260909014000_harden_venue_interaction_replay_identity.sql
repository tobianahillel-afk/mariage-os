create or replace function public.append_venue_interaction(
  target_project_id uuid,
  target_venue_id uuid,
  target_interaction_id uuid,
  target_contact_id uuid,
  target_interaction_type text,
  target_occurred_at text,
  target_summary text,
  target_next_follow_up_at text,
  target_source_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  normalized_interaction_type text;
  parsed_occurred_at timestamptz;
  normalized_summary text;
  parsed_next_follow_up_at timestamptz;
  saved_row public.interactions%rowtype;
  existing_row public.interactions%rowtype;
begin
  perform public.venue_interaction_assert_writer(target_project_id);

  if target_venue_id is null
    or target_interaction_id is null
    or target_interaction_type is null
    or target_occurred_at is null
    or target_summary is null then
    raise exception 'venue interaction unavailable' using errcode = '22023';
  end if;

  normalized_interaction_type := nullif(
    public.fact_ecmascript_trim(target_interaction_type),
    ''
  );
  parsed_occurred_at := public.fact_parse_application_instant(target_occurred_at);
  normalized_summary := nullif(public.fact_ecmascript_trim(target_summary), '');
  parsed_next_follow_up_at := public.fact_parse_application_instant(
    target_next_follow_up_at
  );

  if normalized_interaction_type is null
    or char_length(normalized_interaction_type) > 80
    or parsed_occurred_at is null
    or normalized_summary is null
    or char_length(normalized_summary) > 5000
    or (
      target_next_follow_up_at is not null
      and parsed_next_follow_up_at is null
    ) then
    raise exception 'venue interaction unavailable' using errcode = '22023';
  end if;

  perform 1
  from public.venues v
  where v.project_id = target_project_id
    and v.id = target_venue_id;
  if not found then
    raise exception 'venue interaction unavailable' using errcode = '42501';
  end if;

  if target_contact_id is not null then
    perform 1
    from public.contacts c
    where c.project_id = target_project_id
      and c.parent_type = 'venue'
      and c.parent_id = target_venue_id
      and c.id = target_contact_id;
    if not found then
      raise exception 'venue interaction unavailable' using errcode = '42501';
    end if;
  end if;

  if target_source_id is not null then
    perform 1
    from public.sources s
    where s.project_id = target_project_id
      and s.id = target_source_id;
    if not found then
      raise exception 'venue interaction unavailable' using errcode = '42501';
    end if;
  end if;

  insert into public.interactions (
    id,
    project_id,
    parent_type,
    parent_id,
    contact_id,
    interaction_type,
    occurred_at,
    summary,
    next_follow_up_at,
    source_id,
    created_by,
    updated_by
  ) values (
    target_interaction_id,
    target_project_id,
    'venue',
    target_venue_id,
    target_contact_id,
    normalized_interaction_type,
    parsed_occurred_at,
    normalized_summary,
    parsed_next_follow_up_at,
    target_source_id,
    auth.uid(),
    auth.uid()
  )
  on conflict (id) do nothing
  returning * into saved_row;

  if found then
    return to_jsonb(saved_row);
  end if;

  select i.* into existing_row
  from public.interactions i
  where i.id = target_interaction_id;

  if found and existing_row.project_id <> target_project_id then
    raise exception 'venue interaction unavailable' using errcode = '42501';
  end if;

  if found
    and existing_row.project_id = target_project_id
    and existing_row.parent_type = 'venue'
    and existing_row.parent_id = target_venue_id
    and existing_row.contact_id is not distinct from target_contact_id
    and existing_row.interaction_type = normalized_interaction_type
    and existing_row.occurred_at = parsed_occurred_at
    and existing_row.summary = normalized_summary
    and existing_row.next_follow_up_at is not distinct from parsed_next_follow_up_at
    and existing_row.source_id is not distinct from target_source_id then
    return to_jsonb(existing_row);
  end if;

  raise exception 'venue interaction conflict' using errcode = '23505';
end;
$$;

revoke all on function public.append_venue_interaction(
  uuid, uuid, uuid, uuid, text, text, text, text, uuid
) from public, anon;

grant execute on function public.append_venue_interaction(
  uuid, uuid, uuid, uuid, text, text, text, text, uuid
) to authenticated;
