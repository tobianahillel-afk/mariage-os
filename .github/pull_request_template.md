# Mariage OS Pull Request

## Purpose

- User/system job:
- Current lot:
- Work Packet ID (or `N/A` for non-lot work):
- Work Packet state/pass:
- Feature IDs (`FTR-*`):
- Requirement IDs:
- Acceptance IDs:
- Security requirements (`SEC-*`, `AUTHZ-*`, `RSVP-*`, `COM-*`) if applicable:

## Gate / scope

- [ ] Current `IMPLEMENTATION-STATUS.md` permits this work.
- [ ] Current Lot/Work Packet/pass permits this work.
- [ ] No V1 scope change is hidden in this PR.
- [ ] Any product/spec deviation is documented/approved before implementation.
- [ ] Relevant Feature Implementation Record is updated.
- [ ] Relevant Work Packet Record is updated when this PR belongs to AI-orchestrated Lot work.

## Work Packet / orchestration

- Packet responsibilities covered:
- Prior packet/dependencies:
- Downstream packet impact:
- Complexity planning points:
- [ ] Packet sizing is within `AI-LOT-ORCHESTRATION.md` or an approved exception exists.
- [ ] If this is Pass A, packet will end at `REVIEW_PENDING`, not self-accept.
- [ ] If this is Pass B, review reconstructed expected behavior from repository contracts and searched for omissions/adversarial cases.
- [ ] If this is Pass C, `EXPECTED vs IMPLEMENTED vs VERIFIED` reconciliation is complete.
- [ ] No unrelated Work Packet is left partially `IN_PROGRESS` without explicit orchestration approval.

## UX / design

- Routes/screens affected:
- Governing blueprint/feature contract:
- Primary user job remains clear:
- QIF applicable? `YES / NO`:
- [ ] Desktop behavior reviewed.
- [ ] Mobile behavior reviewed.
- [ ] Empty/loading/error/offline/permission/conflict states handled as applicable.
- [ ] Synthetic screenshots attached for material UI changes.
- [ ] No generic mega-table/mega-form/admin-CRUD substitution.
- [ ] QIF evidence passes where applicable.

## Architecture / code structure

- Main modules added/changed:
- [ ] Code follows `CODEBASE-STRUCTURE.md` layer/folder rules.
- [ ] No forbidden cross-layer dependency or cycle introduced.
- [ ] No duplicate architectural path/pattern introduced.
- [ ] File/function size and complexity comply with `MODULE-SIZE-COMPLEXITY.md`.
- [ ] Any size/complexity exception is explicitly documented below.
- [ ] No new vague `utils.ts` / `helpers.ts` dumping ground.
- [ ] Provider SDKs remain in infrastructure adapters where applicable.

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
- [ ] Server-required action is not falsely presented as finalized offline.

## Security / privacy

- Threat-model items:
- Permission keys/RLS policies/capability endpoints affected:
- Data classification/PII impact:
- External content/file/provider impact:
- [ ] Boundary input validation added/updated.
- [ ] Direct API/RPC/Storage/capability deny tests added when access changes.
- [ ] No secret/real production data committed.
- [ ] No concatenated SQL/unsafe DOM/custom crypto/insecure token handling introduced.
- [ ] Multi-project/cross-household isolation tested where applicable.
- [ ] Webhooks/provider callbacks are authenticated/deduplicated where applicable.

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
- [ ] Capability/provider/webhook contract tests where applicable
- [ ] Security/adversarial
- [ ] Import/export/migration/backup where applicable
- [ ] Offline/reconnect/PWA where applicable
- [ ] Playwright E2E
- [ ] Accessibility
- [ ] Performance/reference dataset where applicable
- [ ] Full required verification from clean environment

Verification summary:

## Documentation / traceability

- [ ] Applicable Feature Ledger(s) updated.
- [ ] FIR/evidence updated.
- [ ] Work Packet Record/current pass updated when applicable.
- [ ] Governing docs/ADR updated if semantics/architecture changed.
- [ ] Requirement/Feature/Acceptance traceability remains accurate.
- [ ] `IMPLEMENTATION-STATUS.md` updated if progress materially changed.
- [ ] Changelog/release notes updated if applicable.

## Lot-level closure only

Complete only for a PR/review that closes a Lot:

- [ ] Every planned Work Packet is `ACCEPTED`.
- [ ] Mechanical `required - accepted/evidenced` reconciliation is empty.
- [ ] Separate Lot Integration Pass is green.
- [ ] Base + applicable addendum Lot acceptance is green.
- [ ] Required checkpoint state is correct.

## Review findings / limitations

Known limitation/deferred decision:

Open blocker:

Next permitted action after merge:
