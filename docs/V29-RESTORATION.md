# Morning Face v2.9 Stable restoration — PR #4 / issue #3

Imported on 2026-11-22 into `restore/v2.9-stable` only. Main and production have
not been changed or deployed. This is a restoration candidate, not release approval.

## Exact artifact and inventory

Original ZIP is retained at `artifacts/v2.9-stable/morning-timer-v29-stable.zip`.
SHA-256: `7840b4792e6c3ef27a4ba35d4e1712277b656dc6f992e52c7af36809748c3740`.
All 34 flat entries passed path/symlink checks and are imported byte-for-byte.
`artifacts/v2.9-stable/inventory.json` records each file's size, SHA-256 and change
relative to the previous application. There were no archive instructions executed.
The supplied README mentions rebuilt v3.0.1 ancestry; this is provenance text in
the supplied artifact, not a substitution with experimental v3.1.

Changed existing files: index.html, service-worker.js, README.md.
Added archive files: CHANGELOG_v29_STABLE_RU.md, CHANGELOG_v301_REBUILT_RU.md.
The other 29 archive files are unchanged. Manifest and images are unchanged.
QA tooling and the existing GitHub Actions QA workflow are preserved.

## Storage and worker compatibility: release blockers

| Item | v2.4-a.8 | v2.9 Stable |
| --- | --- | --- |
| localStorage key | funbots_morning_timer_v24a8_flat | funbots_morning_timer_v29_stable |
| Worker cache | funbots-morning-timer-v24a8-visible-bank-countdown | funbots-morning-timer-v29-stable |

There is no migration/fallback to the old storage key. The old record is left
intact, but the candidate starts fresh under the new key (including language).
A browser test verifies preservation and lack of migration. Same field structure
is loaded with the existing weak validation; cross-version state recovery is not
certified. Do not test this candidate on the family's production origin.

The worker strategy is unchanged: immediate skipWaiting/clients.claim, cache-first
GETs, and activation deleting ALL caches other than its current cache name.
Therefore a same-origin upgrade can delete the old offline cache, and open clients
can encounter a new worker mid-session. The archive does not protect the old
worker installation on the same origin. This is a documented rollout blocker,
not silently corrected in a supposedly byte-exact restoration.

Before any later production approval: back up legacy and candidate storage using
browser/devices' supported export procedure; retain exports securely outside Git
and never include actual family state in traces or fixtures. Decide whether fresh
state is acceptable or design a separately reviewed migration. Test old installed
worker -> candidate -> offline -> rollback with already-open clients on a disposable
origin. Keep production untouched until this passes and MASTER accepts on devices.
Rollback static assets alone does not restore deleted caches or merge the two keys.

## Preview isolation

The first test pass served the untouched extraction from `/workspace/v29-artifact`
on a fresh loopback test origin (port 4173); no production requests were modified.
For local manual preview, from this checkout run:

```sh
python3 -m http.server 4174 --bind 127.0.0.1
```

Port 4174 gives another origin, separate from tests on 4173 and from production.
Use only synthetic state. This is internal validation, not a shared device preview.
No shared preview has been deployed: the task explicitly prohibits deployment,
and a local origin cannot establish iPhone/iPad acceptance. A separately authorized
nonproduction HTTPS origin is still needed for MASTER's real family-device review.
Never publish this candidate to the current production origin just to preview it.

## Test evidence and classifications

First ran the unchanged 13-test suite against the isolated exact extraction:
7 baseline passes, 3 expected timer defect failures, 2 obsolete baseline failures
(old reopening behavior and hard-coded cache name), and 1 unexpected pass of the
future resume contract. Command exit 1. These outcomes motivated only evidenced
test updates; no production logic was patched.

Updated reopening coverage asserts that savings are removed, the previous stage
resumes, one second elapses, and recompletion recredits only the remaining savings.
The `@v29-contract` test is now an ordinary passing test. Offline coverage targets
the actual supplied cache name. The three elapsed-time defects remain expected
failures, not claimed fixes. Additional storage coverage verifies legacy data is
retained but not automatically imported. See QA.md for commands and final results.

Remaining limitations: simulated suspension rather than OS suspension; system
Chromium only; no Safari/iOS install tests, live family state, service-worker
cross-version upgrade/device acceptance, shared HTTPS preview or production release.

MASTER must review PR #4 directly in GitHub, review reports and known defects,
and approve behavior on real family devices before any separately authorized
merge/release. Do not merge or deploy as part of this import.

Final imported-checkout run: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test`
with Chromium 154 completed 14 tests: 11 PASS, 3 expected timer-defect FAIL,
0 unexpected failures, 0 skipped; exit 0. All 34 artifact files matched the
extraction byte-for-byte after the run. `git diff --check` passed.

Review target: https://github.com/studio1037/morningtimer/pull/4 (existing PR
identified by the user). GitHub API access returned Forbidden in this environment;
the branch push updates the existing PR's commits, but API editing of its body
and live CI-status inspection were unavailable. This report carries the results
and blockers for direct review.
