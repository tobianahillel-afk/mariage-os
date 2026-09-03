# Security Policy

Mariage OS is a personal wedding-planning project that may process private personal, financial and contractual data.

## Supported versions

During pre-V1 development, only the current `main`/latest release candidate is supported. After V1, supported-version policy will be listed here.

## Reporting a vulnerability

Do **not** publish exploit details, credentials, private project data or screenshots containing personal information in a public issue.

For now, repository owners should handle security reports privately through an appropriate private GitHub/contact channel available to the project owner. This file must be updated with a dedicated private reporting address/process before public external contribution is encouraged.

## Never include in a report

- real guest data;
- production auth tokens;
- service-role keys;
- private contracts/invoices;
- full database dumps.

Use synthetic reproduction whenever possible.

## Security priorities

Highest-priority issues include:

- cross-project/private-data authorization bypass;
- authentication/session bypass;
- exposed privileged secret;
- data corruption/loss;
- malicious file execution/XSS;
- broken backup/restore affecting production;
- incorrect financial logic with real impact.

## Security architecture

See:

- `docs/security/SECURITY-ARCHITECTURE.md`
- `docs/security/THREAT-MODEL.md`
- `docs/security/AUTHORIZATION-RLS.md`
- `docs/security/FILE-SECURITY.md`
- `docs/security/ASVS-MATRIX.md`

## Public repository rule

Production/private wedding data must never be committed here. Report accidental disclosure immediately so credentials/data exposure can be remediated rather than merely deleted from the latest commit.
