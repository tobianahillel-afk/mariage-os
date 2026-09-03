# Threat Model — Security Hardening Addendum

Status: **Normative addendum to `THREAT-MODEL.md`**

This addendum records attack classes surfaced during the final pre-code hardening review that must remain explicit even when the first private deployment is small.

## Authentication brute force / enumeration

Threats:

- repeated credential attempts;
- OTP/MFA/recovery abuse;
- signup/recovery email flooding;
- probing whether an email/project exists.

Controls:

- Supabase Auth provider rate limits;
- safe 429/backoff UX;
- public CAPTCHA/Turnstile before open self-service where required;
- generic/non-amplifying errors;
- no custom fail-open lockout bypass;
- application quotas for provisioning/expensive operations.

## SQL/query injection

Threat:

Untrusted values alter SQL/query structure through dynamic string concatenation, unsafe sort/filter identifiers or vulnerable RPC.

Controls:

- parameterized/PostgREST queries;
- static SQL;
- `EXECUTE ... USING` for unavoidable dynamic values;
- strict allowlist for identifiers;
- no raw SQL fragments from client;
- direct injection payload tests;
- safe `SECURITY DEFINER` search path/grants.

## DOM/XSS injection

Threat:

Untrusted wedding/import/source text reaches executable DOM/HTML/script sink.

Controls:

- plain-text rendering;
- no unsafe dynamic execution;
- restrictive CSP;
- Trusted Types where compatible;
- URL protocol validation;
- centralized sanitizer only if future rich HTML exists.

## Prototype pollution / object injection

Threat:

Malicious JSON/import keys such as `__proto__` mutate application prototypes/config/security state.

Controls:

- runtime schemas;
- explicit field construction;
- reject dangerous keys where relevant;
- avoid generic deep merge of untrusted objects;
- pollution regression tests.

## ReDoS / parser resource exhaustion

Threat:

Attacker-controlled text/files cause catastrophic regex backtracking, huge JSON nesting, massive spreadsheets/images or expensive search/export work.

Controls:

- bounded inputs/counts;
- no arbitrary user regex compilation;
- safe parsers;
- pagination/concurrency limits;
- pathological-input tests.

## CSRF / CORS / open redirect

Threats:

- future ambient-cookie endpoint accepts cross-site state-changing request;
- permissive CORS exposes private endpoint;
- malicious redirect parameter sends Auth flow/token/user to attacker domain.

Controls:

- current bearer-token API architecture documented;
- no state-changing GET;
- future cookie endpoint CSRF/SameSite/Origin protection;
- explicit CORS;
- exact redirect allowlist/PKCE/provider flow;
- redirect tests.

## Protocol/header misconfiguration

Threats:

- mixed/insecure content;
- missing anti-framing;
- overly broad CSP/connect/script origins;
- leaking private route in Referer;
- unnecessary browser capability permissions.

Controls:

- HTTPS-only production;
- HSTS after safe rollout;
- production CSP/header tests;
- restrictive Referrer/Permissions Policy;
- no blind COOP/COEP changes that break required resources.

## Token/secret leakage

Threat:

Auth/service/admin/invite/backup secrets leak through Git, logs, source maps, URLs, screenshots or diagnostics.

Controls:

- secret classification/inventory;
- approved secret stores;
- no redundant token storage;
- secret/build scanning;
- rotation/revocation procedure;
- exposed privileged secret treated as compromised.

## Weak/predictable security tokens

Threat:

Invite/nonces/secrets generated from `Math.random`, timestamps or predictable values.

Controls:

- provider/platform cryptographically secure randomness;
- no custom token construction;
- static/security tests around security-token modules.

## SSRF (future gated)

Threat:

Future server-side fetch of a user URL reaches localhost/private/cloud metadata/internal service or exfiltrates credentials.

Controls before activation:

- scheme/destination allow/deny policy;
- IP/DNS/redirect validation;
- metadata/private network blocking;
- no credential forwarding;
- size/time limits;
- dedicated SSRF suite.

V1 currently has no privileged arbitrary server URL fetch.

## Command injection (future gated)

Threat:

Future server/tool executes user-controlled data through shell/process command.

Controls before activation:

- prefer library/API;
- argument-array/no-shell process calls;
- allowlisted binaries/arguments;
- no string-concatenated shell command;
- dedicated review/tests.

V1 runtime currently has no command-execution requirement.

## Security configuration drift

Threat:

Application remains unchanged while provider Auth/RLS/rate-limit/TLS/dependency/security defaults evolve, leaving prior assumptions false.

Controls:

- provider/configuration review before real cutover and each major/public release;
- current ASVS review;
- dependency/security advisories;
- versioned evidence of Auth/CSP/headers/RLS/Storage configuration.

## Fail-open error handling

Threat:

Parser/permission/provider/security failure is caught and replaced by permissive default.

Controls:

- unknown authorization/security state denies;
- invalid input rejects;
- MFA/provider outage never silently bypasses protected operation;
- security-relevant catch paths have explicit tests.
