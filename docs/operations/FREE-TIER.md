# Free-Tier Operating Policy

## Requirement

Normal **core Mariage OS infrastructure** for the private couple targets **€0/month**.

This is a product constraint for the application stack, not a promise that every external service used by a couple is free.

## Chosen core services

- Cloudflare Pages free static hosting target;
- Supabase Free for database, Auth, Storage and Realtime.

Current provider limits must be rechecked at implementation/release time because free-tier terms can change.

## External communication-provider exception

V1 now supports optional automatic Email, SMS and WhatsApp Business-compatible delivery.

Those providers may charge per message, per conversation, per phone number, per email volume or by plan. Therefore:

- Mariage OS MUST NOT represent automatic messaging as guaranteed free;
- communication channels are opt-in/configured explicitly;
- no automatic paid provider-plan purchase, upgrade or overage is initiated by Mariage OS;
- campaign preflight shows reliable known/estimated external cost where provider exposes it;
- project/platform send and cost caps prevent accidental runaway usage;
- manual secure RSVP link / QR sharing remains available without automatic provider setup;
- communication-provider spend is separate from core hosting/free-tier status;
- the couple may record those fees in the wedding budget manually/explicitly if desired.

Production provider readiness is governed by `COMMUNICATION-PROVIDER-OPERATIONS.md`.

## Design response to core quotas

Structured wedding data has priority over media convenience.

If quota pressure occurs:

1. preserve core database editing;
2. preserve synchronization and auth;
3. preserve critical private documents where space allows;
4. restrict new large media uploads;
5. prefer remote image references for public promotional photos;
6. allow cleanup/archive/export of nonessential media.

Communication send caps are independent controls and must not consume core-storage quota logic as a substitute.

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

## Communication preflight

Before a bulk automatic send, evaluate independently:

- exact eligible recipient count;
- channel/provider readiness;
- provider quota/send cap;
- known/estimated external cost when reliable;
- missing/invalid/suppressed destinations.

A provider-cost warning is not hidden merely because core Mariage OS itself is operating within free-tier limits.

## Remote photos

External venue marketing images default to URL reference with provenance. Owners may deliberately archive a copy for finalists/important evidence.

## Local derivatives

Thumbnails/previews reduce bandwidth and do not replace originals. Cache eviction can remove disposable local derivatives before unsynced structured work.

## Realtime

Use realtime only where it materially improves collaboration. Do not subscribe to all tables/events unnecessarily.

## Queries

Use indexes, pagination and targeted queries to avoid wasteful full-project scans.

## Provider term changes

A periodic release/operations check reviews current Cloudflare/Supabase free-tier terms and any enabled communication-provider pricing/limits.

If a provider changes materially:

- do not silently accept paid operation;
- present impact;
- preserve manual link/QR fallback for guest RSVP;
- use provider abstractions/exports to migrate or deliberately degrade the affected channel.

## No automatic upgrade

The application never automatically initiates a paid plan or billing change for core hosting or messaging providers.

## Tests

Synthetic tests cover:

- media-quota preflight;
- behavior where nonessential uploads are blocked while tasks/RSVP/budget edits remain functional;
- communication campaign blocked by configured send/cost cap;
- automatic providers unavailable while manual secure-link/QR RSVP remains functional.