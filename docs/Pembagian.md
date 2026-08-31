# Pembagian Scope Kerja ASTERA (Dual-Track Workstream)

Dokumen ini mendefinisikan pembagian tugas dan batasan area kerja antara **Scope 1 (Frontend)** dan **Scope 2 (Backend)** agar proses pengembangan berjalan paralel tanpa menimbulkan *merge conflict*.

---

## 1. Ringkasan Pembagian Scope

| Aspek | Scope 1: Frontend & Client Operations (Dev 1) | Scope 2: Backend, API & Data Engine (Dev 2) |
|---|---|---|
| **Fokus Utama** | Antarmuka pengguna, UX interaktif, visualisasi telemetri, alur intake media, pelaporan family-office | Server endpoints, basis data, validasi server-side, idempotency, webhook dispatch, cryptographic audit chain |
| **Area Direktori** | `app/`, `components/`, `hooks/`, `public/` | `server/` (atau `app/api/`), `lib/db/`, `lib/services/`, `migrations/` |
| **Branch Git** | `feature/client-ops` | `feature/api-services` |
| **Kontrak Bersama** | Mengonsumsi `types/domain.ts` | Mengimplementasikan `types/domain.ts` |
| **Target Output** | UI/UX interaktif siap demo, visualisasi responsif, cetak laporan | REST API teruji, skema database terisolasi, audit log SHA-256 |

---

## 2. Rincian Modul & Tugas per Developer

| No | Modul / Fitur | Scope 1: Frontend (Dev 1) | Scope 2: Backend (Dev 2) |
|---|---|---|---|
| 1 | **Shared Types & Contract** | Mengintegrasikan TypeScript interfaces untuk form state & komponen | Menyusun skema DDL & payload validation (Zod / TypeScript types) |
| 2 | **Incident Intake & Triage** | UI dropzone media foto/video simulasi, voice waveform preview, indikator AI confidence | API Endpoint `POST /api/incidents`, parsing payload, penyimpanan referensi bukti (presigned URL) |
| 3 | **Vendor Quotes & Approval** | UI perbandingan quote interaktif, konfirmasi batas nominal principal, modal persetujuan | API Endpoint `POST /api/quotes/:id/approve`, verifikasi otorisasi role, penguncian idempotency key |
| 4 | **Vendor Dispatch Engine** | Visual tracker status dispatch (ETA, rute, timeline perbaikan) | Webhook adapter pengiriman notifikasi vendor, penanganan network retry & dead-letter queue |
| 5 | **Asset & Telemetry Hub** | Visualisasi telemetri sensor, filter zona/ruangan, modal inspeksi detail aset | API Endpoint `GET /api/assets`, query riwayat servis, data agregasi kondisi kesehatan aset |
| 6 | **Audit & Compliance Ledger** | UI timeline audit interaktif, filter berdasarkan estate & peran, tampilan detail hash | Service SHA-256 append-only ledger generator, export stream data audit `GET /api/audit` |
| 7 | **Reporting & Export** | Generator cetak PDF/CSV ringkasan insiden & pengeluaran untuk family-office | Agregasi data pengeluaran dan laporan bulanan melalui API `GET /api/reports/summary` |
| 8 | **Testing & Quality Gate** | E2E browser interaction tests (Playwright / Vitest UI) | Unit test API endpoints, integrasi database, uji idempotency |

---

## 3. Matriks Batasan Direktori (Mencegah Konflik File)

| Direktori / File | Akses Scope 1 (Frontend) | Akses Scope 2 (Backend) | Keterangan Aturan |
|---|---|---|---|
| `types/domain.ts` | Read-only setelah disepakati | Read-only setelah disepakati | **Area Konsensus**: Perubahan tipe data wajib disepakati bersama |
| `app/(pages)` | Read / Write | Read Only | Area antarmuka dan layout halaman |
| `components/` | Read / Write | Read Only | Komponen visual modular |
| `hooks/` | Read / Write | Read Only | Custom hooks interaksi klien |
| `server/` / `app/api/` | Read Only | Read / Write | Endpoint handler & API routing |
| `lib/db/` & `migrations/` | Read Only | Read / Write | Skema basis data (D1 / PostgreSQL / SQLite) |
| `lib/services/` | Read Only | Read / Write | Business logic, audit hasher, vendor connectors |
| `docs/` | Read / Write (bagian UI) | Read / Write (bagian API) | Update dokumen teknis sesuai modul yang dikerjakan |

---

## 4. Alur Integrasi & Git Workflow

```text
types/domain.ts (Kontrak Disepakati)
       ├──> Branch feature/client-ops  ──> Pull Request (CI Check) ──┐
       │                                                              ├──> Merge ke main
       └──> Branch feature/api-services ──> Pull Request (CI Check) ──┘
```

1. **Sepakati Kontrak di Awal**: Pastikan definisi tipe pada `types/domain.ts` sudah mencakup seluruh interface entitas (Estate, Asset, Incident, Quote, Approval, Audit).
2. **Pengembangan Mandiri**:
   - Dev 1 menggunakan mock data lokal yang mengacu pada `types/domain.ts`.
   - Dev 2 membuat endpoint API dan database query dengan skema yang identik.
3. **Penyatuan (Integration)**: Saat backend siap, frontend cukup mengganti sumber data dari mock adapter ke pemanggilan endpoint API aktual.
4. **CI Gate**: Setiap Pull Request wajib lolos pemeriksaan otomatis GitHub Actions (`npm run check` yang mencakup verify trust, linting, dan build).
