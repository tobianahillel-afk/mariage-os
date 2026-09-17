# Secret Management and Rotation

Status: **Normative V1/public-ready secret-handling contract**

## 1. Secret classes

### Public-client configuration

Values explicitly designed by the provider to be embedded in a browser client, for example the Supabase project URL and publishable/anon-equivalent browser key under RLS.

These are **not** authorization secrets. Security must remain correct if an Internet user reads them.

### Privileged application/deployment secrets

Examples:

- Supabase service-role/server secret key, including the value bound to Pages as `PRIVATE_DOCUMENT_ADMIN_KEY`;
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

For Cloudflare Pages Functions, privileged values are stored as encrypted secrets for the exact Pages environment. Plain-text `vars`, static asset environment substitution and committed Wrangler values are not approved locations for privileged credentials.

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

Local Wrangler/Pages development may use ignored `.dev.vars` or `.env` files with synthetic/non-production values only. Production values are never copied into local development files merely for convenience.

## 4. Least privilege

Each secret:

- has the minimum provider/repository/environment permissions required;
- is scoped to environment/project where provider permits;
- is not reused across unrelated systems;
- is not shared between development/test/production when separation is available.

GitHub Actions/job tokens use minimum workflow permissions. Untrusted PR code must not receive production secrets.

`PRIVATE_DOCUMENT_ADMIN_KEY` is additionally constrained by application architecture: it may be consumed only inside the narrow same-origin Pages private-document abandon boundary or the ADR 0011 private Worker promotion executor, only after current-user authentication plus live project/document authorization and authoritative target-state validation. Possession of the binding is not itself a user authorization decision.

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

For `PRIVATE_DOCUMENT_ADMIN_KEY`, planned rotation is provider-first and environment-specific: create/activate the replacement Supabase server/service credential, replace the Cloudflare Pages and private Worker encrypted secrets in the intended environment, deploy the exact approved application candidate, run the private-document route smoke and synthetic/non-production success proof where permitted, then revoke the previous credential. For an exposure incident, revoke/disable the exposed provider credential immediately, accept temporary fail-closed document promotion if necessary, install the replacement secret in both runtimes, redeploy and verify recovery. In both cases, verify the previous credential is rejected before declaring rotation complete.

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

For the Pages private-document boundary, production smoke may assert secret presence indirectly through fail-closed/success behavior but must never echo, hash, fingerprint or otherwise publish `PRIVATE_DOCUMENT_ADMIN_KEY` itself.

## 9. Key/token generation

Security tokens/keys use provider/platform cryptographically secure generation. No `Math.random`, timestamps or human-readable predictable token construction.

## 10. Backup password

The backup password belongs to the user, is processed client-side according to `BACKUP-FORMAT.md`, and is never retained by the application as a recoverable server secret.

Losing a backup password may make that encrypted backup unrecoverable; UI/documentation must state this honestly.

## 11. Inventory evidence

Production/security review maintains a secret inventory containing **metadata only**, never values:

| Secret ID | Owner / system | Environment | Purpose | Scope | Storage | Rotation / revocation | Verification | Last reviewed |
|---|---|---|---|---|---|---|---|---|
| `PRIVATE_DOCUMENT_ADMIN_KEY` | Mariage OS production operator / Supabase | isolated value per preview/staging/production environment where the trusted route is enabled | privileged Storage copy/remove plus service-only private-document attestation after user authz | Supabase server/service credential scoped to exactly one Supabase project; server-only; usable only through the narrow Pages ingress/Worker executor by application contract | a Cloudflare Pages encrypted secret and a separate private Worker encrypted secret; never browser, Git, static artifact or plain-text variable | rotate/revoke at Supabase, replace both runtime secrets, deploy and smoke; revoke immediately on suspected exposure | route deny checks plus synthetic/non-production trusted-flow proof where allowed; verify the previous credential is rejected; review logs/artifacts for value absence | 2026-09-17 |

`SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`/anon-equivalent are configuration/public-client values, not privileged inventory entries, unless a future provider contract changes their secrecy classification.

No new privileged secret is introduced without inventory/rotation documentation.

## 12. Tests/controls

- Git secret scanning;
- production bundle/source-map scan;
- synthetic secret fixture verifies scanner behavior where safe;
- no real secret in docs/examples;
- workflow-permission review;
- rotation drill for critical provider secret before public launch when feasible;
- revoked secret/session negative test where provider supports it;
- Pages private-document production smoke proves missing/invalid privileged configuration fails closed rather than falling through to static content or a legacy origin.
