# Mariage OS Pull Request

## Purpose

- User/system job:
- Current lot:
- Feature IDs (`FTR-*`):
- Requirement IDs:
- Acceptance IDs:
- Security requirements (`SEC-*`, `AUTHZ-*`) if applicable:

## Gate / scope

- [ ] Current `IMPLEMENTATION-STATUS.md` permits this work.
- [ ] No V1 scope change is hidden in this PR.
- [ ] Any product/spec deviation is documented/approved before implementation.
- [ ] Relevant Feature Implementation Record is updated.

## UX / design

- Routes/screens affected:
- Governing blueprint/feature contract:
- Primary user job remains clear:
- [ ] Desktop behavior reviewed.
- [ ] Mobile behavior reviewed.
- [ ] Empty/loading/error/offline/permission/conflict states handled as applicable.
- [ ] Synthetic screenshots attached for material UI changes.
- [ ] No generic mega-table/mega-form/admin-CRUD substitution.

## Architecture / code structure

- Main modules added/changed:
- [ ] Code follows `CODEBASE-STRUCTURE.md` layer/folder rules.
- [ ] No forbidden cross-layer dependency or cycle introduced.
- [ ] No duplicate architectural path/pattern introduced.
- [ ] File/function size and complexity comply with `MODULE-SIZE-COMPLEXITY.md`.
- [ ] Any size/complexity exception is explicitly documented below.
- [ ] No new vague `utils.ts` / `helpers.ts` dumping ground.

Size/complexity exception (normally `NONE`):

## Data / persistence

- Cloud tables/views/RPC/Storage impact:
- Local/IndexedDB impact:
- Migration impact:
- Derived-data/invalidation impact:
- Import/export/backup compatibility impact:
- [ ] Same-project integrity remains valid.
- [ ] Null/unknown/money/date/state semantics remain valid.

## Offline / sync

- Offline class:
- Pending/retry/idempotence impact:
- Conflict behavior:
- Session/project-switch behavior:
- [ ] No local pending work can be silently lost.

## Security / privacy

- Threat-model items:
- Permission keys/RLS policies affected:
- Data classification/PII impact:
- External content/file impact:
- [ ] Boundary input validation added/updated.
- [ ] Direct API/RPC/Storage deny tests added when access changes.
- [ ] No secret/real production data committed.
- [ ] No concatenated SQL/unsafe DOM/custom crypto/insecure token handling introduced.
- [ ] Multi-project isolation tested where project-owned.

## Dependencies

New dependency: `NONE` or name/reason.

If added:
- problem solved:
- native/smaller alternatives considered:
- maintenance/security/license review:
- bundle/runtime/CSP/privacy impact:
- replacement/exit path:

## Tests / evidence

- [ ] Unit/domain tests
- [ ] Boundary/error-path tests
- [ ] Property tests where applicable
- [ ] Mutation tests where required
- [ ] Integration/local persistence
- [ ] DB/RLS allow+deny
- [ ] Security/adversarial
- [ ] Import/export/migration/backup where applicable
- [ ] Offline/reconnect/PWA where applicable
- [ ] Playwright E2E
- [ ] Accessibility
- [ ] Performance/reference dataset where applicable
- [ ] Full required verification from clean environment

Verification summary:

## Documentation / traceability

- [ ] Feature Ledger updated.
- [ ] FIR/evidence updated.
- [ ] Governing docs/ADR updated if semantics/architecture changed.
- [ ] Requirement/Feature/Acceptance traceability remains accurate.
- [ ] `IMPLEMENTATION-STATUS.md` updated if progress materially changed.
- [ ] Changelog/release notes updated if applicable.

## Review findings / limitations

Known limitation/deferred decision:

Open blocker:

Next permitted action after merge:
