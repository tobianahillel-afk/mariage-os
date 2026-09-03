# Performance Budgets

Status: **Normative V1 quality contract**

Mariage OS must remain responsive on ordinary phones and laptops with a realistic wedding project. Performance is part of correctness because slow UI encourages duplicate clicks, stale interpretation and abandoned workflows.

## Reference project sizes

Performance tests should include deterministic synthetic datasets approximating at least:

- 100 venues;
- 500 guests across households;
- 200 vendors/contacts/interactions combined;
- 5,000 tasks/activity/history records;
- 2,000 media metadata records;
- 500 documents metadata records;
- hundreds of facts/observations/offers;
- pending sync operations/conflict fixtures.

Binary originals are not all loaded for baseline UI tests; metadata and thumbnails model realistic browsing.

## User-perceived targets

Targets are goals subject to device/network test methodology, not guarantees for every network condition.

- cached application shell should become usable quickly on repeat launch;
- route transitions using local data should feel immediate, normally under ~200 ms for common views after data is available;
- local search/filter operations over normal project volumes should normally respond under ~100 ms or move work off the main thread;
- typing/autosave must not visibly block input;
- long import parsing must not freeze the UI;
- large image originals must never be downloaded merely to render list thumbnails.

## Main-thread rules

Move CPU-heavy parsing/transformation to Web Worker or chunked processing where realistic files can visibly block the main thread, especially:

- XLSX parsing;
- large CSV/JSON analysis;
- hashing large batches;
- thumbnail processing where browser implementation permits;
- large import duplicate analysis.

## Network/data rules

- paginate or incrementally fetch long histories/media lists;
- do not SELECT entire project datasets merely to show one counter if a bounded query/derived local index suffices;
- realtime subscriptions are scoped rather than blindly subscribing to unnecessary high-volume streams;
- thumbnails/previews use appropriate sizes;
- originals load on explicit need;
- repeated unchanged remote data should use local cache appropriately.

## Images

Lists/grids render thumbnails, never full originals by default.

Use lazy loading/intersection behavior for galleries.

Broken/slow remote images do not delay essential textual information.

## Imports

For large supported imports:

- show progress;
- remain cancelable before commit where practical;
- parsing/analysis avoids blocking interactions;
- preview can virtualize large tables;
- memory usage is bounded by documented maximum file/row limits.

## Tables/lists

Use pagination/virtualization/incremental rendering when measured data shows DOM size harms target devices. Do not prematurely introduce complex virtualization where simple lists remain fast.

## Bundle/dependencies

Runtime dependencies require bundle-cost awareness. Lot 0 establishes baseline bundle report. New large dependency requires justification.

## Performance regression gate

CI should run deterministic performance-oriented tests where stable enough. Release-candidate/manual profiling uses the golden project on representative desktop/mobile profiles.

Regressions that make a core workflow visibly unusable on supported reference devices block release even if unit tests pass.

## Measurement

Record methodology with results:

- device/profile;
- browser;
- cold/warm state;
- dataset size;
- network profile if relevant;
- app version.

Do not claim precise universal performance numbers from a single desktop test.
