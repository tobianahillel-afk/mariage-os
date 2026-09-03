# Mariage OS — State Machines Addendum: Guest Invitations & Communications

Status: **NORMATIVE V1 STATE ADDENDUM**

## Invitation link

States:

`draft → active → revoked`

`active → expired`

`draft → revoked` allowed.

Rotation is modeled as revoke old + create/activate new link, preserving history. An expired/revoked link never transitions back to active; create a new capability instead.

## RSVP submission

Submission is append-oriented, not a mutable state row. The household's current RSVP projection is derived from latest valid canonical guest state + submission history.

A guest edit creates a new submission version/history event and applies validated canonical mutations transactionally.

## Campaign

States:

- `draft`
- `preview_ready`
- `scheduled`
- `sending`
- `partially_sent`
- `sent`
- `completed`
- `cancelled`
- `failed`

Key transitions:

`draft → preview_ready` only after valid audience/template/channel preflight.

`preview_ready → draft` when material preview inputs become stale.

`preview_ready → scheduled` or `sending` after authorization/revalidation.

`scheduled → draft/preview_ready` when material configuration becomes stale before dispatch, according to implementation policy; stale scheduled send MUST NOT dispatch blindly.

`scheduled → cancelled` before provider dispatch boundary when cancellation succeeds.

`sending → partially_sent` when mixed outcomes exist.

`sending/partially_sent → sent/completed` according to all logical recipient terminal/accepted semantics.

A campaign cannot transition back to an earlier state just because a late provider callback has a lower-level status.

## Communication recipient

Normalized states:

- `pending`
- `accepted`
- `sent`
- `delivered`
- `read` (only where channel/provider legitimately reports it)
- `failed`
- `suppressed`

State progression is monotonic according to channel semantics except explicit failure/retry creates a new attempt/history rather than rewriting provider history ambiguously.

Out-of-order callbacks are reconciled using event time/provider semantics; blindly assigning “last callback wins” is forbidden.

## Provider readiness

Operational states:

- `not_configured`
- `configuring`
- `sandbox_ready`
- `production_ready`
- `degraded`
- `disabled`

Provider readiness is configuration/operations state, not campaign state.

## Suppression

Suppression has active/inactive + reason/history semantics. A hard bounce/invalid destination may activate suppression. Unsuppression is explicit/reviewed; changing the contact point may create a different destination subject to fresh validation rather than silently clearing old suppression history.

## RSVP vs delivery independence

Message delivery/read does not transition RSVP state. RSVP response transitions are driven only by authorized couple actions or valid guest submissions.

## Restore/update behavior

Restoring historical campaign state must not move `scheduled` directly into dispatchable production state. Restored scheduled campaigns require explicit reconciliation/activation.

Application version upgrade must preserve terminal send history and pending provider correlation safely.