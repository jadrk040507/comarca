# Definition of done

## Publish every delivery to the correct target

**Every edit, including small fixes, documentation and FULL changes, requires publication and verification. The public site now uses GitHub Pages; backend changes still require a separate Worker rollout.** Follow the root `AGENTS.md` and `docs/github-pages.md`.

A commit, PR, local build or dry-run alone is not completion. Report the commit and the actual published URL. A successful Pages deployment does not mean that the Worker, CMS or `comarca.kipadmon.com` was updated. The requested custom-domain migration remains pending until the backend has been safely separated and DNS/Pages configuration and HTTPS have been verified.

1. Identify the affected public/private boundaries, source-of-truth ownership, permissions, state transitions and migration needs before implementation.
2. Add or update focused tests appropriate to the change, including failure and stale/concurrency paths. Review the workflow diff when changing deployment automation.
3. From the repository root, run `npm ci --prefix api` and `npm run check`. The public pipeline must additionally build using the real Pages base path. Preserve backend URLs and public integration variables; never substitute the Pages origin for the API origin without a verified backend migration.
4. Preserve the visual system from the existing code and history. For UI changes, compare desktop/mobile views and reduced-motion behavior; do not claim these checks passed merely because a build passed.
5. Review dependencies, secrets, logging, errors and public data exports. Only `dist` may be published; no private records or server credentials belong in static assets.
6. Publish the approved `main` version using `.github/workflows/portal.yml`. Verify the deployed `deployment.json` commit and build ID, real base path, public pages and assets. A 200 response alone is insufficient.
7. If the backend changed, separately review migration compatibility, backup/rollback, configuration and manual acceptance checks. Use the manual `.github/workflows/worker.yml` from `main` with `deploy=true` to publish fresh root-path assets and the Worker while preserving remote secrets. A Cloudflare credential is required for this separate operation, not for public Pages publication.
8. Verify affected authenticated workflows after a backend rollout; static smoke checks do not test sessions, authorization or private writes. Never remove or bypass those features to make Pages appear equivalent to a backend.
9. Report code committed, public Pages publication, backend rollout and custom-domain migration as distinct states. Preserve the last healthy release and report exact blockers; do not silently leave required backend deployment or domain migration marked complete.

The repository has focused unit/integration tests and syntax/build checks. It still lacks a true type-check, lint and browser end-to-end gate. Do not present those backlog items or unperformed visual checks as passed.
