# Mariage OS — Dependency Graph Addendum: Invitations & Communications

Status: **NORMATIVE V1 DEPENDENCY ADDENDUM**

This document defines what must recompute, invalidate or remain historical when invitation/RSVP/communication data changes.

## Guest/contact changes

Changing a guest/household contact point:
- invalidates automatic-send eligibility/preflight for unsent campaigns targeting that contact;
- does **not** rewrite historical recipient destination snapshots for already-sent campaigns;
- may clear/retain suppression only through explicit suppression policy, never implicitly.

Changing household membership:
- invalidates RSVP portal composition preview;
- invalidates unsent campaign personalization snapshot;
- may invalidate seating readiness/expected attendance;
- does not rewrite historical submitted RSVP records.

## Invitation-link changes

Creating/activating link:
- enables manual share/QR and link-bearing campaign preflight.

Rotating/revoking link:
- invalidates old URL immediately;
- invalidates unsent recipient snapshots that still contain old URL;
- does not mutate historical sent-message content;
- creates next-action guidance to regenerate/resend when relevant.

Changing deadline/edit policy/question profile:
- affects future guest portal behavior;
- does not rewrite previous submissions;
- unsent campaign copy that embeds deadline becomes stale and requires preview refresh.

## RSVP submission

Accepted attendance response recalculates/invalidate-review:
- confirmed attendance counts;
- expected attendance precedence;
- household/guest RSVP summaries;
- seating readiness and assignments that are now invalid;
- guest-count-dependent budget scenario outputs where configured;
- caterer/venue capacity readiness indicators;
- dashboard RSVP/next-action summaries;
- planning milestones/tasks explicitly dependent on RSVP completion.

Do not automatically rewrite contractual guest counts, vendor quotes or historical budget snapshots.

Guest-added +1/child:
- creates one canonical guest with provenance;
- increments relevant counts once;
- enters seating/unassigned readiness;
- may affect budget estimates;
- must not silently change invitation allowance after consumption except according to defined remaining-allowance semantics.

## Campaign lifecycle

Campaign preview is stale if any of these change before dispatch:
- audience filter source data;
- contact destination;
- link state/token rotation;
- template version;
- relevant public wedding variable;
- provider/channel availability;
- send permission;
- suppression state.

Send command must revalidate preview revision/fingerprint before dispatch.

Delivery-status updates:
- update communication recipient/timeline summaries;
- may create next action for failed/suppressed destinations;
- must not alter RSVP status merely because a message was delivered/read.

## Provider configuration

Provider disabled/credential invalid:
- automatic channel becomes unavailable;
- scheduled sends block/fail safely before dispatch according to operations contract;
- manual link/QR remains available;
- historical communication records remain readable.

## Dashboard/planning

Dashboard may surface:
- RSVP deadline approaching;
- invitations not sent;
- failed communication requiring action;
- households awaiting response;
- high-impact RSVP changes affecting seating/budget.

It must not become a provider telemetry dashboard.

## Search

Search may index household names and high-level invitation/RSVP status if authorized. Raw phone/email/message body/provider IDs are not globally searchable by default.

## Backup/restore

Restoring project communication records does not automatically reactivate provider credentials, scheduled sends or old guest capability tokens without explicit restore policy/re-keying. A restore must never unexpectedly dispatch messages.