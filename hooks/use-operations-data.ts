'use client';

import { useEffect, useState } from 'react';
import { AsteraApiClient, AsteraApiError, type SyntheticApiMeta } from '@/lib/adapters/client-api';
import type { Asset, AuditEvent, Vendor } from '@/types/domain';

type OperationsLoadState = 'loading' | 'ready' | 'degraded';

interface OperationsSnapshot {
  assets: Asset[];
  vendors: Vendor[];
  auditEvents: AuditEvent[];
  auditIntegrityValid: boolean | null;
  meta: SyntheticApiMeta | null;
  status: OperationsLoadState;
  error: string | null;
}

const initialSnapshot: OperationsSnapshot = {
  assets: [],
  vendors: [],
  auditEvents: [],
  auditIntegrityValid: null,
  meta: null,
  status: 'loading',
  error: null,
};

function getErrorMessage(error: unknown) {
  if (error instanceof AsteraApiError) return error.problem.detail || error.message;
  if (error instanceof Error) return error.message;
  return 'Operational records could not be refreshed.';
}

export function useOperationsData(refreshKey = 0) {
  const [snapshot, setSnapshot] = useState<OperationsSnapshot>(initialSnapshot);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOperationsData() {
      setSnapshot((current) => ({ ...current, status: 'loading', error: null }));

      try {
        const options = { signal: controller.signal };
        const [assetResponse, vendorResponse, auditResponse, verificationResponse] =
          await Promise.all([
            AsteraApiClient.getAssets(undefined, options),
            AsteraApiClient.getVendors(options),
            AsteraApiClient.getAuditTrail({ limit: 20 }, options),
            AsteraApiClient.verifyAuditIntegrity(options),
          ]);

        const responses = [assetResponse, vendorResponse, auditResponse, verificationResponse];
        if (responses.some((response) => response.meta.synthetic !== true)) {
          throw new Error('Operational responses are missing ASTERA synthetic-data metadata.');
        }

        setSnapshot({
          assets: assetResponse.assets,
          vendors: vendorResponse.vendors,
          auditEvents: auditResponse.events,
          auditIntegrityValid: auditResponse.chainIntegrity.valid && verificationResponse.valid,
          meta: auditResponse.meta,
          status: 'ready',
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setSnapshot((current) => ({
          ...current,
          status: 'degraded',
          error: getErrorMessage(error),
        }));
      }
    }

    void loadOperationsData();
    return () => controller.abort();
  }, [refreshKey]);

  return snapshot;
}
