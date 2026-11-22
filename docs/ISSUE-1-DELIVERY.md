# Issue #1: stable delivery baseline and next restoration

## Recorded repository audit

Audited 2026-11-22. Current remote main is
`c517077533cc4f5c74e5ae5436c92fb8d3c4b4e8` (Add files via upload).
README and application identifiers describe v2.4-a.8, not v2.9.

- Entry point: `index.html`; inline styles, state, timers, translations and events.
- Storage key: `funbots_morning_timer_v24a8_flat` (`index.html`, `STORAGE_KEY`).
- Service worker cache: `funbots-morning-timer-v24a8-visible-bank-countdown`.
- PWA metadata: `manifest.json`; root PNG installation/social assets.
- No build step, deployment workflow or repository test tooling existed on main.
- Local preview: run `npm run dev`; internal server address is
  `http://127.0.0.1:4173/` (port 4173). This is a local validation address, not a
  shared cloud preview. Use platform preview controls if available.
- Live version is unverified. A request to the conventional candidate
  `https://studio1037.github.io/morningtimer/` was denied by the environment
  proxy (CONNECT 403); this does not establish site health or deployment identity. Do not claim it matches main or v2.9.

The current branch adds tooling, tests and documentation only. `index.html`,
`manifest.json`, assets and `service-worker.js` must remain byte-identical to main.
No deployment, storage migration, timer correction, Pro or Family Rewards is part
of this PR. Compare these paths with main before review.

## Test categories

See `QA.md` for commands and expected results. Current baseline passes describe
v2.4-a.8. `@known-defect` tests assert desired elapsed-time recovery and execute as
expected failures. The separate `@v29-contract` test asserts that unchecking a
completed stage resumes it; this fails in v2.4-a.8. It is a future acceptance
contract requested by issue #1, not evidence that the unavailable ZIP implements
any particular savings or timer policy. Do not silently rewrite expectations or
copy production code into tests to obtain green output.

## CI design (proposal; no workflow enabled by this PR)

Use pull_request CI on a hosted Linux runner with read-only contents permission:
checkout the exact PR revision, install Node 24 and Python 3, `npm ci`, install the
lockfile-matched Playwright Chromium with system dependencies, then `npm test`.
Upload HTML/JSON reports and failure traces even on failure. Keep retries at zero
initially. Require the test check and MASTER review before merging. No secrets
are needed for tests. Expected failures must remain visible in the report and PR
summary; unexpected failures and unexpected passes block review. Avoid
pull_request_target and running untrusted PR code with deployment credentials.

## Separate v2.9 ZIP import plan

1. Obtain the actual validated v2.9 Stable ZIP through an accessible attachment
   or authorized artifact location. A ZIP in another ChatGPT conversation is not
   available in this workspace. Record its owner-provided identity and SHA-256;
   do not invent contents or substitute experimental v3.1.
2. Inspect the ZIP listing for traversal, symlinks and executable content before
   extracting into an isolated directory outside the checkout. Inventory files,
   versions, storage keys, cache identifiers and dependencies. Retain the original.
3. After MASTER review of this baseline PR, branch from the agreed main revision
   for an isolated v2.9 restoration PR. Compare the artifact against main, inventory
   additions/deletions, and map every production difference to validated behavior.
4. Run baseline, defect and future-contract tests against the artifact in isolation.
   Investigate changes in outcomes; remove expected-failure annotations only with
   evidence. Confirm the precise resumed timer and Bank accounting rules with the
   validated artifact. Preserve real family data; use sanitized storage fixtures.
5. Propose explicit storage compatibility/migration and service-worker upgrade
   handling in that separate PR if required. Test old-to-new upgrades, reload,
   offline use, interrupted updates and rollback data compatibility. Never assume
   replacing static files safely rolls back migrated data.
6. Include artifact identity, diff inventory, results, outstanding discrepancies,
   manual device results and a rollback procedure in the restoration PR. Request
   MASTER approval. No import, merge or deployment is authorized by this plan.

## Preview, production approval and rollback proposal

Use an isolated preview origin for each reviewed release candidate. Paths alone
share localStorage and Cache Storage. Keep preview workers, data and credentials
separate from the live family installation. Do not grant fork PRs production
secrets or publish their artifacts automatically to the production origin.

A later approved GitHub Actions delivery workflow should build/package an immutable
static artifact from an exact reviewed SHA after tests pass. Preview deployment
should be independently permissioned. Production should use an explicit
workflow_dispatch selecting that artifact/SHA and a protected `production`
environment with MASTER as a required reviewer, no self-approval or branch-push
auto-deployment. Grant Pages/id-token permissions only to that deployment job,
serialize production deployments, and record artifact hashes and deployment URLs.

Retain the previous production artifact and SHA. Rollback should require the same
explicit approval and redeploy that known artifact, followed by online/offline
smoke checks. Service-worker cache-first behavior means redeployment alone may
not update installed clients; the restoration PR must validate worker updates and
cache compatibility, including already-open clients. Do not delete family storage
as a rollback mechanism. Preserve recoverable data before any future migration.

## MASTER review through the connected GitHub plugin

Once a PR exists, MASTER can open it directly in the connected GitHub plugin for
`studio1037/morningtimer`, read its description and file diff, and review test
results/known defects there. No copying messages between chats is required. Review
this issue's acceptance checklist, confirm production paths are unchanged and
confirm the external v2.9 import is deferred. Leave approval or requested changes
on that PR. Merge and production approval remain separate explicit decisions.

If API policy prevents PR creation, report that blocker and the pushed branch;
a compare/new-PR link is not an existing PR URL. Do not claim review or acceptance
is complete until the PR has actually been created.
