# Authorization / Rights Design Review

Status: **DESIGN PASS — implementation evidence required later**

Scope: project isolation, built-in roles, permission model, relationship rules, privileged operations, Storage/Realtime, offline revocation and future platform-admin access.

## Review questions

### Tenant isolation

- [x] every wedding has stable `project_id`;
- [x] membership is project-scoped;
- [x] project-scoped routes/local stores are defined;
- [x] RLS is authoritative;
- [x] same-project relational integrity is required beyond RLS;
- [x] multi-project synthetic tests are mandatory;
- [x] guessed IDs/paths are explicitly tested.

### Rights inside a project

- [x] role and permission are separate concepts;
- [x] feature code asks for permissions rather than checking role strings;
- [x] owner/editor/viewer built-in role matrix is specified;
- [x] sensitive guest/finance/document access is separately classified;
- [x] own-vs-partner authored rows use relationship constraints;
- [x] Search/export permissions do not bypass domain sensitivity.

### Privileged operations

- [x] member/role administration is protected;
- [x] project deletion/purge is protected;
- [x] sensitive full backup/export is protected;
- [x] restore is protected;
- [x] strong/recent auth requirements are specified;
- [x] critical transitions use narrow commands rather than generic updates;
- [x] protected/system columns cannot be updated through ordinary payloads.

### Cloud/storage/realtime

- [x] grants and RLS are both required;
- [x] Storage has independent permission checks;
- [x] Realtime events are treated as data access;
- [x] service-role is browser-forbidden;
- [x] signed URLs are not treated as permanent authority.

### Revocation/offline

- [x] current DB membership is authoritative;
- [x] stale local role/permission state cannot authorize cloud mutation;
- [x] downgrade/revocation mid-session must be tested;
- [x] project-switch cache/realtime bleed must be tested;
- [x] explicit logout safe-purge semantics remain defined.

### Future public platform/support

- [x] platform operator identity is separate from project role;
- [x] no hidden universal support owner role is allowed;
- [x] V1 has no in-app support impersonation;
- [x] any future support access requires JIT/time limit/audit/security review;
- [x] public launch cannot weaken tenant isolation.

## Normative references

- `security/AUTHORIZATION-MODEL.md`
- `security/ROLE-PERMISSION-MATRIX.md`
- `security/AUTHORIZATION-RLS.md`
- `security/RLS-MATRIX-V1.md`
- `security/RLS-PERMISSION-MAPPING.md`
- `security/PRIVILEGED-OPERATIONS.md`
- `security/PLATFORM-ADMIN-ACCESS.md`
- `security/THREAT-MODEL-AUTHORIZATION-ADDENDUM.md`
- `domain/PHYSICAL-SCHEMA-AUTHORIZATION-ADDENDUM.md`

## Implementation blockers

Design PASS does **not** mean implementation is proven. The relevant lot/checkpoints cannot pass until:

- migrations create permission catalog/role mapping/helper;
- policies/grants/RPCs are implemented;
- role/permission matrix tests pass;
- direct negative RLS/RPC/Storage tests pass;
- multi-project BOLA/IDOR tests pass;
- role downgrade/revocation mid-session tests pass;
- sensitive-field/search/export tests pass;
- no service-role/client leak exists;
- ASVS authorization controls receive evidence.

Any cross-project leak or privilege-escalation path is BLOCKING.