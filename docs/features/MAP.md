# Map Feature Contract

## Purpose

The map provides geographic context for venue decisions. It is supplementary to the venue database, never the only way to access a venue.

## V1 data

Each venue may expose stored latitude/longitude and address. Coordinates should be persisted once resolved rather than geocoded on every load.

## Pins

Pin/status visuals correspond to canonical venue status, with text/tooltips accessible without relying only on color.

Suggested semantic groups:

- kept/finalist;
- reserve/review;
- rejected;
- researching.

## Pin card

Click/tap shows:

- photo thumbnail if cached/available;
- code/name;
- city;
- status;
- key rating/cost/capacity summary;
- open venue action.

## Filters

At minimum:

- geographic region/project tags;
- status;
- favorites;
- selected venue set/search filter.

Later layers may include stations/hotels/airports but are not V1 blockers.

## Routing

A venue exposes a Google Maps route/action generated from stored address/coordinates and a configured project reference address.

No paid Maps API is required merely to open routing.

## Offline behavior

Map tiles may be unavailable. The application must still provide:

- venue list;
- address;
- stored coordinates;
- cached venue detail.

Do not make venue access depend on map rendering.

## Privacy

Project reference addresses may be private. Do not leak them into public exports or analytics.

## Accessibility

All map items must have a non-map list/table equivalent. Keyboard/screen-reader users must be able to reach venues without manipulating the map canvas.

## Acceptance criteria

- 3+ venue pins render from stored coordinates without geocoding on every view;
- status/filter changes update pins;
- opening pin reaches correct authenticated venue route;
- map failure leaves other venue views fully usable;
- generated external route uses safe URL construction;
- no private data is embedded into public static assets.
