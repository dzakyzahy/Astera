# ASTERA Threat Model

## Scope

This model covers a future production ASTERA deployment handling estate incidents, assets, evidence, approvals, vendors, work orders, and notifications. The current contest build contains synthetic browser data and no real integrations.

## Highest-value assets

- property locations and operational schedules;
- resident, staff, vendor, and principal identities;
- photos, voice notes, documents, and asset telemetry;
- approval authority and financial thresholds;
- vendor dispatch instructions and work-order status;
- audit events and incident history;
- credentials, sessions, integration tokens, and encryption keys.

## Trust boundaries

1. User device to ASTERA edge/API.
2. API to identity provider and authorization policy.
3. Application services to database and object storage.
4. ASTERA to AI, notification, and vendor providers.
5. Organization boundary between separate customers.
6. Estate boundary within one organization.
7. Privileged principal/manager actions versus staff/vendor actions.

## Priority threats and controls

| Threat | Example impact | Required controls |
| --- | --- | --- |
| Cross-estate authorization failure | one vendor sees another property | server-side estate scope, row-level policy, negative authorization tests |
| Approval spoofing or replay | unauthorized spend or duplicate dispatch | MFA, step-up auth, signed session, version check, idempotency key, audit event |
| Sensitive notification leakage | address or incident appears on lock screen | redacted templates, preference controls, secure deep link, no evidence attachment |
| Evidence tampering | false photo or altered quote drives a decision | checksums, immutable object versions, uploader identity, timestamps, malware scan |
| Prompt injection in evidence | AI recommends unsafe action | content isolation, structured extraction, allowlisted tools, human approval, evaluation suite |
| Vendor account compromise | attacker receives operational access | least privilege, short-lived invitations, MFA, session revocation, anomaly alerts |
| Audit deletion or alteration | accountability is lost | append-only events, restricted writer, durable export, integrity monitoring |
| Secret exposure | provider or database compromise | managed secret store, rotation, CI scanning, no client-side credentials |
| Availability attack | urgent incident cannot be coordinated | rate limits, queues, degraded manual path, monitoring, backups and runbook |

## Abuse cases to test

- a vendor guesses or changes an incident identifier;
- a manager retries approval after a network timeout;
- two principals approve different quote versions concurrently;
- a malicious document instructs the AI to ignore estate policy;
- a notification provider receives more household data than necessary;
- a removed staff member reuses an existing session;
- an attacker uploads executable or oversized evidence;
- a support operator attempts to inspect an estate without a recorded reason.

## Security release gate

Before real data is accepted, complete authorization tests for every role and estate boundary, threat-model review, secure upload testing, dependency and secret scans, backup restoration, incident response rehearsal, and independent review of approval and dispatch flows.
