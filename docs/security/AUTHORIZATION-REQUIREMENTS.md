# Mariage OS — Authorization Requirements

Status: **Normative cross-cutting security requirement catalog**

All are P0 unless explicitly stated otherwise.

| ID | Requirement |
|---|---|
| `AUTHZ-001` | Every project-scoped request is denied unless the authenticated user has active membership in the target project. |
| `AUTHZ-002` | Authorization is evaluated from explicit permission keys; feature/domain code must not rely on scattered role-name checks. |
| `AUTHZ-003` | Built-in role→permission mapping is centralized and migration/version controlled. |
| `AUTHZ-004` | Unknown role, missing permission, inactive membership or unavailable authorization state fails closed. |
| `AUTHZ-005` | Cross-project row reads/writes and cross-project references are rejected even when target UUID/path is known. |
| `AUTHZ-006` | Every exposed table/view/RPC/bucket declares read/write permission semantics and direct allow/deny tests. |
| `AUTHZ-007` | RLS and PostgreSQL grants are both explicitly configured; policy presence alone is not considered sufficient. |
| `AUTHZ-008` | System/security-sensitive columns cannot be changed through generic client mutation merely because row write is allowed. |
| `AUTHZ-009` | Member-authored ratings/preferences/approvals can be written only by the authenticated author unless a separately specified recovery/admin flow exists. |
| `AUTHZ-010` | Guest-sensitive, finance, sensitive-document and backup data can be more restricted than ordinary project planning data. |
| `AUTHZ-011` | Search/export/read models filter by effective permissions and cannot become access-control bypasses. |
| `AUTHZ-012` | Role downgrade/revocation takes server-side effect without requiring a fresh login; stale local/JWT role state cannot authorize cloud writes. |
| `AUTHZ-013` | Storage and Realtime enforce project/permission isolation independently from UI knowledge/path knowledge. |
| `AUTHZ-014` | Privileged member/security/delete/full-backup/restore operations require narrow commands and recent/strong authentication as specified. |
| `AUTHZ-015` | Service-role/platform secrets never execute ordinary browser workflows and never appear in public artifacts. |
| `AUTHZ-016` | Platform/support privileges remain separate from project membership; no hidden universal project-owner/support account is allowed. |
| `AUTHZ-017` | Project/account switching cannot leak cached/read-model/Realtime data from another project. |
| `AUTHZ-018` | Public-readiness tests include multiple projects, owner/editor/viewer roles, outsider and revoked-member identities. |
| `AUTHZ-019` | Sensitive authorization failures do not leak existence/content of unauthorized projects/resources. |
| `AUTHZ-020` | Any new table/view/RPC/bucket or sensitive feature must add/update permission mapping and negative authorization tests before merge. |

## Evidence mapping

Each implementation Feature Record touching a protected resource lists applicable `AUTHZ-*` IDs and evidence:

- migration/policy/RPC;
- direct DB/RLS test;
- Storage/Realtime test where applicable;
- E2E permission UX test;
- ASVS mapping.

A required `AUTHZ-*` without objective evidence blocks the relevant lot/checkpoint/release.