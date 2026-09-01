# ASTERA — Product Requirements Document

Version: 1.0
Last updated: 1 Sep 2026
Status: DRAFT — awaiting stakeholder review

---

## 1. Product overview

### 1.1 One-line promise

ASTERA is a private estate operations command center that turns fragmented incidents, vendors, approvals, assets, and audit records into one calm, accountable workflow.

### 1.2 Problem statement

High-value residences, villas, and family offices in Indonesia are still managed through WhatsApp threads, spreadsheets, phone calls, and individual memory. This creates avoidable risk:

- **No structured intake.** Urgent incidents arrive as chat photos with no severity, location, or asset context attached.
- **No quote normalization.** Vendor proposals are forwarded as PDFs or voice notes — comparing scope, warranty, and cost requires manual side-by-side reading.
- **No approval trail.** Spending decisions happen in chat replies with no timestamped record linking evidence to authorization.
- **No asset memory.** Maintenance history disappears when staff turn over. Preventive schedules live in someone's head.
- **No accountability surface.** Principals get interrupted for operational details but still lack oversight of what happened and why.

### 1.3 Target customer

| Segment | Description | Size estimate |
|---|---|---|
| Primary | Professional estate managers responsible for 2–10 premium properties in Indonesia | ~2,000–5,000 individuals |
| Economic buyer | Principals, family offices, or hospitality operators who pay for the service | ~500–1,500 entities |
| Participants | On-site staff (stewards, security, housekeeping) and trusted vendors | 5–20x primary user count |

### 1.4 Competitive landscape

| Alternative | Limitation ASTERA addresses |
|---|---|
| WhatsApp/chat groups | No structure, no state machine, no audit trail, evidence buried in scroll |
| Generic CMMS (Fiix, Limble) | Built for factories/fleets, not household operations; no principal-approval workflow |
| Property management SaaS (Buildium, AppFolio) | Rental/tenant-focused; wrong data model for private estate ops |
| Custom spreadsheet + email | No real-time status, no automated vendor normalization, no accountability chain |
| Dedicated family office platforms | Financial-first; operational incidents are an afterthought |

---

## 2. User roles and personas

### 2.1 Role matrix

| Role | Description | Key jobs-to-be-done |
|---|---|---|
| **Principal** | Property owner or family office head | Review spending requests, approve/reject with evidence, see portfolio health at a glance |
| **Estate Manager** | Professional operations lead for 2–10 properties | Receive incident reports, triage severity, compare vendor quotes, dispatch work, track SLAs |
| **Steward** | On-site staff (housekeeper, security, maintenance) | Report incidents with evidence (photo/voice/text), view assigned work status |
| **Vendor** | Approved service provider | Receive structured work briefs, submit quotes, confirm completion with evidence |
| **Auditor** | Compliance or financial reviewer | Read-only access to incident history, spending, and audit events |

### 2.2 Access model

Every request is checked against both organization and estate scope. UI hiding is not authorization — production enforcement belongs in the API and database policies.

- Principal: portfolio overview, spending approvals, reports
- Estate Manager: full operations for assigned estates
- Steward: report and update assigned work, limited asset context
- Vendor: only assigned work orders and permitted evidence
- Auditor: read-only records and audit exports

---

## 3. Golden workflow (primary use case)

This is the critical path that must work flawlessly. Every screen, state, and transition below is a hard requirement.

```
Report → Triage → Quote → Approval → Dispatch → Resolution → Audit
```

### 3.1 Incident report

- **Actor:** Steward or Estate Manager
- **Input:** Free-text description, severity suggestion, photos, voice notes
- **System response:** Structure the report with location, affected asset, proposed severity, immediate containment steps
- **Output:** Draft incident in TRIAGED state

### 3.2 Triage

- **Actor:** ASTERA AI (advisory) + Estate Manager (authority)
- **System response:** AI proposes severity, identifies affected asset from registry, suggests containment
- **Constraint:** AI output is advisory. It shows uncertainty, preserves source evidence, and never approves spending or dispatch on its own
- **Output:** Incident moves to QUOTING state, matched vendors notified

### 3.3 Quote comparison

- **Actor:** Estate Manager reviews normalized vendor proposals
- **Display:** Side-by-side comparison of total cost, arrival time, scope, warranty, risk assessment
- **Constraint:** Quotes are normalized to a common structure for fair comparison
- **Output:** Estate Manager selects recommended vendor, incident moves to AWAITING_APPROVAL

### 3.4 Approval

- **Actor:** Principal (or delegate with configured threshold)
- **Display:** Concise approval request with amount, risk level, evidence summary, vendor recommendation
- **Constraint:** Explicit authorization checkbox. Cannot proceed without deliberate confirmation
- **Guard:** Amount threshold per role, MFA for high-value decisions (production)
- **Output:** APPROVED or REJECTED state, timestamped audit event

### 3.5 Dispatch

- **Actor:** System (on approval)
- **System response:** Generate work order, notify vendor with structured brief, confirm schedule
- **Constraint:** Idempotency key prevents duplicate dispatch. Retry-safe
- **Output:** DISPATCHED state, vendor receives work order

### 3.6 Resolution

- **Actor:** Vendor submits completion evidence, Estate Manager verifies
- **System response:** Close incident, enrich asset maintenance history
- **Output:** RESOLVED state, asset history updated

### 3.7 Audit trail

- **Immutable:** Every state transition records actor, timestamp, previous/next state, reason, request ID, evidence references
- **Export:** Append-only events exportable for family-office reporting
- **Integrity:** SHA-256 chain in production (prototype simulates structure)

---

## 4. Feature requirements

### 4.1 Portfolio overview (P0 — contest)

| Requirement | Priority | Status |
|---|---|---|
| Estate constellation showing property health at a glance | P0 | Done |
| KPI cards: open incidents, SLA at risk, pending approvals, cost avoidance | P0 | Done |
| Estate switching with scoped data filtering | P0 | Done |
| Greeting with contextual summary of attention items | P0 | Done |
| Synthetic-data disclosure badge | P0 | Done |

### 4.2 Incident management (P0 — contest)

| Requirement | Priority | Status |
|---|---|---|
| Incident card with severity, timeline, affected asset, evidence | P0 | Done |
| Incident intake form with text/photo/voice input modes | P0 | Done |
| AI-assisted triage with confidence indicator and human override | P0 | Done |
| Incident state machine (DRAFT → TRIAGED → QUOTING → AWAITING_APPROVAL → APPROVED/REJECTED → DISPATCHED → IN_PROGRESS → RESOLVED) | P0 | Done |
| All-clear state when no active incidents | P0 | Done |

### 4.3 Quote comparison (P0 — contest)

| Requirement | Priority | Status |
|---|---|---|
| Side-by-side normalized vendor proposals | P0 | Done |
| Comparison axes: cost, ETA, scope, warranty, risk | P0 | Done |
| AI recommendation with evidence citation | P0 | Done |
| Selection triggers approval flow | P0 | Done |

### 4.4 Approval flow (P0 — contest)

| Requirement | Priority | Status |
|---|---|---|
| Explicit authorization confirmation (checkbox + statement) | P0 | Done |
| Approval summary with amount, vendor, risk, evidence | P0 | Done |
| State transition to DISPATCHED on approval | P0 | Done |
| Audit event recorded on decision | P0 | Done |
| No vendor dispatched without accountable approval | P0 | Done |

### 4.5 Asset registry (P0 — contest)

| Requirement | Priority | Status |
|---|---|---|
| Asset list with condition status (Healthy/Scheduled/Attention) | P0 | Done |
| Asset detail with telemetry, service history, specifications | P0 | Done |
| Filtering by estate | P0 | Done |

### 4.6 Vendor network (P0 — contest)

| Requirement | Priority | Status |
|---|---|---|
| Vendor list with response time, rating, job history | P0 | Done |
| Verification status display | P0 | Done |
| Vendor detail with licensing, insurance, capabilities | P0 | Done |

### 4.7 Audit trail (P0 — contest)

| Requirement | Priority | Status |
|---|---|---|
| Timeline view of decision events | P0 | Done |
| Actor, timestamp, action, and evidence reference per event | P0 | Done |
| Estate-scoped filtering | P0 | Done |

### 4.8 Supporting features (P0 — contest)

| Requirement | Priority | Status |
|---|---|---|
| Global search across incidents, assets, vendors, audit | P0 | Done |
| Notification center | P0 | Done |
| Role and privacy panels | P0 | Done |
| Resettable demo state | P0 | Done |
| Mobile responsive layout (360px–1440px) | P0 | Done |
| Keyboard navigation and focus management | P0 | Done |
| Reduced-motion support | P0 | Done |
| Loading and error states | P0 | Done |

### 4.9 Production features (P1 — post-contest)

| Requirement | Priority | Status |
|---|---|---|
| Authentication (passwordless/SSO), MFA, session management | P1 | Planned |
| Persistent database with row-level security | P1 | Planned |
| Secure evidence upload with presigned URLs and malware scanning | P1 | Planned |
| Server-enforced approval policy with threshold rules | P1 | Planned |
| Idempotent vendor dispatch with retry/dead-letter | P1 | Planned |
| Notification preferences and redacted delivery | P1 | Planned |
| Append-only audit with SHA-256 integrity chain | P1 | Planned |
| Indonesian and English localization | P1 | Planned |
| Accessibility audit and automated E2E tests | P1 | Planned |

### 4.10 Commercial differentiation (P2)

| Requirement | Priority | Status |
|---|---|---|
| Preventive maintenance plans from asset history | P2 | Planned |
| Portfolio risk, spend, and vendor performance analytics | P2 | Planned |
| Family-office summaries with configurable approval thresholds | P2 | Planned |
| Integration SDK for property systems | P2 | Planned |
| Offline-first staff capture with sync | P2 | Planned |
| AI recommendations with evaluation suite | P2 | Planned |

---

## 5. Non-functional requirements

### 5.1 Performance

| Metric | Target |
|---|---|
| First Contentful Paint | < 1.5s on 4G |
| Time to Interactive | < 3s on 4G |
| Largest Contentful Paint | < 2.5s |
| Cumulative Layout Shift | < 0.1 |

### 5.2 Accessibility

- WCAG 2.1 AA minimum for all interactive surfaces
- Keyboard-only navigation for the complete golden workflow
- Focus management for all overlays and modals
- Color is never the sole carrier of meaning (dot + label pattern)
- Reduced-motion preference honored for all non-essential animation

### 5.3 Security (production)

- MFA for privileged roles, step-up authentication for high-value approvals
- Encryption in transit (TLS 1.3) and at rest (AES-256)
- Private-by-default estates, uploads, and notifications
- Row-level security in database policies
- Dependency and secret scanning in CI
- Rate limiting and abuse monitoring
- Data minimization and retention controls

### 5.4 Reliability (production)

- 99.9% uptime SLA for the operations surface
- Transactional outbox for notifications and integrations
- Graceful degradation when AI or vendor integrations are unavailable
- Daily encrypted backups with tested restore procedures
- Structured logging, metrics, distributed traces, and alert ownership

---

## 6. Success metrics

| Metric | Measurement method | Target |
|---|---|---|
| Median time from incident report to containment decision | Audit event timestamps | < 30 minutes |
| Spending decisions with complete evidence | % of approvals with attached photos/quotes | > 95% |
| Planned vs. emergency maintenance ratio | Work order classification | > 3:1 |
| Unresolved high-severity incidents past SLA | Dashboard counter | 0 |
| Principal interruptions per property per month | Notification frequency analysis | < 5 |
| Asset records with complete maintenance history | Registry completeness audit | > 90% |

---

## 7. Constraints and assumptions

### 7.1 Contest constraints

- All data is synthetic. No real properties, people, payments, or dispatches
- Front-end only — no persistent backend in the contest build
- Synthetic-data disclosure must be visible at all times
- No security certifications, integrations, or AI capabilities may be claimed beyond implementation

### 7.2 Business assumptions

- Indonesian luxury estate market has sufficient density for a SaaS product
- Professional estate managers exist as a distinct role (not just wealthy homeowners doing it themselves)
- Vendor ecosystem in Bali/Jakarta is fragmented enough to benefit from normalization
- Subscription per estate with usage bands is a viable pricing model
- Vendor referral fees are excluded from the first model to preserve recommendation neutrality

### 7.3 Technical assumptions

- Next.js (vinext) on Cloudflare Workers for the prototype
- Production will migrate to a full API layer with Postgres and object storage
- AI provider is abstracted behind a service interface for portability

---

## 8. Explicitly out of scope

- Replacing emergency services (fire, police, medical)
- Autonomous payments or vendor dispatch without configured approval
- Surveillance or biometric monitoring
- Public vendor marketplace
- Storing household secrets not required for operations
- Multi-cloud or on-premises deployment (initially)

---

## 9. Dependencies

| Dependency | Type | Risk |
|---|---|---|
| Emergent/OpenAI platform (contest hosting) | Platform | Low — static export fallback available |
| Cloudflare Workers (production hosting) | Infrastructure | Low — portable to other edge runtimes |
| AI provider for triage/recommendations | Service | Medium — abstracted behind adapter, deterministic fallback |
| Indonesian vendor ecosystem data | Content | Medium — requires pilot relationships |
| Real estate management contacts for pilot | Business | High — critical for Option A submission framing |

---

## 10. Release plan

### Phase 0: Contest submission (current)

- Complete golden workflow with synthetic data
- Cross-browser and device validation
- Video capture and submission copy
- Deadline: 5 Sep 2026

### Phase 1: Pilot foundation

- Authentication, persistent storage, server-enforced approval
- Secure evidence upload and audit integrity
- One pilot estate manager with 2–3 real properties
- Target: Q4 2026

### Phase 2: Commercial launch

- Multi-organization support
- Analytics and family-office reporting
- Integration SDK
- Indonesian/English localization
- Target: Q1 2027

---

*Cross-references: [ARCHITECTURE.md](file:///C:/Users/o_o/Documents/Astera/docs/ARCHITECTURE.md) for technical design, [DATA_MODEL.md](file:///C:/Users/o_o/Documents/Astera/docs/DATA_MODEL.md) for entity relationships, [DESIGN.md](file:///C:/Users/o_o/Documents/Astera/docs/DESIGN.md) for visual system, [COMPONENT_SPEC.md](file:///C:/Users/o_o/Documents/Astera/docs/COMPONENT_SPEC.md) for implementation tokens.*
