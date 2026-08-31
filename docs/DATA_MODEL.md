# ASTERA Data Model

## Core entities

| Entity | Purpose | Important fields |
| --- | --- | --- |
| Organization | family office or operator boundary | id, name, policySetId |
| Estate | managed property | id, organizationId, label, timezone, status |
| Membership | scoped access | userId, organizationId, estateIds, role |
| Space | location within an estate | id, estateId, label, type |
| Asset | maintainable equipment or system | id, estateId, spaceId, category, lifecycleStatus |
| Incident | reported operational problem | id, estateId, assetId, severity, status, summary |
| Evidence | photo, document, voice, or note | id, incidentId, storageKey, mediaType, checksum |
| Quote | vendor offer normalized for comparison | id, incidentId, vendorId, amount, scope, warranty |
| Approval | accountable decision | id, incidentId, quoteId, approverId, status, decidedAt |
| WorkOrder | authorized execution | id, incidentId, vendorId, status, scheduledAt |
| Vendor | approved service provider | id, organizationId, categories, complianceStatus |
| AuditEvent | append-only state history | id, aggregateType, aggregateId, actorId, action, occurredAt |
| Notification | redacted user-facing update | id, recipientId, channel, template, status |

## Relationship outline

```text
Organization 1---* Estate 1---* Space 1---* Asset
       |               |
       *               *
 Membership        Incident 1---* Evidence
                         | 1---* Quote *---1 Vendor
                         | 1---* Approval
                         ` 1---* WorkOrder

Every business aggregate 1---* AuditEvent
```

## Data rules

- Monetary values use integer minor units plus ISO currency code.
- Timestamps are stored in UTC and rendered in the estate timezone.
- Human-facing references are separate from internal identifiers.
- Evidence objects are immutable; corrections create a new version.
- Audit events cannot be edited through product APIs.
- Soft deletion is allowed only where retention policy permits it.
- Vendor access never implies portfolio-wide access.
- AI-derived fields include source references, model/version, confidence, and reviewer state.

## Prototype notice

The current UI uses synthetic in-memory records solely to demonstrate workflows. No data in the prototype should be treated as a real property record, vendor quote, approval, payment, or dispatch.
