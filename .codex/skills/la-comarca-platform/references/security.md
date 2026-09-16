# Security rules and current boundaries

- Validate sessions and permissions server-side for every read and write; default deny. Centralize permission checks rather than scattering role-name conditionals.
- Maintain origin checks, bounded request bodies, safe error messages, secure HttpOnly/SameSite cookies, rate limits, optimistic concurrency, and audit logging for sensitive changes.
- Treat Notion relations, page IDs, uploaded files, and public URLs as untrusted input. Verify parent/source ownership before reading or writing related records.
- Public exports must use an explicit field allowlist and fail closed on malformed approved records. Never publish contacts, student/minor data, attendance, grades, payments, budgets, private notes, or arbitrary page body content.
- File uploads require size/type/signature checks, source ownership, authorization, and a safe serving/access strategy; temporary Notion URLs must not become accidental public storage.
- Review secret names and deployment variables without printing values. Keep Worker secrets in Cloudflare and public build variables limited to genuinely public identifiers.
- Treat the current broad catechism grant as a known limitation: it does not provide group-level isolation. Do not expose it as fine-grained access.
- Before production rollout, add tests for object access, revoked users, stale writes, malformed Notion records, public/private export separation, file access, and failure-safe retries.
