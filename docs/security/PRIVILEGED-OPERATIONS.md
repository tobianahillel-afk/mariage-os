# Mariage OS — Privileged Operations

Status: **Normative V1 + public-readiness security contract**

Purpose: define operations that require more than ordinary project write permission.

## 1. Principles

Privileged operations are:

- narrow server/database commands, not generic row updates;
- denied by default;
- permission-checked against current project membership;
- protected by domain invariants;
- idempotent where retries are plausible;
- audited without secrets/PII payloads;
- protected by recent/strong authentication where impact warrants it.

A client cannot upgrade an ordinary mutation into a privileged transition by adding fields to a request.

## 2. Strong/recent-auth operations

The following require owner permission plus recent/strong authentication (MFA/AAL policy as defined by Auth contract):

- invite another member where public-ready collaboration is enabled;
- change another member's role;
- revoke another member;
- transfer/finalize owner administration where supported;
- archive/delete a project;
- permanently purge project data;
- change security-sensitive project settings;
- generate full sensitive backup/export;
- restore a full backup;
- perform any future operation explicitly classified as security-critical.

Ordinary read/write planning actions do not need repeated MFA prompts.

## 3. Protected domain commands

The following require narrow commands even when recent MFA is not always required:

- select canonical wedding date;
- activate budget scenario;
- finalize/lock/reopen a joint decision;
- record protected payment/refund/deposit transitions;
- resolve retained facts when multiple rows/history must update atomically;
- apply/rollback transactional import;
- invitation accept/revoke;
- seating bulk operations where partial success could violate invariants;
- project membership changes;
- protected document/version/review transitions where required.

## 4. Authorization transaction integrity

For a protected command, the server/database command must use the authoritative values being authorized.

Example: if a user confirms project deletion, the command authorizes deletion of the exact project identified in the protected command and re-checks current membership/assurance immediately before mutation.

Do not trust hidden fields or client-calculated authorization state.

## 5. Membership changes

Membership commands enforce:

- current owner/admin permission;
- same target project;
- target member exists/has expected state;
- last active owner cannot be removed through ordinary flow;
- actor cannot forge target user ID/role escalation;
- revoked member loses cloud access immediately on subsequent authorization evaluation;
- role changes are audited.

## 6. Full backup/export

A full sensitive backup may contain guest PII, finance and sensitive documents.

Requirements:

- `backup.full_export` permission;
- recent strong authentication;
- explicit user action;
- no background generation exposed through predictable public URL;
- output delivered only to the requesting authorized user;
- generated artifact lifecycle/cleanup documented;
- event recorded in privacy-safe audit log;
- export profile/allowlist used for non-full exports.

## 7. Restore

Restore is high impact.

Requirements:

- `backup.restore` permission;
- recent strong authentication;
- backup integrity/version validation before mutation;
- explicit target project/context;
- preview/validation;
- snapshot/recovery point before destructive apply where applicable;
- transaction/staged restoration strategy;
- no cross-project object injection;
- audit event.

## 8. Project deletion

Deletion requires:

- `project.delete`;
- recent strong authentication;
- explicit confirmation tied to exact project;
- optional backup reminder/export step;
- transition to deletion state before physical purge if workflow uses grace period;
- same-project cleanup for DB/Storage/local metadata;
- no deletion of another tenant via supplied ID;
- audit trail retained only according to privacy/retention policy.

## 9. Failed privileged authorization

Failures must:

- fail closed;
- not partially mutate state;
- return safe user-facing error;
- avoid leaking whether another project/resource exists;
- preserve local pending work when appropriate;
- log only privacy-safe diagnostics where security value justifies it.

## 10. Testing

For each privileged command test at least:

- authorized owner success;
- ordinary editor/viewer denial;
- outsider denial;
- other-project owner denial;
- revoked member denial;
- stale client role denial after server-side downgrade;
- insufficient authentication assurance denial;
- tampered project/resource ID denial;
- retry/idempotence behavior;
- failure atomicity;
- audit event presence without secret payload.