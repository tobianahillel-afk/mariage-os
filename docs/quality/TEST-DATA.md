# Test Data Strategy

## Rule

Automated tests, examples, screenshots and public fixtures must use synthetic data only.

Real wedding data must never be copied into the public repository “just for testing.”

## Golden synthetic project

Maintain a deterministic rich test project containing artificial examples for nearly every domain case.

Suggested content:

- 50+ synthetic venues;
- multiple venue spaces/configurations;
- conflicting fact sources;
- stale/contractual facts;
- 250+ synthetic guests across households;
- priorities/probabilities/RSVP combinations;
- vendors and multiple quote revisions;
- fixed/variable budget items;
- deposits/refunds/cautions;
- tasks in every status;
- decisions requiring both owners;
- synthetic document/media metadata;
- imports, duplicates and conflicts.

Names use clearly fictional values such as `Venue Alpha`, `Alice Example`, `Vendor Cedar`.

## Seeds

Local/test environments should be reproducibly seeded from version-controlled scripts/fixtures.

A new developer should obtain the same expected synthetic state with one documented command.

## Fixture classes

- minimal valid entities;
- boundary values;
- invalid/malformed imports;
- historical schema backups;
- security attack payloads;
- performance-scale datasets;
- offline conflict scenarios;
- backup archives generated during tests.

## Privacy

Never sanitize a production dump and commit it unless a future formally reviewed anonymization process proves irreversibility; default policy is simply not to use production data.

## Determinism

Random/property tests use reproducible seeds on failure so a CI defect can be recreated locally.

## Performance fixtures

Representative targets include at least:

- 100 venues;
- 500 guests;
- 5,000 tasks/activity entries where relevant;
- 2,000 media metadata records;
- realistic fact/source/link counts.

Large binary media can be simulated with safe generated fixtures where full images are unnecessary.

## Security fixtures

Include safe non-executing representations of:

- XSS strings;
- malicious URL schemes;
- spreadsheet formula injection strings;
- zip-slip paths;
- malformed JSON;
- MIME/extension mismatches;
- cross-project UUID attempts.

## Lifecycle

Fixtures change through reviewed commits alongside schema/feature changes. Old-version backup fixtures are intentionally retained for migration regression testing.
