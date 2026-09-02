# Offline Behavior

## Objective

Mariage OS is a cloud application, but essential work must remain possible during temporary network loss, especially during venue visits.

## Offline-capable V1 workflows

When the necessary project data has previously been synchronized, users should be able to:

- open recently cached/favorite venues;
- view essential venue facts and visit checklist;
- add/edit notes;
- change personal ratings/favorites;
- complete/create ordinary tasks;
- capture measurements;
- queue structured edits;
- capture media locally for later upload where browser capabilities permit;
- inspect cached upcoming tasks and decisions.

## Online-required or degraded workflows

The following may require network access:

- first login on a new device;
- uncached records/media;
- map tiles;
- external source pages;
- Google Maps routing;
- final cloud membership changes;
- download of uncached original files;
- cloud-wide search where local cache is incomplete.

The UI must label this limitation rather than display generic failures.

## Offline pinning

Users should be able to mark a venue or visit package as `Available offline`. This prepares:

- venue summary;
- critical facts;
- checklist;
- selected photos/previews;
- contact information;
- address/coordinates;
- relevant pending tasks.

Original high-resolution media is not automatically cached unless deliberately selected.

## Storage pressure

The application must monitor browser storage signals where available and degrade conservatively.

Priority of local data retention:

1. unsynchronized mutations;
2. current project metadata and structured data;
3. upcoming/active workflows;
4. explicitly offline-pinned content;
5. thumbnails;
6. disposable cached originals.

Unsynchronized user work must never be evicted as ordinary cache.

## App restart while offline

Pending edits must survive page refresh/browser restart when browser persistence permits.

## Session expiration

If authentication expires while offline, locally cached information may remain available according to the local privacy policy, but cloud synchronization waits for reauthentication. Pending changes remain retained.

## Conflict after long offline period

On reconnection, remote changes are fetched before unsafe pending changes are finalized. Nonconflicting operations merge; genuine conflicts are isolated for review.

## Service worker

The service worker caches the application shell and versioned static assets. It is not the authoritative store for project data.

## Versioning

A new application version must not combine an incompatible old cache/local schema with a new cloud schema. App-shell caches and IndexedDB migrations require explicit version management.

## User-visible network states

- `Online · Synced`
- `Synchronizing…`
- `Offline · N changes pending`
- `Cloud temporarily unavailable · local data available`
- `Sync problem · your local changes are preserved`

## Testing

Offline tests must include reload while offline, pending writes, reconnect, long offline divergence, storage pressure behavior and PWA update interactions.
