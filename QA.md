# PWA regression baseline

This suite targets the repository's **v2.4-a.8** application, initially at
`c517077533cc4f5c74e5ae5436c92fb8d3c4b4e8`. It does not certify the live deployment
or the separately held v2.9 Stable archive. Pro and Family Rewards are out of scope.
Production HTML, storage keys, and service-worker cache naming are unchanged.

## Install and run

Prerequisites: Node.js (validated with 24.19.0), npm, Python 3 (validated with
3.12.14), and Chromium. From the repository root:

```sh
npm ci
npx playwright install chromium
npm test
```

On Linux, Playwright's browser may also need system libraries; supported machines
can use `npx playwright install --with-deps chromium` during environment setup.
To use an existing system Chromium instead of downloading a browser:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

The suite starts and stops its own Python static server on port 4173. Keep that
port free; it deliberately refuses to reuse an unrelated server. Run `npm run dev`
for manual development, and stop that server before testing. No build is needed.

```sh
npm run test:baseline  # passing behavior only
npm run test:defects   # desired behavior that currently fails
npm run test:report    # HTML report with traces for failing assertions
```

Reports and dependencies are ignored by Git. Each test has a fresh browser
context, isolated storage, and a controlled browser clock. Test timing uses
Playwright's clock API, not production code changes or localStorage fixtures.
The existing service prompt enables nine-second stages where useful.

## Passing baseline expectations

- Tasks toggle checked state. Completing three tasks records that stage's savings
  and activates the next stage; completing another stage adds to the Bank.
- Unchecking and rechecking a completed-stage task changes its checkbox without
  restarting that stage or adding savings twice. This characterizes current behavior;
  it does not promise a future product rule for reopening stages.
- A stage timeout advances automatically without marking unfinished tasks checked
  or opening the exit screen prematurely.
- Savings remain available until the final stage expires, then count down and
  become Late after depletion.
- Immediate reload preserves task and remaining-time snapshots.
- Russian, English, and Hebrew settings text and language metadata update;
  Hebrew sets RTL; language and direction persist after reload.
- After service-worker installation and control, offline reload renders the app,
  task clicks work, and a cached PNG is returned with the correct content type.

## Known defects: assertions must fail today

Tests tagged `@known-defect` use Playwright's `test.fail()` immediately before the
recovery assertion. Setup errors before that annotation remain unexpected failures.
These tests execute; they are not skipped. They assert desired behavior:

| Case | Desired result | Current defect |
| --- | --- | --- |
| Delayed callback, 20 seconds in nine-second mode | Two stages expire; third has seven seconds left | `sync()` advances only one stage and drops overflow |
| Visibility event after a 60-second clock jump | Active timer consumes the minute | Handler resets `lastTime` before synchronizing |
| Reload after five active seconds and 60 additional elapsed seconds | First timer displays 13:55 | Reload restores the old 14:55 snapshot |

An expected assertion failure counts as an expected outcome in Playwright, so
its aggregate may say "passed". Do not report these cases as working features.
An unexpected pass makes the command fail and requires review/removal of the
expected-failure annotation. Any other unexpected failure also fails the command.
Inspect HTML/JSON results and traces to confirm the failure is the documented
assertion, not an unrelated error.

## Validation and limits

Initial cloud validation uses system Chromium 154, two workers, and no retries.
The three recovery cases are deterministic simulations: clock jumps, delayed
callbacks, and a synthetic visibility event. They do not reproduce real mobile
OS suspension. Real-device lock/unlock, iOS installation, Safari/WebKit, Firefox,
accessibility, visual layout, multi-tab conflicts, schema migrations, and upgrades
from an old service worker remain outside this first suite. Offline validation
covers a freshly installed worker, not a cross-version cache upgrade.

Do not merge or deploy until MASTER approval. The v2.9 archive needs a separate
comparison and validation when provided; do not relabel this baseline as v2.9.

Recorded result (2026-11-01): **9 baseline PASS, 3 known-defect assertion FAIL
(expected), 0 unexpected failures, 0 skipped**, full suite exit code 0.
Observed defect values: delayed overflow left stage two at `00:09` rather than
`00:00`; visibility resume left stage one at `15:00` rather than `14:00`;
elapsed reload restored approximately `14:55` rather than `13:55`.
