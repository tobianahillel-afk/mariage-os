create or replace function public.save_venue_contact(
  target_project_id uuid,
  target_venue_id uuid,
  target_contact_id uuid,
  target_expected_revision bigint,
  target_name text,
  target_role_label text,
  target_email text,
  target_phone text,
  target_preferred_channel text,
  target_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  normalized_name text;
  normalized_role_label text;
  normalized_email text;
  normalized_phone text;
  normalized_preferred_channel text;
  normalized_notes text;
  saved_row public.contacts%rowtype;
  conflicting_project_id uuid;
begin
  perform public.venue_contact_assert_writer(target_project_id);

  if target_project_id is null
    or target_venue_id is null
    or target_contact_id is null then
    raise exception 'venue contact unavailable' using errcode = '22023';
  end if;

  perform 1 from public.venues v
  where v.project_id = target_project_id and v.id = target_venue_id;
  if not found then
    raise exception 'venue contact unavailable' using errcode = '42501';
  end if;

  normalized_name := nullif(public.fact_ecmascript_trim(target_name), '');
  normalized_role_label := nullif(public.fact_ecmascript_trim(target_role_label), '');
  normalized_email := nullif(public.fact_ecmascript_trim(target_email), '');
  normalized_phone := nullif(public.fact_ecmascript_trim(target_phone), '');
  normalized_preferred_channel := nullif(public.fact_ecmascript_trim(target_preferred_channel), '');
  normalized_notes := nullif(public.fact_ecmascript_trim(target_notes), '');

  if (normalized_name is not null and char_length(normalized_name) > 240)
    or (normalized_role_label is not null and char_length(normalized_role_label) > 160)
    or (normalized_email is not null and char_length(normalized_email) > 320)
    or (normalized_phone is not null and normalized_phone !~ '^\+[1-9][0-9]{1,14}$')
    or (normalized_preferred_channel is not null and char_length(normalized_preferred_channel) > 80)
    or (normalized_notes is not null and char_length(normalized_notes) > 5000) then
    raise exception 'venue contact unavailable' using errcode = '22023';
  end if;

  if target_expected_revision is null then
    begin
      insert into public.contacts (
        id, project_id, parent_type, parent_id,
        name, role_label, email, phone, preferred_channel, notes,
        created_by, updated_by
      ) values (
        target_contact_id, target_project_id, 'venue', target_venue_id,
        normalized_name, normalized_role_label, normalized_email,
        normalized_phone, normalized_preferred_channel, normalized_notes,
        auth.uid(), auth.uid()
      )
      returning * into saved_row;
    exception when unique_violation then
      select c.project_id
      into conflicting_project_id
      from public.contacts c
      where c.id = target_contact_id;

      if found and conflicting_project_id <> target_project_id then
        raise exception 'venue contact unavailable' using errcode = '42501';
      end if;

      raise exception 'venue contact conflict' using errcode = '23505';
    end;
    return to_jsonb(saved_row);
  end if;

  if target_expected_revision <= 0 then
    raise exception 'venue contact unavailable' using errcode = '22023';
  end if;

  update public.contacts
  set name = normalized_name,
      role_label = normalized_role_label,
      email = normalized_email,
      phone = normalized_phone,
      preferred_channel = normalized_preferred_channel,
      notes = normalized_notes
  where id = target_contact_id
    and project_id = target_project_id
    and parent_type = 'venue'
    and parent_id = target_venue_id
    and revision = target_expected_revision
  returning * into saved_row;

  if not found then
    raise exception 'venue contact conflict' using errcode = '40001';
  end if;

  return to_jsonb(saved_row);
end;
$$;

revoke all on function public.save_venue_contact(
  uuid, uuid, uuid, bigint, text, text, text, text, text, text
) from public, anon;

grant execute on function public.save_venue_contact(
  uuid, uuid, uuid, bigint, text, text, text, text, text, text
) to authenticated;
