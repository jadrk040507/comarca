# Definition of done

## Every delivery must update production

**Every repository edit, including documentation, configuration, small fixes and FULL changes, requires deploying and verifying `https://comarca.kipadmon.com`.** Follow the mandatory production rule in the root `AGENTS.md`. Group related edits into a coherent tested delivery; do not ship broken intermediate states.

A commit, pull request, local build, successful dry-run, or GitHub Pages publication alone is not completion. Record the delivered commit, the actual Worker deployment result and verification on the canonical domain. Do not claim production is updated when deployment was skipped or the running version was not checked.

For a meaningful change:

1. Identify affected public/private boundaries, source-of-truth ownership, permissions, state transitions, and migration needs before implementation.
2. Add or update focused unit/integration/authorization/workflow tests; include failure and stale/concurrency paths.
3. From the repository root (not `web`), run `npm ci --prefix api` and `BASE_PATH=/ PLATFORM_ORIGIN=https://comarca.kipadmon.com npm run check`. This runs syntax checks, tests and the public build. Inspect generated output for public-facing changes.
4. Recover and preserve the existing visual system from the code and history. Read `references/ux.md` and the design section of `AGENTS.md`; compare affected desktop/mobile views and reduced-motion behavior when applicable.
5. Review dependency, secret, logging, error, and data-export impact. Do not treat a rendering check as completion.
6. Before production rollout, document configuration/secret names (never values), migration order, compatibility, backup/rollback path, observability, and manual acceptance checks. Review new migrations before merging to `main`; deployment requirements do not authorize destructive changes.
7. Deploy the approved `main` version through `.github/workflows/worker.yml`, including fresh `dist` assets and the Worker described by `api/wrangler.jsonc`. Preserve remote secrets and variables; GitHub Pages is a separate publication target, not a substitute.
8. Verify the deployment step actually ran for the delivered commit and check the canonical domain, public assets, CMS entry point and affected workflows. An HTTP 200 alone is insufficient evidence of the deployed revision. Report any failed or unavailable checks honestly.
9. If credentials, permissions, connectivity, tests or deployment checks block delivery, preserve the last healthy release and report the exact blocker. Clearly separate code committed, deployment executed and production verified; the production requirement remains unresolved until verified.

The repository has focused tests and syntax/build gates, plus a Worker verification/deployment workflow. It still lacks a true type-check, lint and browser end-to-end gate. Treat those as backlog items, not silently satisfied requirements. Public smoke checks cannot establish that authenticated CMS workflows or visual regressions have passed.
