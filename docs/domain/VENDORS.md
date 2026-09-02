# Vendor Domain Model

## Purpose

Vendors share common commercial/contact/document workflows while retaining type-specific facts.

## Vendor types

Initial canonical types:

- caterer;
- photographer;
- videographer;
- DJ/music;
- florist/decorator;
- transport;
- accommodation;
- stationery;
- attire;
- religious/cultural service where appropriate;
- other.

Avoid creating a new physical table for every vendor type unless a later domain need justifies it.

## Core fields

- internal UUID;
- project ID;
- canonical name;
- aliases;
- type;
- lifecycle status;
- website/social/public contact data;
- main contact/reference;
- tags;
- partner ratings/favorites;
- created/updated/revision metadata.

## Contacts/interactions

Vendor contact history must support:

- named contact;
- phone/email/WhatsApp where relevant;
- interaction type;
- date/time;
- notes;
- attachments;
- next follow-up;
- statements that can become fact sources.

## Commercial offers

Vendor offers/quotes can include:

- date or validity range;
- package name;
- base amount;
- per-guest/per-hour/per-item components;
- minimum spend;
- included services;
- optional extras;
- deposit/cancellation terms;
- quote document;
- negotiated revisions;
- superseded versions.

## Caterer-specific facts

The caterer type should support, via typed fact definitions/offer components:

- kosher certification/requirements;
- buffet/service-at-table format;
- price per person;
- adult/child/vendor rates;
- meat/menu options;
- cocktail;
- dessert/cake;
- wine/champagne/beverages;
- servers and staffing;
- tableware/glassware;
- setup/cleanup;
- kitchen requirements;
- travel fees;
- number of tables/guests assumptions;
- tasting;
- compatibility with candidate venues.

## Reliability assessment

Partner/project assessment may record:

- responsiveness;
- quote clarity;
- perceived reliability;
- references/reviews;
- unresolved concerns.

These remain subjective unless backed by explicit source data.

## Availability

Availability is date-sensitive and freshness-sensitive. An old “available” observation must not be treated as current indefinitely.

## Selection

A selected/contracted vendor keeps rejected alternatives archived for fallback/history until the project no longer needs them.

## Tests

Vendor tests cover generic lifecycle, specialized facts, multiple quote versions, negotiation, availability freshness, contact follow-up and cross-project authorization.
