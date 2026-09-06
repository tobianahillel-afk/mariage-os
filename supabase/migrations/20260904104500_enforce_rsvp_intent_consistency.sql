alter table public.project_rsvp_intent_settings
add constraint project_rsvp_intent_settings_channel_setup_consistency
check (
  (
    (planned_email or planned_sms or planned_whatsapp)
    and automatic_channel_setup_intent in ('configure_now', 'later')
  )
  or (
    not planned_email
    and not planned_sms
    and not planned_whatsapp
    and automatic_channel_setup_intent = 'not_applicable'
  )
);
