# Release Process

## Versioning

Use semantic-style application versions:

- major: incompatible product/data contract change requiring deliberate migration;
- minor: backward-compatible feature set;
- patch: backward-compatible fixes/security hardening.

Pre-release versions may use `-alpha`, `-beta`, `-rc.N`.

## Before a release candidate

- feature specifications/ADRs current;
- migrations complete and tested;
- full CI green;
- coverage and mutation targets satisfied;
- security scans/RLS tests green;
- changelog draft complete;
- synthetic migration/backup fixtures green.

## Release candidate

Deploy preview/release-candidate build against synthetic/nonproduction data.

Perform:

- desktop smoke;
- real mobile smoke where possible;
- offline/reconnect smoke;
- import/export smoke;
- backup/restore verification;
- security configuration/header review;
- free-tier usage/config review.

## Production migration order

Prefer backward-compatible staged database changes so old/new frontend overlap cannot corrupt data.

General principle:

1. backup/checkpoint;
2. deploy backward-compatible DB migration;
3. verify DB/RLS;
4. deploy frontend;
5. verify production smoke;
6. perform cleanup migration only in later compatible release if needed.

Do not combine destructive schema removal with clients that may still depend on it.

## PWA/service-worker release

New version must handle cached clients safely.

- version application cache;
- detect/update service worker;
- prompt/reload when required;
- ensure local IndexedDB migration is compatible;
- never let stale frontend write incompatible payloads silently.

## Changelog

Maintain user-relevant changes:

- Added
- Changed
- Fixed
- Security
- Migration notes when relevant.

## Rollback

Frontend rollback is possible via prior static deployment, but database rollback depends on migration strategy. Prefer forward-compatible fixes and tested recovery rather than assuming every schema migration is trivially reversible.

## Production release blockers

See Quality Gates and Definition of Done. P0/P1 known defects block release.

## V1 real-data cutover

V1 is special:

1. run beta with synthetic project;
2. import representative non-sensitive/controlled test data;
3. verify workflows on couple's real devices;
4. prepare migration inputs from existing Excel/research;
5. export/archive legacy source files;
6. import/reconcile into production;
7. create verified full backup;
8. only then declare Mariage OS operational source of truth.
