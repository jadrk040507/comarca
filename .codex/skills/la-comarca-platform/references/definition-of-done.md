# Definition of done

For a meaningful change:

1. Identify affected public/private boundaries, source-of-truth ownership, permissions, state transitions, and migration needs before implementation.
2. Add or update focused unit/integration/authorization/workflow tests; include failure and stale/concurrency paths.
3. Run `npm test` from `web`; run `BASE_PATH=/ npm run build` and inspect generated output for public-facing changes.
4. Review dependency, secret, logging, error, and data-export impact. Do not treat a rendering check as completion.
5. For production rollout, document configuration/secrets, migration order, rollback path, observability, and manual acceptance checks.

 The current repository has focused tests and syntax/build gates, plus a manual Worker dry-run/deploy workflow; it still lacks a true type-check, lint, and browser end-to-end gate. Treat those as backlog items, not silently satisfied requirements.
