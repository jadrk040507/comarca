# Evidence-backed domain map

## Existing concepts

- Agenda activities: public/private state, date, location, type, recurrence, status, publication flag, and optimistic versioning.
- Materials: public link/file metadata, validity, review, and agenda relations.
- Catechism operations: students, attendance, lessons, grades, topics, and catechist shifts under one broad `catecismo` permission.
- Transport: driver/trip records related to agenda.
- Registrations: incoming requests stored privately in Notion; submission does not confirm a place.
- Access: admin/editor/reader grants scoped to broad modules; invitations are hashed, expiring, and single-use.

## Candidate future domains

Treat spaces/rooms, programs/groups, events/reservations, people/contacts, operations/tasks, incidents/maintenance, notifications, and audit history as hypotheses. Add each only after a real workflow, owner, state transition, and source of truth are documented.

Prefer an event/activity as the hub for related program, room, registration, transport, materials, staffing, and operational history. Do not conflate a recurring schedule with individual sessions, or a request with a confirmed reservation.

## Ownership

- Public agenda/materials: Notion-owned editorial data, exported through an explicit allowlist to the public site/Worker.
- Auth, grants, invitations, sessions, rate limiting, and audit events: application/D1-owned.
- Registrations and sensitive catechism records: private operational data; do not export to GitHub or public endpoints.
- Notifications: separate delivery system; consent and delivery status must not be inferred from public content.
