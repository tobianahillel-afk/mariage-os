# Free-Tier Operating Policy

## Requirement

Normal Mariage OS operation for the couple targets **€0/month**.

This is a product constraint, not merely an initial deployment preference.

## Chosen services

- Cloudflare Pages free static hosting target;
- Supabase Free for database, Auth, Storage and Realtime.

Current provider limits must be rechecked at implementation/release time because free-tier terms can change.

## Design response to quotas

Structured wedding data has priority over media convenience.

If quota pressure occurs:

1. preserve core database editing;
2. preserve synchronization and auth;
3. preserve critical private documents where space allows;
4. restrict new large media uploads;
5. prefer remote image references for public promotional photos;
6. allow cleanup/archive/export of nonessential media.

## Storage budget

The UI should expose best-effort storage usage where provider APIs make reliable measurement available.

Internal warning thresholds may be configured conceptually around:

- 70%: information;
- 85%: attention;
- 90%: strong warning;
- 95%: block nonessential large uploads.

Do not display fake precision if the provider does not expose real-time exact quota data.

## Preflight upload

Before a large batch, estimate projected storage:

```text
current known usage + selected upload size = projected usage
```

If this threatens the configured zero-cost safety margin, refuse/defer the nonessential upload and explain alternatives.

## Remote photos

External venue marketing images default to URL reference with provenance. Owners may deliberately archive a copy for finalists/important evidence.

## Local derivatives

Thumbnails/previews reduce bandwidth and do not replace originals. Cache eviction can remove disposable local derivatives before unsynced structured work.

## Realtime

Use realtime only where it materially improves collaboration. Do not subscribe to all tables/events unnecessarily.

## Queries

Use indexes, pagination and targeted queries to avoid wasteful full-project scans.

## Provider term changes

A periodic release/operations check reviews current Cloudflare/Supabase free-tier terms. If a provider changes materially:

- do not silently accept paid operation;
- present impact;
- use exports/abstractions to plan migration or feature degradation.

## No automatic upgrade

The application never automatically initiates a paid plan or billing change.

## Tests

Synthetic tests cover media-quota preflight and behavior where nonessential uploads are blocked while tasks/RSVP/budget edits remain functional.
