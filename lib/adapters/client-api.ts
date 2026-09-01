/**
 * ASTERA Client API Adapter
 * Standardized typed fetchers for Frontend (Scope 1) to consume Backend (Scope 2) endpoints.
 */

import type {
  Approval,
  Asset,
  AuditEvent,
  AuditVerificationResult,
  Estate,
  FinancialAndOpsReport,
  GlobalSearchResult,
  Incident,
  NormalizedQuote,
  PortfolioKpis,
  TelemetryReading,
  UserRole,
  Vendor,
  WorkOrder,
} from '../../types/domain';

export interface SyntheticApiMeta {
  synthetic: true;
  environment: 'contest-prototype';
  timestamp: string;
}

export interface ProblemDetailsPayload {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

export class AsteraApiError extends Error {
  public readonly status: number;
  public readonly problem: ProblemDetailsPayload;

  constructor(status: number, problem: ProblemDetailsPayload) {
    super(problem.detail || problem.title || `API request failed with status ${status}`);
    this.name = 'AsteraApiError';
    this.status = status;
    this.problem = problem;
  }
}

export interface RequestOptions {
  signal?: AbortSignal;
  headers?: HeadersInit;
}

export type WithSyntheticMeta<T> = T & { meta: SyntheticApiMeta };

async function apiFetch<T>(endpoint: string, init?: RequestInit): Promise<WithSyntheticMeta<T>> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type') && init?.method && init.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(endpoint, {
    ...init,
    headers,
  });

  const json = (await res.json()) as unknown;
  if (!res.ok) {
    throw new AsteraApiError(res.status, json as ProblemDetailsPayload);
  }
  return json as WithSyntheticMeta<T>;
}

export const AsteraApiClient = {
  // Estates & Portfolio
  getEstates: (options?: RequestOptions) =>
    apiFetch<{ estates: Estate[] }>('/api/estates', {
      signal: options?.signal,
      headers: options?.headers,
    }),

  getPortfolioSummary: (estateId?: string, options?: RequestOptions) =>
    apiFetch<{
      kpis: PortfolioKpis;
      estates: Estate[];
      activeEstate?: Estate;
      recentIncidents: Incident[];
      activeWorkOrders: WorkOrder[];
    }>(`/api/portfolio/summary${estateId ? `?estateId=${encodeURIComponent(estateId)}` : ''}`, {
      signal: options?.signal,
      headers: options?.headers,
    }),

  // Incidents
  getIncidents: (params?: { estateId?: string; status?: string }, options?: RequestOptions) => {
    const query = new URLSearchParams();
    if (params?.estateId) query.set('estateId', params.estateId);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return apiFetch<{ incidents: Incident[]; total: number }>(
      `/api/incidents${qs ? `?${qs}` : ''}`,
      {
        signal: options?.signal,
        headers: options?.headers,
      }
    );
  },

  createIncident: (
    payload: {
      estateId: string;
      assetId?: string;
      summary: string;
      description: string;
      reportedBy?: string;
      reportedByRole?: UserRole;
    },
    options?: RequestOptions
  ) =>
    apiFetch<{ incident: Incident }>('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal: options?.signal,
      headers: options?.headers,
    }),

  // Quotes
  getIncidentQuotes: (incidentId: string, options?: RequestOptions) =>
    apiFetch<{ incidentId: string; quotes: NormalizedQuote[] }>(
      `/api/incidents/${encodeURIComponent(incidentId)}/quotes`,
      {
        signal: options?.signal,
        headers: options?.headers,
      }
    ),

  // Human Approval (Spending Gate)
  approveQuote: (
    payload: {
      incidentId: string;
      quoteId: string;
      approverId: string;
      approverName: string;
      approverRole: UserRole;
      explicitAck: true;
      notes?: string;
      idempotencyKey: string;
    },
    options?: RequestOptions
  ) =>
    apiFetch<{
      success: boolean;
      approval: Approval;
      workOrder: WorkOrder;
      incident: Incident;
    }>(`/api/quotes/${encodeURIComponent(payload.quoteId)}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload),
      signal: options?.signal,
      headers: options?.headers,
    }),

  rejectQuote: (
    payload: {
      incidentId: string;
      quoteId: string;
      approverId: string;
      approverName: string;
      approverRole: UserRole;
      reason: string;
      idempotencyKey: string;
    },
    options?: RequestOptions
  ) =>
    apiFetch<{ success: boolean; approval: Approval; incident: Incident }>(
      `/api/quotes/${encodeURIComponent(payload.quoteId)}/reject`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: options?.signal,
        headers: options?.headers,
      }
    ),

  // Work Orders & Dispatch
  dispatchWorkOrder: (
    payload: {
      workOrderId: string;
      idempotencyKey: string;
      assignedTechnician?: string;
      technicianContact?: string;
      notes?: string;
      actorId: string;
      actorRole: UserRole;
    },
    options?: RequestOptions
  ) =>
    apiFetch<{ success: boolean; workOrder: WorkOrder }>('/api/work-orders/dispatch', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal: options?.signal,
      headers: options?.headers,
    }),

  // Assets & Telemetry
  getAssets: (estateId?: string, options?: RequestOptions) =>
    apiFetch<{ assets: Asset[]; total: number }>(
      `/api/assets${estateId ? `?estateId=${encodeURIComponent(estateId)}` : ''}`,
      {
        signal: options?.signal,
        headers: options?.headers,
      }
    ),

  getAssetTelemetry: (assetId: string, options?: RequestOptions) =>
    apiFetch<{
      assetId: string;
      assetName: string;
      state: string;
      telemetry: TelemetryReading[];
      lastServiceDate: string;
    }>(`/api/assets/${encodeURIComponent(assetId)}/telemetry`, {
      signal: options?.signal,
      headers: options?.headers,
    }),

  // Vendors
  getVendors: (options?: RequestOptions) =>
    apiFetch<{ vendors: Vendor[]; total: number }>('/api/vendors', {
      signal: options?.signal,
      headers: options?.headers,
    }),

  getVendorDetail: (vendorId: string, options?: RequestOptions) =>
    apiFetch<{ vendor: Vendor }>(`/api/vendors/${encodeURIComponent(vendorId)}`, {
      signal: options?.signal,
      headers: options?.headers,
    }),

  // Audit
  getAuditTrail: (params?: { limit?: number; cursor?: string }, options?: RequestOptions) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.cursor) query.set('cursor', params.cursor);
    const qs = query.toString();
    return apiFetch<{
      events: AuditEvent[];
      total: number;
      nextCursor?: string;
      chainIntegrity: { valid: boolean; verifiedAt: string };
    }>(`/api/audit${qs ? `?${qs}` : ''}`, {
      signal: options?.signal,
      headers: options?.headers,
    });
  },

  verifyAuditIntegrity: (options?: RequestOptions) =>
    apiFetch<AuditVerificationResult>('/api/audit/verify', {
      signal: options?.signal,
      headers: options?.headers,
    }),

  // Search & Reports
  search: (query: string, options?: RequestOptions) =>
    apiFetch<GlobalSearchResult>(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: options?.signal,
      headers: options?.headers,
    }),

  getFinancialReport: (period?: string, options?: RequestOptions) =>
    apiFetch<{ report: FinancialAndOpsReport }>(
      `/api/reports/summary${period ? `?period=${encodeURIComponent(period)}` : ''}`,
      {
        signal: options?.signal,
        headers: options?.headers,
      }
    ),

  // Contest Demo State Reset
  resetDemo: (options?: RequestOptions) =>
    apiFetch<{
      success: boolean;
      message: string;
      resetAt: string;
      seededIncidents: number;
      seededQuotes: number;
    }>('/api/demo/reset', {
      method: 'POST',
      signal: options?.signal,
      headers: options?.headers,
    }),
};
