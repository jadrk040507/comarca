# La Comarca repository guidance

This repository contains the public La Comarca site and its Cloudflare Worker-backed team platform. Read `.codex/skills/la-comarca-platform/SKILL.md` for project-specific rules and load only the linked references relevant to the change.

- Keep public publishing fail-closed: export only explicitly approved public fields from Notion.
- Keep participant, student/minor, tutor, attendance, transport, budget, and operational notes out of public exports.
- Treat server-side authentication and authorization as the source of access decisions; do not rely on UI visibility.
- Preserve the existing static-site and Worker architecture unless an audited change proves a smaller incremental design cannot meet the requirement.
- Use Notion as an integration boundary, not as an excuse to couple every UI component directly to its API.
- Run `npm test` from `web`, and `BASE_PATH=/ npm run build` for public build verification when applicable.
- Do not print or commit secrets, `.dev.vars`, `.env*`, tokens, private Notion payloads, or personal data.
