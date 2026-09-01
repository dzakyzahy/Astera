# ASTERA Architecture

## Current contest build

ASTERA is currently a responsive Next.js contest prototype packaged for Sites-compatible hosting. Its UI consumes typed, in-memory server API routes; every property, person, incident, quote, work order, and audit event remains anonymous and synthetic.

```text
User interaction
      |
Next.js App Router
      |
Typed client adapter
      |
Synthetic API + domain services
      |---- portfolio, assets, incidents, and quotes
      |---- server-enforced approval and dispatch state machine
      |---- idempotency locks, outbox, and audit verification
      `---- resettable in-memory contest dataset
```

This boundary makes the demonstration safe, repeatable, and contract-testable. The dispatch route records only a synthetic contest event; it has no external vendor connector, payment rail, or property-control capability.

## Production target

```text
Web / mobile clients
        |
API gateway + authentication
        |
Estate operations service
   |         |          |
Postgres   Object     Workflow / jobs
RLS data   storage    with retries
   |         |          |
Audit log  Evidence   Vendor connectors
        |
AI orchestration adapter
```

### Recommended service boundaries

- **Identity and access:** passwordless or enterprise SSO, MFA, session management, role and estate-scoped authorization.
- **Estate operations:** properties, spaces, assets, incidents, work orders, approvals, and vendor engagements.
- **Evidence:** presigned uploads, malware scanning, metadata stripping where appropriate, retention policies, and immutable references from audit events.
- **Workflow:** timeouts, reminders, approval thresholds, vendor dispatch, idempotency keys, and dead-letter handling.
- **AI adapter:** provider-neutral structured extraction and recommendation with prompt/version logging, confidence, citations to submitted evidence, and safe fallbacks.
- **Notifications:** user preferences and redacted delivery through email, push, or messaging providers.
- **Audit:** append-only security and business events exported to durable storage.

## Authorization model

Every request should be checked against both organization and estate scope. Suggested roles:

| Role | Typical access |
| --- | --- |
| Principal | portfolio overview, spending approvals, reports |
| Estate manager | full operations for assigned estates |
| Steward | report and update assigned work, limited asset context |
| Vendor | only assigned work orders and permitted evidence |
| Auditor | read-only records and audit exports |

UI hiding is not authorization. Production enforcement belongs in the API and database policies.

## Approval state machine

```text
DRAFT -> TRIAGED -> QUOTING -> AWAITING_APPROVAL
                                  |        |
                               REJECTED  APPROVED
                                             |
                                         DISPATCHED
                                             |
                                       IN_PROGRESS
                                             |
                                          RESOLVED
```

Every transition records actor, timestamp, previous and next state, reason, request identifier, and relevant evidence. External actions use idempotency keys so retries cannot dispatch or charge twice.

## Reliability requirements

- transactional outbox for notifications and integrations;
- optimistic concurrency or version columns on decisions;
- retry policies with exponential backoff and explicit terminal failure states;
- health checks, structured logs, metrics, distributed traces, and alert ownership;
- daily encrypted backups with tested restore procedures;
- graceful degradation when AI or vendor integrations are unavailable.

## Security baseline

- MFA for privileged roles and step-up authentication for high-value approvals;
- encryption in transit and at rest using managed key rotation;
- private-by-default estates, uploads, and notifications;
- signed, short-lived asset URLs and strict content security policy;
- secret management outside source control;
- dependency and secret scanning in CI;
- rate limiting, abuse monitoring, and tamper-evident audit exports;
- data minimization, residency review, retention controls, and account deletion workflow.

## AI safety boundary

AI output is advisory. It may extract structured fields, summarize evidence, suggest severity, compare quotes, and draft actions. It must show uncertainty, preserve source evidence, avoid unsupported claims, and never approve spending or dispatch a vendor on its own.
