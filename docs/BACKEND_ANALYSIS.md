# ASTERA — Backend Analysis & Technical Walkthrough

Version: 1.0
Last updated: 1 Sep 2026

---

## 1. Current Backend Architecture & Capabilities

The Astera backend has transitioned from an in-memory prototype store to a robust, production-ready foundation using **Next.js API Routes**, **Drizzle ORM**, and **PostgreSQL (Supabase)**. 

### 1.1 Key Implemented Features

1. **Persistent Database (Supabase + Drizzle ORM)**:
   - fully typed database schema mapping the domain models (`Organization`, `Estate`, `Asset`, `Incident`, `Vendor`, `WorkOrder`).
   - Centralized seeding script (`lib/db/seeder.ts`) and reset endpoint for contest demo repeatability.
2. **Cryptographic Audit Trail (`AuditService`)**:
   - Every state transition (Intake, Quote, Approval, Dispatch) is recorded in an append-only `audit_events` table.
   - Events are chained via SHA-256 hashes (`previousHash`), providing tamper-evident records suitable for family-office compliance.
3. **Idempotency Engine (`IdempotencyService`)**:
   - Mutations (like spending approvals and vendor dispatch) require an idempotency key to prevent accidental duplicate actions (e.g. double-approving a 15M IDR quote).
4. **Outbox Pattern for Webhooks (`OutboxService`)**:
   - Dispatch events are written transactionally to the database outbox instead of firing external network requests directly. This ensures reliability and allows background queue workers to safely consume events.
5. **AI Advisory Triage Integration**:
   - The system utilizes LangGraph and local/remote LLM orchestration to provide severity suggestions and incident summaries, ensuring humans remain in the loop for final authorization.

---

## 2. Strategic Analysis & Next Steps (Phase 1 & Phase 2)

To move Astera from the Pilot foundation to full Commercial Launch, the following backend systems must be implemented to harden security and expand capabilities:

### 2.1 Identity & Access Management (Authentication/Authorization)
- **Problem:** Currently, the system uses simulated user contexts (e.g. `USR-PRIN-01`) passed via request body. 
- **Next Step:** Implement a robust authentication provider (e.g., Supabase Auth or NextAuth.js). 
- **Security Requirement:** Implement Role-Based Access Control (RBAC) via PostgreSQL Row Level Security (RLS) to ensure Estate Managers can only access their assigned properties, and Auditors are strictly read-only. Require MFA for Principal-level spending approvals.

### 2.2 Secure Evidence Object Storage
- **Problem:** Evidence photos and voice notes are currently stored as mock metadata URLs or local arrays.
- **Next Step:** Integrate AWS S3 or Supabase Storage for secure asset uploads.
- **Security Requirement:** Use temporary, authenticated **presigned URLs** for both uploading and viewing files. Implement background malware scanning before associating uploads with an incident.

### 2.3 Robust Background Worker System (Queue / Webhooks)
- **Problem:** The `OutboxService` tracks pending webhooks, but currently lacks a dedicated background worker to process them concurrently.
- **Next Step:** Introduce a persistent queue engine (e.g., BullMQ with Redis, or Inngest). 
- **Reliability Requirement:** Implement exponential backoff for failed webhook deliveries and a Dead Letter Queue (DLQ) for alerting the engineering team to chronic integration failures.

### 2.4 Server-Enforced Approval Thresholds
- **Problem:** Any role can theoretically send an approval payload if they bypass the UI. 
- **Next Step:** Store granular organizational policy configurations in the database. When an approval request hits the API, the backend must cross-reference the user's role and monetary threshold limits (e.g., `max_auto_approve_minor_units`) before processing the idempotency lock.

### 2.5 Multi-Tenant Data Analytics
- **Problem:** Portfolio health metrics are currently calculated via raw arrays.
- **Next Step:** Create specialized Read Replica queries or OLAP cubes for generating weekly PDF financial/operational reports for family offices.

---

## 3. Backend Technical Walkthrough

This section explains how to trace a core operation—such as **Spending Approval**—through the Astera backend. 

### Step 1: The Request Interface (Client API Adapter)
The frontend UI triggers `AsteraApiClient.approveQuote(payload)` which sends a `POST` request. The payload must include `explicitAck: true` and an `idempotencyKey`.

### Step 2: The Route Handler (`app/api/quotes/[id]/approve/route.ts`)
The Next.js API Route acts as the orchestrator:
1. **Validation:** It parses the body against a strict Zod schema. If it fails, an RFC 7807 `application/problem+json` error is returned.
2. **Routing:** It calls the `db` or specific service modules.

### Step 3: Idempotency Lock (`IdempotencyService`)
Before touching any business logic, the route calls `executeWithLock`. If the `idempotencyKey` was already used, the server immediately returns the cached response (e.g., `{ status: 'APPROVED' }`) without modifying the database again.

### Step 4: Transaction & Business Logic
Using Drizzle ORM, a database transaction ensures all related updates succeed or fail together:
- The incident status transitions to `APPROVED`.
- The quoted amount is locked in an `approvals` record.
- A `work_orders` record is created in `PENDING_DISPATCH` state.

### Step 5: The Cryptographic Audit (`AuditService`)
In the same transaction, `auditService.recordEvent()` is called. 
- It hashes the new payload along with the `previousHash` from the last recorded event in the `audit_events` table.
- This creates an immutable, verifiable link.

### Step 6: Response Formatting
The API route wraps the final data using the `apiSuccess` helper. This attaches the standard `meta.synthetic` envelope, indicating the environment and timestamp, completing the request securely.

---

*For further frontend and visual walkthrough details, please see [WALKTHROUGH.md](./WALKTHROUGH.md).*
