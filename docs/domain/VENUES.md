# Venue Domain Model

## Purpose

The venue module supports discovery, evidence collection, comparison, decision-making, quote tracking and eventual booking.

## Venue identity fields

Stable/core fields include:

- internal UUID;
- project ID;
- human code such as `S32`;
- canonical name;
- aliases/previous names;
- lifecycle status;
- address components;
- latitude/longitude;
- official website;
- public phone/email where appropriate;
- main photo reference;
- created/updated/revision metadata.

## Location/access

Store factual components separately from subjective scoring:

- full address;
- coordinates;
- city/region/country;
- nearest relevant TGV station(s);
- station-to-venue travel information;
- road travel references;
- parking details;
- public transport/taxi/shuttle notes;
- accessibility rating as subjective/derived data, not a substitute for raw data.

Routing links should be generated from addresses/coordinates, not stored as a single fragile static URL where unnecessary.

## Spaces

Each meaningful physical space is separate.

Example types:

- reception_room;
- ceremony_area;
- terrace;
- garden;
- cocktail_area;
- kitchen;
- accommodation;
- parking;
- secondary_room.

Space data may include:

- area m²;
- length/width/height;
- seated/cocktail capacity;
- indoor/outdoor/covered;
- heating/air conditioning;
- pillars/obstructions;
- acoustic notes;
- accessibility;
- photo/media links.

## Wedding-specific fit

Commercial capacity is not enough. Venue assessment must support:

- target 150/175/200 configurations;
- one shared main room requirement;
- separate men's/women's dance zones within that room;
- circulation/separation feasibility;
- outdoor houppa/ceremony;
- rain backup;
- winter suitability;
- heat/sun suitability;
- music curfew;
- external caterer acceptance;
- kosher/catering logistics;
- mehitsa feasibility/provision;
- furniture/inclusions.

These are facts/assessments with sources/confidence where appropriate.

## Aesthetic assessment

Partner-specific ratings should support at least:

- interior;
- exterior;
- view;
- ceremony setting;
- atmosphere/coup de coeur.

Optional tags/assessments include:

- “too canteen/event hall”;
- decoration effort required;
- authentic/provençal character;
- elevated/panoramic setting.

These subjective ratings are not presented as externally verified facts.

## Offers and dates

A venue can have multiple offers and availability observations by date/season/day.

Support:

- base rental;
- included guest count;
- per-extra-person components;
- cleaning/security/furniture;
- refundable caution;
- deposit schedule;
- music overtime;
- package inclusions;
- tax status;
- offer validity;
- source/quote document.

## Quote/contact workflow

Track:

- quote requested?;
- request date;
- reply status;
- contact person;
- last interaction;
- next follow-up;
- quote received/document;
- negotiation notes;
- commercial confirmations.

## Decisions

Venue can be:

- researching;
- kept/shortlisted;
- reserve;
- rejected with mandatory reason;
- finalist;
- selected;
- contractually confirmed.

Rejecting never deletes the venue.

## Photos

Media categories should include:

- exterior;
- empty interior;
- decorated interior;
- view;
- ceremony;
- kitchen;
- toilets;
- parking;
- accommodation;
- floor plan;
- own visit.

Official/external and own-visit photos are distinguishable.

## Completeness

Venue readiness should be calculated from critical information, not raw field count.

A venue may be decision-ready even with optional fields unknown, but not with unknown blocking facts such as availability, external caterer or effective capacity.

## Visit mode

The venue domain must support a generated visit checklist based on:

- universal venue questions;
- missing critical facts;
- stale/conflicting facts;
- project-specific criteria.

## Tests

Venue tests cover capacities by space/configuration, blocking criteria, rejection/restore, offers by date, freshness, source conflicts, partner ratings, visit checklist generation and import deduplication.
