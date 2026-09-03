# Mariage OS Release Plan — vX.Y.Z

Status: `PLANNED | CANDIDATE_BUILDING | CANDIDATE_VERIFYING | READY_FOR_PRODUCTION | PRODUCTION_MIGRATING | PRODUCTION_DEPLOYING | PRODUCTION_VERIFYING | HEALTHY | DEGRADED | FAILED | ROLLING_BACK | ROLLED_BACK | SUPERSEDED`

## Identity

- Target version:
- Release type: `PATCH | MINOR | MAJOR`
- Release channel:
- Exact commit SHA:
- Build ID:
- Release owner:
- Reviewer/approver:
- Planned release date:
- Production deployment ID/ref:

## Included scope

- Feature IDs:
- Requirement IDs:
- Acceptance IDs:
- Security/Authz IDs:
- User-visible summary:
- V1/V2 scope delta if major:

## Version matrix

| Layer | Before | After | Compatibility / migration |
|---|---|---|---|
| App | | | |
| Cloud/PostgreSQL | | | |
| RLS/RPC contract | | | |
| IndexedDB | | | |
| Sync protocol | | | |
| Import schema | | | |
| Backup schema | | | |
| Service Worker/cache | | | |
| Persisted settings | | | |

- Minimum safe app version after release:
- Old frontend supported cloud range:
- New frontend supported cloud range:

## Surface impact

Mark every affected interface:

- [ ] Dashboard
- [ ] Search
- [ ] Inbox
- [ ] Venues collection/detail/compare/visit
- [ ] Vendors
- [ ] Guests/households
- [ ] Seating
- [ ] Budget/scenarios/payments
- [ ] Tasks
- [ ] Decisions
- [ ] Planning
- [ ] Timeline
- [ ] Documents
- [ ] Map/access
- [ ] Import/export
- [ ] Settings/Diagnostics
- [ ] Mobile variants
- [ ] Desktop/tablet variants
- [ ] Offline/conflict/error states
- [ ] Print/export/frozen snapshots
- [ ] Accessibility/help/release text
- [ ] No user-visible interface impact

## Database / cloud migration

- Pending migration files:
- Expand phase:
- Backfill/data migration:
- Switch phase:
- Contract/cleanup deferred to release:
- Migration dry-run result:
- Staging result:
- RLS/constraint integrity result:
- Production recovery point:
- Irreversible operations:

## Local/PWA migration

- IndexedDB migration path(s):
- Pending mutation preservation proof:
- Old Service Worker/cache compatibility:
- Update-in-open-tab behavior:
- Forced-update condition:
- Failed local migration recovery:

## Import/export/backup

- Import compatibility:
- Export compatibility:
- Backup compatibility:
- Historical fixtures upgraded:
- V1→current restore test:
- Future-version rejection test:

## Security / privacy

- Threat-model delta:
- Auth/RLS/permissions impact:
- Release credential requirements:
- Secret exposure review:
- Supply-chain changes:
- PII/diagnostic impact:
- Dedicated security review required/result:

## Candidate evidence

- [ ] clean install
- [ ] format/lint/typecheck
- [ ] architecture/dependency rules
- [ ] module complexity limits
- [ ] unit/property/coverage
- [ ] mutation tests where required
- [ ] DB migration/reset
- [ ] RLS allow/deny/adversarial
- [ ] IndexedDB migration
- [ ] import/export/round-trip
- [ ] backup/restore/migration
- [ ] offline/sync/PWA
- [ ] E2E
- [ ] accessibility
- [ ] performance
- [ ] security/secret/dependency scans
- [ ] production build
- [ ] staging deploy
- [ ] desktop smoke
- [ ] mobile smoke
- [ ] visual review where applicable
- [ ] documentation/traceability

Verification links/results:

## Production sequence

1. Deployment lock acquired:
2. Production migration history verified:
3. Recovery point verified:
4. Expand migrations applied:
5. DB/RLS health checks:
6. Production ref promoted:
7. Cloudflare deployment successful:
8. Release manifest verified:
9. Production smoke:
10. Release marked `HEALTHY`:

## Post-release monitoring

Observation period/result:

- app boot errors:
- auth anomalies:
- DB/migration issues:
- RLS/permission issues:
- sync queue failures:
- conflicts abnormality:
- IndexedDB migration failures:
- update-required/PWA failures:
- import/backup errors:
- quota/resource pressure:
- performance regressions:
- support/user-reported blocker:

## Rollback / forward-fix

- Previous frontend release:
- Is previous frontend compatible with post-release DB? `YES / NO`
- Frontend rollback procedure:
- DB recovery/forward-fix procedure:
- Dangerous writes kill-switch/degraded-mode plan:

## Major upgrade only

For `MAJOR`:

- [ ] previous-major feature inventory reconciled
- [ ] new specification/scope delta approved
- [ ] cloud migration chain proven
- [ ] IndexedDB sequential upgrade proven
- [ ] sync protocol migration proven
- [ ] import schema migration proven
- [ ] backup migration/restore proven
- [ ] user preferences migrated
- [ ] all changed routes/screens reviewed
- [ ] historical production-like synthetic project upgraded in place
- [ ] recovery rehearsal completed
- [ ] minimum old-client version/forced update defined
- [ ] irreversible cleanup deferred until healthy

## Final decision

- Open blockers:
- Known limitations:
- Final status:
- Approved by:
- Release evidence URL(s):
- Next release/cleanup action:
