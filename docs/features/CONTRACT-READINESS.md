# Quote and Contract Readiness Feature Contract

Status: **Normative V1 feature contract**

## Purpose

Before accepting/signing a venue/vendor agreement, Mariage OS must help the couple verify that important operational/commercial points have been checked against the actual document/evidence.

This is an organizational checklist, **not legal advice** and not an automated legal interpretation system.

## Scope

Applies primarily to documents typed as:

- quote/proposal;
- contract;
- amendment/addendum;
- invoice/payment schedule where relevant.

## Document review state

A document can be:

- `unreviewed`;
- `in_review`;
- `reviewed_with_open_items`;
- `reviewed`;
- `superseded`.

Store reviewer/time and document version lineage.

## Checklist sources

Review checklist is generated from:

1. universal checks for the document type;
2. project blocking/important criteria;
3. linked venue/vendor offer/facts;
4. known unresolved contradictions/missing information;
5. previous verbal/written promises that should be reflected in contract.

## Venue contract baseline checks

At minimum surface/check applicability of:

- exact event date;
- named spaces/access times;
- seated capacity/configuration;
- external caterer permission / restrictions;
- ceremony/chuppah location and rain backup if contractual;
- music/end/door/acoustic restrictions;
- price and mandatory extras;
- tax treatment;
- deposit/payment schedule;
- refundable security deposit;
- cancellation/postponement terms presence checked;
- insurance requirements;
- furniture/inclusions;
- cleaning/security staffing;
- overtime/extra-hour terms;
- final guest-count deadline;
- exclusivity/vendor constraints;
- accommodation/access promises if material.

## Caterer/vendor baseline checks

Depending on type:

- date/location/service window;
- headcount assumptions/minimum;
- price calculation/tax/travel fees;
- inclusions/exclusions;
- staff count/service/setup/cleanup;
- menu/package/drinks/cake/equipment;
- required kosher supervision/certification for caterer;
- payment/cancellation/postponement;
- delivery/access constraints;
- replacement/backup arrangements when relevant.

## Review item result

Each check is one of:

- `confirmed_in_document`;
- `confirmed_by_linked_evidence`;
- `not_found`;
- `contradictory`;
- `not_applicable`;
- `needs_human_review`.

For V1, review items can be represented as linked facts/tasks and document review metadata rather than an AI-extracted clause system. Manual confirmation stores source/document reference and reviewer.

## Verbal-only promises

If an important selected/contractual fact is supported only by phone/verbal note, readiness highlights it:

> Important item is not currently supported by the contract/direct written confirmation.

The app may suggest a follow-up task, not infer that the promise is invalid.

## Signing transition interaction

Moving a venue/vendor toward `contract_signed` while critical review items are unresolved shows a strong warning and requires explicit acknowledgement. The app does not legally block signing solely because a non-applicable/checklist item is unknown, but known product-level blockers/security/data integrity are still enforced.

## Superseded documents

A new quote/contract revision links to the prior version. Prior review state/history remains. A new version can invalidate previous checklist confirmations if the relevant evidence was document-version-specific.

## Import/AI

V1 does **not** require automatic PDF clause extraction/OCR/AI. A future extraction engine may prefill suggestions, but every result remains reviewable and cannot silently mark critical legal/commercial check confirmed.

## Acceptance criteria

- document versions/supersession preserved;
- review status/reviewer/time persisted;
- checklist can show linked facts/sources/tasks;
- important verbal-only promise visible;
- tax/price/date/catering/time restrictions represented;
- contract-signed transition warns on unresolved critical review items;
- a superseding contract cannot silently inherit document-specific confirmations;
- no UI states or copy claim legal advice/legal validity;
- vendor export does not expose unrelated private review notes.