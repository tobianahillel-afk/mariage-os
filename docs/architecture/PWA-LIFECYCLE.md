# PWA and Service-Worker Lifecycle

Status: **Normative architecture contract**

The PWA must improve availability without becoming a source of stale-code/schema failures.

## App shell

Cache only versioned static application assets required to open the application shell. Dynamic wedding data is managed by the local data layer/IndexedDB, not treated as opaque service-worker HTML cache state.

## Version identity

Every production build exposes an application version/build identifier. The local application records:

- app version;
- local schema version;
- last successful cloud schema compatibility check.

## Update behavior

1. Browser discovers a new service worker.
2. New worker installs without silently destroying active old-worker state.
3. Application detects that a new version is ready.
4. If no dangerous unsaved transition exists, UI offers `New version available — reload`.
5. Reload activates compatible new shell.
6. IndexedDB migrations run transactionally before new code assumes new local shape.
7. Cloud schema compatibility is verified.

A new worker must not silently take control mid-form in a way that loses user input.

## Cache naming

Caches are versioned by build/app-shell version. Old cache cleanup occurs only after the new version has successfully activated according to tested lifecycle behavior.

## Compatibility rules

- Frontend version must declare supported cloud schema range.
- Local DB version migrations are sequential/versioned.
- If frontend is too old for current backend schema, it displays an update-required state rather than continuing unsafe writes.
- If backend is temporarily unavailable, compatible cached data remains readable.

## Offline capability

The app shell should open without network after at least one successful prior load where browser capability permits.

Offline functionality is defined by `architecture/OFFLINE.md`; service worker caching must not duplicate local business data ownership.

## Cache invalidation

Do not use indefinite unversioned caches for application JavaScript/CSS.

When a build changes logic affecting sync/schema/security, old application code must not continue indefinitely.

## Failure states

Designed states include:

- update available;
- update download failed;
- local migration failed;
- incompatible app/backend versions;
- stale cache recovered;
- service worker unsupported.

Failure must preserve recoverable local data before destructive repair/reset is proposed.

## Testing requirements

Automated/real-device tests must cover:

- first install;
- normal update;
- update while app is open;
- offline reload;
- old cache after new deployment;
- failed local migration;
- unsupported service-worker environment fallback;
- pending local edits during app update.
