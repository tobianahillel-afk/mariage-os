# Secret Management and Rotation

Status: **Normative V1/public-ready secret-handling contract**

## 1. Secret classes

### Public-client configuration

Values explicitly designed by the provider to be embedded in a browser client, for example the Supabase project URL and publishable/anon-equivalent browser key under RLS.

These are **not** authorization secrets. Security must remain correct if an Internet user reads them.

### Privileged application/deployment secrets

Examples:

- Supabase service-role/secret key;
- database password/owner credentials;
- Cloudflare/GitHub deployment tokens where write/admin scope exists;
- SMTP/API secret if public email service is later added;
- platform admin credentials.

Never exposed to browser/public repository.

### User/session bearer secrets

Examples:

- access/refresh tokens;
- invitation bearer token before exchange;
- password-reset/verification code;
- OTP;
- MFA seed/challenge secret.

Never logged/exported/stored redundantly.

### User-controlled encryption secret

`.mariage` backup password/key material.

Never uploaded/stored by Mariage OS merely for recovery convenience.

## 2. Storage locations

Privileged secrets live only in approved platform secret stores/environment configuration with minimum necessary scope.

Never in:

- committed `.env`;
- source code;
- README/docs examples with real value;
- test fixture;
- issue/PR comment;
- screenshot;
- browser bundle;
- diagnostic export;
- analytics/logs.

Local development uses separate non-production credentials/configuration and synthetic data.

## 3. `.env` policy

Repository may include an `.env.example` containing **names and fake placeholders only**.

`.gitignore` excludes real environment files/secrets. Secret scanning is still required because `.gitignore` is not a security control against deliberate/accidental copy-paste into another file.

## 4. Least privilege

Each secret:

- has the minimum provider/repository/environment permissions required;
- is scoped to environment/project where provider permits;
- is not reused across unrelated systems;
- is not shared between development/test/production when separation is available.

GitHub Actions/job tokens use minimum workflow permissions. Untrusted PR code must not receive production secrets.

## 5. Rotation/revocation

Before real production secrets exist, document for each privileged secret:

- owner/system;
- where stored;
- permissions/scope;
- how to rotate;
- how to revoke immediately;
- what application/deployment change follows rotation;
- how to verify old secret is dead;
- expected downtime/rollback.

Rotate immediately after known/suspected exposure. Do not wait for periodic rotation.

Periodic rotation follows provider/risk needs; arbitrary frequent rotation is not a substitute for proper scoping/storage.

## 6. Exposure response

If a privileged secret appears in Git/public artifact/log:

1. treat it as compromised, even if deleted quickly;
2. revoke/rotate at provider first;
3. assess access/logs/impact;
4. remove from repository/history where appropriate;
5. invalidate related sessions/credentials if needed;
6. add regression detection/pre-commit/CI rule where possible;
7. record incident without republishing secret value.

Deleting a commit alone does not make a leaked secret trustworthy again.

## 7. Client bundle/source maps

Production build tests scan generated assets/source maps for:

- service-role/database/deployment keys;
- real backup secrets;
- private environment values;
- auth/session tokens accidentally baked into fixtures/build logs;
- real wedding/private data.

Source maps are deployed only according to the chosen debugging/privacy policy; they must never contain secrets even if access is restricted.

## 8. CI/log redaction

- secrets passed through official secret mechanism;
- shell tracing/debug output must not echo secret values;
- test failures do not dump full environment/auth objects;
- GitHub Actions from forks/untrusted contexts cannot access production secrets;
- artifacts are reviewed for sensitive content.

## 9. Key/token generation

Security tokens/keys use provider/platform cryptographically secure generation. No `Math.random`, timestamps or human-readable predictable token construction.

## 10. Backup password

The backup password belongs to the user, is processed client-side according to `BACKUP-FORMAT.md`, and is never retained by the application as a recoverable server secret.

Losing a backup password may make that encrypted backup unrecoverable; UI/documentation must state this honestly.

## 11. Inventory evidence

Production/security review maintains a secret inventory containing **metadata only**, never values:

| Secret ID | System | Environment | Purpose | Scope | Storage | Rotation method | Last reviewed |
|---|---|---|---|---|---|---|---|

No new privileged secret is introduced without inventory/rotation documentation.

## 12. Tests/controls

- Git secret scanning;
- production bundle/source-map scan;
- synthetic secret fixture verifies scanner behavior where safe;
- no real secret in docs/examples;
- workflow-permission review;
- rotation drill for critical provider secret before public launch when feasible;
- revoked secret/session negative test where provider supports it.
