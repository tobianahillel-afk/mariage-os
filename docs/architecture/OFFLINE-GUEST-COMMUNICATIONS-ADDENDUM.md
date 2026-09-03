# Mariage OS — Offline Addendum: Guest Invitations & Communications

Status: **NORMATIVE V1 OFFLINE CONTRACT ADDENDUM**

## Principle

Offline support is explicit per action. A communication operation is not considered safely sendable merely because its draft can be edited offline.

## Couple-side actions

### Allowed offline/local pending

- view cached guest/household/contact summaries authorized for current account/project;
- draft invitation message/template changes;
- draft campaign purpose/audience filters;
- draft RSVP form/question settings;
- edit household contact data as a normal pending structured mutation where validation rules permit;
- view cached historical communication summary.

### Requires cloud revalidation before authoritative commit

- create/rotate/revoke a secure invitation link when token/hash/server state is needed;
- finalize campaign recipient snapshot;
- send/schedule/cancel provider campaign;
- retry provider failures;
- change provider configuration/caps;
- process webhook state;
- unsuppress destination where policy requires server authorization.

The UI must distinguish `draft saved locally` from `campaign scheduled/sent`.

## Guest portal

V1 guest RSVP authoritative submit requires network connectivity.

The guest page may preserve safe in-progress form values locally/session-side during temporary connection loss, but MUST NOT display “response confirmed” until server commit succeeds.

If submit loses connectivity:
- preserve entered values on the page where feasible;
- show explicit not-sent/not-confirmed state;
- allow retry;
- use idempotency to avoid duplicate effect if the original request actually succeeded but acknowledgement was lost.

Do not create a durable long-lived guest offline queue containing capability tokens/PII unless a future reviewed design explicitly adds one.

## Automatic sending

Provider dispatch is server-side/network-required. No service worker/background browser timer may silently dispatch a campaign as authoritative scheduler.

## PWA update

Before activating a new app version:
- preserve couple-side communication drafts/pending structured edits;
- do not replay provider sends from local queue;
- reconcile pending send command state server-side;
- never treat stale client state as permission to resend.

## Logout/session expiry

- draft campaign/contact edits follow normal pending-work safeguards;
- provider sends already accepted remain server-side history;
- safe logout does not attempt to cancel/send campaigns automatically;
- private communication/contact cache is purged according to account/project logout policy after safe completion.

## Cross-project isolation

Cached communication/contact/campaign data is keyed by account + project context. Switching account/project cannot show previous tenant contact data.

## Tests

- offline draft survives reload then syncs;
- offline `Send` is not falsely confirmed;
- lost acknowledgement + retry produces one logical send;
- guest submit connection loss preserves values and one eventual RSVP effect;
- PWA update with pending draft does not dispatch;
- logout with draft follows pending-work policy;
- account/project switch cannot reveal cached contact/message data.