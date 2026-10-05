# WP-2.12R — Pass C acceptance reconciliation

Status: **ACCEPTED / COMPLETE — Pass C gap ∅; acceptance-record CI 5/5 green**.

This is the separate `EXPECTED ↔ IMPLEMENTED ↔ VERIFIED` reconciliation for
the bounded replay-safe Venue fact-observation support packet. Entry state is
`ACCEPTANCE_PENDING` after complete Fresh Pass B v2 found no unresolved P0,
P1 or P2 defect.

This record accepts only the replay-safe append command boundary required by
parent WP-2.12 structured reconnect. It does not accept the parent mobile visit
workflow, Lot 2 as a whole, generic offline/PWA sync, media upload/replay,
Tasks/Decision behavior, provider infrastructure or real/private data cutover.

## Entry gates

- Parent WP-2.12 remains **BLOCKED** with its first three GREEN tranches
  preserved through `1794a3d9d564769437a22582b918f793e57cf150` /
  CI `37280907551`.
- WP-2.12R activation governance:
  `cc12be09d1569a739c11943e5283146d02de950f` /
  CI `37289339246` — **5/5 SUCCESS**, clean checkout included.
- RED #81 / `8d30a16ea8f234c8cee712eed66dc4e1fb64764b`
  proved the accepted append boundary lacked stable client replay identity and
  was closed unmerged.
- Pass-A GREEN PR #82 reviewed head
  `78c1d83e45357b653486ceb53dec64a9afdfec51` /
  CI `37295580568` — **5/5 SUCCESS**; merged as
  `5389bb31f2b57c1b02a011dbd6fd775a9c048570` /
  CI `37296758669` — **5/5 SUCCESS**.
- Targeted RED #83 /
  `b4909ef100f1ea40d73e1490bfa19258b0820eec` /
  CI `37300726435` reproduced exactly the NULL evidence/confidence defect.
- Remediation #84 exact head
  `bb856ab835a48ddc7bcc6b6278f5f83bc815d991` /
  CI `37301743650` — **5/5 SUCCESS**; merged canonically as
  `e6c46b0e6b0879aa48ce29fd58c80f91b6900cb7` /
  CI `37309288791` — **5/5 SUCCESS**.
- Authorization-evidence remediation #86 merged canonically as
  `9e9851d29830decd1dd927496b7aaa473445ca51` /
  CI `37316129635` — **5/5 SUCCESS**, including direct exact-signature
  owner/deny/zero-side-effect evidence and clean checkout.
- Complete Fresh Pass B v2 review-only PR #87 final head
  `bd17217f6d2ecb2ffc20ef7dd1c9017713737019` /
  CI `37327242771` — **PASS**, final Codex verdict “Didn't find any major
  issues”, zero unresolved review threads.
- Review-only challenge #88 /
  `55f0fc8b54554d1f108098d12fa6b718e2288115` /
  CI `37322464350` — **5/5 SUCCESS**, disproving mutable multiselect-order
  replay risk on the effective canonicalizer.
- Review-only challenge #89 /
  `8bb749810082332efb9de43fb9a61f101e8f39c9` /
  CI `37329487914` — **5/5 SUCCESS**, proving historical-definition guards
  reject the cited constraint drift and exact replay remains one row.
- Fresh Pass-B/status seal:
  `091d5f00e5e07afcefaafd8e89d4bb477a55dd10` /
  CI `37333914603` — **5/5 SUCCESS**, including full verify from clean
  checkout.
- Primary product responsibility remains FIR #42 / FTR-028 in parent WP-2.12;
  WP-2.12R introduces no new product Feature.

## EXPECTED ↔ IMPLEMENTED ↔ VERIFIED

| Assigned WP-2.12R responsibility | EXPECTED | IMPLEMENTED | VERIFIED | Result |
| --- | --- | --- | --- | --- |
| Stable client observation identity | append requires a client-supplied UUID and preserves it application → adapter → RPC → returned row | stronger application draft/input, adapter `target_observation_id`, replay-safe public RPC and exact returned-ID validation | RED #81; application/adapter tests; replay pgTAP; Fresh Pass B | PASS |
| First insert and exact replay | first use inserts the requested ID exactly once; exact normalized replay returns the existing row and never duplicates | replay core checks existing supplied ID before insert and returns the existing semantic match | direct pgTAP first-use/replay/row-count assertions and fresh adversarial review | PASS |
| Semantic-drift conflict | same ID with changed Fact/value/raw/evidence/confidence/timestamp/note/supersedes intent must fail rather than reuse/mutate | NULL-safe normalized intent comparison rejects drift with conflict semantics | replay drift pgTAP across bounded fields; Fresh Pass B | PASS |
| NULL metadata | NULL evidence level/confidence cannot bypass validation or replay comparison | forward-only NULL-hardening migration explicitly rejects NULL and uses NULL-safe comparisons | targeted RED #83 failed exactly NULL cases; remediation #84 and canonical CI green | PASS |
| Cross-project ID collision | foreign-project observation-ID reuse must fail without disclosing foreign row | project-scoped lookup/authorization preserves non-disclosure | cross-project replay pgTAP plus independent Pass B | PASS |
| Supersede replay | exact applied supersede is idempotent; inconsistent supersede state/drift fails closed | replay core preserves accepted supersede invariants and rejects inconsistent semantic reuse | supersede first-use/replay/drift pgTAP and review | PASS |
| Exact public-RPC authorization | active authorized writer positive control; anon/viewer/outsider/project-B owner/revoked member denied; denied attempts produce zero rows | changed SECURITY DEFINER public signature retains membership + `venues.write` enforcement; helper remains privileged-only | PR #86 direct exact-signature pgTAP executes all allow/deny cases and zero-side-effect checks; DB/RLS CI PASS | PASS |
| Legacy/helper privilege boundary | old client signature unavailable and internal replay helper not callable by public/anon/authenticated | legacy signature removed/revoked; helper grants remain revoked | signature/grant pgTAP, security review and Fresh Pass B | PASS |
| Adapter receipt integrity | adapter must send requested ID and fail closed if returned row ID is substituted | Supabase adapter sends `target_observation_id`; parser compares returned ID with requested ID | adapter unit tests including substituted-ID rejection | PASS |
| Forward-only migration safety | hardening must not rewrite history or weaken accepted Fact/Evidence/freshness/withdrawal behavior | additive/replacement migrations preserve existing tables and prior accepted semantics | full DB/RLS suite, existing fact suites, promotion suite and clean-checkout verification | PASS |
| Effective mutable-definition behavior | replay must remain valid under legal metadata changes, and illegal history-invalidating changes must be rejected before replay | hardened lexical multiselect canonicalizer is independent of option order; later definition-history guards reject invalidating option removal/numeric tightening | review-only #88 and #89, both 5/5 exact-head clean-checkout evidence | PASS |
| Bounded packet architecture | no new table, RLS policy, permission key, provider, UI, local queue or parent coordinator may leak into WP-2.12R | implementation is limited to one replay-safe Fact Observation command/migration family plus tests/docs | source-delta review, static/security gates and complete Fresh Pass B v2 | PASS |

## Finding reconciliation

| Finding / challenge | Pass C disposition |
| --- | --- |
| WP212R-AR-001 — NULL replay metadata | **CLOSED / VERIFIED** |
| WP212R-AR-002 — stale durable handoff | **CLOSED / VERIFIED** |
| transient multiselect-order P2 | **FALSE POSITIVE / DISPROVED by #88** |
| transient definition-constraint-drift P2 | **FALSE POSITIVE / DISPROVED by #89** |
| New Fresh Pass-B v2 findings | ∅ |

## Gap calculation

```text
required bounded WP-2.12R responsibilities
- implemented WP-2.12R responsibilities
- verified WP-2.12R responsibilities
= ∅
```

## Security / data-integrity / scope confirmation

- Stable client identity is mandatory at the application trust boundary.
- Exact replay is idempotent; semantic drift cannot silently reuse an existing
  row.
- Cross-project collision remains non-disclosing.
- Direct authorization is proven on the exact changed public RPC, not merely on
  a helper or owner-only happy path.
- Denied calls create zero observation rows.
- Legacy public surface and internal helper privileges remain closed.
- Existing Fact definition/history invariants remain authoritative; the
  effective migration chain, not obsolete earlier helper text, governs replay.
- No table, RLS policy, permission key, external provider, UI route, media
  lifecycle, local queue or parent WP-2.12 coordinator was added by this
  support packet.
- No production/private wedding data or provider campaign is required.

## Pass C verdict

**PASS — EXPECTED ↔ IMPLEMENTED ↔ VERIFIED gap ∅.**

The exact HEAD containing this acceptance record,
`5c6d40296ccf7ee2e616a6587b8e910e762dd541`, passed CI `37335393969` with
all five ordinary jobs green, including `Full verify from clean checkout`.
WP-2.12R is therefore **ACCEPTED / COMPLETE**.

The support dependency is satisfied. Parent WP-2.12 remains paused only until a
separate resumption seal records this accepted dependency and that seal itself
passes exact-head ordinary CI including clean checkout. FIR #42 / FTR-028
remains open for the parent workflow.
