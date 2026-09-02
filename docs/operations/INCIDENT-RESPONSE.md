# Incident Response

Mariage OS is a personal project, but private data still deserves a calm, repeatable response when something goes wrong.

## Incident classes

### P0 — Critical

Examples:

- cross-project/private-data exposure;
- leaked privileged secret;
- widespread data corruption/loss;
- compromised owner/admin access with active impact.

### P1 — High

Examples:

- incorrect financial calculation affecting planning decisions;
- broken restore/migration affecting real project;
- persistent sync bug losing local confirmed/pending work;
- serious unauthorized action without confirmed broad exposure.

### P2 — Moderate

Recoverable malfunction without private-data exposure/data loss.

### P3 — Low

Minor UX/noncritical defect.

## Immediate response for data/security incident

1. Stop risky further writes/deployment where needed.
2. Preserve current state/export if safe.
3. Record application version, time and diagnostic ID.
4. Revoke/rotate affected access/secrets where applicable.
5. Reproduce using synthetic/local environment.
6. Identify affected data/operations.
7. Repair through tested migration/script/restore path.
8. Verify integrity and authorization.
9. Add regression tests.
10. Document root cause and preventative action.

## No live improvisation

Do not execute destructive ad-hoc production SQL as the first reaction when a recoverable investigation path exists.

## Secret leak

If a privileged platform secret is exposed:

- treat as compromised immediately;
- rotate/revoke through provider;
- review logs/activity as available;
- remove leaked value from active environment;
- remember that deleting a Git commit does not guarantee a secret was never copied; rotation is required.

## Account compromise

- revoke sessions/change credentials;
- verify membership/roles;
- inspect significant activity/exports/deletions;
- restore/repair if necessary.

## Data corruption

Prefer targeted repair with proof over broad rollback that might erase legitimate newer work. If restore is needed, reconcile carefully against post-backup changes.

## Communication

Because the main users are the couple, incident messaging should be clear:

- what happened;
- what data/work is affected;
- whether current edits are safe;
- what action is required.

## Post-incident review

Every P0/P1 and recurring P2 produces:

- root cause;
- impact;
- detection gap;
- control/test that should have caught it;
- fix;
- regression test;
- documentation/threat-model update if applicable.
