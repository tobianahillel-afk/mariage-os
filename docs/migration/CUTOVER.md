# Production Cutover Checklist

Mariage OS becomes the operational source of truth only after this checklist is satisfied.

## Product readiness

- [ ] V1 required features implemented according to contracts.
- [ ] Critical desktop/mobile workflows usable by both owners.
- [ ] Offline venue/task workflow validated on real device.
- [ ] Dashboard answers next-action/blockers/budget correctly.

## Security

- [ ] Both owners use individual accounts.
- [ ] MFA/TOTP configured according to production policy.
- [ ] RLS enabled/tested on all exposed private tables.
- [ ] Storage policies tested.
- [ ] No service-role/secret key in frontend/repository.
- [ ] ASVS applicable V1 controls verified.
- [ ] No known Critical/High vulnerability accepted.

## Data integrity

- [ ] All migrations green from clean database.
- [ ] Historical schema fixtures migrate.
- [ ] Import/export round-trip tests pass.
- [ ] Backup/restore test passes.
- [ ] Sync/offline conflict tests pass.

## Existing data migration

- [ ] Venue list imported and statuses reconciled.
- [ ] Venue codes/duplicates reviewed.
- [ ] Guest workbook imported.
- [ ] Guest totals/probabilities/priority cumulatives match legacy expected values.
- [ ] Vendor/caterer data imported as desired.
- [ ] Private data classification reviewed.

## Finance

- [ ] Currency/money calculations verified.
- [ ] Existing committed/paid amounts reviewed if any.
- [ ] Refundable cautions not counted as final cost.

## Recovery

- [ ] Complete production backup exported.
- [ ] Backup integrity verification passes.
- [ ] Restore tested in clean recovery environment/project.
- [ ] Legacy Excel/source files archived read-only outside GitHub.

## Cloud/free tier

- [ ] Supabase project active/configured.
- [ ] Cloudflare production deploy configured.
- [ ] Usage comfortably below free-tier limits.
- [ ] No paid automatic upgrade path relied upon.

## Real devices

- [ ] Owner A phone.
- [ ] Owner B phone.
- [ ] At least one desktop/laptop.
- [ ] PWA install/fallback verified.
- [ ] Login/session recovery tested.

## Final switch

After both owners approve:

- [ ] record cutover date/time;
- [ ] mark Mariage OS as operational source of truth;
- [ ] stop editing legacy workbook except as archived reference;
- [ ] schedule next external backup reminder.

If a blocking item fails, cutover is postponed rather than worked around informally.
