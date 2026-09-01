# Pembagian Scope Kerja & Spesifikasi Tanggung Jawab ASTERA
## Dual-Track Workstream: Frontend (Scope 1) & Backend (Scope 2)

Dokumen ini mendefinisikan pembagian tanggung jawab, batasan teknis, matriks kepemilikan file, serta kontrak kerja sama antara **Scope 1: Frontend & Client Operations (Dev 1)** dan **Scope 2: Backend, API & Data Engine (Dev 2)**. Pembagian ini disusun berdasarkan pembaruan arsitektur dan spesifikasi pada [PRD.md](file:///c:/Users/o_o/Documents/Astera/docs/PRD.md), [DESIGN.md](file:///c:/Users/o_o/Documents/Astera/docs/DESIGN.md), [COMPONENT_SPEC.md](file:///c:/Users/o_o/Documents/Astera/docs/COMPONENT_SPEC.md), [ARCHITECTURE.md](file:///c:/Users/o_o/Documents/Astera/docs/ARCHITECTURE.md), [DATA_MODEL.md](file:///c:/Users/o_o/Documents/Astera/docs/DATA_MODEL.md), dan [QA_CHECKLIST.md](file:///c:/Users/o_o/Documents/Astera/docs/QA_CHECKLIST.md).

---

## 1. Landasan & Prinsip Utama Kolaborasi

1. **Mandatory Documentation Baseline**:
   - Seluruh keputusan UI/UX dan token visual wajib merujuk pada [DESIGN.md](file:///c:/Users/o_o/Documents/Astera/docs/DESIGN.md) (Cloud + Sienna light-mode) dan [COMPONENT_SPEC.md](file:///c:/Users/o_o/Documents/Astera/docs/COMPONENT_SPEC.md).
   - Seluruh aturan alur bisnis, state machine, dan batasan cakupan merujuk pada [PRD.md](file:///c:/Users/o_o/Documents/Astera/docs/PRD.md) dan [ARCHITECTURE.md](file:///c:/Users/o_o/Documents/Astera/docs/ARCHITECTURE.md).
   - Seluruh struktur entitas merujuk pada [DATA_MODEL.md](file:///c:/Users/o_o/Documents/Astera/docs/DATA_MODEL.md).
2. **Contract-First & Parallel Development**:
   - Skema data `types/domain.ts` disepakati bersama di awal sebagai *single source of truth*.
   - Dev 1 mengembangkan antarmuka interaktif menggunakan *in-memory mock adapter* yang mereplikasi kontrak domain.
   - Dev 2 membangun skema basis data, REST API, validasi Zod, dan *cryptographic ledger* secara terisolasi.
3. **Product & Trust Boundaries**:
   - **Golden Workflow**: `Report → Triage → Quote → Approval → Dispatch → Resolution → Audit`.
   - **Human-in-the-Loop**: Rekomendasi AI bersifat *advisory*. Otorisasi pengeluaran dan *vendor dispatch* wajib dikonfirmasi manusia secara eksplisit.
   - **Anonymity & Synthetic Data Guard**: Seluruh data simulasi bersifat anonim; tidak boleh ada klaim eksternal palsu, integrasi pihak ketiga yang belum aktif, atau pembocoran data riil.

---

## 2. Ringkasan Pembagian Scope (Executive Summary)

| Aspek | Scope 1: Frontend & Client Operations (Dev 1) | Scope 2: Backend, API & Data Engine (Dev 2) |
|---|---|---|
| **Fokus Utama** | Antarmuka pengguna (Next.js / React), interaktivitas, kepatuhan Design System (Cloud + Sienna), alur intake multimedia, visualisasi telemetri, UX persetujuan, accessibility & responsive layout | Server API handlers, persistensi database (PostgreSQL / SQLite / D1), validasi server-side (Zod), idempotency key engine, webhook/outbox dispatch, SHA-256 append-only audit chain |
| **Area Direktori** | `app/`, `components/`, `hooks/`, `public/`, `styles/` | `server/` (atau `app/api/`), `lib/db/`, `lib/services/`, `lib/validations/`, `migrations/` |
| **Branch Git** | `feature/client-ops` | `feature/api-services` |
| **Kontrak Bersama** | Mengonsumsi interface pada `types/domain.ts` | Mengimplementasikan & memvalidasi skema `types/domain.ts` |
| **Design Tokens** | Menggunakan CSS custom properties (`--surface-base`, `--accent`, dll.) tanpa hardcoded hex | Memastikan payload serialisasi format standar (ISO timestamp UTC, integer minor units untuk mata uang) |
| **Target Output** | UI/UX operasional command center siap demo, responsive (360px–1440px), keyboard navigable, lolos WCAG 2.1 AA | REST API teruji dengan validasi ketat, migrasi database idempotent, outbox queue aman, audit hash integrity |

---

## 3. Rincian Modul & Tugas Berdasarkan Golden Workflow

```text
Report → Triage → Quote → Approval → Dispatch → Resolution → Audit
```

| No | Modul / Fitur | Scope 1: Frontend (Dev 1) | Scope 2: Backend (Dev 2) | Rujukan Dokumen |
|---|---|---|---|---|
| **1** | **Shared Domain Contract & Types** | Mengintegrasikan TypeScript interfaces untuk form state, card props, dan filter state | Menyusun skema DDL relasional, migrasi database, dan Zod runtime validator untuk seluruh payload | [DATA_MODEL.md](file:///c:/Users/o_o/Documents/Astera/docs/DATA_MODEL.md) |
| **2** | **Portfolio Overview & Constellation** | • Estate switcher dengan *scoped data filtering*<br>• KPI cards: Open Incidents, SLA at Risk, Pending Approvals, Cost Avoidance<br>• Banner synthetic-data disclosure | • API `GET /api/estates` & `GET /api/portfolio/summary`<br>• Agregasi metrik KPI lintas estate dengan filter otorisasi peran (Principal vs Manager) | [PRD.md §4.1](file:///c:/Users/o_o/Documents/Astera/docs/PRD.md#L129-L138) |
| **3** | **Incident Intake & Advisory Triage** | • Form intake multimodal (Text, Photo upload simulasi, Voice waveform preview)<br>• Panel AI Triage: rekomendasi keparahan, confidence indicator, sumber sitasi bukti, tombol human override | • API `POST /api/incidents`<br>• File storage handler (presigned URL mock/S3)<br>• AI orchestration service adapter (ekstraksi structured fields & advisory containment steps) | [PRD.md §3.1–3.2](file:///c:/Users/o_o/Documents/Astera/docs/PRD.md#L77-L90)<br>[COMPONENT_SPEC.md §2.5](file:///c:/Users/o_o/Documents/Astera/docs/COMPONENT_SPEC.md#L200-L240) |
| **4** | **Normalized Quote Comparison** | • Matrix perbandingan vendor side-by-side (Total Biaya, ETA Kedatangan, Cakupan Garansi, Risk Assessment)<br>• Label rekomendasi AI dengan sitasi bukti | • API `GET /api/incidents/:id/quotes`<br>• Normalizer engine untuk standardisasi format penawaran vendor (pecahan biaya material vs tenaga kerja) | [PRD.md §3.3](file:///c:/Users/o_o/Documents/Astera/docs/PRD.md#L91-L97)<br>[COMPONENT_SPEC.md §2.7](file:///c:/Users/o_o/Documents/Astera/docs/COMPONENT_SPEC.md#L270-L310) |
| **5** | **Human-in-the-Loop Spending Approval** | • Modal persetujuan dengan rincian biaya & risiko<br>• *Mandatory explicit confirmation checkbox* (tombol Approve disabled sampai dicentang)<br>• State transition handling ke `APPROVED` / `REJECTED` | • API `POST /api/quotes/:id/approve` & `POST /api/quotes/:id/reject`<br>• Verifikasi otorisasi nominal per peran (Spending threshold guard)<br>• Idempotency key lock mencegah double approval | [PRD.md §3.4](file:///c:/Users/o_o/Documents/Astera/docs/PRD.md#L98-L105)<br>[ARCHITECTURE.md §Approval](file:///c:/Users/o_o/Documents/Astera/docs/ARCHITECTURE.md#L63-L78) |
| **6** | **Vendor Dispatch & Work Order Engine** | • Visual dispatch tracker (status vendor, estimasi tiba, rute, kontak simulasi)<br>• Transisi status insiden ke `DISPATCHED` → `IN_PROGRESS` → `RESOLVED` | • API `POST /api/work-orders/dispatch`<br>• Transactional Outbox pattern & webhook dispatch connector<br>• Retry logic dengan exponential backoff & dead-letter queue | [PRD.md §3.5–3.6](file:///c:/Users/o_o/Documents/Astera/docs/PRD.md#L106-L118)<br>[COMPONENT_SPEC.md §2.8](file:///c:/Users/o_o/Documents/Astera/docs/COMPONENT_SPEC.md#L311-L345) |
| **7** | **Asset Registry & Telemetry Hub** | • Daftar aset dengan status kondisi (Healthy / Scheduled / Attention)<br>• Visualisasi grafik telemetri sensor (suhu, getaran, tekanan, kWh) dengan filter zona/ruangan | • API `GET /api/assets` & `GET /api/assets/:id/telemetry`<br>• Service pembaruan riwayat pemeliharaan aset pasca resolusi insiden | [PRD.md §4.5](file:///c:/Users/o_o/Documents/Astera/docs/PRD.md#L168-L175)<br>[DATA_MODEL.md](file:///c:/Users/o_o/Documents/Astera/docs/DATA_MODEL.md#L11) |
| **8** | **Vendor Network Directory** | • Tampilan profil vendor: SLA response time, verifikasi lisensi/asuransi, riwayat pekerjaan, rating kepatuhan | • API `GET /api/vendors` & `GET /api/vendors/:id`<br>• Manajemen data kualifikasi vendor & filter kepatuhan per wilayah operasi | [PRD.md §4.6](file:///c:/Users/o_o/Documents/Astera/docs/PRD.md#L176-L183) |
| **9** | **Cryptographic Audit Trail** | • UI timeline audit interaktif dengan filter per estate, peran, dan rentang waktu<br>• Inspeksi detail event hash, payload diff, dan signature | • Append-only audit logger service<br>• SHA-256 chaining generator (`prev_hash` + `payload` → `current_hash`)<br>• API `GET /api/audit` & export stream | [PRD.md §3.7](file:///c:/Users/o_o/Documents/Astera/docs/PRD.md#L119-L125)<br>[ARCHITECTURE.md](file:///c:/Users/o_o/Documents/Astera/docs/ARCHITECTURE.md#L47) |
| **10** | **Reporting & Family-Office Export** | • Tampilan ringkasan laporan operasional & pengeluaran<br>• Tombol generator cetak dokumen / export PDF & CSV | • API `GET /api/reports/summary`<br>• Query agregasi pengeluaran, perbandingan biaya darurat vs terencana, dan pemenuhan SLA | [PRD.md §4.10](file:///c:/Users/o_o/Documents/Astera/docs/PRD.md#L225) |
| **11** | **Global Search, Notifications & Role Panels** | • Command bar / search filter global (incidents, assets, vendors, audit)<br>• Notification center & drawer pengaturan peran simulasi | • API `GET /api/search` dengan multi-entity index<br>• Notification dispatch preference service | [PRD.md §4.8](file:///c:/Users/o_o/Documents/Astera/docs/PRD.md#L192-L204) |
| **12** | **Accessibility, Resilience & Testing** | • Keyboard navigation (Escape, Tab, Focus trap pada overlay)<br>• Responsive testing (360px–1440px)<br>• High-contrast light mode & reduced-motion support | • API automated unit tests & integration tests<br>• Error handling standard (RFC 7807 Problem Details)<br>• Verification script & CI validation | [QA_CHECKLIST.md](file:///c:/Users/o_o/Documents/Astera/docs/QA_CHECKLIST.md) |

---

## 4. Matriks Batasan Direktori (Mencegah Konflik File)

Untuk memastikan kedua pengembang dapat bekerja secara simultan tanpa *merge conflict*, pembagian hak akses direktori diatur secara ketat:

| Direktori / File | Akses Scope 1 (Dev 1 - Frontend) | Akses Scope 2 (Dev 2 - Backend) | Kebijakan & Aturan |
|---|---|---|---|
| `types/domain.ts` | **Read-Only** (setelah disepakati) | **Read-Only** (setelah disepakati) | **Konsensus Bersama**: Perubahan tipe entitas wajib didiskusikan dan disetujui kedua pihak. |
| `app/` (Kecuali `app/api/`) | **Read / Write** | **Read-Only** | Area layout, routing halaman, template klien, and styling global. |
| `components/` | **Read / Write** | **Read-Only** | Komponen UI modular (cards, modals, badges, tables, charts). |
| `hooks/` & `styles/` | **Read / Write** | **Read-Only** | Custom React hooks, state manajemen lokal, dan utility CSS. |
| `public/` | **Read / Write** | **Read-Only** | Asset statis (SVG icons, mock images, fonts). |
| `server/` atau `app/api/` | **Read-Only** | **Read / Write** | Route handlers, middleware otentikasi, dan controller API. |
| `lib/db/` & `migrations/` | **Read-Only** | **Read / Write** | Konfigurasi database client, schema definitions, dan migration scripts. |
| `lib/services/` | **Read-Only** | **Read / Write** | Business logic, audit hasher, outbox worker, AI adapter. |
| `lib/validations/` | **Read-Only** | **Read / Write** | Zod schemas untuk validasi request payload. |
| `scripts/` | **Read / Write** (UI verify) | **Read / Write** (API verify) | Script verifikasi CI & test runner. |
| `docs/` | **Read / Write** (UI specs) | **Read / Write** (API specs) | Update dokumentasi sesuai modul yang dikerjakan. |

---

## 5. Spesifikasi State Machine & Standar Kontrak API

### 5.1 State Machine Insiden & Persetujuan

Setiap insiden operasional mengikuti siklus status yang terdefinisi secara ketat pada [ARCHITECTURE.md](file:///c:/Users/o_o/Documents/Astera/docs/ARCHITECTURE.md#L63-L78):

```text
DRAFT ──> TRIAGED ──> QUOTING ──> AWAITING_APPROVAL
                                      │        │
                                   REJECTED  APPROVED
                                                 │
                                             DISPATCHED
                                                 │
                                           IN_PROGRESS
                                                 │
                                              RESOLVED
```

### 5.2 Ringkasan Endpoint API Utama

| Method | Path | Fungsi | Request Body Utama | Response Penting |
|---|---|---|---|---|
| `GET` | `/api/estates` | Mengambil daftar properti & status ringkas | - | `Estate[]` |
| `GET` | `/api/incidents` | Mengambil daftar insiden (filter `estateId`, `status`) | - | `Incident[]` |
| `POST` | `/api/incidents` | Mendaftarkan insiden baru & memicu AI triage | `{ estateId, assetId?, summary, description, severitySuggestion, evidence }` | `Incident` (Status: `TRIAGED`) |
| `GET` | `/api/incidents/:id/quotes` | Mengambil penawaran vendor yang telah dinormalisasi | - | `NormalizedQuote[]` |
| `POST` | `/api/quotes/:id/approve` | Menyetujui penawaran & mengunci otorisasi | `{ incidentId, explicitAck: true, notes? }` | `ApprovalResult` (Status: `APPROVED`, `dispatchedWorkOrderId`) |
| `POST` | `/api/quotes/:id/reject` | Menolak penawaran | `{ incidentId, reason }` | `ApprovalResult` (Status: `REJECTED`) |
| `POST` | `/api/work-orders/dispatch` | Memicu pengiriman instruksi kerja ke vendor | `{ workOrderId, idempotencyKey }` | `WorkOrder` (Status: `DISPATCHED`, `etaTimestamp`) |
| `GET` | `/api/assets` | Mengambil inventaris aset & status pemeliharaan | - | `Asset[]` |
| `GET` | `/api/assets/:id/telemetry` | Mengambil data telemetri historis & real-time | - | `TelemetryReading[]` |
| `GET` | `/api/vendors` | Mengambil daftar direktori vendor terverifikasi | - | `Vendor[]` |
| `GET` | `/api/audit` | Mengambil riwayat audit log append-only | `?estateId=&limit=&cursor=` | `{ events: AuditEvent[], chainValid: boolean }` |
| `GET` | `/api/reports/summary` | Mengambil data agregasi untuk export family-office | `?period=monthly&estateId=` | `FinancialAndOpsReport` |

---

## 6. Protokol Integrasi & Alur Kerja Git

### 6.1 Skema Alur Git

```text
types/domain.ts (Kontrak Disepakati)
       ├──> Branch: feature/client-ops   (Dev 1 - UI & State)   ──> PR (CI Checks) ──┐
       │                                                                               ├──> Merge ke main
       └──> Branch: feature/api-services (Dev 2 - API & DB Engine) ──> PR (CI Checks) ──┘
```

### 6.2 Langkah-Langkah Sinkronisasi

1. **Inisialisasi Kontrak (Day 1)**:
   - Finalisasi definisi tipe pada `types/domain.ts`.
   - Pastikan tipe nominal mata uang menggunakan integer minor units (IDR / USD) dan waktu dalam format ISO 8601 UTC.
2. **Pengembangan Mandiri (Day 2–4)**:
   - Dev 1 menggunakan hook data klien dengan *mock adapter* lokal (tanpa dependensi backend aktif).
   - Dev 2 menulis endpoint unit tests dan integrasi basis data menggunakan tool test runner.
3. **Penyambungan (Integration Day 5)**:
   - Dev 1 mengganti *mock data fetcher* dengan pemanggilan ke route handler aktual `/api/*`.
   - Dev 2 memvalidasi bahwa payload dari frontend lolos seluruh aturan validasi Zod dan constraint skema.
4. **CI & Quality Gate**:
   - Setiap Pull Request wajib lolos validasi otomatis:
     ```powershell
     npm run check
     ```
   - Pemeriksaan mencakup: linter oxlint/eslint, formatter oxfmt, validasi konten kepercayaan (`verify-content.mjs`), typecheck `tsc`, dan build verifikasi.
5. **Verifikasi Akhir**:
   - Menjalankan seluruh item pada [QA_CHECKLIST.md](file:///c:/Users/o_o/Documents/Astera/docs/QA_CHECKLIST.md) sebelum rilis final.
