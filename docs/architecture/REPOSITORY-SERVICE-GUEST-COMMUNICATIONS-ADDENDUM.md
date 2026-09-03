# Mariage OS — Repository / Service Contracts Addendum: Guest Communications

Status: **NORMATIVE V1 APPLICATION-BOUNDARY ADDENDUM**

## Repositories

### `GuestContactRepository`

Responsibilities:
- list/get household/guest contact points within project;
- create/update/delete according to permission/invariants;
- resolve normalized duplicate candidates;
- read channel eligibility/suppression summaries.

Does not send messages.

### `GuestInvitationRepository`

Responsibilities:
- create/activate/revoke/rotate invitation-link metadata through privileged server command;
- resolve public capability token server-side;
- persist question profile/deadline/allowances;
- append RSVP submission history.

Client implementation MUST NOT receive stored token hash as a reusable secret.

### `CommunicationRepository`

Responsibilities:
- templates;
- campaigns;
- frozen recipient rows;
- attempts/events;
- suppression/history;
- non-secret channel settings.

Does not own provider credentials.

## Application services / commands

### `CreateInvitationLink`

Input: authorized project/household, policy.
Output: metadata + raw link token exactly at intended creation boundary.

Requirements: permission, CSPRNG/server generation, hash storage, same-project check, audit.

### `RotateInvitationLink`

Revokes old capability, creates new one atomically enough that no two unexpected active links remain according to defined policy.

### `ResolveGuestInvitation`

Public capability query. Input raw token; output guest-safe DTO only.

### `SubmitGuestRsvp`

Public capability command. Resolves token, validates schema/allowances/revision/idempotency, applies canonical guest mutations and appends submission history transactionally.

### `BuildCampaignPreview`

Input: project, purpose, audience filters, channel, template/version.
Output: preflight plan with eligible/excluded/problem recipients, cost info when reliable, rendered sample and stable preview fingerprint/revision.

No send side effect.

### `FreezeCampaignAudience`

Server-side operation creating immutable/frozen logical recipient rows from a valid preview before dispatch.

### `DispatchCampaign`

Rechecks send permission, preview/current revision, provider readiness, caps and recipient state; dispatches through provider port with idempotency.

### `RetryFailedRecipients`

Creates bounded retry attempts only for currently eligible failed recipients.

### `IngestProviderEvent`

Called only after provider authenticity verification. Maps provider identifier to stored recipient/attempt, deduplicates, normalizes and appends event/state transition.

### `ScheduleCampaign` / `CancelScheduledCampaign`

Application commands controlling durable server scheduler semantics. Browser does not own execution.

## Public API DTOs

Guest DTO and submit schema are separate types from private Guest/Household entities. Never serialize private domain entity and “delete a few fields” at runtime; define explicit allowlisted guest response types.

## Result types

Commands should return structured outcomes such as:
- success;
- validation failure;
- permission failure;
- stale preview;
- provider unavailable;
- cap exceeded;
- transient provider failure;
- permanent destination failure.

Do not make UI parse provider SDK error strings.

## Transaction boundaries

Transactional DB operations include:
- RSVP canonical mutations + submission history;
- campaign audience freeze;
- invitation rotation state changes;
- event dedup + normalized state update where feasible.

External provider call cannot participate in DB transaction. Use durable state/idempotency/reconciliation patterns instead of pretending it is atomic.

## Testing

Application services use fake repositories/providers for deterministic unit/property tests. Infrastructure adapters receive separate integration/contract tests.