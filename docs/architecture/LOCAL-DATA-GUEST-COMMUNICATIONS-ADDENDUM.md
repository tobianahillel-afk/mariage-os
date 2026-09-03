# Mariage OS — Local Data Addendum: Guest Communications

Status: **NORMATIVE V1 LOCAL-DATA ADDENDUM**

## Principle

Local state supports couple-side resilience/drafts but must not become an alternate provider scheduler or a long-lived store of raw guest capability secrets.

## Cached/project-scoped records

Eligible authenticated couple-side cache may include:

- guest/household/contact summaries according to current permissions;
- invitation-link metadata (state/deadline), **not raw token unless the active UI operation temporarily needs it**;
- RSVP current state/history summaries according to cache policy;
- communication templates;
- campaign drafts/previews;
- communication recipient/status summaries;
- provider readiness non-secret metadata;
- suppressions necessary for UI.

All records remain account + project scoped.

## Raw invitation token handling

Raw token is secret capability material.

V1 default:
- generated/returned only through explicit create/rotate action;
- can exist ephemerally in memory/clipboard/share flow;
- not persisted in IndexedDB as ordinary cache;
- not included in activity logs/diagnostics;
- if UI needs to re-display a shareable link later, create/rotate/reissue design must provide a safe mechanism rather than assuming raw token can be recovered from hash.

This implies an implementation decision: either the application treats raw link as one-time display/share and supports rotation/reissue, or stores a separately encrypted retrievable secret through a reviewed mechanism. **V1 default is one-time raw token + reissue/rotation**, because no extra local secret store is currently specified.

## Campaign drafts

Campaign draft/preflight inputs can be durable locally:
- purpose;
- selected filters;
- template draft;
- scheduling intent;
- UI progress.

A locally cached preview is not authoritative dispatch permission. Server revalidation/frozen recipient snapshot is required before send.

## Pending mutations

Allowed ordinary pending local mutations include contact edits/template edits/settings drafts under the normal sync contract.

Provider sends, token rotation/revocation and webhook events are not generic offline mutations.

## Guest public browser

Guest portal does not use the authenticated project's IndexedDB database.

Temporary unsent form state may use ephemeral/session storage or carefully scoped local state if needed for resilience, but:
- do not persist the raw token separately beyond URL/session need;
- do not create a cross-wedding guest data cache;
- clear guest form data after confirmed completion/expiry according to UX/privacy policy.

## Purge

Authenticated logout/account switch purges cached private contact/communication data according to base policy.

Public guest session completion/expiry clears temporary guest data where feasible.

## Version migration

IndexedDB schema migrations for communication cache/drafts must preserve unsynced couple drafts while preventing stale app versions from dispatching provider operations.