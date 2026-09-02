# ADR 0005 — Public code repository, private runtime data

- Status: Accepted
- Date: 2026-09-02

## Context

The GitHub repository is public for simpler workflow/access constraints, while Mariage OS will contain real guest PII, budgets, contracts, private notes and photos.

The repository must therefore be safe to expose publicly by design rather than relying on repository privacy.

## Decision

The public GitHub repository stores only:

- application source;
- documentation;
- migrations;
- tests;
- synthetic fixtures;
- public-safe templates/examples;
- configuration that contains no secret.

Real wedding data lives only in authorized production/runtime storage such as Supabase and authorized local device state/backups.

Never commit:

- real guests/contact details;
- private partner notes;
- real budgets/payments/contracts/quotes;
- production backups/dumps;
- real private photos;
- production secret/service-role keys;
- production diagnostic logs containing PII.

## Controls

- `.gitignore` patterns for known local/private artifacts;
- secret scanning in CI/repository settings where available;
- synthetic fixtures only;
- public-safe screenshots/examples only;
- contribution/security documentation;
- review of import/export samples before commit.

## Consequences

Repository compromise/exposure must not directly expose wedding data or privileged backend credentials.

The client necessarily contains public client configuration (such as publishable Supabase endpoint/key) where designed; security relies on Auth/RLS, not hiding those public client identifiers.

## Rejected alternative

Relying on a private repository to permit unsafe storage of secrets/data was rejected. Repository visibility can change or credentials can be shared; runtime data separation is the stronger architecture.
