# Data Ownership and Sources of Truth

## Purpose

Mariage OS deliberately separates product code, shared production data, local working state and portable backups.

## Product and architecture truth

Stored in GitHub:

- source code;
- migrations;
- typed schemas;
- tests;
- synthetic fixtures;
- documentation;
- ADRs;
- CI configuration.

This repository is public and must always be safe to expose.

## Shared production truth

Stored in the private Supabase project:

- project membership;
- venues and vendors;
- guest and household data;
- tasks and decisions;
- budget and payments;
- document/media metadata;
- audit/activity data;
- private files.

For shared collaboration, Supabase is the authoritative synchronized state after successful commit.

## Local working truth

IndexedDB stores:

- cached project data necessary for responsive/offline UX;
- pending mutations not yet confirmed remotely;
- cache metadata;
- local synchronization checkpoints;
- selected offline media/derivatives;
- local drafts where appropriate.

Pending local mutations are not considered remotely committed until acknowledged by the cloud.

## Portable recovery truth

A validated `.mariage` export is a portable recovery artifact. It must be documented, versioned and testable independently of a running production session.

## Derived data

Derived values are not independent truths.

Examples:

- expected guest count;
- cost per guest;
- compatibility score;
- remaining amount to pay;
- milestone progress;
- number of missing critical facts.

They should be computed from authoritative inputs. If cached for performance, their cache must be safely invalidatable/rebuildable.

## External observations

An external source may report a value, but that observation is not automatically the retained truth.

Example:

- official venue site: 300 m²;
- specialist directory: 250 m²;
- commercial email: 300 m².

Mariage OS should preserve observations and allow a retained/current value with explicit confidence rather than destroying contradictory evidence.

## Manual versus imported values

Imported data has provenance. A later import must not silently downgrade a stronger manually/contractually confirmed value.

## Decision truth

Major decisions are append/history-oriented. The current state can change, but prior rationale and alternatives remain auditable.

## Data deletion

Normal deletion is soft/recoverable first. Permanent deletion occurs only after explicit action/policy and must clean both structured references and storage objects according to documented retention rules.

## Ownership at project level

Every project-scoped entity must carry or deterministically inherit a `project_id`. Cross-project reassignment is not an ordinary edit and should generally be forbidden.
