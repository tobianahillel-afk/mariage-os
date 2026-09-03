# PWA and Service-Worker Lifecycle

Status: **Normative architecture contract**

See `engineering/VERSIONING-UPDATE-DELIVERY.md` for release orchestration.

The PWA must improve availability without becoming a source of stale-code/schema failures. Web deployment should make a new release discoverable automatically, while activation must preserve active/pending user work.

## App shell

Cache only versioned static application assets required to open the application shell. Dynamic wedding data is managed by the local data layer/IndexedDB, not treated as opaque service-worker HTML cache state.

## Version identity

Every production build exposes a machine-readable application version/build identifier. The local application records at minimum:

- app version;
- build/commit identity;
- local schema version;
- supported cloud schema range;
- sync protocol version where applicable;
- last successful cloud schema compatibility check.

The release manifest is generated from repository/release metadata rather than maintained as contradictory hand-edited values.

## Update discovery

The running application checks for a newer release:

- on application startup;
- when returning from background/foreground after a meaningful interval;
- through Service Worker update discovery;
- periodically during unusually long-running sessions at a conservative cadence.

Version/release metadata must not be trapped indefinitely in an immutable cache. The update check must remain lightweight and privacy-safe.

## Normal update behavior

1. Production deploy publishes new versioned static shell/release metadata.
2. Browser discovers new Service Worker/release.
3. New worker installs without silently destroying active old-worker state.
4. Application detects that a new version is ready.
5. If no dangerous unsaved transition exists, UI offers a clear update/reload action.
6. Any draft/debounced edit is flushed to durable local state where possible.
7. Reload activates the compatible new shell.
8. IndexedDB migrations run transactionally/sequentially before new code assumes new local shape.
9. Cloud schema/protocol compatibility is verified.
10. Pending synchronization resumes only after compatibility succeeds.
11. Old caches are cleaned only after successful new-version activation.

A new worker must not silently take control mid-form in a way that loses user input.

## Automatic delivery vs safe activation

A web/PWA release is **delivered automatically** by the production deployment: users do not need to install an App Store update.

However, automatic delivery does not mean unsafe forced mid-edit reload.

- compatible ordinary updates may wait for safe user reload/next app open;
- security-critical or backend-incompatible stale clients may require immediate update before further writes;
- local work remains durable/recoverable during either path.

## Forced update / obsolete client

Every release declares a minimum safe app version/compatibility range.

If the current app is below that safe range:

- do not perform incompatible server writes;
- preserve local drafts and pending operations;
- allow safe read/export/recovery behavior where supported;
- display explicit `Update required` state;
- trigger/recommend reload to current supported application;
- run local migrations after update;
- resume writes/sync only after cloud compatibility check passes.

Never fake compatibility because the stale UI still renders.

## Cache naming

Caches are versioned by build/app-shell version. Do not use indefinite unversioned caches for application JavaScript/CSS.

Old cache cleanup occurs only after the new version has successfully activated according to tested lifecycle behavior.

## Compatibility rules

- Frontend version declares supported cloud schema range.
- Local DB migrations are sequential/versioned and support skipped intermediate app openings as defined by policy.
- Sync protocol compatibility is explicit when operation semantics change.
- If frontend is too old for current backend, it enters update-required state instead of continuing unsafe writes.
- If backend is temporarily unavailable, compatible cached data remains readable.
- New frontend/old backend overlap during staged deployment must be explicitly compatible or safely blocked.

## IndexedDB migration

Before a new app version uses a new local schema:

- migration identifies current local version;
- applies each required step in order;
- preserves pending mutations/drafts;
- verifies completion;
- records recoverable failure state;
- never clears private local state as an automatic generic fix.

For V1→V2, historical V1 local fixtures and pending operations are part of the major-upgrade rehearsal.

## Open-tab / multi-tab behavior

Multiple open tabs/windows must not independently perform incompatible migrations or race update activation.

Lot 0/implementation must define a browser-safe coordination mechanism so:

- one migration owner performs local schema upgrade;
- other tabs detect version change;
- stale tabs stop incompatible writes;
- users receive one coherent update state rather than conflicting prompts.

## Offline capability

The app shell should open without network after at least one successful prior load where browser capability permits.

Offline functionality is defined by `OFFLINE.md`; service-worker caching must not duplicate local business data ownership.

A newly deployed release does not invalidate a compatible offline session merely because network is unavailable. Once backend compatibility requires an update, writes remain safely pending until supported app/network state is restored.

## Failure states

Designed states include:

- update available;
- update downloading/installing;
- update ready;
- update required;
- update download failed;
- local migration failed;
- incompatible app/backend versions;
- stale cache recovered;
- multi-tab stale-client warning;
- service worker unsupported.

Failure must preserve recoverable local data before destructive repair/reset is proposed.

## Release verification

After production deployment, smoke verification confirms:

- release manifest/version is current;
- new shell is served;
- service worker can discover the release;
- update path preserves durable local work;
- local migration works from supported previous version;
- backend compatibility check succeeds;
- stale unsupported client is denied unsafe writes;
- application can recover from failed update/migration according to design.

## Testing requirements

Automated/real-device tests must cover:

- first install;
- patch/minor normal update;
- major-version update fixture path;
- update while app is open;
- update with active unsaved/debounced form;
- update with durable pending mutations;
- multiple open tabs/windows;
- offline reload;
- old cache after new deployment;
- failed local migration;
- failed Service Worker install/update;
- unsupported service-worker environment fallback;
- old app/new backend incompatible state;
- new app/old backend staged-overlap state where relevant;
- skipped intermediate local versions;
- V1 local state → V2 upgrade rehearsal.
