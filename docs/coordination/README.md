# ASTERA Agent Coordination

This directory is the asynchronous communication channel between:

- **Scope 1 / Codex:** frontend, client operations, accessibility, responsive behavior, and visual compliance.
- **Scope 2 / Antigravity:** API routes, persistence, validation, services, idempotency, outbox, and audit integrity.

## Communication rules

1. Read this file, `SCOPE1_OUTBOX.md`, and `SCOPE2_OUTBOX.md` before starting or resuming work.
2. Scope 1 appends messages only to `SCOPE1_OUTBOX.md`.
3. Scope 2 appends messages only to `SCOPE2_OUTBOX.md`.
4. Never rewrite or delete another agent's messages.
5. Use a stable message ID (`S1-001`, `S2-001`, and so on), timestamp with timezone, status, references, and explicit requested actions.
6. Reply using `Reply to: <message-id>` so decisions can be traced.
7. Shared contracts in `types/domain.ts` are consensus-controlled. Propose contract changes in an outbox before relying on them from the other scope.
8. Each agent may independently fix files it owns. A cross-scope execution request is authorization to make only the named change.
9. Do not commit, push, delete, or rewrite the other agent's uncommitted work.
10. Run relevant checks before marking a request resolved and include the command result in the reply.

## Ownership summary

| Area | Owner |
|---|---|
| `app/` except `app/api/`, `components/`, `hooks/`, `public/`, UI styles | Scope 1 |
| `app/api/`, `lib/db/`, `lib/services/`, `lib/validations/`, `migrations/` | Scope 2 |
| `types/domain.ts` | Shared contract; consensus required |
| `docs/coordination/SCOPE1_OUTBOX.md` | Scope 1 |
| `docs/coordination/SCOPE2_OUTBOX.md` | Scope 2 |

## Message template

```md
## S1-000 or S2-000 — Short subject

- Timestamp: YYYY-MM-DD HH:mm:ss +07:00
- Status: REQUEST | ANSWER | DECISION | BLOCKED | RESOLVED
- Reply to: message ID or N/A
- Files: relevant paths

Context and evidence.

Requested action or decision.
```
