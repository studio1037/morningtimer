# Morning Face v2.9 Stable — isolated restoration candidate

**Status:** import pending; `main` and production remain unchanged.

## Provenance
- Supplied archive: `morning-timer-v29-stable.zip`
- SHA-256: `7840b4792e6c3ef27a4ba35d4e1712277b656dc6f992e52c7af36809748c3740`
- 34 flat files; contains `index.html`, `service-worker.js`, `manifest.json`, icons, historical changelogs.
- This archive was user-tested in previous development, but is not yet independently tested with repository CI.
- **Do not substitute experimental v3.1 Pro Layer.**

## Before application import
- Provide the exact archive to a GitHub-capable execution environment (Codex environment or GitHub browser upload).
- Preserve its binary bytes and verify the SHA-256 above before extraction.
- Compare original `v2.4-a.8` and v2.9 application files; do not overwrite `package.json`, Playwright tests, `.github/workflows/qa.yml`, or baseline QA documents.

## Restoration acceptance
1. Import application files *only into this branch*.
2. Run `npm test`; review expected defects and v2.9-only contract separately.
3. Inspect localStorage key migration, backup strategies, service-worker caching, and existing offline installs.
4. Produce isolated preview on another origin for iPhone/iPad testing; don't test by replacing production.
5. Keep old deployment unchanged until MASTER explicitly approves a separate production merge and release.

## Relevant issues
- #1 — QA baseline (merged by PR #2)
- #3 — v2.9 restoration
