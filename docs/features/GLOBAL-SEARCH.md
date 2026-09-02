# Global Search Feature Contract

Status: **Normative V1 feature contract**

## Purpose

Global Search lets either partner find an existing planning object quickly without knowing which module contains it.

## Searchable V1 domains

At minimum:

- venues: code, name, city, tags;
- vendors: name, type, tags;
- guests/households: names/display name;
- tasks: title;
- decisions: title;
- documents: title/filename metadata;
- Inbox: captured text/URL metadata where appropriate.

Private document binary contents are not full-text indexed in V1.

## Privacy

Search results are always scoped to the currently authorized project. No global/public search endpoint may reveal whether another project contains a given name or UUID.

## UX

- accessible from desktop shell and mobile `More`/command entry;
- debounced query after a short minimum length except exact human code lookups;
- grouped results by entity type;
- result shows enough disambiguation (e.g. `S32 · Venue · Grignan`) without exposing excessive private detail;
- selecting a result deep-links to its detail route;
- empty query shows recent/relevant local items only if privacy-safe.

## Matching

V1 supports:

- case-insensitive text matching;
- accent-tolerant normalized matching where implementation supports it deterministically;
- exact/strong human code match;
- natural names;
- no opaque AI semantic search dependency.

## Offline

Offline search works over locally cached searchable entities only and displays that limitation. It must not pretend results are exhaustive when the cache is partial.

## Performance

Representative project-scale search should return interactive results within the performance budget. Search must use bounded/paginated queries and/or a local index; it must not download the entire database for each keystroke.

## Security

Search implementation must respect the same RLS as ordinary entity queries. Highlighting user text uses safe rendering, not raw HTML injection.

## Acceptance criteria

- search cannot return another project's entities via direct request manipulation;
- exact venue codes sort ahead of weak name matches;
- offline result set visibly identifies cached-only mode;
- opening a result restores the proper deep link;
- searching guest names never writes them to analytics/third-party services.