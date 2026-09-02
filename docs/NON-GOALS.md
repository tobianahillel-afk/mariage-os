# Non-Goals and Scope Boundaries

Mariage OS must remain a focused planning system for a couple. Completeness does not mean unlimited scope.

The following are explicitly **not** V1 goals unless later approved through an ADR and roadmap update.

## Not a social network

No public profiles, feeds, likes, marketplace community or guest social layer.

## Not an internal chat platform

The product groups joint decisions, notes and responsibilities but does not replace WhatsApp/Signal/email.

## Not a payment processor

Mariage OS tracks payment obligations and evidence. It does not move money or store card/bank credentials.

## Not a legal-advice engine

The product may provide contract-review checklists and store clauses. It must not present automated legal conclusions as professional legal advice.

## Not an AI-dependent system

Core functions must remain fully usable without an AI service. Future optional AI can assist classification/extraction but may not become required for data access, import, budget math or decision history.

## Not a vendor marketplace

No vendor commission model, ads, ranking manipulation or sponsored recommendations.

## Not a full ERP/CRM

Contacts, quotes, tasks and follow-ups exist only to support wedding planning. Avoid enterprise complexity.

## Not a custom backend infrastructure project

V1 deliberately uses managed static hosting and Supabase instead of maintaining VPS, Kubernetes, custom identity servers or a bespoke API fleet.

## Not a generic project manager

The data model can be reusable internally, but UX must remain wedding-specific.

## Not a photo-editing application

Original imported photos are preserved. Thumbnails/previews may be optimized for display, but editing/retouching is out of scope.

## Not a real-time collaborative document editor

We do not need Google-Docs-style character-level co-editing. Record-level updates and conflict handling are sufficient.

## Not a replacement for cloud backup discipline

The cloud project is not the only recovery mechanism. Portable exports remain required.

## Not unlimited file storage

The product targets free-tier operation. Large nonessential media collections must be managed deliberately.

## Not an excuse for opaque automation

Automatic calculations are welcome; silent decisions are not. Important automatic effects must be explainable.

## Deferred beyond initial V1

The following may be introduced in later lots after the foundation is stable:

- visual seating-plan editor;
- advanced shuttle and hotel-room assignment;
- dedicated day-of operator mode;
- push notifications;
- temporary guest/vendor share links;
- AI-assisted PDF extraction;
- advanced astronomical sun/orientation calculations;
- optional richer presence indicators.

The roadmap documentation controls when a deferred capability may enter development.
