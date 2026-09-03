# Mariage OS — Codebase Structure Addendum: Guest Communications

Status: **NORMATIVE V1 ENGINEERING ADDENDUM**

This extends `CODEBASE-STRUCTURE.md` without changing layer direction.

## Recommended ownership

```text
src/
  domain/
    guests/
      contact-point.ts
      invitation-link.ts
      rsvp.ts
      ...
    communications/
      campaign.ts
      recipient.ts
      template.ts
      communication-event.ts
      suppression.ts
      status-machine.ts
      ...

  application/
    guests/
      resolve-guest-invitation.ts
      submit-guest-rsvp.ts
      rotate-invitation-link.ts
      ...
    communications/
      build-campaign-preview.ts
      freeze-campaign-audience.ts
      dispatch-campaign.ts
      retry-failed-recipients.ts
      ingest-provider-event.ts
      ...

  ui/
    screens/
      guests/
        invitations/
        household/
        ...
    public/
      rsvp/
        ...

  infrastructure/
    supabase/
      repositories/
        guest-contacts-repository.ts
        guest-invitations-repository.ts
        communications-repository.ts
      rpc/
        ...
    communications/
      providers/
        email/
        sms/
        whatsapp/
      webhooks/
      scheduler/
      ...
```

Exact file split follows quantitative module-size rules; this is ownership guidance, not permission to create giant files.

## Dependency direction

- guest/communication domain imports no provider SDK;
- application imports provider **ports/interfaces**, not adapters;
- infrastructure adapters can import external provider SDK/API clients;
- public RSVP UI calls application/public-capability client boundary, not database adapter directly;
- private campaign UI calls application services, not provider SDK;
- webhook HTTP adapter verifies provider authenticity before invoking application normalization command.

## Provider port location

Ports may live in a dedicated application/domain ports folder consistent with base architecture. Do not place Twilio/Meta/etc. concrete types in port signatures.

## Public guest shell

`ui/public/rsvp` is visually related to Mariage OS but does not import private authenticated app shell/sidebar. Shared design primitives are allowed when they do not pull private routing/auth state into public bundle.

## Tests

```text
tests/
  integration/
    guest-rsvp/
    communications/
  security/
    guest-capability/
    communication-webhooks/
  e2e/
    guest-rsvp/
    communications/
  fixtures/
    communications/
```

Provider adapter contract tests may be colocated or under integration according to frozen test-placement rules.

## Forbidden shortcuts

- `src/utils/whatsapp.ts` as catch-all provider logic;
- provider SDK import in UI/domain;
- one giant `communications-service.ts` containing templates, sending, webhooks, scheduling and RSVP;
- public RSVP page importing private project repository directly;
- raw provider payload types exported through application/domain API;
- guest link security logic duplicated independently in multiple UI routes.