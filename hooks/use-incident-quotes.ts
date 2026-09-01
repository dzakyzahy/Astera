'use client';

import { useEffect, useState } from 'react';
import { AsteraApiClient, AsteraApiError } from '@/lib/adapters/client-api';
import type { Incident, NormalizedQuote } from '@/types/domain';

type IncidentQuoteLoadState = 'loading' | 'ready' | 'degraded';

interface IncidentQuoteSnapshot {
  incident: Incident | null;
  quotes: NormalizedQuote[];
  status: IncidentQuoteLoadState;
  error: string | null;
}

const initialSnapshot: IncidentQuoteSnapshot = {
  incident: null,
  quotes: [],
  status: 'loading',
  error: null,
};

function getIncidentQuoteErrorMessage(error: unknown) {
  if (error instanceof AsteraApiError) {
    return error.problem.detail || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Incident quotes could not be refreshed.';
}

export function useIncidentQuotes(estateId?: string, refreshKey = 0) {
  const [snapshot, setSnapshot] = useState<IncidentQuoteSnapshot>(initialSnapshot);

  useEffect(() => {
    const controller = new AbortController();

    async function loadIncidentQuotes() {
      setSnapshot((current) => ({ ...current, status: 'loading', error: null }));

      try {
        const incidentResponse = await AsteraApiClient.getIncidents(
          { estateId, status: 'AWAITING_APPROVAL' },
          { signal: controller.signal },
        );
        const incident = incidentResponse.incidents[0] ?? null;

        if (!incident) {
          setSnapshot({ incident: null, quotes: [], status: 'ready', error: null });
          return;
        }

        const quoteResponse = await AsteraApiClient.getIncidentQuotes(incident.id, {
          signal: controller.signal,
        });

        if (incidentResponse.meta.synthetic !== true || quoteResponse.meta.synthetic !== true) {
          throw new Error('The incident workflow is missing ASTERA synthetic-data metadata.');
        }

        setSnapshot({
          incident,
          quotes: [...quoteResponse.quotes].sort(
            (left, right) => Number(right.isAiRecommended) - Number(left.isAiRecommended),
          ),
          status: 'ready',
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setSnapshot((current) => ({
          ...current,
          status: 'degraded',
          error: getIncidentQuoteErrorMessage(error),
        }));
      }
    }

    void loadIncidentQuotes();
    return () => controller.abort();
  }, [estateId, refreshKey]);

  return snapshot;
}
