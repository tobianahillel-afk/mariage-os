# Security Testing

Status: **Normative V1/public-ready adversarial security verification contract**

## Objective

Security controls are verified through direct adversarial tests/configuration inspection, not assumed from UI behavior or documentation.

A successful happy-path test is never sufficient evidence for authorization, input validation or injection prevention.

## 1. Authentication / brute-force / recovery

Verify:

- valid/invalid/unverified identity;
- provider rate-limit behavior and application handling of 429 responses;
- no retry storm/tight-loop after auth throttling;
- generic account-enumeration-safe errors where applicable;
- password policy/config evidence if password mode is used;
- PKCE/redirect callback/replay/open-redirect cases if redirect auth is used;
- invalid/expired/reused authorization code;
- MFA enrollment/challenge/required privileged action;
- MFA bypass attempt;
- recovery path;
- invitation expiry/replay/wrong identity;
- logout/relogin with pending local mutation;
- stale session after role downgrade/revocation;
- no raw auth/reset/invite/MFA token in logs/URLs/build/diagnostics.

Before future public self-service activation, test CAPTCHA/Turnstile and provisioning/signup abuse controls.

## 2. Authorization suite

For every project-scoped table/resource:

- anonymous read denied;
- anonymous write denied;
- permitted member reads own project;
- member cannot read another project;
- member cannot insert/update with another project ID;
- removed member denied;
- viewer/editor restrictions;
- protected administrative fields cannot be escalated client-side;
- permission removed/role downgraded takes effect on subsequent cloud operations;
- user cannot write partner-authored ratings/approvals/preferences;
- missing/unknown permission fails closed;
- direct REST/RPC calls behave exactly as policy requires.

## 3. Storage suite

- unauthorized object read denied;
- cross-project path/object denied;
- unauthorized upload/update/delete denied;
- guessed/signed/private link behavior verified;
- signed URL is scoped/time-limited as designed;
- malformed/path traversal names handled safely;
- sensitive-document permission stricter than ordinary media where configured;
- orphan cleanup does not cross project boundaries.

## 4. SQL/query injection suite

Adversarial data includes quotes, semicolons, comment markers, UNION/boolean-like payloads, wildcard/search metacharacters, malicious sort/filter keys and schema/table-looking strings.

Verify:

- payload treated as data/rejected;
- no SQL structure modification;
- no raw SQL/WHERE/ORDER expression accepted from client;
- dynamic identifier allowlist rejects unknown key;
- any dynamic PL/pgSQL path uses safe parameter binding/identifier handling;
- no error reveals useful SQL/schema internals;
- security-definer RPC cannot be abused via search_path/object-resolution tricks.

Static/code review checks flag new raw/dynamic query construction for mandatory review.

## 5. XSS / DOM / URL suite

Payloads in:

- venue/vendor/guest names;
- notes;
- captions;
- imported headers/values;
- source labels;
- search terms/highlighting;
- URL values;
- route/query parameters.

Verify:

- no script execution;
- dangerous/encoded protocols rejected;
- no DOM-sink bypass;
- Trusted Types enforcement/policy where enabled;
- CSP blocks unexpected scripts/frames;
- open redirects rejected;
- external link opener/referrer privacy behavior.

## 6. Prototype pollution / object injection

Test imported/JSON/clipboard values containing:

- `__proto__`;
- `constructor`;
- `prototype`;
- nested malicious objects;
- unexpected configuration/permission-shaped fields.

Verify:

- runtime schema rejects/strips according to policy;
- global/object prototype not modified;
- permissions/configuration cannot be injected through data merge;
- no generic unsafe deep merge of untrusted objects.

## 7. ReDoS/resource-input suite

- very long search/tag/name/URL values;
- pathological regex metacharacter patterns;
- huge JSON nesting/array counts;
- many CSV rows/columns/sheets;
- large image dimensions with bounded file bytes;
- oversized pagination/filter/export requests.

Verify bounded CPU/memory/runtime and explicit rejection rather than browser/server hang.

## 8. File/import adversarial suite

- MIME/extension/signature mismatch;
- oversized file;
- malformed XLSX/CSV/JSON;
- formula-injection strings;
- macro-containing workbook handled without execution;
- malicious HTML/JS/SVG upload rejected/not executable;
- archive traversal/symlink/absolute paths;
- decompression bomb/huge entry count;
- future/unsupported backup schema;
- duplicate hashes;
- interrupted upload;
- malformed HEIC/image where supported;
- private EXIF stripping in derivatives where required.

## 9. SSRF tests if server-side fetch is ever introduced

No V1 privileged arbitrary URL fetch is expected. If introduced later, mandatory tests include:

- `localhost`/loopback;
- RFC1918/private networks;
- IPv6 local/private;
- link-local/cloud metadata endpoints;
- redirect to forbidden IP;
- DNS rebinding/resolution changes;
- userinfo/encoded IP/scheme tricks;
- huge/slow response;
- credentials not forwarded to remote destination.

Feature cannot activate before this suite exists.

## 10. CSRF/CORS/open-redirect tests

For any app-controlled endpoint:

- allowed/disallowed origins;
- credentialed endpoint never permissive wildcard CORS;
- state-changing GET absent;
- malicious Origin/Referer behavior according to architecture;
- cookie-authenticated endpoint has CSRF defense if ever introduced;
- `returnTo`/callback cannot redirect to arbitrary attacker domain.

## 11. Business-logic abuse

- import changes locked selected venue;
- stale import downgrades contractual fact;
- negative/overflow financial values;
- `NaN`/Infinity/trailing-garbage numeric parsing;
- impossible probabilities;
- invalid state transition;
- task/timeline dependency cycle;
- seating duplicate/cross-project assignment;
- concurrent stale overwrite;
- delete/edit race;
- repeated operation replay;
- unknown state does not fail open.

## 12. Frontend/browser security configuration

Verify production build for:

- HTTPS/no mixed active content;
- CSP compatibility and no `unsafe-eval`;
- Trusted Types where enabled;
- HSTS after rollout;
- `nosniff`, referrer, permissions and framing policy;
- no service-role/secret token string;
- no private data in source map/build artifact;
- no third-party trackers/unreviewed runtime scripts;
- safe external link behavior;
- service-worker cache/project isolation.

## 13. Secret/crypto tests

- secret scanner executes;
- production bundle scan contains no privileged secret;
- synthetic canary validates secret-scanning control where safe;
- backup wrong password/tamper fails before mutation;
- backup password never appears in logs/network/storage;
- invite token hash/one-time semantics;
- security token generation path does not use `Math.random()`;
- rotation/revocation procedure tested for critical production secret where feasible before public launch.

## 14. Dependency/supply chain

- static analysis/CodeQL where applicable;
- dependency vulnerability/dependency-review scan;
- secret scan;
- lockfile consistency;
- `npm ci` reproducibility;
- GitHub Actions permissions/pinning review;
- untrusted PR does not receive production secrets;
- exceptional external resource uses SRI/CSP review if any.

## 15. Manual security review

Before real-data V1 cutover:

- bypass UI and call Supabase REST/RPC/Storage directly using test-user credentials;
- attempt cross-project IDOR/BOLA;
- attempt role/permission escalation;
- inspect production headers/CSP/TLS behavior;
- inspect generated bundle/source maps;
- verify provider Auth/rate-limit/MFA configuration.

Before public self-service launch, perform a renewed security review/penetration-style assessment of public signup/provisioning/abuse/support surfaces.

## 16. Regression rule

Every discovered security defect gets a regression test at the appropriate layer before closure whenever technically reproducible.

## 17. Production data prohibition

All automated/manual security tests use isolated synthetic projects/accounts/files. Real wedding/customer data does not enter security fixtures, public issue reports or test artifacts.
