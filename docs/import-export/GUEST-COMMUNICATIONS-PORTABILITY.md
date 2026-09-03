# Mariage OS — Guest Communications Import / Export / Backup Contract

Status: **NORMATIVE V1 PORTABILITY ADDENDUM**

## Contact import

Guest/household contact points may be imported through supported CSV/XLSX/canonical JSON workflows.

Import rules:

- map email/phone columns explicitly;
- normalize/validate without silently rewriting ambiguous data;
- preserve source/provenance;
- detect duplicate destinations conservatively;
- do not merge households solely because they share a contact point;
- do not activate/generate/send campaigns automatically;
- do not infer messaging consent/eligibility merely from possession of a phone/email;
- preview new contact points and conflicts.

## Invitation-link import/export

Raw capability tokens are NEVER exported/imported through ordinary module exports.

Canonical project export may include non-secret invitation metadata such as:
- household relationship;
- link state;
- deadline/policy;
- created/activated/revoked timestamps;

Restoring links requires a safe restore policy. Default safe behavior is to re-key/recreate capability links rather than revive old raw secrets.

## Communication templates

Project-owned message templates can be included in canonical export/backup, including safe variable definitions and provider template references that are not secrets.

Provider credentials/secrets are excluded.

## Campaign/history export

Privacy profiles distinguish:

### Couple/private archive
May include campaign metadata, recipient status, household references, timestamps, normalized error classes and message template/version references.

### General spreadsheet export
Default excludes raw message bodies, full contact points and provider IDs unless explicitly requested through a sensitive export permission/profile.

### Guest/vendor-facing export
Never includes unrelated guest contact/history.

## Provider message/event IDs

Provider identifiers are operational metadata, not portable authorization. They may be archived when needed for audit/diagnostics but must not be treated as valid after provider migration/restore unless explicitly reconciled.

## Backup

`.mariage` backup can include communication domain state according to selected privacy/fullness mode, but:

- provider API keys/secrets/webhook secrets are forbidden;
- raw RSVP capability tokens are forbidden unless a future separately encrypted/reviewed secret-backup mechanism is explicitly designed; V1 default is no;
- restored scheduled campaigns are disabled/not dispatchable by default;
- restored provider configuration requires explicit re-binding;
- no restore operation sends messages automatically.

## Round-trip expectations

Project data round-trip preserves:
- contact-point structured values/provenance;
- guest responses/history according to backup profile;
- template versions;
- campaign/history semantics;
- suppression records where privacy/operations policy includes them.

Round-trip does not promise preservation of live provider queues/credentials or active external scheduling state.

## Migration/provider replacement

Switching Email/SMS/WhatsApp provider does not rewrite domain history. New adapter/provider bindings map new provider IDs while historical events retain original provider label/reference.

## Tests

- import contact column with invalid/mixed formats;
- same phone shared by two households remains ambiguous, not auto-merged;
- ordinary export contains no raw invitation token/provider secret;
- restore creates no automatic send;
- provider change leaves historical campaign/event data interpretable;
- full encrypted backup round-trip preserves non-secret communication state;
- limited privacy export omits contact/message-sensitive fields.