# Emergent Build Guide

This guide is a handoff for continuing ASTERA in Emergent or another app-building environment while preserving the product intent.

## Product north star

Build a private estate operations command center for professional estate managers and principals. The anime-inspired 3D concierge is a memorable visual hook, while all operational interfaces remain calm, credible, accessible, and suitable for high-trust decisions.

## Recommended build sequence

1. Reproduce the portfolio shell and responsive design tokens.
2. Implement estate selection and role-scoped navigation.
3. Implement incident intake with structured fields and evidence uploads.
4. Add deterministic triage rules before connecting any AI provider.
5. Add quote normalization and comparison.
6. Add an explicit, policy-driven approval state machine.
7. Add work-order dispatch and append-only audit events.
8. Add secure authentication, persistent storage, and notification adapters.
9. Add observability, accessibility, security, and recovery tests.

## Master build prompt

> Build ASTERA, a responsive private estate operations command center for principals and professional estate managers in Indonesia. The UI uses a midnight-indigo, champagne-gold visual system with restrained anime-inspired 3D concierge artwork as a memorable hook. Operational surfaces must look professional, calm, and trustworthy. The golden workflow is a water leak at a Bali villa: report by text/photo/voice, structure the evidence, suggest severity and containment, compare two normalized vendor quotes, require explicit human approval, dispatch a work order, and record an audit event. Include portfolio KPIs, estate switching, assets, vendors, search, notifications, role/privacy panels, a resettable synthetic demo, mobile responsiveness, keyboard support, loading/error states, and visible disclosure that all demo data is synthetic. Do not claim real security certifications, integrations, payments, dispatches, or AI actions unless they are actually implemented. AI recommendations must be advisory and evidence-linked; only an authorized human may approve spend or dispatch.

## Production integration contract

Replace in-memory demo actions behind service interfaces rather than rewriting UI flows:

- `IncidentService.createDraft(input, evidence)`
- `TriageService.analyze(incidentId)`
- `QuoteService.listForIncident(incidentId)`
- `ApprovalService.decide(approvalId, decision, version)`
- `WorkOrderService.dispatch(incidentId, quoteId, idempotencyKey)`
- `AuditService.listForAggregate(type, id)`
- `NotificationService.listForUser()`

Every mutation should return an authoritative server state and request identifier. Approval and dispatch APIs must enforce role, threshold, concurrency version, and idempotency server-side.

## Deployment checklist

- Set environment secrets in the platform, never in source files.
- Use preview deployment first.
- Verify the golden workflow on desktop and mobile.
- Verify keyboard navigation, focus, reduced motion, and readable contrast.
- Check synthetic-data disclosures and remove development-only logs.
- Confirm error monitoring, health checks, backup/restore, and incident ownership.
- Review all externally visible claims against implemented capability.
