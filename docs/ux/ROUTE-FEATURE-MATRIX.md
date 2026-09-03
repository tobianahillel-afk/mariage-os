# Mariage OS — Route / Feature / UX Matrix

Status: **Normative V1 discoverability and UX traceability matrix**

Purpose: prove that every primary V1 user capability has a discoverable canonical route or explicit contextual surface, and that routes do not create parallel sources of truth.

`SCREEN-CONTRACTS.md` defines exact route behavior. This matrix adds the user job and Feature-ID mapping.

---

## Authentication / onboarding

| Route/surface | Primary user job | Feature IDs | UX pattern | Governing docs |
|---|---|---|---|---|
| `/login` | Access my private wedding safely | FTR-003 | focused auth screen | AUTH-ONBOARDING, AUTHENTICATION, AUTH-BLUEPRINTS |
| `/onboarding` | Set up the one intended wedding/project | FTR-002,006,007,008 | guided focused workflow | AUTH-ONBOARDING, AUTH-BLUEPRINTS |
| `/invite/:token` | Join my partner's wedding safely | FTR-004 | focused invitation workflow | BOOTSTRAP-INVITATIONS, AUTH-BLUEPRINTS |
| MFA/recovery subflow | Secure/recover my owner account | FTR-005 | focused security workflow | AUTHENTICATION, AUTH-BLUEPRINTS |
| safe logout pending-work sheet | Sign out without losing local work | FTR-011 | protected contextual workflow | AUTHENTICATION, OFFLINE, AUTH-BLUEPRINTS |

`/invite/:token` is not a project-data route before validated auth/invitation acceptance.

---

## Home / control

| Route | Primary user job | Feature IDs | Pattern | Governing docs |
|---|---|---|---|---|
| `/dashboard` | Know what matters now and act | FTR-071..074,053 | overview/command | DASHBOARD, SCREEN-BLUEPRINTS |
| `/search` / global overlay | Find the right project entity quickly | FTR-078 | navigation accelerator | GLOBAL-SEARCH, UX-ARCHITECTURE |
| global `+` | Capture/create something without navigation friction | FTR-034,013,029 etc. | quick capture/action sheet | INBOX, NAVIGATION |

Dashboard/Search/Quick Add always navigate into canonical domain routes rather than maintaining separate editable copies.

---

## Venues

| Route/surface | Primary user job | Feature IDs | Pattern |
|---|---|---|---|
| `/venues` Gallery | Browse/shortlist venues visually | FTR-015,013,014,023 | collection/cards |
| `/venues` Table | Scan/filter analytical venue facts | FTR-016 | analytical collection/table |
| `/venues/compare` | Compare 2–5 finalists on real criteria | FTR-021,027,025,080 | analysis/comparison |
| `/venues/:venueId` | Judge one venue and know what to do next | FTR-017..026 | entity detail workspace |
| `/venues/:venueId/visit` | Capture reliable visit information on site | FTR-028 | mobile-first operational workspace |

Venue sub-sections (photos/spaces/prices/access/sources/contracts) stay within canonical Venue Detail unless a linked entity opens its own canonical route.

---

## Vendors

| Route | Primary user job | Feature IDs | Pattern |
|---|---|---|---|
| `/vendors` | Find/compare/manage service providers | FTR-064..068 | collection |
| `/vendors/:vendorId` | Understand one provider, quote and next action | FTR-064..068,089..091 | entity detail workspace |

Contract documents opened from vendor detail use canonical `/documents/:id`, then Back returns to vendor context where feasible.

---

## Guests / households / seating

| Route | Primary user job | Feature IDs | Pattern |
|---|---|---|---|
| `/guests` | Manage who is invited/coming and overall counts | FTR-054..059 | collection + analytical management |
| `/guests/:guestId` | Update one guest's individual status/details | FTR-054..059,061 | entity detail |
| `/households/:householdId` | Manage household invitation context/members | FTR-054 | entity detail |
| `/seating` | Build/validate the non-visual seating plan | FTR-060..063 | operational workspace |

Seating assignment may open guest detail, but does not maintain duplicate guest RSVP truth.

---

## Tasks / decisions / Inbox

| Route | Primary user job | Feature IDs | Pattern |
|---|---|---|---|
| `/tasks` | See what I/we must do, wait for or unblock | FTR-029..031 | collection/work queue |
| `/tasks/:taskId` | Understand/complete one task | FTR-029..031 | detail/drawer or route |
| `/decisions` | See decisions needing input/discussion | FTR-032..033 | decision queue |
| `/decisions/:decisionId` | Compare options/approve/retain rationale | FTR-032..033 | entity decision workspace |
| `/inbox` | Process captured unclassified information | FTR-034..035 | work queue |

Converted Inbox item links to its canonical target; it does not remain an independently editable duplicate.

---

## Budget / payments

| Route | Primary user job | Feature IDs | Pattern |
|---|---|---|---|
| `/budget` | Understand expected/committed/paid/due wedding cost | FTR-045..053 | overview + analytical modes |
| `/budget/scenarios/:scenarioId` | Understand/compare scenario assumptions | FTR-049..050 | analysis/detail |
| `/budget/items/:itemId` | Inspect one financial commitment and its payments | FTR-045..052 | entity detail |
| Budget Payments/Cash-flow mode | See when money leaves/returns | FTR-051..053 | analytical list/timeline |

Historical quote truth, scenario override and payment movement never share one ambiguous editable field.

---

## Planning / wedding day

| Route | Primary user job | Feature IDs | Pattern |
|---|---|---|---|
| `/planning` | Know whether preparation is on track | FTR-069..070 | overview/planning |
| `/timeline` | Build/validate actual wedding-day sequence | FTR-075..077 | chronological operational workspace |

Planning milestones and Event Timeline stay distinct routes/mental models.

---

## Map / access

| Route | Primary user job | Feature IDs | Pattern |
|---|---|---|---|
| `/map` | Understand where venue options are and open one | FTR-079..082 | spatial browse workspace |
| `/settings/locations` | Configure private reference origins | FTR-008,080 | settings configuration |

Map is never the only way to access a venue or access-route facts.

---

## Documents / contracts

| Route | Primary user job | Feature IDs | Pattern |
|---|---|---|---|
| `/documents` | Find the right document/version | FTR-089..093 | collection |
| `/documents/:documentId` | Review/download/version/link one document | FTR-089..091 | entity detail |

Contract readiness is a section/workflow of the canonical document (and linked vendor/venue context), not a separate duplicate contract entity.

---

## Import / export / recovery

| Route | Primary user job | Feature IDs | Pattern |
|---|---|---|---|
| `/import` | Safely analyze/map/preview/apply external data | FTR-036..043 | focused multi-step workflow |
| `/imports/:importId` | Inspect what an import changed / rollback state | FTR-042..043 | history/detail |
| `/export` | Export module/research/portable data | FTR-044,094..096 | focused export hub |
| `/restore` | Verify and recover from a backup safely | FTR-096..097 | high-risk focused workflow |

Restore is visually/navigation-separated from ordinary export/download actions.

---

## Settings / diagnostics

| Route | Primary user job | Feature IDs | Pattern |
|---|---|---|---|
| `/settings` | Find the right configuration area | FTR-006..012,098 | settings index |
| `/settings/project` | Configure project basics/date assumptions | FTR-006..007 | settings |
| `/settings/members` | Review partner/invitation membership | FTR-002..005 | protected settings |
| `/settings/criteria` | Configure evaluation criteria safely | FTR-019..021 | settings |
| `/settings/locations` | Manage route reference origins | FTR-008 | settings |
| `/settings/offline-storage` | Understand local/pending/storage state | FTR-010,083..088 | diagnostics/settings |
| `/settings/backup` | Inspect backup status/export/verify | FTR-094..097 | recovery settings |
| `/settings/security` | MFA/session/recovery/logout | FTR-003..005,011 | security settings |
| `/settings/diagnostics` | Diagnose versions/sync/integrity without PII | FTR-098 | diagnostics |
| `/settings/danger` | Archive/purge/delete with strong safeguards | cross-cutting | high-risk settings workflow |

Ordinary wedding work must never require navigating through Settings.

---

## No dedicated route by design

Some capabilities are cross-cutting/contextual and correctly do not own a primary route:

- personal ratings/favorites — entity detail/list controls;
- fact/source editing — entity detail contextual drawer/section;
- sync conflict resolution — contextual/global conflict panel;
- tag assignment — entity contextual action;
- activity history — dashboard/entity history sections;
- media upload — contextual entity/document action;
- payment add/edit — Budget context;
- criterion evaluation — rendered within venue/vendor comparison/detail;
- backup encryption — Export/Backup workflow option.

Absence of a dedicated route is deliberate only when a canonical contextual surface is named here.

---

## Discoverability rules

Every primary user feature must be discoverable through at least one of:
- persistent navigation;
- canonical parent collection/detail;
- Dashboard actionable link;
- global Search;
- global Quick Add/Inbox where creation/capture is relevant.

No V1 Feature ID may require knowing a hidden URL.

---

## Mobile path rule

Every primary route must have a mobile path that does not depend on:
- hover;
- wide horizontal desktop table;
- right click;
- tiny precision targets;
- permanent multi-pane layout.

Mobile alternatives are defined in `SCREEN-BLUEPRINTS.md`/feature contracts.

---

## Review conclusion template

For final design/checkpoint review verify:

- no Feature ID has no canonical surface;
- no canonical route has no clear user job;
- no route duplicates authoritative editable truth from another route;
- no ordinary workflow is hidden only under Settings;
- no mobile workflow depends on desktop-only interaction;
- Search/Dashboard/Inbox are accelerators, not alternative data models.
