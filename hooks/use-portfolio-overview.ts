'use client';

import { useEffect, useState } from 'react';
import type { Estate, Incident, PortfolioKpis, WorkOrder } from '@/types/domain';
import {
  AsteraApiClient,
  type SyntheticApiMeta,
} from '@/lib/adapters/client-api';

export type PortfolioLoadState = 'loading' | 'ready' | 'degraded';

interface PortfolioOverviewSnapshot {
  estates: Estate[];
  kpis: PortfolioKpis | null;
  activeEstate: Estate | null;
  recentIncidents: Incident[];
  activeWorkOrders: WorkOrder[];
  meta: SyntheticApiMeta | null;
  status: PortfolioLoadState;
  error: string | null;
}

const initialSnapshot: PortfolioOverviewSnapshot = {
  estates: [],
  kpis: null,
  activeEstate: null,
  recentIncidents: [],
  activeWorkOrders: [],
  meta: null,
  status: 'loading',
  error: null,
};

function hasSyntheticMeta(value: unknown): value is SyntheticApiMeta {
  if (typeof value !== 'object' || value === null) return false;
  const meta = value as Partial<SyntheticApiMeta>;
  return (
    meta.synthetic === true &&
    meta.environment === 'contest-prototype' &&
    typeof meta.timestamp === 'string'
  );
}

export function usePortfolioOverview(selectedEstateLabel: string | null, refreshKey = 0) {
  const [snapshot, setSnapshot] = useState<PortfolioOverviewSnapshot>(initialSnapshot);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOverview() {
      setSnapshot((current) => ({ ...current, status: 'loading', error: null }));

      try {
        const estatePayload = await AsteraApiClient.getEstates({ signal: controller.signal });

        if (!hasSyntheticMeta(estatePayload.meta)) {
          throw new Error('The estates response is missing ASTERA synthetic-data metadata.');
        }

        const estateId = selectedEstateLabel
          ? estatePayload.estates.find((estate) => estate.label === selectedEstateLabel)?.id
          : undefined;

        if (selectedEstateLabel && !estateId) {
          throw new Error(`The selected estate "${selectedEstateLabel}" is unavailable.`);
        }

        const summary = await AsteraApiClient.getPortfolioSummary(estateId, {
          signal: controller.signal,
        });

        if (!hasSyntheticMeta(summary.meta)) {
          throw new Error('The portfolio response is missing ASTERA synthetic-data metadata.');
        }

        setSnapshot({
          estates: estatePayload.estates,
          kpis: summary.kpis,
          activeEstate: summary.activeEstate ?? null,
          recentIncidents: summary.recentIncidents,
          activeWorkOrders: summary.activeWorkOrders,
          meta: summary.meta,
          status: 'ready',
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setSnapshot((current) => ({
          ...current,
          status: 'degraded',
          error: error instanceof Error ? error.message : 'Portfolio data could not be refreshed.',
        }));
      }
    }

    void loadOverview();
    return () => controller.abort();
  }, [selectedEstateLabel, refreshKey]);

  return snapshot;
}
