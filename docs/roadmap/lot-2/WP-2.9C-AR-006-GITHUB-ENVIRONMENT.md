# WP-2.9C / AR-006 — GitHub Environment configuration helper

Status: **EXECUTION SUPPORT — DOES NOT CLOSE AR-006**

Companion runbook: `WP-2.9C-AR-006-RUNBOOK.md`

Helper command:

```text
npm run configure:ar006:github-environment
```

## Purpose

The AR-006 provider jobs intentionally fail closed when the GitHub Environment
`ar006-isolated` is missing its required variables or secrets. This helper
reduces the manual GitHub configuration step without weakening that boundary.

It does **not** create Cloudflare tokens, create a Cloudflare Pages project,
create a Supabase project/user, deploy code, run the evidence workload, or
change WP-2.9C state.

The helper only copies values that an operator has already supplied to the
local process environment into the existing GitHub Environment.

## Security properties

The helper:

- validates every required input before making the first GitHub write;
- requires the exact attestation
  `AR006_WORKERS_FREE_ATTESTATION=YES-WORKERS-FREE-ISOLATED`;
- requires an authenticated GitHub CLI session;
- targets only `tobianahillel-afk/mariage-os` and environment
  `ar006-isolated`;
- sends both variables and secrets to `gh` over stdin rather than placing
  values in command-line arguments;
- removes the four AR-006 secret values from the child-process environment
  before invoking `gh`;
- never prints secret values;
- verifies non-secret variable values after storage without printing them;
- verifies only the **names** of stored secrets because GitHub never returns
  secret values.

GitHub CLI currently supports environment variables through
`gh variable set --env` and environment secrets through `gh secret set --env`.
The latter encrypts secret values locally before sending them to GitHub.

Official references:

- <https://cli.github.com/manual/gh_variable_set>
- <https://cli.github.com/manual/gh_secret_set>
- <https://cli.github.com/manual/gh_variable_list>
- <https://cli.github.com/manual/gh_secret_list>

## Prerequisites

Before running the helper, the external isolated resources described by
`WP-2.9C-AR-006-RUNBOOK.md` must already exist:

- one non-production Cloudflare Pages project on Workers Free and one private Worker named `mariage-os-private-document-promotion`;
- expected preview bindings for the isolated Supabase project;
- encrypted Pages and private-Worker secrets `PRIVATE_DOCUMENT_ADMIN_KEY`, with the same isolated Supabase server credential;
- one isolated Supabase project with current migrations;
- one synthetic ordinary user;
- one synthetic project where that user has live `documents.write`;
- narrow Pages deployment, Worker deployment and Workers Observability tokens.

Authenticate GitHub CLI locally with an account permitted to configure the
repository environment. Do not put AR-006 provider secrets in Git, issue
comments, screenshots, shell history, or command-line arguments.

## Required local process variables

Provide these eight non-secret values to the local process:

```text
AR006_PAGES_PROJECT
AR006_PRIVATE_DOCUMENT_WORKER
CLOUDFLARE_ACCOUNT_ID
AR006_SUPABASE_URL
AR006_SUPABASE_PUBLISHABLE_KEY
AR006_TEST_USER_EMAIL
AR006_PROJECT_ID
AR006_WORKERS_FREE_ATTESTATION
```

`AR006_WORKERS_FREE_ATTESTATION` must equal exactly:

```text
YES-WORKERS-FREE-ISOLATED
```

Provide these four secret values to the local process using a secure local
secret source such as a password manager or a shell facility that does not
record the value in history:

```text
AR006_CLOUDFLARE_DEPLOY_TOKEN
AR006_CLOUDFLARE_WORKER_DEPLOY_TOKEN
AR006_CLOUDFLARE_OBSERVABILITY_TOKEN
AR006_TEST_USER_PASSWORD
```

Do not pass secret values as arguments to the npm command.

## Apply configuration

From a clean checkout of `lot-2/venues-core`, after the required values are
present only in the local process environment:

```text
npm ci --no-audit --no-fund
npm run configure:ar006:github-environment
```

A successful run prints only counts and environment/name information. It does
not print the four secret values.

After the command exits, clear the four secret environment variables from the
local shell/session according to the operator's shell and password-manager
procedure.

## Verification sequence

Configuration by this helper is **not** readiness evidence.

After a successful helper run:

1. keep the repository tree unchanged;
2. create a no-content commit whose message contains `[AR006-WORKER-BOOTSTRAP]` to deploy only the private Worker;
3. configure the isolated Worker secret/bindings and the Pages Service Binding through the provider console, without putting values in GitHub Actions;
4. create a no-content commit whose message contains `[AR006-PREFLIGHT]`;
5. require `AR-006 isolated provider preflight` to become green;
6. inspect any red preflight as provider/configuration evidence, not CPU
   feasibility evidence;
7. only after a green preflight may an exact no-content
   `[AR006-EVIDENCE]` candidate be created.

A green preflight still does not close AR-006. The exact-size deployed Workers
Free CPU evidence and later fresh Pass B remain mandatory.

## Failure and rollback

If the helper fails before writes, correct the missing/invalid local input and
rerun it.

If GitHub rejects a write, do not launch `[AR006-EVIDENCE]`. Inspect repository
permission, Environment existence/protection, and `gh auth status`, then rerun
only after the cause is understood.

If an incorrect AR-006 entry must be removed, GitHub CLI provides environment
scoped deletion commands:

```text
gh variable delete NAME --env ar006-isolated --repo tobianahillel-afk/mariage-os
gh secret delete NAME --env ar006-isolated --repo tobianahillel-afk/mariage-os
```

Never weaken the CI gates, copy a production credential into the environment,
enable Workers Paid, or reduce the 25 MB contract merely to make the readiness
or evidence job pass.
