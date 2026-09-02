# ADR 0006 — Facts are represented by observations plus a retained value

- Status: Accepted
- Date: 2026-09-02

## Context

Wedding research often produces conflicting information. Example: a venue's official website may list 300 m² while a directory lists 250 m² and a salesperson later confirms 300 m². Storing only one mutable field destroys useful provenance and allows weak imports to replace stronger evidence.

## Decision

For important configurable facts, separate:

- fact definition/semantic key;
- zero or more source observations;
- observation value;
- source/provenance;
- evidence/confidence level;
- verification time/freshness;
- retained/current value or explicit conflict state.

The retained value is chosen by explicit deterministic/user-reviewed rules; conflicting observations remain stored.

## Consequences

The UI can show:

- current retained value;
- confidence;
- evidence sources;
- contradictions;
- stale status;
- whether information is contractual, written, official, directory-based or inferred.

Imports add observations/provenance rather than blindly flattening trusted values.

This model costs more rows/logic than a simple wide venue table but directly serves the product's decision-quality requirement and research-heavy workflow.

## Scope

Not every trivial field needs multi-observation provenance. Core identity fields and purely personal notes may remain direct fields. The data dictionary/spec decides which values use the facts/evidence model.

## Rejected alternative

A single `venue.external_caterer = true` column with one optional `source_url` was rejected because it cannot represent contradictory, historical or differently reliable evidence safely.
