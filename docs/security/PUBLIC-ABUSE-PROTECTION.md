# Mariage OS — Public Abuse Protection Contract

Status: **Public-launch security contract; architecture-aware during private V1**

Private V1 does not expose self-service public project creation. However, the application must be ready to enable public signup without making abuse controls an afterthought.

This document defines the controls that become mandatory before `public_saas` mode is enabled.

---

## 1. Threats added by public self-service

Public signup materially expands attack surface:

- automated account creation;
- project-spam/free-tier exhaustion;
- invitation spam;
- password-reset/email abuse;
- credential stuffing/login abuse;
- large-file/storage exhaustion;
- import CPU/memory abuse;
- scripted creation of expensive Realtime/database load;
- enumeration of accounts/projects/invitations;
- support/contact spam;
- malicious files/URLs/content;
- attempts to exploit cross-tenant IDs;
- future billing/fraud abuse if payments are introduced.

Public launch is prohibited unless these risks have explicit controls and tests.

---

## 2. Auth bot protection

Before public signup:

- Supabase Auth CAPTCHA/bot protection is enabled with Cloudflare Turnstile (or an explicitly reviewed equivalent);
- signup challenge token is passed through the supported Auth mechanism;
- sign-in/password-reset flows are protected where provider/configuration supports it;
- CAPTCHA configuration/hostnames are environment-specific;
- CAPTCHA failure never leaks account existence;
- tests cover missing/invalid/replayed challenge behavior where testable;
- E2E test environments use documented provider test/bypass strategy without weakening production.

Do not implement a visual-only CAPTCHA whose token is never validated.

---

## 3. Auth rate limits

Supabase Auth provider rate limits are reviewed/tuned before public launch for at least:

- signup/email sends;
- password recovery;
- OTP/magic-link flows if enabled;
- verification;
- token refresh;
- MFA challenge/verification.

Application UX handles `429`/rate-limit responses gracefully without infinite automated retry.

Rate-limit configuration is documented as deployment configuration, not assumed from provider defaults forever.

---

## 4. Project-provisioning abuse control

Authentication alone is insufficient permission to create unlimited projects.

Public `ProjectProvisioningService` must apply server/database-controlled policy including:

- verified account;
- public mode enabled;
- accepted required legal versions;
- per-account project entitlement;
- recent provisioning rate/abuse checks;
- idempotency key/double-submit protection;
- safe defaults/quota initialization;
- atomic tenant+owner creation.

Project-creation denial must not affect access to projects the user already owns.

Private mode continues to deny unrelated provisioning.

---

## 5. Invitation abuse control

Public-scale invitations need additional policy beyond token security:

- inviter must have project permission;
- maximum outstanding invites/project;
- resend cooldown;
- per-user/project issuance rate limits;
- normalized destination handling;
- expiry/revocation;
- token hashes only persisted;
- no account-enumerating messages;
- eventual transactional email uses server-side provider credentials only;
- an abuse/spam complaint path exists before broad public launch.

The private V1 manual-link-share path may remain simpler while using the same invitation data semantics.

---

## 6. File/storage abuse

Before broad public access, uploads enforce:

- allowlisted file families/MIME/signature checks according to file-security contract;
- per-file maximum;
- project/account storage entitlement;
- preflight projected quota check for large batches;
- import row/column/sheet limits;
- orphan upload cleanup;
- no executable active content rendering;
- separate derivative/original accounting where useful;
- rate limiting/backpressure for repeated failed or large uploads if required by observed abuse.

Structured core wedding data should remain usable when media quota is exhausted.

---

## 7. Import abuse

Import parsing is local/browser-side where practical, but still needs limits because hostile files can exhaust the client's memory/CPU.

Controls:

- supported format allowlist;
- compressed archive/ZIP-bomb protections where relevant;
- row/column/sheet/file-size ceilings;
- Web Worker parsing for large supported inputs;
- cancellation/progress;
- schema depth/collection-size limits for JSON;
- no macro/script execution;
- import preview before remote mutation;
- remote commit operation limits/batching.

Public launch does not relax conservative import semantics.

---

## 8. Application/API abuse

Ordinary project CRUD remains protected by RLS and tenant isolation.

Where observed/public traffic justifies it, additionally apply:

- provider/network rate limits;
- operation-specific throttling for expensive endpoints/functions;
- pagination and maximum query windows;
- Realtime subscription limits/scoping;
- server-side idempotency for public control-plane operations;
- bounded search/import/report/export workloads.

Never solve abuse by weakening offline guarantees or tenant authorization.

---

## 9. Enumeration resistance

Public-facing flows must not make it easy to discover:

- whether a specific email has an account;
- whether a project UUID exists when caller lacks membership;
- invited partner identity beyond what authorized inviter already knows;
- guest/vendor/project contents;
- Storage object existence across tenants.

Responses use generic wording where disclosure adds no legitimate user value.

---

## 10. Transactional email readiness

Private V1 can minimize email dependence.

Before public self-service, review provider email limits/deliverability and configure a production-capable transactional SMTP/provider if required.

Email templates must:

- use controlled application domains;
- avoid leaking sensitive project details in subject/preheader unnecessarily;
- support confirmation/recovery/invitation security requirements;
- account for link scanners/single-use link behavior;
- disable provider link rewriting/tracking if it breaks auth links;
- be tested across common email clients.

No SMTP/service secret enters public frontend code.

---

## 11. Public form/contact protection

If public marketing adds contact/support/waitlist forms:

- protect abuse-sensitive forms with Turnstile or reviewed equivalent;
- verify challenge server-side/provider-side;
- apply submission rate limits;
- minimize stored PII;
- do not route raw messages into public logs/issues;
- sanitize rendered user content;
- define retention/deletion.

---

## 12. Admin/support operations

Privileged support actions are higher-risk abuse targets.

Future support/admin operations require:

- separate privileged authentication/authorization;
- MFA;
- server-side secret handling;
- audit trail;
- least privilege;
- bounded actions;
- explicit target tenant;
- no generic browser service-role client.

Support tooling is not required for private V1, but no production code may assume that ordinary project owners are global admins.

---

## 13. Monitoring without privacy overcollection

Public abuse monitoring may require aggregate/security telemetry, but:

- collect only data necessary to defend/operate the service;
- avoid copying wedding content into security logs;
- redact tokens/secrets;
- define retention;
- separate diagnostic identifiers from guest/person details;
- document any external monitoring provider before launch.

---

## 14. Mandatory public-launch tests

At minimum:

- bot challenge missing/invalid denied on protected signup;
- verified-user requirement for provisioning;
- project creation entitlement enforced;
- repeated provisioning idempotent/limited;
- unrelated users still cross-tenant denied;
- excessive invite issuance limited;
- email/account enumeration responses reviewed;
- Storage quota prevents large upload without blocking text CRUD;
- hostile/import-limit fixtures rejected safely;
- rate-limit errors do not cause retry storms;
- no privileged secret in client bundle;
- public marketing routes cannot access private wedding APIs/data anonymously;
- private `/app` routes remain non-indexable.

---

## 15. Public-mode release blocker

`public_saas` deployment mode must not be enabled merely because signup UI exists.

It requires PASS of `operations/PUBLIC-LAUNCH-GATE.md` and corresponding security/abuse evidence.
